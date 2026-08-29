import type { NewReport, Report, ReportStatus, Stats } from "./types";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const message = await res.text().catch(() => res.statusText);
    throw new Error(`Request failed (${res.status}): ${message}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchReports(filters: {
  status?: string;
  category?: string;
}): Promise<Report[]> {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.category) params.set("category", filters.category);
  const qs = params.toString();
  return handle<Report[]>(await fetch(`/api/reports${qs ? `?${qs}` : ""}`));
}

export async function fetchStats(): Promise<Stats> {
  return handle<Stats>(await fetch("/api/stats"));
}

export async function createReport(report: NewReport): Promise<Report> {
  return handle<Report>(
    await fetch("/api/reports", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(report),
    }),
  );
}

export async function updateReportStatus(
  id: string,
  status: ReportStatus,
): Promise<Report> {
  return handle<Report>(
    await fetch(`/api/reports/${id}/status`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    }),
  );
}
