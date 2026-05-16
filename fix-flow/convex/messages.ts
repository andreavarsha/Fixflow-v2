import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

export const list = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .order("asc")
      .collect();

    return Promise.all(
      messages.map(async (message) => {
        const sender = await ctx.db.get(message.senderId);
        return { ...message, senderName: sender?.name ?? "Unknown" };
      }),
    );
  },
});

export const send = mutation({
  args: {
    jobId: v.id("jobs"),
    receiverId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, { jobId, receiverId, content }) => {
    const senderId = await getAuthUserId(ctx);
    if (!senderId) throw new Error("Not authenticated");

    const job = await ctx.db.get(jobId);
    if (!job) throw new Error("Job not found");

    await ctx.db.insert("messages", {
      jobId,
      senderId,
      receiverId,
      content,
      read: false,
    });
  },
});
