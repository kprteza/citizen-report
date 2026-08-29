import { findColocatedReports, findMovementMatches } from "../domain/correlation.js";
import { correlationStrategyFor } from "../domain/issueType.js";
import { composeColocationPost, composeMovementPost } from "../domain/postContent.js";
import { reportLocation, type Report } from "../domain/report.js";
import { DEFAULT_CORRELATION_CONFIG, type CorrelationConfig } from "./config.js";
import type {
  MapRenderer,
  PoliceDirectory,
  ReportRepository,
  SocialPoster,
  SocialPostResult,
} from "./ports.js";

export type ProcessOutcome =
  | { kind: "skipped"; reason: "no_correlation_strategy" }
  | { kind: "no_match"; strategy: "movement" | "colocation" }
  | {
      kind: "correlated";
      strategy: "movement" | "colocation";
      matchedReportIds: string[];
      post: SocialPostResult;
    };

export interface ProcessReportDeps {
  repository: ReportRepository;
  mapRenderer: MapRenderer;
  socialPoster: SocialPoster;
  policeDirectory: PoliceDirectory;
  config?: CorrelationConfig;
}

/**
 * Correlates a freshly-stored report with earlier ones and, when a meaningful
 * correlation is found, posts a map to X tagging local police. Split into small
 * private helpers so each branch is independently testable.
 */
export class ProcessReportUseCase {
  private readonly config: CorrelationConfig;

  constructor(private readonly deps: ProcessReportDeps) {
    this.config = deps.config ?? DEFAULT_CORRELATION_CONFIG;
  }

  async execute(report: Report): Promise<ProcessOutcome> {
    const strategy = correlationStrategyFor(report.issueType);
    if (strategy === "movement") return this.processMovement(report);
    if (strategy === "colocation") return this.processColocation(report);
    return { kind: "skipped", reason: "no_correlation_strategy" };
  }

  private async processMovement(report: Report): Promise<ProcessOutcome> {
    const { radiusKm, maxSpeedKmh, windowMs } = this.config.movement;
    const since = new Date(new Date(report.createdAt).getTime() - windowMs);
    const candidates = await this.deps.repository.findCandidates({
      issueType: report.issueType,
      center: reportLocation(report),
      radiusKm,
      since,
    });

    const matches = findMovementMatches(report, candidates, {
      radiusKm,
      maxSpeedKmh,
    });
    if (matches.length === 0) return { kind: "no_match", strategy: "movement" };

    const nearest = matches[0];
    const image = await this.deps.mapRenderer.render({
      points: [reportLocation(nearest.prior), reportLocation(report)],
      drawPath: true,
    });
    const policeHandle = await this.deps.policeDirectory.handleFor(
      reportLocation(report),
    );
    const post = await this.deps.socialPoster.post({
      text: composeMovementPost({
        target: report,
        prior: nearest.prior,
        distanceKm: nearest.distanceKm,
        elapsedHours: nearest.elapsedHours,
        policeHandle,
      }),
      image,
    });

    return {
      kind: "correlated",
      strategy: "movement",
      matchedReportIds: [nearest.prior.id, report.id],
      post,
    };
  }

  private async processColocation(report: Report): Promise<ProcessOutcome> {
    const { radiusMeters, windowMs } = this.config.colocation;
    const since = new Date(new Date(report.createdAt).getTime() - windowMs);
    const candidates = await this.deps.repository.findCandidates({
      issueType: report.issueType,
      center: reportLocation(report),
      radiusKm: Math.max(radiusMeters / 1000, 0.1),
      since,
    });

    const colocated = findColocatedReports(report, candidates, radiusMeters);
    if (colocated.length === 0) return { kind: "no_match", strategy: "colocation" };

    const image = await this.deps.mapRenderer.render({
      points: [reportLocation(report), ...colocated.map(reportLocation)],
      drawPath: false,
    });
    const policeHandle = await this.deps.policeDirectory.handleFor(
      reportLocation(report),
    );
    const post = await this.deps.socialPoster.post({
      text: composeColocationPost({ target: report, others: colocated, policeHandle }),
      image,
    });

    return {
      kind: "correlated",
      strategy: "colocation",
      matchedReportIds: [report.id, ...colocated.map((r) => r.id)],
      post,
    };
  }
}
