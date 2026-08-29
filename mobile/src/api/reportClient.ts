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
