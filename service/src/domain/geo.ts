export interface GeoPoint {
  latitude: number;
  longitude: number;
}

const EARTH_RADIUS_KM = 6371.0088;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Great-circle distance between two points in kilometres (Haversine formula).
 * Pure and side-effect free so it is trivially unit testable.
 */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLon = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h =
    sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function haversineMeters(a: GeoPoint, b: GeoPoint): number {
  return haversineKm(a, b) * 1000;
}

/** True when two points are within `meters` of each other. */
export function isWithinMeters(a: GeoPoint, b: GeoPoint, meters: number): boolean {
  return haversineMeters(a, b) <= meters;
}

/**
 * Whether a single mover could have travelled `distanceKm` in `elapsedHours`
 * without exceeding `maxSpeedKmh`. Used to decide whether two sightings of a
 * mobile nuisance (e.g. a biker gang) could be the same group.
 *
 * - Negative elapsed time is never feasible.
 * - Zero distance is always feasible (same place).
 * - Otherwise feasible when distance <= maxSpeed * elapsedTime.
 */
export function isTravelFeasible(
  distanceKm: number,
  elapsedHours: number,
  maxSpeedKmh: number,
): boolean {
  if (elapsedHours < 0) return false;
  if (distanceKm <= 0) return true;
  if (maxSpeedKmh <= 0) return false;
  return distanceKm <= maxSpeedKmh * elapsedHours;
}
