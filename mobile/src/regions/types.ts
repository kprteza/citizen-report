export interface SavedRegion {
  id: string;
  /** Display name, e.g. "Tōkyō" or "Current location". */
  name: string;
  latitude: number;
  longitude: number;
  /** How this region was added. */
  source: "gps" | "manual";
  /** Prefecture code when added manually. */
  prefectureCode?: string;
}

/** Maximum number of regions a user can save (and dashboard scopes). */
export const MAX_REGIONS = 3;
