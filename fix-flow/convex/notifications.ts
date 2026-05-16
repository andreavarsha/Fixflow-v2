import { query } from "./_generated/server";
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
