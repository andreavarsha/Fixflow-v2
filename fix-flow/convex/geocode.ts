"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";

type NominatimHit = {
  lat: string;
  lon: string;
  display_name: string;
};

const TRANSLITERATIONS: Record<string, string> = {
  // Zones
  "රාජගිරිය": "Rajagiriya",
  "இராஜகிரிய": "Rajagiriya",
  "ராஜகிரிய": "Rajagiriya",
  "නාවල": "Nawala",
  "நாவல": "Nawala",
  "කඩවත": "Kadawatha",
  "කඳාන": "Kandana",
  "கந்தானை": "Kandana",
  "கடவத்தை": "Kadawatha",
  // Suffixes
  "පාර": "Road",
  "වීදිය": "Road",
  "පටුමග": "Lane",
  "වත්ත": "Watta",
  "හන්දිය": "Junction",
  "வீதி": "Road",
  "தெரு": "Street",
  "சந்தி": "Junction",
  "வத்தை": "Watta",
};

/** Geocode a Sri Lanka address via OpenStreetMap Nominatim (server-side). */
export const searchAddress = action({
  args: { query: v.string() },
  handler: async (_ctx, { query }) => {
    let q = query.trim();
    if (!q) return [] as Array<{ lat: number; lng: number; label: string }>;

    // Map Sinhala/Tamil address terms to English equivalents for OSM search stability
    for (const [key, val] of Object.entries(TRANSLITERATIONS)) {
      const regex = new RegExp(key, "gi");
      q = q.replace(regex, val);
    }

    const withCountry = /sri\s*lanka/i.test(q) ? q : `${q}, Sri Lanka`;
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", withCountry);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "5");
    url.searchParams.set("countrycodes", "lk");

    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "User-Agent": "BetterCall/1.0 (convex-action; property-maintenance-demo)",
      },
    });

    if (!response.ok) {
      throw new Error("Address lookup failed. Try again in a moment.");
    }

    const hits = (await response.json()) as NominatimHit[];
    return hits
      .map((hit) => ({
        lat: Number(hit.lat),
        lng: Number(hit.lon),
        label: hit.display_name,
      }))
      .filter((h) => Number.isFinite(h.lat) && Number.isFinite(h.lng));
  },
});
