import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Id } from "./_generated/dataModel";

export type LiveQuote = {
  _id: Id<"quoteRequests">;
  jobId: Id<"jobs">;
  supplierId: Id<"users">;
  status: "pending" | "quoted" | "accepted" | "rejected";
  priceLKR: number | undefined;
  duration: string | undefined;
  notes: string | undefined;
  isFinal: boolean | undefined;
  supplierName: string | undefined;
  supplierRating: number | undefined;
};

/** Reactive quotes for the owner dashboard (Round 3 demo query). */
export const getLiveQuotes = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }): Promise<LiveQuote[]> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const job = await ctx.db.get(jobId);
    if (!job || job.ownerId !== userId) return [];

    const rows = await ctx.db
      .query("quoteRequests")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .collect();

    const enriched: LiveQuote[] = await Promise.all(
      rows.map(async (row) => {
        const supplier = await ctx.db.get(row.supplierId);
        return {
          _id: row._id,
          jobId: row.jobId,
          supplierId: row.supplierId,
          status: row.status,
          priceLKR: row.priceLKR,
          duration: row.duration,
          notes: row.notes,
          isFinal: row.isFinal,
          supplierName: supplier?.name,
          supplierRating: supplier?.rating,
        };
      }),
    );

    enriched.sort((a, b) => {
      const pa = a.priceLKR ?? Number.POSITIVE_INFINITY;
      const pb = b.priceLKR ?? Number.POSITIVE_INFINITY;
      if (pa !== pb) return pa - pb;
      return 0;
    });

    return enriched;
  },
});

export const submitQuote = mutation({
  args: {
    jobId: v.id("jobs"),
    priceLKR: v.number(),
    duration: v.string(),
    notes: v.optional(v.string()),
    isFinal: v.boolean(),
  },
  handler: async (ctx, { jobId, priceLKR, duration, notes, isFinal }) => {
    const supplierId = await getAuthUserId(ctx);
    if (!supplierId) throw new Error("Not authenticated");

    const supplier = await ctx.db.get(supplierId);
    if (!supplier || supplier.role !== "supplier") {
      throw new Error("Only suppliers can submit quotes");
    }

    const job = await ctx.db.get(jobId);
    if (!job) throw new Error("Job not found");
    if (job.status !== "open") {
      throw new Error("This job is not accepting quotes");
    }

    const rows = await ctx.db
      .query("quoteRequests")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .collect();

    if (priceLKR <= 0) throw new Error("Price must be greater than zero");

    const qr = rows.find((r) => r.supplierId === supplierId);
    if (!qr) throw new Error("You were not invited to quote on this job");
    if (qr.status === "accepted" || qr.status === "rejected") {
      throw new Error("Quote request is no longer active");
    }

    const dur = duration.trim();
    if (!dur) throw new Error("Duration is required");

    await ctx.db.patch(qr._id, {
      priceLKR,
      duration: dur,
      notes: notes?.trim() || undefined,
      isFinal,
      status: "quoted",
    });

    const supplierLabel = supplier.name ?? "A supplier";
    await ctx.db.insert("notifications", {
      userId: job.ownerId,
      type: "new_quote",
      message: `${supplierLabel} quoted LKR ${priceLKR.toLocaleString("en-LK")} (${dur})${isFinal ? " — final" : ""}`,
      read: false,
      jobId,
    });

    return qr._id;
  },
});

export const acceptQuote = mutation({
  args: {
    jobId: v.id("jobs"),
    quoteRequestId: v.id("quoteRequests"),
  },
  handler: async (ctx, { jobId, quoteRequestId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const job = await ctx.db.get(jobId);
    if (!job || job.ownerId !== userId) {
      throw new Error("Job not found");
    }

    const chosen = await ctx.db.get(quoteRequestId);
    if (!chosen || chosen.jobId !== jobId) {
      throw new Error("Quote not found for this job");
    }
    if (chosen.status !== "quoted") {
      throw new Error("Quote must be submitted before it can be accepted");
    }
    if (!chosen.isFinal) {
      throw new Error("You can only accept quotes marked as final by the supplier");
    }

    const all = await ctx.db
      .query("quoteRequests")
      .withIndex("by_job", (q) => q.eq("jobId", jobId))
      .collect();

    for (const row of all) {
      if (row._id === quoteRequestId) {
        await ctx.db.patch(row._id, { status: "accepted" });
        continue;
      }
      if (row.status === "pending" || row.status === "quoted") {
        await ctx.db.patch(row._id, { status: "rejected" });
        if (row.supplierId !== chosen.supplierId) {
          await ctx.db.insert("notifications", {
            userId: row.supplierId,
            type: "quote_not_selected",
            message:
              "Your quote was not selected for this job. Thank you for participating.",
            read: false,
            jobId,
          });
        }
      }
    }

    await ctx.db.patch(jobId, {
      acceptedSupplierId: chosen.supplierId,
      status: "in_progress",
    });
  },
});

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
          jobSummary_si: job?.aiSummary_si,
          jobSummary_ta: job?.aiSummary_ta,
          jobStatus: job?.status,
        };
      }),
    );
  },
});
