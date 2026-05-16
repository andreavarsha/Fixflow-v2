import { mutation } from "./_generated/server";

// PRD v6.1 Section 7 — Kadana centre 7.0167N, 79.9833E
const SUPPLIERS = [
  { name: "Nimal Perera", category: "Plumbing", lat: 7.018, lng: 79.985, preferredLanguage: "si" as const, rating: 4.6, available: true, suspended: false },
  { name: "Ranjith Fernando", category: "Plumbing", lat: 7.025, lng: 79.99, preferredLanguage: "si" as const, rating: 4.4, available: true, suspended: false },
  { name: "Priya Subramaniam", category: "Plumbing", lat: 7.04, lng: 80.01, preferredLanguage: "ta" as const, rating: 4.5, available: true, suspended: false },
  { name: "Kamal Silva", category: "Electrical", lat: 7.02, lng: 79.978, preferredLanguage: "si" as const, rating: 4.7, available: true, suspended: false },
  { name: "Dinesh Wickrama", category: "Electrical", lat: 7.05, lng: 80.02, preferredLanguage: "si" as const, rating: 4.3, available: true, suspended: false },
  { name: "Arjun Selvam", category: "Electrical", lat: 7.065, lng: 80.035, preferredLanguage: "ta" as const, rating: 4.5, available: true, suspended: false },
  { name: "Susantha Bandara", category: "Structural / Masonry", lat: 7.03, lng: 79.97, preferredLanguage: "si" as const, rating: 4.4, available: true, suspended: false },
  { name: "Mahesh Rathnayake", category: "Structural / Masonry", lat: 7.045, lng: 79.96, preferredLanguage: "si" as const, rating: 4.2, available: true, suspended: false },
  { name: "Kumaran Pillai", category: "Structural / Masonry", lat: 7.075, lng: 80.05, preferredLanguage: "ta" as const, rating: 4.1, available: true, suspended: false },
  { name: "Rohan Jayawardena", category: "Carpentry", lat: 7.022, lng: 79.992, preferredLanguage: "si" as const, rating: 4.6, available: true, suspended: false },
  { name: "Thilak Dissanayake", category: "Carpentry", lat: 7.06, lng: 80.04, preferredLanguage: "si" as const, rating: 4.3, available: true, suspended: false },
  { name: "Saman Kumarasinghe", category: "Painting", lat: 7.015, lng: 79.995, preferredLanguage: "si" as const, rating: 4.5, available: true, suspended: false },
  { name: "Lalith Weerasinghe", category: "Painting", lat: 7.055, lng: 80.03, preferredLanguage: "si" as const, rating: 4.2, available: true, suspended: false },
  { name: "Muthu Krishnan", category: "Painting", lat: 7.035, lng: 79.965, preferredLanguage: "ta" as const, rating: 4.4, available: true, suspended: false },
  { name: "Chaminda Senanayake", category: "Garden / Landscaping", lat: 7.028, lng: 79.982, preferredLanguage: "si" as const, rating: 4.5, available: true, suspended: false },
  { name: "Anura Gunasekara", category: "Garden / Landscaping", lat: 7.07, lng: 80.045, preferredLanguage: "si" as const, rating: 4.1, available: true, suspended: false },
  { name: "Selvakumar Nadar", category: "General Maintenance", lat: 7.048, lng: 80.015, preferredLanguage: "ta" as const, rating: 4.6, available: true, suspended: false },
  // 18–20: outside 15km bounding box (Round 2 demo)
  { name: "Asanka Hettiarachchi", category: "General Maintenance", lat: 7.15, lng: 80.12, preferredLanguage: "si" as const, rating: 4.8, available: true, suspended: false },
  { name: "Nuwan Amarasinghe", category: "Plumbing", lat: 7.18, lng: 80.15, preferredLanguage: "si" as const, rating: 4.0, available: false, suspended: false },
  { name: "Ravi Chandran", category: "Electrical", lat: 7.21, lng: 80.18, preferredLanguage: "ta" as const, rating: 4.3, available: true, suspended: true },
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
      .take(1);
    if (existing.length > 0) {
      return { seeded: 0, message: "Suppliers already seeded — skip or clear users table first" };
    }

    for (let i = 0; i < SUPPLIERS.length; i++) {
      const s = SUPPLIERS[i];
      await ctx.db.insert("users", {
        name: s.name,
        email: supplierEmail(s.name, i + 1),
        role: "supplier",
        preferredLanguage: s.preferredLanguage,
        category: s.category,
        rating: s.rating,
        lat: s.lat,
        lng: s.lng,
        available: s.available,
        suspended: s.suspended,
        approved: true,
      });
    }
    return { seeded: SUPPLIERS.length };
  },
});
