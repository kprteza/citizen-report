export type ReportStatus = "open" | "in_progress" | "resolved";
export type ReportSeverity = "low" | "medium" | "high";
export type ReportCategory =
  | "pothole"
  | "streetlight"
  | "graffiti"
  | "trash"
  | "water"
  | "other";

export interface Report {
  id: string;
  title: string;
  description: string;
  category: ReportCategory;
  severity: ReportSeverity;
  status: ReportStatus;
  address: string;
  latitude: number | null;
  longitude: number | null;
  reporter_name: string;
  created_at: string;
  updated_at: string;
}

export interface NewReport {
  title: string;
  description: string;
  category: ReportCategory;
  severity: ReportSeverity;
  address: string;
  reporter_name: string;
}

export interface Stats {
  total: number;
  byStatus: Partial<Record<ReportStatus, number>>;
  byCategory: Partial<Record<ReportCategory, number>>;
}
