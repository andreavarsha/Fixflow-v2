import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.optional(v.string()),
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: v.union(v.literal("owner"), v.literal("supplier"), v.literal("admin")),
    preferredLanguage: v.union(v.literal("en"), v.literal("si"), v.literal("ta")),
    category: v.optional(v.string()),
    rating: v.optional(v.number()),
    available: v.optional(v.boolean()),
    suspended: v.optional(v.boolean()),
    approved: v.optional(v.boolean()),
    lat: v.optional(v.number()),
    lng: v.optional(v.number()),
  }).index("by_email", ["email"]),

  jobs: defineTable({
    ownerId: v.id("users"),
    description: v.string(),
    photoId: v.optional(v.id("_storage")),
    status: v.union(
      v.literal("classifying"),
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("completed"),
    ),
    category: v.optional(v.string()),
    subcategory: v.optional(v.string()),
    urgency: v.optional(
      v.union(v.literal("High"), v.literal("Medium"), v.literal("Low")),
    ),
    aiSummary: v.optional(v.string()),
    aiSummary_si: v.optional(v.string()),
    aiSummary_ta: v.optional(v.string()),
    acceptedSupplierId: v.optional(v.id("users")),
  }).index("by_owner", ["ownerId"]),

  quoteRequests: defineTable({
    jobId: v.id("jobs"),
    supplierId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("quoted"),
      v.literal("accepted"),
      v.literal("rejected"),
    ),
    priceLKR: v.optional(v.number()),
    duration: v.optional(v.string()),
    notes: v.optional(v.string()),
    isFinal: v.optional(v.boolean()),
  })
    .index("by_job", ["jobId"])
    .index("by_supplier", ["supplierId"]),

  messages: defineTable({
    jobId: v.id("jobs"),
    senderId: v.id("users"),
    receiverId: v.id("users"),
    content: v.string(),
    read: v.boolean(),
  }).index("by_job", ["jobId"]),

  notifications: defineTable({
    userId: v.id("users"),
    type: v.string(),
    message: v.string(),
    read: v.boolean(),
    jobId: v.optional(v.id("jobs")),
  }).index("by_user", ["userId"]),

  reviews: defineTable({
    jobId: v.id("jobs"),
    reviewerId: v.id("users"),
    supplierId: v.id("users"),
    rating: v.number(),
    comment: v.optional(v.string()),
  }).index("by_supplier", ["supplierId"]),
});
