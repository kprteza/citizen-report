import type { ReportCategory, ReportSeverity, ReportStatus } from "./types";

export const CATEGORIES: { value: ReportCategory; label: string }[] = [
  { value: "pothole", label: "Pothole / Road" },
  { value: "streetlight", label: "Streetlight" },
  { value: "graffiti", label: "Graffiti" },
  { value: "trash", label: "Trash / Sanitation" },
  { value: "water", label: "Water / Drainage" },
  { value: "other", label: "Other" },
];

export const SEVERITIES: { value: ReportSeverity; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

export const STATUSES: { value: ReportStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
];

export const CATEGORY_LABEL: Record<ReportCategory, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.value, c.label]),
) as Record<ReportCategory, string>;

export const STATUS_LABEL: Record<ReportStatus, string> = Object.fromEntries(
  STATUSES.map((s) => [s.value, s.label]),
) as Record<ReportStatus, string>;
