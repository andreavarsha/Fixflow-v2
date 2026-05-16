import { v } from "convex/values";
import {
  internalAction,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";

const MAX_DESCRIPTION_LENGTH = 300;

export const SERVICE_CATEGORIES = [
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

/** Step 1 — photo upload URL for job submission (owner only). */
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

/** Step 2 — create job and schedule AI classification. */
export const submitJob = mutation({
  args: {
    description: v.string(),
    photoId: v.optional(v.id("_storage")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "owner") {
      throw new Error("Only property owners can submit jobs");
    }

    const description = args.description.trim();
    if (!description) throw new Error("Description is required");
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      throw new Error(`Description must be at most ${MAX_DESCRIPTION_LENGTH} characters`);
    }

    const jobId = await ctx.db.insert("jobs", {
      ownerId: userId,
      description,
      photoId: args.photoId,
      status: "classifying",
    });

    await ctx.scheduler.runAfter(0, internal.jobs.classifyIssue, {
      jobId,
      description,
    });

    return { jobId };
  },
});

/** Step 3 — reactive job record for owner UI. */
export const get = query({
  args: { jobId: v.id("jobs") },
  handler: async (ctx, { jobId }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const job = await ctx.db.get(jobId);
    if (!job || job.ownerId !== userId) return null;

    return job;
  },
});

/** Step 4 — written by classifyIssue after OpenAI completes. */
export const updateClassification = internalMutation({
  args: {
    jobId: v.id("jobs"),
    category: v.string(),
    subcategory: v.string(),
    urgency: urgencyValidator,
    aiSummary: v.string(),
    aiSummary_si: v.string(),
    aiSummary_ta: v.string(),
  },
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (!job) throw new Error("Job not found");

    await ctx.db.patch(args.jobId, {
      category: args.category,
      subcategory: args.subcategory,
      urgency: args.urgency,
      aiSummary: args.aiSummary,
      aiSummary_si: args.aiSummary_si,
      aiSummary_ta: args.aiSummary_ta,
      status: "open",
    });
  },
});

/** Step 5 — OpenAI classify + translate (2 calls). */
export const classifyIssue = internalAction({
  args: {
    jobId: v.id("jobs"),
    description: v.string(),
  },
  handler: async (ctx, { jobId, description }) => {
    const categories = SERVICE_CATEGORIES.join(", ");

    const classifyResult = await chatJson({
      messages: [
        {
          role: "system",
          content: `You classify property maintenance issues in Kadana, Gampaha, Sri Lanka.
Return JSON only with keys: category, subcategory, urgency, summary.
category must be exactly one of: ${categories}.
urgency must be High, Medium, or Low.
High: safety risk or major damage if delayed (gas leak, flooding, exposed wire).
Medium: affects daily use, not immediate safety (broken tap, blocked drain).
Low: cosmetic or non-urgent (paint peeling, minor crack, garden).
summary: max 2 short sentences, no filler.`,
        },
        {
          role: "user",
          content: description,
        },
      ],
    });

    const category = String(classifyResult.category ?? "");
    const subcategory = String(classifyResult.subcategory ?? "");
    const urgency = classifyResult.urgency as "High" | "Medium" | "Low";
    const summary = String(classifyResult.summary ?? "");

    if (!SERVICE_CATEGORIES.includes(category as (typeof SERVICE_CATEGORIES)[number])) {
      throw new Error(`Invalid category from AI: ${category}`);
    }
    if (!["High", "Medium", "Low"].includes(urgency)) {
      throw new Error(`Invalid urgency from AI: ${urgency}`);
    }

    const translateResult = await chatJson({
      messages: [
        {
          role: "system",
          content: `Translate the maintenance job summary into Sinhala and Tamil.
Return JSON only with keys: sinhala, tamil. Keep the same meaning; no extra commentary.`,
        },
        {
          role: "user",
          content: summary,
        },
      ],
    });

    await ctx.runMutation(internal.jobs.updateClassification, {
      jobId,
      category,
      subcategory,
      urgency,
      aiSummary: summary,
      aiSummary_si: String(translateResult.sinhala ?? ""),
      aiSummary_ta: String(translateResult.tamil ?? ""),
    });
  },
});

async function chatJson(body: {
  messages: { role: string; content: string }[];
}): Promise<Record<string, unknown>> {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const openAiKey = process.env.OPENAI_API_KEY;
  const apiKey = openAiKey ?? openRouterKey;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY or OPENROUTER_API_KEY must be set in Convex");
  }

  const useOpenRouter = !openAiKey && !!openRouterKey;
  const url = useOpenRouter
    ? "https://openrouter.ai/api/v1/chat/completions"
    : "https://api.openai.com/v1/chat/completions";

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(useOpenRouter ? { "HTTP-Referer": "https://fixflow.lk" } : {}),
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: body.messages,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`AI request failed (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI returned empty content");

  return JSON.parse(content) as Record<string, unknown>;
}
