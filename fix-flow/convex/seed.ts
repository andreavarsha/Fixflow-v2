import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { syncSupplierGeospatial } from "./supplierGeospatial";
import { DEMO_ZONES, type ZoneId } from "./zones";
import { JOB_CATEGORIES } from "./jobCategories";

type SeedSupplier = {
  name: string;
  category: (typeof JOB_CATEGORIES)[number];
  zoneId: ZoneId;
  lat: number;
  lng: number;
  rating: number;
  reviewCount: number;
  available: boolean;
  suspended: boolean;
};

/** Offset helpers — keep suppliers near zone centers but distinct. */
function near(
  zoneId: ZoneId,
  dLat: number,
  dLng: number,
): { zoneId: ZoneId; lat: number; lng: number } {
  const zone = DEMO_ZONES.find((z) => z.id === zoneId)!;
  return {
    zoneId,
    lat: zone.lat + dLat,
    lng: zone.lng + dLng,
  };
}

/**
 * At least 5 suppliers per category, spread across all three towns
 * (2 Kadana, 2 Rajagiriya, 1 Nawala).
 */
const ZONE_SLOTS: { zoneId: ZoneId; dLat: number; dLng: number }[] = [
  { zoneId: "kadana", dLat: 0.008, dLng: 0.006 },
  { zoneId: "kadana", dLat: -0.01, dLng: 0.012 },
  { zoneId: "rajagiriya", dLat: 0.006, dLng: 0.005 },
  { zoneId: "rajagiriya", dLat: -0.008, dLng: 0.007 },
  { zoneId: "nawala", dLat: 0.005, dLng: 0.006 },
];

/** Slight per-category jitter so pins don't stack. */
function slotOffset(categoryIndex: number, slotIndex: number) {
  const base = ZONE_SLOTS[slotIndex];
  const jitter = (categoryIndex - 3) * 0.0015;
  return near(base.zoneId, base.dLat + jitter, base.dLng - jitter * 0.7);
}

const NAMES_BY_CATEGORY: Record<(typeof JOB_CATEGORIES)[number], string[]> = {
  Plumbing: [
    "Nimal Perera",
    "Ranjith Fernando",
    "Priya Subramaniam",
    "Farook Ismail",
    "Janaka Perera",
  ],
  Electrical: [
    "Kamal Silva",
    "Dinesh Wickrama",
    "Arjun Selvam",
    "Sandun Fernando",
    "Nadeesha Wijesinghe",
  ],
  Roofing: [
    "Susantha Bandara",
    "Asanka Peiris",
    "Mahesh Rathnayake",
    "Nuwan Herath",
    "Kumaran Pillai",
  ],
  Carpentry: [
    "Rohan Jayawardena",
    "Kasun Amarasinghe",
    "Thilak Dissanayake",
    "Pradeep Fonseka",
    "Gayan Silva",
  ],
  Painting: [
    "Saman Kumarasinghe",
    "Buddika Pathirana",
    "Lalith Weerasinghe",
    "Chathura Ekanayake",
    "Muthu Krishnan",
  ],
  "Garden / Landscaping": [
    "Chaminda Senanayake",
    "Lahiru Abeysekara",
    "Anura Gunasekara",
    "Dilshan Karunaratne",
    "Ruwan Bandara",
  ],
  "General Maintenance": [
    "Selvakumar Nadar",
    "Amila Ratnayake",
    "Ishara Mendis",
    "Tharindu Jayasinghe",
    "Heshan Jayasuriya",
  ],
};

const RATING_BASE = [4.7, 4.4, 4.6, 4.3, 4.5];
const REVIEW_BASE = [18, 11, 15, 9, 14];

const SUPPLIERS: SeedSupplier[] = JOB_CATEGORIES.flatMap((category, catIdx) =>
  NAMES_BY_CATEGORY[category].map((name, slotIdx) => ({
    name,
    category,
    ...slotOffset(catIdx, slotIdx),
    rating: Math.min(4.9, RATING_BASE[slotIdx] + (catIdx % 3) * 0.05),
    reviewCount: REVIEW_BASE[slotIdx] + catIdx,
    available: true,
    suspended: false,
  })),
);

function supplierEmail(name: string, index: number) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.|\.$/g, "");
  return `${slug}.${index}@fixflow.lk`;
}

export const seedSuppliers = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "supplier"))
      .collect();

    // Soft-disable old @fixflow.lk suppliers not in this seed so geospatial stays clean.
    const keepEmails = new Set(
      SUPPLIERS.map((s, i) => supplierEmail(s.name, i + 1)),
    );
    for (const s of existing) {
      if (s.email?.endsWith("@fixflow.lk") && s.email && !keepEmails.has(s.email)) {
        await ctx.db.patch(s._id, {
          available: false,
          suspended: true,
        });
        await syncSupplierGeospatial(ctx, s._id);
      }
    }

    let created = 0;
    let updated = 0;

    for (let i = 0; i < SUPPLIERS.length; i++) {
      const s = SUPPLIERS[i];
      const email = supplierEmail(s.name, i + 1);
      const prior = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .unique();

      const fields = {
        name: s.name,
        email,
        role: "supplier" as const,
        preferredLanguage: "en" as const,
        category: s.category,
        rating: s.rating,
        reviewCount: s.reviewCount,
        available: s.available,
        suspended: s.suspended,
        approved: true,
        lat: s.lat,
        lng: s.lng,
        zoneId: s.zoneId,
      };

      if (prior) {
        await ctx.db.patch(prior._id, fields);
        await syncSupplierGeospatial(ctx, prior._id);
        updated++;
      } else {
        const id = await ctx.db.insert("users", fields);
        await syncSupplierGeospatial(ctx, id);
        created++;
      }
    }

    return { created, updated, total: SUPPLIERS.length };
  },
});

/** Demo owner account profile (password set via demoAuth). */
export const ensureDemoOwner = mutation({
  args: {},
  handler: async (ctx) => {
    const email = "demo.owner@fixflow.lk";
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (existing) return { userId: existing._id, email };

    const userId = await ctx.db.insert("users", {
      name: "Demo Owner",
      email,
      role: "owner",
      preferredLanguage: "en",
      approved: true,
      suspended: false,
    });
    return { userId, email };
  },
});

/** Demo admin account profile (password set via demoAuth). */
export const ensureDemoAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    const email = "admin@fixflow.lk";
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (existing) return { userId: existing._id, email };

    const userId = await ctx.db.insert("users", {
      name: "Demo Admin",
      email,
      role: "admin",
      preferredLanguage: "en",
      approved: true,
      suspended: false,
    });
    return { userId, email };
  },
});

/** Demote a mis-tagged account to owner-only and drop geospatial supplier listing. */
export const forceOwnerOnly = mutation({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const target = email.trim();
    const normalized = target.toLowerCase();
    const byIndex = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", target))
      .unique();
    const fallback =
      byIndex ??
      (await ctx.db.query("users").collect()).find(
        (u) => u.email?.toLowerCase() === normalized,
      );

    if (!fallback) {
      return { ok: false as const, reason: "not_found", email: target };
    }

    await ctx.db.patch(fallback._id, {
      role: "owner",
      preferredLanguage: fallback.preferredLanguage ?? "en",
      approved: true,
      suspended: false,
      available: false,
    });
    await syncSupplierGeospatial(ctx, fallback._id);

    return {
      ok: true as const,
      userId: fallback._id,
      email: fallback.email,
      previousRole: fallback.role,
    };
  },
});
