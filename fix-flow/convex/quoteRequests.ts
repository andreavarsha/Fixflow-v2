import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import { enforceRateLimit, userRateKey } from "./rateLimits";
import { haversineKm } from "./supplierGeospatial";
import { getSupplierStats } from "./suppliers";
import { zoneById } from "./zones";

export type LiveQuote = {
  _id: Id<"quoteRequests">;
  jobId: Id<"jobs">;
  supplierId: Id<"users">;
  status: "pending" | "quoted" | "accepted" | "rejected";
  priceLKR: number | undefined;
  duration: string | undefined;
  notes: string | undefined;
  isFinal: boolean | undefined;
  supplierName: string | undefined;
  supplierRating: number | undefined;
  supplierReviewCount: number | undefined;
  distanceKm: number | undefined;
  completedJobs?: number;
  avgResponseMinutes?: number;
};

/** Reactive quotes for the owner dashboard (Round 3 demo query). */
export const getLiveQuotes = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }): Promise<LiveQuote[]> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const job = await ctx.db.get(jobId);
    if (!job || job.ownerId !== userId) return [];

    const rows = await ctx.db
      .query("quoteRequests")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .collect();

    const enriched: LiveQuote[] = await Promise.all(
      rows.map(async (row) => {
        const supplier = await ctx.db.get(row.supplierId);
        let distanceKm: number | undefined;
        if (
          job.lat !== undefined &&
          job.lng !== undefined &&
          supplier?.lat !== undefined &&
          supplier.lng !== undefined
        ) {
          distanceKm =
            Math.round(haversineKm(job.lat, job.lng, supplier.lat, supplier.lng) * 10) /
            10;
        }

        const stats = await getSupplierStats(ctx, row.supplierId);

        return {
          _id: row._id,
          jobId: row.jobId,
          supplierId: row.supplierId,
          status: row.status,
          priceLKR: row.priceLKR,
          duration: row.duration,
          notes: row.notes,
          isFinal: row.isFinal,
          supplierName: supplier?.name,
          supplierRating: supplier?.rating,
          supplierReviewCount: supplier?.reviewCount,
          distanceKm,
          completedJobs: stats.completedJobs,
          avgResponseMinutes: stats.avgResponseMinutes,
        };
      }),
    );

    enriched.sort((a, b) => {
      const pa = a.priceLKR ?? Number.POSITIVE_INFINITY;
      const pb = b.priceLKR ?? Number.POSITIVE_INFINITY;
      if (pa !== pb) return pa - pb;
      const da = a.distanceKm ?? Number.POSITIVE_INFINITY;
      const db = b.distanceKm ?? Number.POSITIVE_INFINITY;
      return da - db;
    });

    return enriched;
  },
});

export const submitQuote = mutation({
  args: {
    jobId: v.id("jobs"),
    priceLKR: v.number(),
    duration: v.string(),
    notes: v.optional(v.string()),
    isFinal: v.boolean(),
  },
  handler: async (ctx, { jobId, priceLKR, duration, notes, isFinal }) => {
    const supplierId = await getAuthUserId(ctx);
    if (!supplierId) throw new Error("Not authenticated");

    const supplier = await ctx.db.get(supplierId);
    if (!supplier || supplier.role !== "supplier") {
      throw new Error("Only suppliers can submit quotes");
    }

    const job = await ctx.db.get(jobId);
    if (!job) throw new Error("Job not found");
    if (job.status !== "open") {
      throw new Error("This job is not accepting quotes");
    }

    const rows = await ctx.db
      .query("quoteRequests")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .collect();

    if (priceLKR <= 0) throw new Error("Price must be greater than zero");

    const qr = rows.find((r) => r.supplierId === supplierId);
    if (!qr) throw new Error("You were not invited to quote on this job");
    if (qr.status === "accepted" || qr.status === "rejected") {
      throw new Error("Quote request is no longer active");
    }

    const dur = duration.trim();
    if (!dur) throw new Error("Duration is required");

    await enforceRateLimit(ctx, "submitQuote", { key: userRateKey(supplierId) });

    const patchData: any = {
      priceLKR,
      duration: dur,
      notes: notes?.trim() || undefined,
      isFinal,
      status: "quoted",
    };
    if (qr.status === "pending") {
      patchData.quotedAt = Date.now();
    }

    await ctx.db.patch(qr._id, patchData);

    const supplierLabel = supplier.name ?? "A supplier";
    await ctx.db.insert("notifications", {
      userId: job.ownerId,
      type: "new_quote",
      message: `${supplierLabel} quoted LKR ${priceLKR.toLocaleString("en-LK")} (${dur})${isFinal ? " — final" : ""}`,
      read: false,
      jobId,
    });

    return qr._id;
  },
});

export const acceptQuote = mutation({
  args: {
    jobId: v.id("jobs"),
    quoteRequestId: v.id("quoteRequests"),
  },
  handler: async (ctx, { jobId, quoteRequestId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const job = await ctx.db.get(jobId);
    if (!job || job.ownerId !== userId) {
      throw new Error("Job not found");
    }

    const chosen = await ctx.db.get(quoteRequestId);
    if (!chosen || chosen.jobId !== jobId) {
      throw new Error("Quote not found for this job");
    }
    if (chosen.status !== "quoted") {
      throw new Error("Quote must be submitted before it can be accepted");
    }

    await enforceRateLimit(ctx, "acceptQuote", { key: userRateKey(userId) });

    const all = await ctx.db
      .query("quoteRequests")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .collect();

    for (const row of all) {
      if (row._id === quoteRequestId) {
        await ctx.db.patch(row._id, { status: "accepted" });
        continue;
      }
      if (row.status === "pending" || row.status === "quoted") {
        await ctx.db.patch(row._id, { status: "rejected" });
        if (row.supplierId !== chosen.supplierId) {
          await ctx.db.insert("notifications", {
            userId: row.supplierId,
            type: "quote_not_selected",
            message:
              "Your quote was not selected for this job. Thank you for participating.",
            read: false,
            jobId,
          });
        }
      }
    }

    await ctx.db.patch(jobId, {
      acceptedSupplierId: chosen.supplierId,
      status: "in_progress",
      acceptedAt: Date.now(),
    });

    const supplier = await ctx.db.get(chosen.supplierId);
    await ctx.db.insert("notifications", {
      userId: chosen.supplierId,
      type: "quote_accepted",
      message: `${job.description.slice(0, 60)}… — your quote was accepted. Complete the work, then mark the job done in your dashboard.`,
      read: false,
      jobId,
    });

    await ctx.db.insert("notifications", {
      userId: job.ownerId,
      type: "quote_accepted",
      message: `You hired ${supplier?.name ?? "a tradesperson"}. They will mark the job complete when finished, then you can pay.`,
      read: false,
      jobId,
    });
  },
});

/** Issue photo URL for a job the supplier was invited to quote on. */
export const getJobPhotoForSupplier = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    const supplierId = await getAuthUserId(ctx);
    if (!supplierId) return { hasPhoto: false as const, url: undefined };

    const user = await ctx.db.get(supplierId);
    if (!user || user.role !== "supplier") {
      return { hasPhoto: false as const, url: undefined };
    }

    const invited = await ctx.db
      .query("quoteRequests")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .filter((q) => q.eq(q.field("supplierId"), supplierId))
      .first();
    if (!invited) return { hasPhoto: false as const, url: undefined };

    const job = await ctx.db.get(jobId);
    if (!job?.photoId) return { hasPhoto: false as const, url: undefined };

    const url = await ctx.storage.getUrl(job.photoId);
    return { hasPhoto: true as const, url: url ?? undefined };
  },
});

/** Incoming quote requests for the logged-in supplier. */
export const listForSupplier = query({
  args: {},
  handler: async (ctx) => {
    const supplierId = await getAuthUserId(ctx);
    if (!supplierId) return [];

    const user = await ctx.db.get(supplierId);
    if (!user || user.role !== "supplier") return [];

    const requests = await ctx.db
      .query("quoteRequests")
      .withIndex("by_supplier", (q) => q.eq("supplierId", supplierId))
      .order("desc")
      .collect();

    return Promise.all(
      requests.map(async (request) => {
        const job = await ctx.db.get(request.jobId);

        let distanceKm: number | undefined;
        if (
          job?.lat !== undefined &&
          job?.lng !== undefined &&
          user.lat !== undefined &&
          user.lng !== undefined
        ) {
          distanceKm =
            Math.round(
              haversineKm(user.lat, user.lng, job.lat, job.lng) * 10,
            ) / 10;
        }

        const jobPhotoUrl = job?.photoId
          ? (await ctx.storage.getUrl(job.photoId)) ?? undefined
          : undefined;

        return {
          ...request,
          jobDescription: job?.description,
          jobCategory: job?.category,
          jobUrgency: job?.urgency,
          jobSummary: job?.aiSummary,
          jobSummary_si: job?.aiSummary_si,
          jobSummary_ta: job?.aiSummary_ta,
          jobStatus: job?.status,
          jobHasPhoto: Boolean(job?.photoId),
          jobPhotoUrl,
          distanceKm,
          zoneName: zoneById(job?.zoneId)?.name,
          // Exposed so the supplier UI can open a masked chat with the homeowner (Exp R4).
          ownerId: job?.ownerId,
          addressNote: request.status === "accepted" ? job?.addressNote : undefined,
        };
      }),
    );
  },
});
