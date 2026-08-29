import { isWithinMeters } from "./geo.js";
import type { Report, ReportInput } from "./report.js";

export interface DedupePolicy {
  /** Two reports at the same place are within this many metres. */
  radiusMeters: number;
  /** Only consider prior reports newer than this window (milliseconds). */
  windowMs: number;
}

export const DEFAULT_DEDUPE_POLICY: DedupePolicy = {
  radiusMeters: 30,
  windowMs: 6 * 60 * 60 * 1000, // 6 hours
};

/**
 * A candidate report is a duplicate when the SAME device reports the SAME issue
 * type at effectively the SAME location within the dedupe time window. Duplicates
 * are silently discarded by the submit use case.
 */
export function isDuplicate(
  candidate: ReportInput,
  existing: Report[],
  now: Date,
  policy: DedupePolicy = DEFAULT_DEDUPE_POLICY,
): boolean {
  const cutoff = now.getTime() - policy.windowMs;
  return existing.some((prior) => {
    if (prior.deviceId !== candidate.deviceId) return false;
    if (prior.issueType !== candidate.issueType) return false;
    if (new Date(prior.createdAt).getTime() < cutoff) return false;
    return isWithinMeters(
      candidate.location,
      { latitude: prior.latitude, longitude: prior.longitude },
      policy.radiusMeters,
    );
  });
}
