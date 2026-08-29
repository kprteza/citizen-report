import type { IssueType } from "../domain/issueTypes";

/** A report as cached locally on the device (Report History tab). */
export interface HistoryEntry {
  id: string;
  issueType: IssueType;
  latitude: number;
  longitude: number;
  note?: string;
  hasPhoto: boolean;
  /** ISO-8601 timestamp of when the report was submitted. */
  createdAt: string;
  /** Server outcome. */
  status: "accepted" | "duplicate_discarded";
  /** True when the backend correlated this report with others. */
  correlated: boolean;
  /** Link to the social media (X) post, if one was created for this report. */
  postUrl?: string;
}
