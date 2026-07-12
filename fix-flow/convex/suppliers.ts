import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
  type QueryCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import { resolveDiscoveryCategory } from "./jobCategories";
import {
  haversineKm,
  supplierGeospatial,
  syncSupplierGeospatial,
} from "./supplierGeospatial";
import {
  boundingBoxAround,
  JOB_SEARCH_RADIUS_KM,
  zoneById,
} from "./zones";
import { enforceRateLimit, userRateKey } from "./rateLimits";

const MAX_SELECTED_SUPPLIERS = 3;

export type NearbySupplier = {
  _id: Id<"users">;
  name: string | undefined;
  category: string | undefined;
  rating: number | undefined;
  reviewCount: number | undefined;
  available: boolean | undefined;
  distanceKm: number;
  lat: number;
  lng: number;
  zoneId: string | undefined;
  quoteStatus?: "pending" | "quoted" | "accepted" | "rejected";
  priceLKR?: number;
  isFinal?: boolean;
};

async function findNearbySuppliers(
  ctx: QueryCtx,
  originLat: number,
  originLng: number,
  category: string,
): Promise<NearbySupplier[]> {
  const tradeCategory = resolveDiscoveryCategory(category);
  const rectangle = boundingBoxAround(originLat, originLng);
  const matches: NearbySupplier[] = [];
  let cursor: string | undefined;

  do {
    const page = await supplierGeospatial.query(
      ctx,
      {
        shape: { type: "rectangle", rectangle },
        limit: 64,
        filter: (q) =>
          q
            .eq("category", tradeCategory)
            .eq("approved", true)
            .eq("available", true)
            .eq("suspended", false),
      },
      cursor,
    );

    for (const hit of page.results) {
      const supplier = await ctx.db.get(hit.key);
      if (!supplier || supplier.lat === undefined || supplier.lng === undefined) {
        continue;
      }

      const distanceKm = haversineKm(
        originLat,
        originLng,
        supplier.lat,
        supplier.lng,
      );
      if (distanceKm > JOB_SEARCH_RADIUS_KM) continue;

      matches.push({
        _id: supplier._id,
        name: supplier.name,
        category: supplier.category,
        rating: supplier.rating,
        reviewCount: supplier.reviewCount,
        available: supplier.available,
        distanceKm: Math.round(distanceKm * 10) / 10,
        lat: supplier.lat,
        lng: supplier.lng,
        zoneId: supplier.zoneId,
      });
    }

    cursor = page.nextCursor ?? undefined;
  } while (cursor);

  matches.sort((a, b) => a.distanceKm - b.distanceKm);
  return matches;
}

/** Nearby approved suppliers around a job pin, sorted by distance. */
export const getSuppliersNearJob = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }): Promise<NearbySupplier[]> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "owner") return [];

    const job = await ctx.db.get(jobId);
    if (!job || job.ownerId !== userId || !job.category) return [];
    if (job.lat === undefined || job.lng === undefined) return [];

    const nearby = await findNearbySuppliers(
      ctx,
      job.lat,
      job.lng,
      job.category,
    );

    const quotes = await ctx.db
      .query("quoteRequests")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .collect();
    const bySupplier = new Map(quotes.map((q) => [q.supplierId, q]));

    return nearby.map((s) => {
      const q = bySupplier.get(s._id);
      return {
        ...s,
        quoteStatus: q?.status,
        priceLKR: q?.priceLKR,
        isFinal: q?.isFinal,
      };
    });
  },
});

/** @deprecated Prefer getSuppliersNearJob. */
export const getSuppliersNearKadana = query({
  args: { category: v.string(), jobId: v.optional(v.id("jobs")) },
  handler: async (ctx, { category, jobId }): Promise<NearbySupplier[]> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "owner") return [];

    let originLat = 7.0167;
    let originLng = 79.9833;
    let trade = category;

    if (jobId) {
      const job = await ctx.db.get(jobId);
      if (job && job.ownerId === userId) {
        if (job.lat !== undefined && job.lng !== undefined) {
          originLat = job.lat;
          originLng = job.lng;
        }
        if (job.category) trade = job.category;
      }
    }

    return findNearbySuppliers(ctx, originLat, originLng, trade);
  },
});

export const selectSuppliers = mutation({
  args: {
    jobId: v.id("jobs"),
    supplierIds: v.array(v.id("users")),
  },
  handler: async (ctx, { jobId, supplierIds }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const owner = await ctx.db.get(userId);
    if (!owner || owner.role !== "owner") {
      throw new Error("Only property owners can request quotes");
    }

    const job = await ctx.db.get(jobId);
    if (!job || job.ownerId !== userId) {
      throw new Error("Job not found");
    }
    if (!job.category) {
      throw new Error("Job must be classified before requesting quotes");
    }
    if (job.lat === undefined || job.lng === undefined) {
      throw new Error("Job location is required");
    }

    const uniqueIds = [...new Set(supplierIds)];
    if (uniqueIds.length === 0) {
      throw new Error("Select at least one supplier");
    }
    if (uniqueIds.length > MAX_SELECTED_SUPPLIERS) {
      throw new Error(`You can select at most ${MAX_SELECTED_SUPPLIERS} suppliers`);
    }

    await enforceRateLimit(ctx, "selectSuppliers", { key: userRateKey(userId) });

    const nearby = await ctx.runQuery(internal.suppliers.listNearbySupplierIds, {
      category: job.category,
      lat: job.lat,
      lng: job.lng,
    });
    const nearbySet = new Set(nearby);

    const created: Id<"quoteRequests">[] = [];
    for (const supplierId of uniqueIds) {
      if (!nearbySet.has(supplierId)) {
        throw new Error("One or more suppliers are not available for this job");
      }

      const existing = await ctx.db
        .query("quoteRequests")
        .withIndex("by_job", (q) => q.eq("jobId", jobId))
        .filter((q) => q.eq(q.field("supplierId"), supplierId))
        .first();
      if (existing) continue;

      const quoteRequestId = await ctx.db.insert("quoteRequests", {
        jobId,
        supplierId,
        status: "pending",
      });
      created.push(quoteRequestId);
    }

    if (created.length > 0) {
      await ctx.scheduler.runAfter(0, internal.suppliers.notifySuppliers, {
        jobId,
        supplierIds: uniqueIds,
      });
    }

    return { quoteRequestIds: created };
  },
});

export const listNearbySupplierIds = internalQuery({
  args: {
    category: v.string(),
    lat: v.number(),
    lng: v.number(),
  },
  handler: async (ctx, { category, lat, lng }) => {
    const nearby = await findNearbySuppliers(ctx, lat, lng, category);
    return nearby.map((s) => s._id);
  },
});

export const notifySuppliers = internalAction({
  args: {
    jobId: v.id("jobs"),
    supplierIds: v.array(v.id("users")),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(internal.suppliers.deliverSupplierNotifications, args);
  },
});

export const deliverSupplierNotifications = internalMutation({
  args: {
    jobId: v.id("jobs"),
    supplierIds: v.array(v.id("users")),
  },
  handler: async (ctx, { jobId, supplierIds }) => {
    const job = await ctx.db.get(jobId);
    if (!job) return;

    const zone = zoneById(job.zoneId);
    const place = zone ? ` in ${zone.name}` : "";

    for (const supplierId of supplierIds) {
      const supplier = await ctx.db.get(supplierId);
      if (!supplier) continue;

      await ctx.db.insert("notifications", {
        userId: supplierId,
        type: "quote_request",
        message: job.aiSummary
          ? `${job.aiSummary} (${job.category ?? "Job"}${place})`
          : `New quote request${place}`,
        read: false,
        jobId,
      });
    }
  },
});

const LEGACY_STRUCTURAL_CATEGORY = "Structural / Masonry";

export const indexAllSuppliers = mutation({
  args: {},
  handler: async (ctx) => {
    const suppliers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "supplier"))
      .collect();

    let renamed = 0;
    for (const supplier of suppliers) {
      if (supplier.category === LEGACY_STRUCTURAL_CATEGORY) {
        await ctx.db.patch(supplier._id, { category: "Roofing" });
        renamed++;
      }
      await syncSupplierGeospatial(ctx, supplier._id);
    }

    return { indexed: suppliers.length, renamed };
  },
});
