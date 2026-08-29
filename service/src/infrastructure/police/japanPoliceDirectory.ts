import type { PoliceDirectory } from "../../application/ports.js";
import type { GeoPoint } from "../../domain/geo.js";

export interface PoliceRegion {
  name: string;
  handle: string;
  /** Approximate bounding box of the jurisdiction. */
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

/**
 * Approximate prefectural bounding boxes with the corresponding police social
 * handle. These are intentionally coarse and configurable — the point is a clean,
 * swappable resolver, not an authoritative GIS boundary set. Refine per rollout.
 */
export const JAPAN_POLICE_REGIONS: PoliceRegion[] = [
  {
    name: "Tokyo Metropolitan",
    handle: "@MPD_koho",
    minLat: 35.5,
    maxLat: 35.9,
    minLng: 139.3,
    maxLng: 139.95,
  },
  {
    name: "Osaka Prefectural",
    handle: "@OsakaFukei_PR",
    minLat: 34.4,
    maxLat: 34.85,
    minLng: 135.25,
    maxLng: 135.75,
  },
  {
    name: "Kyoto Prefectural",
    handle: "@Kyoto_Pref_PD",
    minLat: 34.85,
    maxLat: 35.35,
    minLng: 135.5,
    maxLng: 136.0,
  },
];

/** National Police Agency — used when no prefecture matches. */
export const JAPAN_NATIONAL_HANDLE = "@NPA_KOHO";

function contains(region: PoliceRegion, point: GeoPoint): boolean {
  return (
    point.latitude >= region.minLat &&
    point.latitude <= region.maxLat &&
    point.longitude >= region.minLng &&
    point.longitude <= region.maxLng
  );
}

export class JapanPoliceDirectory implements PoliceDirectory {
  constructor(
    private readonly regions: PoliceRegion[] = JAPAN_POLICE_REGIONS,
    private readonly fallback: string | null = JAPAN_NATIONAL_HANDLE,
  ) {}

  async handleFor(point: GeoPoint): Promise<string | null> {
    const region = this.regions.find((r) => contains(r, point));
    return region ? region.handle : this.fallback;
  }
}
