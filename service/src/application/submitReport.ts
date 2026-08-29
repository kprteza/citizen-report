import { DEFAULT_DEDUPE_POLICY, isDuplicate, type DedupePolicy } from "../domain/dedupe.js";
import type { GeoPoint } from "../domain/geo.js";
import type { IssueType } from "../domain/issueType.js";
import type { Report, ReportInput } from "../domain/report.js";
import type { ProcessOutcome, ProcessReportUseCase } from "./processReport.js";
import type { Clock, IdGenerator, ImageStore, ReportRepository } from "./ports.js";

export interface SubmitReportInput extends ReportInput {
  photo?: { data: Buffer; contentType: string };
}

export type SubmitResult =
  | { status: "discarded_duplicate" }
  | { status: "accepted"; report: Report; processing: ProcessOutcome };

export interface SubmitReportDeps {
  repository: ReportRepository;
  imageStore?: ImageStore;
  clock: Clock;
  idGenerator: IdGenerator;
  processor: ProcessReportUseCase;
  country: string;
  dedupePolicy?: DedupePolicy;
}

export class SubmitReportUseCase {
  private readonly dedupePolicy: DedupePolicy;

  constructor(private readonly deps: SubmitReportDeps) {
    this.dedupePolicy = deps.dedupePolicy ?? DEFAULT_DEDUPE_POLICY;
  }

  async execute(input: SubmitReportInput): Promise<SubmitResult> {
    const now = this.deps.clock.now();

    if (await this.isDuplicate(input, input.location, now)) {
      // Silently discard duplicates from the same device at the same location.
      return { status: "discarded_duplicate" };
    }

    const photoKey = await this.storePhoto(input);
    const report: Report = {
      id: this.deps.idGenerator.next(),
      deviceId: input.deviceId,
      issueType: input.issueType,
      latitude: input.location.latitude,
      longitude: input.location.longitude,
      note: input.note?.trim() ? input.note.trim() : null,
      photoKey,
      observedAt: this.resolveObservedAt(input, now),
      createdAt: now.toISOString(),
      country: this.deps.country,
      isCorrelated: false,
    };

    await this.deps.repository.save(report);
    const processing = await this.deps.processor.execute(report);

    // Any report that correlated with an earlier one (biker-gang follow-on or an
    // additional report of the same stationary issue) is not a unique issue, so
    // dashboards ignore it. The first report of an issue stays isCorrelated=false.
    if (processing.kind === "correlated") {
      report.isCorrelated = true;
      await this.deps.repository.markCorrelated(report.id);
    }

    return { status: "accepted", report, processing };
  }

  private async isDuplicate(
    input: SubmitReportInput,
    center: GeoPoint,
    now: Date,
  ): Promise<boolean> {
    const since = new Date(now.getTime() - this.dedupePolicy.windowMs);
    const candidates = await this.deps.repository.findCandidates({
      issueType: input.issueType as IssueType,
      center,
      radiusKm: Math.max(this.dedupePolicy.radiusMeters / 1000, 0.05),
      since,
    });
    return isDuplicate(input, candidates, now, this.dedupePolicy);
  }

  /** Trust a client-provided observation time only if it is a valid, non-future date. */
  private resolveObservedAt(input: SubmitReportInput, now: Date): string {
    if (!input.observedAt) return now.toISOString();
    const parsed = new Date(input.observedAt);
    if (Number.isNaN(parsed.getTime())) return now.toISOString();
    if (parsed.getTime() > now.getTime()) return now.toISOString();
    return parsed.toISOString();
  }

  private async storePhoto(input: SubmitReportInput): Promise<string | null> {
    if (!input.photo) return input.photoKey ?? null;
    if (!this.deps.imageStore) return null;
    const stored = await this.deps.imageStore.put(
      input.photo.data,
      input.photo.contentType,
    );
    return stored.key;
  }
}
