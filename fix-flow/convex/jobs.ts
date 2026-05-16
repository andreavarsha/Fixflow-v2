import {
  internalAction,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { chatJson, type LlmImage } from "./llm";
import {
  JOB_CATEGORIES,
  JOB_URGENCIES,
  normalizeCategory,
  type JobUrgency,
} from "./jobCategories";

const MAX_DESCRIPTION_LENGTH = 300;

const urgencyValidator = v.union(
  v.literal("High"),
  v.literal("Medium"),
  v.literal("Low"),
);

const categoryValidator = v.union(
  ...JOB_CATEGORIES.map((c) => v.literal(c)),
);

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "owner") {
      throw new Error("Only property owners can upload job photos");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

export const submitJob = mutation({
  args: {
    description: v.string(),
    photoId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const ownerId = await getAuthUserId(ctx);
    if (!ownerId) throw new Error("Not authenticated");

    const user = await ctx.db.get(ownerId);
    if (!user || user.role !== "owner") {
      throw new Error("Only property owners can submit jobs");
    }

    const description = args.description.trim();
    if (!description) throw new Error("Description is required");
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      throw new Error(
        `Description must be at most ${MAX_DESCRIPTION_LENGTH} characters`,
      );
    }

    const jobId = await ctx.db.insert("jobs", {
      ownerId,
      description,
      photoId: args.photoId,
      status: "classifying",
    });

    await ctx.scheduler.runAfter(0, internal.jobs.classifyIssue, {
      jobId,
      description,
      photoId: args.photoId,
    });

    return jobId;
  },
});

export const getJob = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const job = await ctx.db.get(jobId);
    if (!job || job.ownerId !== userId) return null;

    const photoUrl = job.photoId
      ? await ctx.storage.getUrl(job.photoId)
      : null;

    return { ...job, photoUrl };
  },
});

export const updateSummary = mutation({
  args: {
    jobId: v.id("jobs"),
    aiSummary: v.string(),
  },
  handler: async (ctx, { jobId, aiSummary }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const job = await ctx.db.get(jobId);
    if (!job || job.ownerId !== userId) throw new Error("Not authorized");
    if (job.status !== "open") throw new Error("Can only edit classified jobs");

    const summary = aiSummary.trim();
    if (!summary) throw new Error("Summary cannot be empty");

    await ctx.db.patch(jobId, { aiSummary: summary });
  },
});

/** Owner can correct category / urgency before inviting suppliers (optional). */
export const updateJobClassification = mutation({
  args: {
    jobId: v.id("jobs"),
    category: categoryValidator,
    urgency: urgencyValidator,
    subcategory: v.optional(v.string()),
  },
  handler: async (ctx, { jobId, category, urgency, subcategory }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const job = await ctx.db.get(jobId);
    if (!job || job.ownerId !== userId) throw new Error("Not authorized");
    if (job.status !== "open") {
      throw new Error("Can only edit classification while the job is open");
    }

    await ctx.db.patch(jobId, {
      category,
      urgency,
      subcategory: subcategory?.trim().slice(0, 120) || job.subcategory,
      classificationFailed: false,
    });
  },
});

export const applyClassification = internalMutation({
  args: {
    jobId: v.id("jobs"),
    category: v.string(),
    subcategory: v.string(),
    urgency: urgencyValidator,
    aiSummary: v.string(),
    aiSummary_si: v.string(),
    aiSummary_ta: v.string(),
  },
  handler: async (ctx, { jobId, ...fields }) => {
    await ctx.db.patch(jobId, {
      ...fields,
      status: "open",
      classificationFailed: false,
    });
  },
});

export const markClassificationFailed = internalMutation({
  args: {
    jobId: v.id("jobs"),
    description: v.string(),
  },
  handler: async (ctx, { jobId, description }) => {
    const fallback = description.slice(0, MAX_DESCRIPTION_LENGTH);
    const category = normalizeCategory(
      inferCategoryFromText(description) ?? undefined,
    );
    await ctx.db.patch(jobId, {
      status: "open",
      category,
      subcategory: "Needs review",
      urgency: "Medium",
      aiSummary: fallback,
      aiSummary_si: fallback,
      aiSummary_ta: fallback,
      classificationFailed: true,
    });
  },
});

export const classifyIssue = internalAction({
  args: {
    jobId: v.id("jobs"),
    description: v.string(),
    photoId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, { jobId, description, photoId }) => {
    try {
      const image = photoId ? await loadImageForLlm(ctx, photoId) : undefined;
      const classified = await classifyWithLlm(description, image);
      const translated = await translateWithLlm(classified.summary);

      await ctx.runMutation(internal.jobs.applyClassification, {
        jobId,
        category: classified.category,
        subcategory: classified.subcategory,
        urgency: classified.urgency,
        aiSummary: classified.summary,
        aiSummary_si: translated.sinhala,
        aiSummary_ta: translated.tamil,
      });
    } catch (error) {
      console.error("classifyIssue failed:", error);
      await ctx.runMutation(internal.jobs.markClassificationFailed, {
        jobId,
        description,
      });
    }
  },
});

type ClassifyResult = {
  category: string;
  subcategory: string;
  urgency: JobUrgency;
  summary: string;
};

type TranslateResult = {
  sinhala: string;
  tamil: string;
};

function bytesToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

async function loadImageForLlm(
  ctx: { storage: { get: (id: import("./_generated/dataModel").Id<"_storage">) => Promise<Blob | null> } },
  photoId: import("./_generated/dataModel").Id<"_storage">,
): Promise<LlmImage | undefined> {
  const blob = await ctx.storage.get(photoId);
  if (!blob) return undefined;

  const bytes = new Uint8Array(await blob.arrayBuffer());
  const base64 = bytesToBase64(bytes);
  const mimeType = blob.type && blob.type.startsWith("image/")
    ? blob.type
    : "image/jpeg";

  return { mimeType, base64 };
}

function inferCategoryFromText(text: string): string | null {
  const lower = text.toLowerCase();
  if (
    lower.includes("leak") ||
    lower.includes("pipe") ||
    lower.includes("tap") ||
    lower.includes("water stain") ||
    lower.includes("ceiling") && lower.includes("water")
  ) {
    return "Plumbing";
  }
  if (lower.includes("ceiling") || lower.includes("crack") || lower.includes("mould") || lower.includes("mold")) {
    return "Roofing";
  }
  return null;
}

const CLASSIFY_SYSTEM = `You classify home repair issues for FixFlow AI in Gampaha, Sri Lanka.
Return JSON only with keys: category, subcategory, urgency, summary.

category must be exactly one of: ${JOB_CATEGORIES.join(", ")}.

urgency rules:
- High = safety risk, active spreading water, electrical hazard, or structural collapse risk
- Medium = needs repair soon (e.g. visible ceiling water damage, broken fixtures)
- Low = routine maintenance or appearance-only work with no safety risk

Examples:
- Ceiling water stain / mould from a leak → Plumbing or Roofing (not General Maintenance), usually Medium or High if active
- Overgrown lawn → Garden / Landscaping, Low
- Burst pipe → Plumbing, High

summary: max 2 sentences in plain English for homeowners. State what work is needed. No jargon like "cosmetic issue".`;

async function classifyWithLlm(
  description: string,
  image?: LlmImage,
): Promise<ClassifyResult> {
  const userText = image
    ? `Issue description:\n${description}\n\nA photo of the problem is attached — use it together with the description.`
    : `Issue description:\n${description}`;

  const content = await chatJson(
    [
      { role: "system", content: CLASSIFY_SYSTEM },
      { role: "user", content: userText },
    ],
    "classify",
    image,
  );

  const parsed = JSON.parse(content) as {
    category?: string;
    subcategory?: string;
    urgency?: string;
    summary?: string;
  };

  const category = normalizeCategory(parsed.category);

  const urgency: JobUrgency =
    parsed.urgency === "High" ||
    parsed.urgency === "Medium" ||
    parsed.urgency === "Low"
      ? parsed.urgency
      : "Medium";

  return {
    category,
    subcategory: (parsed.subcategory ?? "General").slice(0, 120),
    urgency,
    summary: (parsed.summary ?? description).slice(0, 500),
  };
}

async function translateWithLlm(summary: string): Promise<TranslateResult> {
  const content = await chatJson(
    [
      {
        role: "system",
        content:
          "Translate the repair summary to Sinhala and Tamil for Sri Lankan homeowners. Return JSON only with keys: sinhala, tamil. Keep each translation concise (1-2 sentences).",
      },
      { role: "user", content: summary },
    ],
    "translate",
  );

  const parsed = JSON.parse(content) as {
    sinhala?: string;
    tamil?: string;
  };

  return {
    sinhala: (parsed.sinhala ?? summary).slice(0, 500),
    tamil: (parsed.tamil ?? summary).slice(0, 500),
  };
}
