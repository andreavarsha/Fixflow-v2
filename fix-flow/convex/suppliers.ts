import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import { resolveDiscoveryCategory } from "./jobCategories";
import {
  distanceFromKadanaKm,
  kadanaBoundingBox,
  MAX_DISTANCE_KM,
  supplierGeospatial,
  syncSupplierGeospatial,
} from "./supplierGeospatial";

const MAX_SELECTED_SUPPLIERS = 3;

export type SupplierNearKadana = {
  _id: Id<"users">;
  name: string | undefined;
  category: string | undefined;
  rating: number | undefined;
  available: boolean | undefined;
  distanceKm: number;
};

/** Nearby approved suppliers for a job category, sorted by distance from Kadana. */
export const getSuppliersNearKadana = query({
  args: { category: v.string() },
  handler: async (ctx, { category }): Promise<SupplierNearKadana[]> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "owner") return [];

    const tradeCategory = resolveDiscoveryCategory(category);
    const rectangle = kadanaBoundingBox();
    const matches: SupplierNearKadana[] = [];
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

        const distanceKm = distanceFromKadanaKm(supplier.lat, supplier.lng);
        if (distanceKm > MAX_DISTANCE_KM) continue;

        matches.push({
          _id: supplier._id,
          name: supplier.name,
          category: supplier.category,
          rating: supplier.rating,
          available: supplier.available,
          distanceKm: Math.round(distanceKm * 10) / 10,
        });
      }

      cursor = page.nextCursor ?? undefined;
    } while (cursor);

    matches.sort((a, b) => a.distanceKm - b.distanceKm);
    return matches;
  },
});

/** Owner selects suppliers to receive quote requests for a job. */
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

    const uniqueIds = [...new Set(supplierIds)];
    if (uniqueIds.length === 0) {
      throw new Error("Select at least one supplier");
    }
    if (uniqueIds.length > MAX_SELECTED_SUPPLIERS) {
      throw new Error(`You can select at most ${MAX_SELECTED_SUPPLIERS} suppliers`);
    }

    const nearby = await ctx.runQuery(internal.suppliers.listNearbySupplierIds, {
      category: job.category,
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

/** Internal helper so selectSuppliers can validate against the same discovery rules. */
export const listNearbySupplierIds = internalQuery({
  args: { category: v.string() },
  handler: async (ctx, { category }) => {
    const tradeCategory = resolveDiscoveryCategory(category);
    const rectangle = kadanaBoundingBox();
    const ids: Id<"users">[] = [];
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
        if (distanceFromKadanaKm(supplier.lat, supplier.lng) > MAX_DISTANCE_KM) {
          continue;
        }
        ids.push(supplier._id);
      }

      cursor = page.nextCursor ?? undefined;
    } while (cursor);

    return ids;
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

    for (const supplierId of supplierIds) {
      const supplier = await ctx.db.get(supplierId);
      if (!supplier) continue;

      let message: string;
      switch (supplier.preferredLanguage) {
        case "si":
          message = job.aiSummary_si ?? job.aiSummary ?? "New quote request";
          break;
        case "ta":
          message = job.aiSummary_ta ?? job.aiSummary ?? "New quote request";
          break;
        default:
          message = job.aiSummary ?? "New quote request";
      }

      await ctx.db.insert("notifications", {
        userId: supplierId,
        type: "quote_request",
        message,
        read: false,
        jobId,
      });
    }
  },
});

/** Admin approves a pending supplier — they appear in discovery reactively. */
export const approveSupplier = mutation({
  args: { supplierId: v.id("users") },
  handler: async (ctx, { supplierId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const admin = await ctx.db.get(userId);
    if (!admin || admin.role !== "admin") {
      throw new Error("Only admins can approve suppliers");
    }

    const supplier = await ctx.db.get(supplierId);
    if (!supplier || supplier.role !== "supplier") {
      throw new Error("Supplier not found");
    }

    await ctx.db.patch(supplierId, { approved: true });
    await syncSupplierGeospatial(ctx, supplierId);
  },
});

const LEGACY_STRUCTURAL_CATEGORY = "Structural / Masonry";

/** Backfill geospatial index + migrate legacy category name to Roofing. */
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
