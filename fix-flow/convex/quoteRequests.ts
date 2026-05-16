import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
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
        return {
          ...request,
          jobDescription: job?.description,
          jobCategory: job?.category,
          jobUrgency: job?.urgency,
          jobSummary: job?.aiSummary,
        };
      }),
    );
  },
});

/** Reactive live quotes for owner dashboard — THE demo query. */
export const getLiveQuotes = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const job = await ctx.db.get(jobId);
    if (!job || job.ownerId !== userId) return [];

    const requests = await ctx.db
      .query("quoteRequests")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .collect();

    const quotes = await Promise.all(
      requests.map(async (request) => {
        const supplier = await ctx.db.get(request.supplierId);
        return {
          ...request,
          supplierName: supplier?.name ?? "Supplier",
          supplierRating: supplier?.rating,
        };
      }),
    );

    return quotes
      .filter((q) => q.status === "quoted" || q.status === "accepted")
      .sort((a, b) => (a.priceLKR ?? 0) - (b.priceLKR ?? 0));
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

    if (priceLKR <= 0) throw new Error("Price must be greater than zero");

    const durationTrimmed = duration.trim();
    if (!durationTrimmed) throw new Error("Duration is required");

    const request = await ctx.db
      .query("quoteRequests")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .filter((q) => q.eq(q.field("supplierId"), supplierId))
      .first();

    if (!request) {
      throw new Error("No quote request found for this job");
    }
    if (request.status !== "pending" && request.status !== "quoted") {
      throw new Error("This quote request is no longer open");
    }

    const job = await ctx.db.get(jobId);
    if (!job || job.status !== "open") {
      throw new Error("Job is not accepting quotes");
    }

    await ctx.db.patch(request._id, {
      priceLKR,
      duration: durationTrimmed,
      notes: notes?.trim() || undefined,
      isFinal,
      status: "quoted",
    });

    const supplierLabel = supplier.name ?? "A supplier";
    await ctx.db.insert("notifications", {
      userId: job.ownerId,
      type: "new_quote",
      message: `${supplierLabel} submitted a quote: LKR ${priceLKR.toLocaleString()}`,
      read: false,
      jobId,
    });

    return request._id;
  },
});

export const acceptQuote = mutation({
  args: {
    jobId: v.id("jobs"),
    quoteRequestId: v.id("quoteRequests"),
  },
  handler: async (ctx, { jobId, quoteRequestId }) => {
    const ownerId = await getAuthUserId(ctx);
    if (!ownerId) throw new Error("Not authenticated");

    const job = await ctx.db.get(jobId);
    if (!job || job.ownerId !== ownerId) {
      throw new Error("Not authorized");
    }
    if (job.status !== "open") {
      throw new Error("Job is not open for acceptance");
    }

    const accepted = await ctx.db.get(quoteRequestId);
    if (!accepted || accepted.jobId !== jobId) {
      throw new Error("Quote not found");
    }
    if (accepted.status !== "quoted") {
      throw new Error("Quote cannot be accepted");
    }
    if (!accepted.isFinal) {
      throw new Error("Only final quotes can be accepted");
    }
    if (accepted.priceLKR === undefined) {
      throw new Error("Quote has no price");
    }

    await ctx.db.patch(jobId, {
      acceptedSupplierId: accepted.supplierId,
      status: "in_progress",
    });

    await ctx.db.patch(quoteRequestId, { status: "accepted" });

    const allForJob = await ctx.db
      .query("quoteRequests")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .collect();

    for (const other of allForJob) {
      if (other._id === quoteRequestId) continue;
      if (other.status === "quoted" || other.status === "pending") {
        await ctx.db.patch(other._id, { status: "rejected" });
        await ctx.db.insert("notifications", {
          userId: other.supplierId,
          type: "quote_not_selected",
          message: "Your quote was not selected for this job.",
          read: false,
          jobId,
        });
      }
    }

    await ctx.db.insert("notifications", {
      userId: accepted.supplierId,
      type: "quote_accepted",
      message: `Your quote was accepted — LKR ${accepted.priceLKR.toLocaleString()}, ${accepted.duration}`,
      read: false,
      jobId,
    });

    return {
      jobId,
      supplierId: accepted.supplierId,
      priceLKR: accepted.priceLKR,
      duration: accepted.duration,
    };
  },
});
