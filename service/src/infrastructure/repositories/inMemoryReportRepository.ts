import type { CandidateQuery, ReportRepository } from "../../application/ports.js";
import { haversineKm } from "../../domain/geo.js";
import type { Report } from "../../domain/report.js";

/**
 * In-memory repository. Used as the default local adapter and as a test double.
 * Applies the same candidate semantics (issue type + area + time) as the SQL and
 * DynamoDB adapters so use-case behaviour is backend-independent.
 */
export class InMemoryReportRepository implements ReportRepository {
  private readonly reports: Report[] = [];

  async save(report: Report): Promise<void> {
    this.reports.push({ ...report });
  }

  async getById(id: string): Promise<Report | null> {
    const found = this.reports.find((r) => r.id === id);
    return found ? { ...found } : null;
  }

  async findCandidates(query: CandidateQuery): Promise<Report[]> {
    const sinceMs = query.since.getTime();
    return this.reports
      .filter((r) => r.issueType === query.issueType)
      .filter((r) => new Date(r.createdAt).getTime() >= sinceMs)
      .filter(
        (r) =>
          haversineKm(query.center, {
            latitude: r.latitude,
            longitude: r.longitude,
          }) <= query.radiusKm,
      )
      .map((r) => ({ ...r }));
  }

  /** Test helper. */
  all(): Report[] {
    return this.reports.map((r) => ({ ...r }));
  }
}
