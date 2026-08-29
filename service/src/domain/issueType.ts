/**
 * The civic nuisance categories a citizen can report. The string values are the
 * stable wire/storage representation and must not change without a migration.
 */
export const ISSUE_TYPES = [
  "illegal_garbage_dumping",
  "noise_nuisance",
  "biker_gang",
  "accident",
  "illegal_barbecue",
  "bear_sighting",
] as const;

export type IssueType = (typeof ISSUE_TYPES)[number];

export function isIssueType(value: unknown): value is IssueType {
  return (
    typeof value === "string" && (ISSUE_TYPES as readonly string[]).includes(value)
  );
}

/**
 * How a given issue type should be correlated with earlier reports.
 *
 * - "movement": the source is mobile (e.g. a biker gang). Earlier reports within
 *   a wide radius are candidate matches when travel between the two points is
 *   physically possible for the elapsed time.
 * - "colocation": the source is stationary (e.g. an illegal garbage dump). Two or
 *   more reports at effectively the same place are correlated together.
 * - "none": no automatic correlation is performed.
 */
export type CorrelationStrategy = "movement" | "colocation" | "none";

export const CORRELATION_STRATEGY: Record<IssueType, CorrelationStrategy> = {
  biker_gang: "movement",
  illegal_garbage_dumping: "colocation",
  noise_nuisance: "colocation",
  illegal_barbecue: "colocation",
  accident: "none",
  bear_sighting: "colocation",
};

/** Human-readable labels (English). Localized labels live in the mobile client. */
export const ISSUE_LABEL: Record<IssueType, string> = {
  illegal_garbage_dumping: "Illegal garbage dumping",
  noise_nuisance: "Loud music / noise nuisance",
  biker_gang: "Loud biker gang",
  accident: "Accident",
  illegal_barbecue: "Illegal barbecue",
  bear_sighting: "Bear sighting",
};

export function correlationStrategyFor(type: IssueType): CorrelationStrategy {
  return CORRELATION_STRATEGY[type];
}
