import type { GeoPoint } from "./geo.js";
import type { IssueType } from "./issueType.js";

/** A report as submitted by a device, before the service assigns identity/time. */
export interface ReportInput {
  deviceId: string;
  issueType: IssueType;
  location: GeoPoint;
  note?: string;
  /** Storage key/URL of an optional attached photo, resolved before persistence. */
  photoKey?: string;
  /** ISO-8601 timestamp of when the observation occurred (client clock). */
  observedAt?: string;
}

/** A persisted report. */
export interface Report {
  id: string;
  deviceId: string;
  issueType: IssueType;
  latitude: number;
  longitude: number;
  note: string | null;
  photoKey: string | null;
  /** When the nuisance was observed (ISO-8601, UTC). Drives movement timing. */
  observedAt: string;
  /** Server-assigned receipt time (ISO-8601, UTC). */
  createdAt: string;
  country: string;
  /**
   * False for the FIRST report of an issue (a unique issue); true for a report
   * that correlated with an earlier one (a follow-on biker-gang sighting or an
   * additional report of the same stationary issue). Dashboards count only the
   * first reports (isCorrelated === false) so they measure unique issues.
   */
  isCorrelated: boolean;
}

export function reportLocation(report: Report): GeoPoint {
  return { latitude: report.latitude, longitude: report.longitude };
}
