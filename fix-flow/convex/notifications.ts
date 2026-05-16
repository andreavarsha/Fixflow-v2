import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
/** Unread notification count for the bell badge (reactive). */
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return notifications.filter((n) => !n.read).length;
  },
});

/** Recent notifications for the dashboard sidebar (newest first). */
export const listRecent = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit = 15 }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    return notifications
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, limit)
      .map((n) => ({
        _id: n._id,
        type: n.type,
        message: n.message,
        read: n.read,
        jobId: n.jobId,
        createdAt: n._creationTime,
      }));
  },
});

/** Mark notifications for a job read (e.g. when opening chat). */
export const markReadForJob = mutation({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    for (const n of notifications) {
      if (n.jobId === jobId && !n.read) {
        await ctx.db.patch(n._id, { read: true });
      }
    }
  },
});
