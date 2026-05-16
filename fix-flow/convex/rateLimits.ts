import { RateLimiter, MINUTE, HOUR } from "@convex-dev/rate-limiter";
import { components } from "./_generated/api";
import type { ActionCtx, MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";

/** Application rate limits — transactional, per-user where noted. */
export const rateLimiter = new RateLimiter(components.rateLimiter, {
  /** Homeowner new repair reports (each triggers LLM classification). */
  submitJob: { kind: "token bucket", rate: 5, period: MINUTE, capacity: 2 },
  /** Chat messages between owner and supplier on a job. */
  sendMessage: { kind: "token bucket", rate: 30, period: MINUTE, capacity: 10 },
  /** Supplier quote create/update. */
  submitQuote: { kind: "token bucket", rate: 15, period: MINUTE, capacity: 5 },
  /** Owner accepts a final quote. */
  acceptQuote: { kind: "fixed window", rate: 10, period: MINUTE },
  /** Owner invites suppliers to quote. */
  selectSuppliers: { kind: "fixed window", rate: 15, period: MINUTE },
  /** Supplier marks on-site work finished. */
  markWorkComplete: { kind: "fixed window", rate: 10, period: HOUR },
  /** Owner confirms demo payment. */
  confirmPayment: { kind: "fixed window", rate: 10, period: MINUTE },
  /** LLM classification + translation (global cap with sharding). */
  llmClassify: {
    kind: "token bucket",
    rate: 40,
    period: MINUTE,
    capacity: 10,
    shards: 5,
  },
});

export type RateLimitName =
  | "submitJob"
  | "sendMessage"
  | "submitQuote"
  | "acceptQuote"
  | "selectSuppliers"
  | "markWorkComplete"
  | "confirmPayment"
  | "llmClassify";

type RateCtx = MutationCtx | ActionCtx;

function retryMessage(retryAfter?: number): string {
  if (!retryAfter || retryAfter <= 0) {
    return "Too many requests. Please wait a moment and try again.";
  }
  const seconds = Math.ceil(retryAfter / 1000);
  if (seconds < 60) {
    return `Too many requests. Please wait ${seconds} second${seconds === 1 ? "" : "s"} and try again.`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `Too many requests. Please wait about ${minutes} minute${minutes === 1 ? "" : "s"} and try again.`;
}

/** Enforce a named limit; rolls back with the surrounding mutation/action on failure. */
export async function enforceRateLimit(
  ctx: RateCtx,
  name: RateLimitName,
  options?: { key?: string; count?: number },
): Promise<void> {
  const { ok, retryAfter } = await rateLimiter.limit(ctx, name, {
    key: options?.key,
    count: options?.count ?? 1,
  });
  if (!ok) {
    throw new Error(retryMessage(retryAfter));
  }
}

export function userRateKey(userId: Id<"users">): string {
  return userId;
}
