import { haversineKm, haversineMeters, isTravelFeasible } from "./geo.js";
import { reportLocation, type Report } from "./report.js";

export interface MovementMatch {
  prior: Report;
  distanceKm: number;
  elapsedHours: number;
}

export interface MovementParams {
  /** Search radius for candidate prior reports (e.g. 10 or 20 km). */
  radiusKm: number;
  /** Plausible maximum travel speed for the mover, km/h. */
  maxSpeedKmh: number;
}

/**
 * For a mobile nuisance (e.g. a biker gang), find earlier reports of the SAME
 * issue type that are within `radiusKm` AND close enough in time that a single
 * group could physically have travelled between the two points.
 *
 * `target` must be the most recent report; only strictly-earlier priors are
 * considered. Results are sorted nearest-first.
 */
export function findMovementMatches(
  target: Report,
  history: Report[],
  params: MovementParams,
): MovementMatch[] {
  const targetTime = new Date(target.observedAt).getTime();
  const matches: MovementMatch[] = [];

  for (const prior of history) {
    if (prior.id === target.id) continue;
    if (prior.issueType !== target.issueType) continue;

    const priorTime = new Date(prior.observedAt).getTime();
    const elapsedHours = (targetTime - priorTime) / 3_600_000;
    if (elapsedHours < 0) continue; // prior must be earlier

    const distanceKm = haversineKm(reportLocation(target), reportLocation(prior));
    if (distanceKm > params.radiusKm) continue;
    if (!isTravelFeasible(distanceKm, elapsedHours, params.maxSpeedKmh)) continue;

    matches.push({ prior, distanceKm, elapsedHours });
  }

  return matches.sort((a, b) => a.distanceKm - b.distanceKm);
}

/**
 * For a stationary nuisance (e.g. an illegal garbage dump), find earlier reports
 * of the SAME issue type at effectively the same location. When one or more are
 * found, the target plus those priors represent more than one report at the same
 * place and should be correlated.
 */
export function findColocatedReports(
  target: Report,
  history: Report[],
  radiusMeters: number,
): Report[] {
  return history.filter((prior) => {
    if (prior.id === target.id) return false;
    if (prior.issueType !== target.issueType) return false;
    return (
      haversineMeters(reportLocation(target), reportLocation(prior)) <= radiusMeters
    );
  });
}
