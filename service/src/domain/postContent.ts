import { ISSUE_LABEL } from "./issueType.js";
import type { Report } from "./report.js";

function coord(report: Report): string {
  return `${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}`;
}

function timeLabel(iso: string): string {
  // Compact, timezone-explicit label (UTC) for reproducibility.
  return new Date(iso).toISOString().replace("T", " ").replace(".000Z", "Z");
}

/**
 * Compose the X post for a correlated mobile nuisance (e.g. a biker gang) seen at
 * two points within travel range. Tags local police when a handle is known.
 */
export function composeMovementPost(params: {
  target: Report;
  prior: Report;
  distanceKm: number;
  elapsedHours: number;
  policeHandle: string | null;
}): string {
  const { target, prior, distanceKm, elapsedHours, policeHandle } = params;
  const label = ISSUE_LABEL[target.issueType];
  const minutes = Math.round(elapsedHours * 60);
  const tag = policeHandle ? ` ${policeHandle}` : "";
  return (
    `Possible moving ${label} correlated across two reports ` +
    `${distanceKm.toFixed(1)} km apart within ${minutes} min ` +
    `(${timeLabel(prior.observedAt)} -> ${timeLabel(target.observedAt)}). ` +
    `Latest location: ${coord(target)}.${tag}`
  );
}

/**
 * Compose the X post for multiple co-located reports of the same stationary issue
 * (e.g. an illegal garbage dump reported by several people).
 */
export function composeColocationPost(params: {
  target: Report;
  others: Report[];
  policeHandle: string | null;
}): string {
  const { target, others, policeHandle } = params;
  const label = ISSUE_LABEL[target.issueType];
  const count = others.length + 1;
  const tag = policeHandle ? ` ${policeHandle}` : "";
  return (
    `${count} reports of ${label} at the same location: ${coord(target)}. ` +
    `Please investigate.${tag}`
  );
}
