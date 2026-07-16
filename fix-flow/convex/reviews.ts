import { mutation, query, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import { enforceRateLimit, userRateKey } from "./rateLimits";

async function recomputeSupplierRating(
  ctx: MutationCtx,
  supplierId: Id<"users">,
) {
  const reviews = await ctx.db
    .query("reviews")
    .withIndex("by_supplier", (q) => q.eq("supplierId", supplierId))
    .collect();

  if (reviews.length === 0) {
    await ctx.db.patch(supplierId, { rating: 0, reviewCount: 0 });
    return;
  }

  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const avg = Math.round((sum / reviews.length) * 10) / 10;
  await ctx.db.patch(supplierId, {
    rating: avg,
    reviewCount: reviews.length,
  });
}

/** Submit a star rating after the owner confirms payment. One review per job. */
export const submitReview = mutation({
  args: {
    jobId: v.id("jobs"),
    rating: v.number(),
    comment: v.optional(v.string()),
  },
  handler: async (ctx, { jobId, rating, comment }) => {
    const ownerId = await getAuthUserId(ctx);
    if (!ownerId) throw new Error("Not authenticated");

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error("Rating must be an integer from 1 to 5");
    }

    const job = await ctx.db.get(jobId);
    if (!job || job.ownerId !== ownerId) throw new Error("Not authorized");
    if (job.status !== "completed") {
      throw new Error("You can only rate after the job is paid and complete");
    }
    if (!job.acceptedSupplierId) {
      throw new Error("No supplier to rate on this job");
    }

    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .first();
    if (existing) {
      throw new Error("You already rated this job");
    }

    await enforceRateLimit(ctx, "confirmPayment", {
      key: userRateKey(ownerId),
    });

    const trimmed = comment?.trim().slice(0, 500);

    await ctx.db.insert("reviews", {
      jobId,
      reviewerId: ownerId,
      supplierId: job.acceptedSupplierId,
      rating,
      comment: trimmed || undefined,
    });

    await recomputeSupplierRating(ctx, job.acceptedSupplierId);
  },
});

export const getReviewForJob = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const job = await ctx.db.get(jobId);
    if (!job || job.ownerId !== userId) return null;

    return await ctx.db
      .query("reviews")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .first();
  },
});
