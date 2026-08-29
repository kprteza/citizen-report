import type { IssueType } from "../domain/issueTypes";

export interface ReportClientConfig {
  baseUrl: string;
  token: string;
  deviceId: string;
}

export interface SubmitReportRequest {
  issueType: IssueType;
  latitude: number;
  longitude: number;
  note?: string;
  observedAt?: string;
  photoBase64?: string;
  photoContentType?: "image/jpeg" | "image/png" | "image/webp";
}

export type SubmitStatus =
  | "accepted"
  | "duplicate_discarded"
  | "unauthorized"
  | "invalid"
  | "error";

export interface SubmitResult {
  status: SubmitStatus;
  httpStatus: number;
  correlation?: { correlated: boolean; postUrl?: string };
}

type FetchLike = (
  url: string,
  init: {
    method: string;
    headers: Record<string, string>;
    body: string;
  },
) => Promise<{ status: number; json(): Promise<unknown> }>;

export interface MapReport {
  id: string;
  issueType: IssueType;
  latitude: number;
  longitude: number;
  note: string | null;
  observedAt: string;
  createdAt: string;
}

export interface FetchReportsFilter {
  issueType?: IssueType;
  bbox?: [number, number, number, number]; // minLng,minLat,maxLng,maxLat
  limit?: number;
}

function statusFromHttp(http: number): SubmitStatus {
  if (http === 201) return "accepted";
  if (http === 202) return "duplicate_discarded";
  if (http === 401) return "unauthorized";
  if (http === 400) return "invalid";
  return "error";
}

/**
 * Sends a report to the backend with bearer auth and the device id. The fetch
 * implementation is injectable so this is unit-testable without a network.
 */
export async function submitReport(
  config: ReportClientConfig,
  request: SubmitReportRequest,
  fetchImpl: FetchLike = fetch as unknown as FetchLike,
): Promise<SubmitResult> {
  const res = await fetchImpl(`${config.baseUrl}/api/v1/reports`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.token}`,
      "x-device-id": config.deviceId,
    },
    body: JSON.stringify(request),
  });

  const status = statusFromHttp(res.status);
  let correlation: SubmitResult["correlation"];
  if (status === "accepted") {
    const body = (await res.json().catch(() => ({}))) as {
      correlation?: { correlated: boolean; postUrl?: string };
    };
    correlation = body.correlation;
  }
  return { status, httpStatus: res.status, correlation };
}

/** Fetches unique-issue reports for the dashboard map. */
export async function fetchReports(
  config: ReportClientConfig,
  filter: FetchReportsFilter = {},
  fetchImpl: typeof fetch = fetch,
): Promise<MapReport[]> {
  const params = new URLSearchParams();
  if (filter.issueType) params.set("issueType", filter.issueType);
  if (filter.bbox) params.set("bbox", filter.bbox.join(","));
  if (filter.limit) params.set("limit", String(filter.limit));
  const qs = params.toString();
  const res = await fetchImpl(
    `${config.baseUrl}/api/v1/reports${qs ? `?${qs}` : ""}`,
    { headers: { authorization: `Bearer ${config.token}` } },
  );
  if (!res.ok) throw new Error(`Failed to load reports (${res.status})`);
  return (await res.json()) as MapReport[];
}
