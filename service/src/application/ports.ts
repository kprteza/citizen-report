import type { GeoPoint } from "../domain/geo.js";
import type { IssueType } from "../domain/issueType.js";
import type { Report } from "../domain/report.js";

/**
 * Query for prior reports that could correlate with, or duplicate, a new report.
 * Implementations return a superset (same issue type, roughly within the area and
 * time window); precise geo/time filtering is done by pure domain functions so it
 * stays identical across storage backends.
 */
export interface CandidateQuery {
  issueType: IssueType;
  center: GeoPoint;
  radiusKm: number;
  since: Date;
}

/** Persistence port. RDS/Postgres today; DynamoDB or others can be swapped in. */
export interface ReportRepository {
  save(report: Report): Promise<void>;
  findCandidates(query: CandidateQuery): Promise<Report[]>;
  getById(id: string): Promise<Report | null>;
}

export interface StoredImage {
  key: string;
  url: string;
}

/** Binary blob storage port (e.g. S3). */
export interface ImageStore {
  put(data: Buffer, contentType: string): Promise<StoredImage>;
  urlFor(key: string): string;
}

export interface RenderedImage {
  data: Buffer;
  contentType: string;
  /** A shareable URL for the rendered map, when the renderer produces one. */
  url?: string;
}

export interface MapRenderRequest {
  /** Markers to place on the map. */
  points: GeoPoint[];
  /** When true, draw a path connecting the points in order. */
  drawPath?: boolean;
}

/** Renders a static map image (markers and optional route path). */
export interface MapRenderer {
  render(request: MapRenderRequest): Promise<RenderedImage>;
}

export interface SocialPost {
  text: string;
  image?: RenderedImage;
}

export interface SocialPostResult {
  id: string;
  url: string;
}

/** Posts to a social network (X/Twitter). Fakeable and swappable. */
export interface SocialPoster {
  post(post: SocialPost): Promise<SocialPostResult>;
}

/** Resolves the local police social handle responsible for a location. */
export interface PoliceDirectory {
  handleFor(point: GeoPoint): Promise<string | null>;
}

export interface Clock {
  now(): Date;
}

export interface IdGenerator {
  next(): string;
}

export interface AuthPrincipal {
  clientId: string;
}

/** Verifies an inbound credential (e.g. bearer token). */
export interface Authenticator {
  verify(token: string | undefined): Promise<AuthPrincipal | null>;
}
