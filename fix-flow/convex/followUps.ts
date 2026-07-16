import { internalMutation } from "./_generated/server";
import type { MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

const HOUR = 60 * 60 * 1000;
/** Demo-friendly windows so follow-ups show up without waiting a day. */
const UNPAID_AFTER_MS = 2 * HOUR;
const STALE_QUOTE_AFTER_MS = 4 * HOUR;

/**
 * Automatic owner follow-ups:
 * - awaiting_payment jobs unpaid past the window
 * - open jobs with pending invites and no quotes past the window
 */
export const runOwnerFollowUps = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const jobs = await ctx.db.query("jobs").collect();

    for (const job of jobs) {
      if (job.status === "awaiting_payment") {
        const since = job.workCompletedAt ?? job._creationTime;
        if (now - since < UNPAID_AFTER_MS) continue;

        const already = await hasFollowUpOfType(
          ctx,
          job.ownerId,
          job._id,
          "follow_up_unpaid",
        );
        if (already) continue;

        await ctx.db.insert("notifications", {
          userId: job.ownerId,
          type: "follow_up_unpaid",
          message:
            "Reminder: payment is still due for a completed repair. Confirm payment when you are ready.",
          read: false,
          jobId: job._id,
        });
        continue;
      }

      if (job.status !== "open") continue;

      const quotes = await ctx.db
        .query("quoteRequests")
        .withIndex("by_job", (q) => q.eq("jobId", job._id))
        .collect();

      if (quotes.length === 0) continue;

      const anyQuoted = quotes.some(
        (q) => q.status === "quoted" || q.status === "accepted",
      );
      if (anyQuoted) continue;

      const oldestInvite = Math.min(...quotes.map((q) => q._creationTime));
      if (now - oldestInvite < STALE_QUOTE_AFTER_MS) continue;

      const already = await hasFollowUpOfType(
        ctx,
        job.ownerId,
        job._id,
        "follow_up_stale_quotes",
      );
      if (already) continue;

      await ctx.db.insert("notifications", {
        userId: job.ownerId,
        type: "follow_up_stale_quotes",
        message:
          "Still waiting on quotes? You can invite more nearby professionals or check your quote inbox.",
        read: false,
        jobId: job._id,
      });
    }
  },
});

async function hasFollowUpOfType(
  ctx: MutationCtx,
  userId: Id<"users">,
  jobId: Id<"jobs">,
  type: string,
) {
  const notes = await ctx.db
    .query("notifications")
    .withIndex("by_user", (q) => q.eq("userId", userId))
    .collect();
  return notes.some((n) => n.type === type && n.jobId === jobId);
}
