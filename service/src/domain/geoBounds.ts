import type { GeoPoint } from "./geo.js";

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

// Minimum km per degree of latitude (at the equator). Using the minimum makes
// the latitude delta maximal, so the box never under-covers the requested radius.
const KM_PER_DEGREE_LAT = 110.574;
// Extra margin so the axis-aligned box fully contains the circle despite the
// coarse flat-earth approximation. Over-covering is harmless: the exact haversine
// filter runs afterwards on the candidates.
const SAFETY_FACTOR = 1.01;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * An axis-aligned bounding box that fully contains the circle of `radiusKm`
 * around `center`. Used by SQL/NoSQL adapters for an index-friendly prefilter;
 * exact distance filtering is done afterwards in the domain layer.
 */
export function boundingBox(center: GeoPoint, radiusKm: number): BoundingBox {
  const reach = radiusKm * SAFETY_FACTOR;
  const latDelta = reach / KM_PER_DEGREE_LAT;
  const cosLat = Math.cos((center.latitude * Math.PI) / 180);
  // Near the poles cosLat -> 0; fall back to the full longitude range.
  const lngDelta =
    Math.abs(cosLat) < 1e-6 ? 180 : reach / (KM_PER_DEGREE_LAT * Math.abs(cosLat));

  return {
    minLat: clamp(center.latitude - latDelta, -90, 90),
    maxLat: clamp(center.latitude + latDelta, -90, 90),
    minLng: clamp(center.longitude - lngDelta, -180, 180),
    maxLng: clamp(center.longitude + lngDelta, -180, 180),
  };
}
