/** Client-safe zone metadata (mirrors convex/zones.ts centers). */
export type ZoneId = "kadana" | "rajagiriya" | "nawala";

export type DemoZone = {
  id: ZoneId;
  name: string;
  lat: number;
  lng: number;
  radiusKm: number;
};

export const DEMO_ZONES: DemoZone[] = [
  { id: "kadana", name: "Kandana", lat: 7.0495, lng: 79.8982, radiusKm: 2.5 },
  {
    id: "rajagiriya",
    name: "Rajagiriya",
    lat: 6.9106,
    lng: 79.8947,
    radiusKm: 2.2,
  },
  { id: "nawala", name: "Nawala", lat: 6.8997, lng: 79.8886, radiusKm: 2.0 },
];

export const DEFAULT_MAP_CENTER = {
  lat: DEMO_ZONES[0].lat,
  lng: DEMO_ZONES[0].lng,
};

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function resolveZone(lat: number, lng: number): DemoZone | null {
  let best: { zone: DemoZone; distanceKm: number } | null = null;
  for (const zone of DEMO_ZONES) {
    const distanceKm = haversineKm(lat, lng, zone.lat, zone.lng);
    if (distanceKm <= zone.radiusKm) {
      if (!best || distanceKm < best.distanceKm) {
        best = { zone, distanceKm };
      }
    }
  }
  return best?.zone ?? null;
}

export function zoneByIdName(id: string | undefined): string | null {
  if (!id) return null;
  return DEMO_ZONES.find((z) => z.id === id)?.name ?? null;
}
