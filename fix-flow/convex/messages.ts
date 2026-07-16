import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { enforceRateLimit, userRateKey } from "./rateLimits";

const MAX_MESSAGE_LENGTH = 500;

async function getJobOrThrow(ctx: QueryCtx | MutationCtx, jobId: Id<"jobs">) {
  const job = await ctx.db.get(jobId);
  if (!job) throw new Error("Job not found");
  return job;
}

async function supplierHasQuoteRequest(
  ctx: QueryCtx | MutationCtx,
  jobId: Id<"jobs">,
  supplierId: Id<"users">,
) {
  const qr = await ctx.db
    .query("quoteRequests")
    .withIndex("by_job", (q) => q.eq("jobId", jobId))
    .filter((q) => q.eq(q.field("supplierId"), supplierId))
    .first();
  return qr !== null;
}

/** Owner or invited supplier on this job. */
async function assertJobChatParticipant(
  ctx: QueryCtx | MutationCtx,
  jobId: Id<"jobs">,
  userId: Id<"users">,
) {
  const job = await getJobOrThrow(ctx, jobId);
  if (job.ownerId === userId) return job;
  if (await supplierHasQuoteRequest(ctx, jobId, userId)) return job;
  throw new Error("You are not part of this conversation");
}

async function assertCanMessagePeer(
  ctx: MutationCtx,
  jobId: Id<"jobs">,
  senderId: Id<"users">,
  receiverId: Id<"users">,
) {
  const job = await assertJobChatParticipant(ctx, jobId, senderId);
  if (senderId === receiverId) {
    throw new Error("Cannot message yourself");
  }

  if (senderId === job.ownerId) {
    if (!(await supplierHasQuoteRequest(ctx, jobId, receiverId))) {
      throw new Error("You can only message suppliers invited to this job");
    }
    return job;
  }

  if (receiverId !== job.ownerId) {
    throw new Error("You can only message the homeowner for this job");
  }
  if (!(await supplierHasQuoteRequest(ctx, jobId, senderId))) {
    throw new Error("You are not part of this conversation");
  }
  return job;
}

function notificationPreview(content: string): string {
  const trimmed = content.trim();
  if (trimmed.length <= 80) return trimmed;
  return `${trimmed.slice(0, 77)}…`;
}

async function listMessagesForJob(ctx: QueryCtx, jobId: Id<"jobs">) {
  const userId = await getAuthUserId(ctx);
  if (!userId) return [];

  await assertJobChatParticipant(ctx, jobId, userId);

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
}

/** Exp R4 — reactive thread for a job (alias: getMessages). */
export const list = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => listMessagesForJob(ctx, jobId),
});

/** PRD name for the same reactive query used by ChatPanel. */
export const getMessages = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => listMessagesForJob(ctx, jobId),
});

/** Unread messages in a 1:1 thread on this job (for badge + auto-open chat). */
export const unreadCountForThread = query({
  args: {
    jobId: v.id("jobs"),
    peerId: v.id("users"),
  },
  handler: async (ctx, { jobId, peerId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return 0;

    await assertJobChatParticipant(ctx, jobId, userId);

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .collect();

    return messages.filter(
      (m) => m.receiverId === userId && m.senderId === peerId && !m.read,
    ).length;
  },
});

/** Mark incoming messages from peer as read when the user opens the thread. */
export const markThreadRead = mutation({
  args: {
    jobId: v.id("jobs"),
    peerId: v.id("users"),
  },
  handler: async (ctx, { jobId, peerId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    await assertJobChatParticipant(ctx, jobId, userId);

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .collect();

    for (const m of messages) {
      if (m.receiverId === userId && m.senderId === peerId && !m.read) {
        await ctx.db.patch(m._id, { read: true });
      }
    }
  },
});

/** Exp R4 — send message and notify receiver so getUnreadCount updates live. */
export const send = mutation({
  args: {
    jobId: v.id("jobs"),
    receiverId: v.id("users"),
    content: v.string(),
  },
  handler: async (ctx, { jobId, receiverId, content }) => {
    const senderId = await getAuthUserId(ctx);
    if (!senderId) throw new Error("Not authenticated");

    const trimmed = content.trim();
    if (!trimmed) throw new Error("Message cannot be empty");
    if (trimmed.length > MAX_MESSAGE_LENGTH) {
      throw new Error("Message is too long");
    }

    await assertCanMessagePeer(ctx, jobId, senderId, receiverId);

    await enforceRateLimit(ctx, "sendMessage", { key: userRateKey(senderId) });

    await ctx.db.insert("messages", {
      jobId,
      senderId,
      receiverId,
      content: trimmed,
      read: false,
    });

    const job = await getJobOrThrow(ctx, jobId);
    const fromHomeowner = senderId === job.ownerId;
    const preview = notificationPreview(trimmed);

    await ctx.db.insert("notifications", {
      userId: receiverId,
      type: "new_message",
      message: fromHomeowner
        ? `New message from homeowner: ${preview}`
        : `New message from tradesperson: ${preview}`,
      read: false,
      jobId,
    });

    return { ok: true as const };
  },
});
