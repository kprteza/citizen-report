import { distanceMeters, type Coordinate } from "../domain/geo";
import type { IssueType } from "../domain/issueTypes";

export interface RecentSubmission {
  issueType: IssueType;
  latitude: number;
  longitude: number;
  /** Epoch milliseconds. */
  at: number;
}

export interface LocalDedupePolicy {
  radiusMeters: number;
  windowMs: number;
}

export const DEFAULT_LOCAL_DEDUPE_POLICY: LocalDedupePolicy = {
  radiusMeters: 30,
  windowMs: 6 * 60 * 60 * 1000,
};

export interface DedupeCandidate {
  issueType: IssueType;
  location: Coordinate;
}

/**
 * Client-side guard so the app can silently discard a duplicate report from this
 * device at the same location before it ever hits the network. Mirrors (and is
 * backed up by) the server-side dedupe.
 */
export function isLocalDuplicate(
  candidate: DedupeCandidate,
  recent: RecentSubmission[],
  now: number,
  policy: LocalDedupePolicy = DEFAULT_LOCAL_DEDUPE_POLICY,
): boolean {
  const cutoff = now - policy.windowMs;
  return recent.some(
    (prior) =>
      prior.issueType === candidate.issueType &&
      prior.at >= cutoff &&
      distanceMeters(candidate.location, {
        latitude: prior.latitude,
        longitude: prior.longitude,
      }) <= policy.radiusMeters,
  );
}

/** Drops submissions older than the window; keeps the recent list bounded. */
export function pruneRecent(
  recent: RecentSubmission[],
  now: number,
  policy: LocalDedupePolicy = DEFAULT_LOCAL_DEDUPE_POLICY,
): RecentSubmission[] {
  const cutoff = now - policy.windowMs;
  return recent.filter((r) => r.at >= cutoff);
}

export function recordSubmission(
  recent: RecentSubmission[],
  candidate: DedupeCandidate,
  now: number,
  policy: LocalDedupePolicy = DEFAULT_LOCAL_DEDUPE_POLICY,
): RecentSubmission[] {
  const entry: RecentSubmission = {
    issueType: candidate.issueType,
    latitude: candidate.location.latitude,
    longitude: candidate.location.longitude,
    at: now,
  };
  return pruneRecent([...recent, entry], now, policy);
}
