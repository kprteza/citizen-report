import type { Report } from "./report.js";

/**
 * Dashboards count unique ISSUES, not unique reports. Any report that correlated
 * with an earlier one (a follow-on sighting for a moving biker gang, or an
 * additional report of the same stationary issue at a location) is dropped, so a
 * single real-world issue is represented once by its first (originating) report.
 */
export function collapseToUniqueIssues(reports: Report[]): Report[] {
  return reports.filter((r) => !r.isCorrelated);
}
