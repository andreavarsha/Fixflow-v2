import {
  internalAction,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";

const MAX_DESCRIPTION_LENGTH = 300;

const CATEGORIES = [
  "Plumbing",
  "Electrical",
  "Structural / Masonry",
  "Carpentry",
  "Painting",
  "Garden / Landscaping",
  "General Maintenance",
] as const;

const urgencyValidator = v.union(
  v.literal("High"),
  v.literal("Medium"),
  v.literal("Low"),
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
    await ctx.db.patch(jobId, { ...fields, status: "open" });
  },
});

export const markClassificationFailed = internalMutation({
  args: {
    jobId: v.id("jobs"),
    description: v.string(),
  },
  handler: async (ctx, { jobId, description }) => {
    const fallback = description.slice(0, MAX_DESCRIPTION_LENGTH);
    await ctx.db.patch(jobId, {
      status: "open",
      category: "General Maintenance",
      subcategory: "General issue",
      urgency: "Medium",
      aiSummary: fallback,
      aiSummary_si: fallback,
      aiSummary_ta: fallback,
    });
  },
});

export const classifyIssue = internalAction({
  args: {
    jobId: v.id("jobs"),
    description: v.string(),
  },
  handler: async (ctx, { jobId, description }) => {
    try {
      const classified = await classifyWithLlm(description);
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
  urgency: "High" | "Medium" | "Low";
  summary: string;
};

type TranslateResult = {
  sinhala: string;
  tamil: string;
};

async function classifyWithLlm(description: string): Promise<ClassifyResult> {
  const categories = CATEGORIES.join(", ");
  const content = await chatJson(
    [
      {
        role: "system",
        content: `You classify home repair issues for FixFlow AI in Gampaha, Sri Lanka. Return JSON only with keys: category, subcategory, urgency, summary. category must be exactly one of: ${categories}. urgency must be High, Medium, or Low (High = safety risk or active damage spreading; Medium = needs repair soon; Low = cosmetic or non-urgent). summary is max 2 sentences in English.`,
      },
      {
        role: "user",
        content: `Issue description:\n${description}`,
      },
    ],
    "classify",
  );

  const parsed = JSON.parse(content) as {
    category?: string;
    subcategory?: string;
    urgency?: string;
    summary?: string;
  };

  const category = CATEGORIES.includes(
    parsed.category as (typeof CATEGORIES)[number],
  )
    ? parsed.category!
    : "General Maintenance";

  const urgency =
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
      {
        role: "user",
        content: summary,
      },
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

async function chatJson(
  messages: { role: string; content: string }[],
  label: string,
): Promise<string> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    return callOpenAiCompatible(
      "https://api.openai.com/v1/chat/completions",
      openaiKey,
      "gpt-4o-mini",
      messages,
      label,
    );
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    return callOpenAiCompatible(
      "https://openrouter.ai/api/v1/chat/completions",
      openRouterKey,
      "openai/gpt-4o-mini",
      messages,
      label,
    );
  }

  throw new Error(
    "Set OPENAI_API_KEY or OPENROUTER_API_KEY in Convex environment variables",
  );
}

async function callOpenAiCompatible(
  url: string,
  apiKey: string,
  model: string,
  messages: { role: string; content: string }[],
  label: string,
): Promise<string> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages,
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${label} LLM failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error(`${label} LLM returned empty content`);
  return content;
}
