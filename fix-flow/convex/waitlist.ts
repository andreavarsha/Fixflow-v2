import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { DEMO_ZONES, resolveZone } from "./zones";

export const listZones = query({
  args: {},
  handler: async () => DEMO_ZONES,
});

export const resolveJobZone = query({
  args: { lat: v.number(), lng: v.number() },
  handler: async (_ctx, { lat, lng }) => {
    const zone = resolveZone(lat, lng);
    if (!zone) {
      return { inCoverage: false as const, zone: null };
    }
    return {
      inCoverage: true as const,
      zone: { id: zone.id, name: zone.name },
    };
  },
});

export const joinWaitlist = mutation({
  args: {
    email: v.string(),
    lat: v.number(),
    lng: v.number(),
  },
  handler: async (ctx, { email, lat, lng }) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@")) {
      throw new Error("Enter a valid email address");
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw new Error("Location is required");
    }

    const zone = resolveZone(lat, lng);
    if (zone) {
      throw new Error(
        `You're already in ${zone.name} — FixFlow is live there. Pin your job and submit.`,
      );
    }

    const existing = await ctx.db
      .query("waitlist")
      .withIndex("by_email", (q) => q.eq("email", trimmed))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { lat, lng });
      return { alreadyJoined: true };
    }

    await ctx.db.insert("waitlist", { email: trimmed, lat, lng });
    return { alreadyJoined: false };
  },
});
