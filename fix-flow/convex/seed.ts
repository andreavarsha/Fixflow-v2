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

const SUPPLIERS: SeedSupplier[] = [
  // Kadana — all trades (2 each for key trades)
  {
    name: "Nimal Perera",
    category: "Plumbing",
    ...near("kadana", 0.008, 0.006),
    rating: 4.7,
    reviewCount: 18,
    available: true,
    suspended: false,
  },
  {
    name: "Ranjith Fernando",
    category: "Plumbing",
    ...near("kadana", -0.01, 0.012),
    rating: 4.4,
    reviewCount: 11,
    available: true,
    suspended: false,
  },
  {
    name: "Kamal Silva",
    category: "Electrical",
    ...near("kadana", 0.006, -0.008),
    rating: 4.8,
    reviewCount: 22,
    available: true,
    suspended: false,
  },
  {
    name: "Dinesh Wickrama",
    category: "Electrical",
    ...near("kadana", -0.012, -0.005),
    rating: 4.3,
    reviewCount: 9,
    available: true,
    suspended: false,
  },
  {
    name: "Susantha Bandara",
    category: "Roofing",
    ...near("kadana", 0.014, 0.004),
    rating: 4.5,
    reviewCount: 14,
    available: true,
    suspended: false,
  },
  {
    name: "Rohan Jayawardena",
    category: "Carpentry",
    ...near("kadana", 0.004, 0.015),
    rating: 4.6,
    reviewCount: 16,
    available: true,
    suspended: false,
  },
  {
    name: "Saman Kumarasinghe",
    category: "Painting",
    ...near("kadana", -0.006, 0.009),
    rating: 4.5,
    reviewCount: 13,
    available: true,
    suspended: false,
  },
  {
    name: "Chaminda Senanayake",
    category: "Garden / Landscaping",
    ...near("kadana", 0.01, -0.012),
    rating: 4.6,
    reviewCount: 20,
    available: true,
    suspended: false,
  },
  {
    name: "Selvakumar Nadar",
    category: "General Maintenance",
    ...near("kadana", -0.008, -0.01),
    rating: 4.4,
    reviewCount: 12,
    available: true,
    suspended: false,
  },

  // Rajagiriya
  {
    name: "Priya Subramaniam",
    category: "Plumbing",
    ...near("rajagiriya", 0.006, 0.005),
    rating: 4.6,
    reviewCount: 15,
    available: true,
    suspended: false,
  },
  {
    name: "Arjun Selvam",
    category: "Electrical",
    ...near("rajagiriya", -0.008, 0.007),
    rating: 4.5,
    reviewCount: 10,
    available: true,
    suspended: false,
  },
  {
    name: "Mahesh Rathnayake",
    category: "Roofing",
    ...near("rajagiriya", 0.01, -0.006),
    rating: 4.2,
    reviewCount: 8,
    available: true,
    suspended: false,
  },
  {
    name: "Thilak Dissanayake",
    category: "Carpentry",
    ...near("rajagiriya", -0.005, -0.009),
    rating: 4.4,
    reviewCount: 11,
    available: true,
    suspended: false,
  },
  {
    name: "Lalith Weerasinghe",
    category: "Painting",
    ...near("rajagiriya", 0.007, 0.011),
    rating: 4.3,
    reviewCount: 7,
    available: true,
    suspended: false,
  },
  {
    name: "Anura Gunasekara",
    category: "Garden / Landscaping",
    ...near("rajagiriya", -0.011, 0.004),
    rating: 4.1,
    reviewCount: 6,
    available: true,
    suspended: false,
  },
  {
    name: "Ishara Mendis",
    category: "General Maintenance",
    ...near("rajagiriya", 0.004, -0.012),
    rating: 4.7,
    reviewCount: 19,
    available: true,
    suspended: false,
  },
  {
    name: "Farook Ismail",
    category: "Plumbing",
    ...near("rajagiriya", 0.012, -0.004),
    rating: 4.5,
    reviewCount: 14,
    available: true,
    suspended: false,
  },

  // Nawala
  {
    name: "Kumaran Pillai",
    category: "Roofing",
    ...near("nawala", 0.005, 0.006),
    rating: 4.3,
    reviewCount: 9,
    available: true,
    suspended: false,
  },
  {
    name: "Muthu Krishnan",
    category: "Painting",
    ...near("nawala", -0.007, 0.008),
    rating: 4.4,
    reviewCount: 12,
    available: true,
    suspended: false,
  },
  {
    name: "Janaka Perera",
    category: "Plumbing",
    ...near("nawala", 0.009, -0.005),
    rating: 4.6,
    reviewCount: 17,
    available: true,
    suspended: false,
  },
  {
    name: "Sandun Fernando",
    category: "Electrical",
    ...near("nawala", -0.006, -0.01),
    rating: 4.5,
    reviewCount: 13,
    available: true,
    suspended: false,
  },
  {
    name: "Gayan Silva",
    category: "Carpentry",
    ...near("nawala", 0.011, 0.003),
    rating: 4.2,
    reviewCount: 8,
    available: true,
    suspended: false,
  },
  {
    name: "Ruwan Bandara",
    category: "Garden / Landscaping",
    ...near("nawala", -0.01, 0.007),
    rating: 4.4,
    reviewCount: 10,
    available: true,
    suspended: false,
  },
  {
    name: "Heshan Jayasuriya",
    category: "General Maintenance",
    ...near("nawala", 0.003, -0.008),
    rating: 4.8,
    reviewCount: 21,
    available: true,
    suspended: false,
  },
  {
    name: "Nadeesha Wijesinghe",
    category: "Electrical",
    ...near("nawala", 0.008, 0.01),
    rating: 4.6,
    reviewCount: 15,
    available: true,
    suspended: false,
  },
];

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
