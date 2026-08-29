import { MAX_REGIONS, type SavedRegion } from "./types";

/** Whether another region can be added (max enforced). */
export function canAddRegion(regions: SavedRegion[]): boolean {
  return regions.length < MAX_REGIONS;
}

/**
 * Adds a region, enforcing the max and de-duplicating by prefecture (manual) or
 * by very-near coordinates (gps). Returns the new list; if it can't be added the
 * original list is returned unchanged.
 */
export function addRegion(regions: SavedRegion[], region: SavedRegion): SavedRegion[] {
  if (!canAddRegion(regions)) return regions;
  const duplicate = regions.some((r) =>
    region.prefectureCode
      ? r.prefectureCode === region.prefectureCode
      : Math.abs(r.latitude - region.latitude) < 0.01 &&
        Math.abs(r.longitude - region.longitude) < 0.01,
  );
  if (duplicate) return regions;
  return [...regions, region];
}

export function removeRegion(regions: SavedRegion[], id: string): SavedRegion[] {
  return regions.filter((r) => r.id !== id);
}
