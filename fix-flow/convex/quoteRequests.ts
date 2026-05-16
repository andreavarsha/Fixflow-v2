import { query } from "./_generated/server";
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
