import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Helper to check if caller has admin role
async function enforceAdmin(ctx: any) {
  const userId = await getAuthUserId(ctx);
  if (!userId) throw new Error("Not authenticated");
  const user = await ctx.db.get(userId);
  if (!user || user.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }
  return user;
}

/** List all jobs in the system with owner details, hired supplier, review info, and quote counts. */
export const listAllJobs = query({
  args: {},
  handler: async (ctx) => {
    await enforceAdmin(ctx);

    const jobs = await ctx.db.query("jobs").order("desc").collect();

    return Promise.all(
      jobs.map(async (job) => {
        const owner = await ctx.db.get(job.ownerId);
        const quotes = await ctx.db
          .query("quoteRequests")
          .withIndex("by_job", (q) => q.eq("jobId", job._id))
          .collect();

        const review = await ctx.db
          .query("reviews")
          .withIndex("by_job", (q) => q.eq("jobId", job._id))
          .unique();

        const hiredSupplier = job.acceptedSupplierId
          ? await ctx.db.get(job.acceptedSupplierId)
          : null;

        const acceptedQuote = quotes.find((q) => q.status === "accepted");

        return {
          ...job,
          ownerName: owner?.name,
          ownerEmail: owner?.email,
          quotesCount: quotes.filter((q) => q.status === "quoted" || q.status === "accepted").length,
          totalQuotesSent: quotes.length,
          hiredSupplierName: hiredSupplier?.name,
          hiredSupplierEmail: hiredSupplier?.email,
          priceLKR: acceptedQuote?.priceLKR,
          rating: review?.rating,
          comment: review?.comment,
        };
      }),
    );
  },
});

/** List all registered accounts (suppliers and owners) for marketplace analysis. */
export const listAllUsers = query({
  args: {},
  handler: async (ctx) => {
    await enforceAdmin(ctx);
    return ctx.db.query("users").collect();
  },
});

/** List all quote requests sent for a job, enriched with supplier info. */
export const getJobQuotes = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    await enforceAdmin(ctx);

    const quotes = await ctx.db
      .query("quoteRequests")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .collect();

    return Promise.all(
      quotes.map(async (q) => {
        const supplier = await ctx.db.get(q.supplierId);
        return {
          ...q,
          supplierName: supplier?.name,
          supplierEmail: supplier?.email,
        };
      }),
    );
  },
});

/** Manual override for AI classification (Human-in-the-loop). */
export const overrideJob = mutation({
  args: {
    jobId: v.id("jobs"),
    category: v.string(),
    subcategory: v.string(),
    urgency: v.union(v.literal("High"), v.literal("Medium"), v.literal("Low")),
    aiSummary: v.string(),
    aiSummary_si: v.optional(v.string()),
    aiSummary_ta: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await enforceAdmin(ctx);

    const { jobId, ...fields } = args;

    const existing = await ctx.db.get(jobId);
    if (!existing) throw new Error("Job not found");

    // Patch job fields and mark classification resolution
    await ctx.db.patch(jobId, {
      ...fields,
      classificationFailed: false,
    });

    return { success: true };
  },
});
