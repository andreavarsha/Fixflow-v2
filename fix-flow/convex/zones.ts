import { haversineKm } from "./supplierGeospatial";

/** Demo coverage zones for Improvement PRD v2.0. */
export type ZoneId = "kadana" | "rajagiriya" | "nawala";

export type DemoZone = {
  id: ZoneId;
  name: string;
  lat: number;
  lng: number;
  /** Approximate coverage radius in km. */
  radiusKm: number;
};

export const DEMO_ZONES: DemoZone[] = [
  {
    id: "kadana",
    name: "Kadawatha",
    lat: 7.0021,
    lng: 79.9512,
    radiusKm: 3.5,
  },
  {
    id: "rajagiriya",
    name: "Rajagiriya",
    lat: 6.9106,
    lng: 79.8947,
    radiusKm: 2.2,
  },
  {
    id: "nawala",
    name: "Nawala",
    lat: 6.8997,
    lng: 79.8886,
    radiusKm: 2.0,
  },
];

/** Default map center when GPS is unavailable (Kadana). */
export const DEFAULT_MAP_CENTER = {
  lat: DEMO_ZONES[0].lat,
  lng: DEMO_ZONES[0].lng,
};

/** Max supplier search radius around a job pin (km). */
export const JOB_SEARCH_RADIUS_KM = 8;

/** Degrees roughly covering JOB_SEARCH_RADIUS_KM for geospatial bbox. */
export const JOB_SEARCH_BBOX_DEG = 0.08;

export function resolveZone(
  lat: number,
  lng: number,
): DemoZone | null {
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

export function boundingBoxAround(
  lat: number,
  lng: number,
  radiusDeg: number = JOB_SEARCH_BBOX_DEG,
) {
  return {
    west: lng - radiusDeg,
    east: lng + radiusDeg,
    south: lat - radiusDeg,
    north: lat + radiusDeg,
  };
}

export function zoneById(id: string | undefined): DemoZone | null {
  if (!id) return null;
  return DEMO_ZONES.find((z) => z.id === id) ?? null;
}
