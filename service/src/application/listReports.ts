import { collapseToUniqueIssues } from "../domain/mapView.js";
import type { Report } from "../domain/report.js";
import type { ListReportsQuery, ReportRepository } from "./ports.js";

/**
 * Lists reports for the dashboard/map. Correlated follow-ons are removed so the
 * result represents unique issues (see collapseToUniqueIssues).
 */
export class ListReportsUseCase {
  constructor(private readonly repository: ReportRepository) {}

  async execute(query: ListReportsQuery): Promise<Report[]> {
    const reports = await this.repository.list(query);
    return collapseToUniqueIssues(reports);
  }
}
