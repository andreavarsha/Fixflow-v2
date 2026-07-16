import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/** Nudge owners on unpaid jobs and stale quote invites. */
crons.interval(
  "owner follow-ups",
  { hours: 1 },
  internal.followUps.runOwnerFollowUps,
  {},
);

export default crons;
