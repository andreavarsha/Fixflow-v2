import { GeospatialIndex } from "@convex-dev/geospatial";
import type { MutationCtx } from "./_generated/server";
import { components } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

/** Kadana centre — fixed search origin for all owner discovery (PRD §3.2). */
export const KADANA_LAT = 7.0167;
export const KADANA_LNG = 79.9833;

/** ~15 km bounding box in degrees. */
export const BBOX_RADIUS_DEG = 0.14;
export const MAX_DISTANCE_KM = 15;

export type SupplierFilterKeys = {
  category: string;
  approved: boolean;
  available: boolean;
  suspended: boolean;
};

export const supplierGeospatial = new GeospatialIndex<
  Id<"users">,
  SupplierFilterKeys
>(components.geospatial);

export function kadanaBoundingBox() {
  return {
    west: KADANA_LNG - BBOX_RADIUS_DEG,
    east: KADANA_LNG + BBOX_RADIUS_DEG,
    south: KADANA_LAT - BBOX_RADIUS_DEG,
    north: KADANA_LAT + BBOX_RADIUS_DEG,
  };
}

/** Haversine distance in km between two WGS84 points. */
export function haversineKm(
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

export function distanceFromKadanaKm(lat: number, lng: number): number {
  return haversineKm(KADANA_LAT, KADANA_LNG, lat, lng);
}

function supplierFilterKeys(user: {
  category?: string;
  approved?: boolean;
  available?: boolean;
  suspended?: boolean;
}): SupplierFilterKeys {
  return {
    category: user.category ?? "",
    approved: user.approved === true,
    available: user.available !== false,
    suspended: user.suspended === true,
  };
}

/** Upsert a supplier's position and filter fields in the geospatial index. */
export async function syncSupplierGeospatial(
  ctx: MutationCtx,
  supplierId: Id<"users">,
) {
  const user = await ctx.db.get(supplierId);
  if (!user || user.role !== "supplier") {
    await supplierGeospatial.remove(ctx, supplierId);
    return;
  }
  if (user.lat === undefined || user.lng === undefined) {
    await supplierGeospatial.remove(ctx, supplierId);
    return;
  }

  await supplierGeospatial.remove(ctx, supplierId);
  await supplierGeospatial.insert(
    ctx,
    supplierId,
    { latitude: user.lat, longitude: user.lng },
    supplierFilterKeys(user),
  );
}
