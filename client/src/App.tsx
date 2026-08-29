import { useCallback, useEffect, useMemo, useState } from "react";
import type { NewReport, Report, ReportStatus, Stats } from "./types";
import {
  createReport,
  fetchReports,
  fetchStats,
  updateReportStatus,
} from "./api";
import { CATEGORIES, STATUSES } from "./constants";
import { StatsBar } from "./components/StatsBar";
import { ReportForm } from "./components/ReportForm";
import { ReportCard } from "./components/ReportCard";

export default function App() {
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const [list, s] = await Promise.all([
        fetchReports({ status: statusFilter, category: categoryFilter }),
        fetchStats(),
      ]);
      setReports(list);
      setStats(s);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, categoryFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreate = useCallback(
    async (report: NewReport) => {
      await createReport(report);
      await refresh();
    },
    [refresh],
  );

  const handleStatusChange = useCallback(
    async (id: string, status: ReportStatus) => {
      await updateReportStatus(id, status);
      await refresh();
    },
    [refresh],
  );

  const heading = useMemo(() => {
    if (loading) return "Loading reports…";
    if (reports.length === 0) return "No reports match your filters yet";
    return `${reports.length} report${reports.length === 1 ? "" : "s"}`;
  }, [loading, reports.length]);

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <div>
              <h1>Citizen Report</h1>
              <p>Report local issues. Track them to resolution.</p>
            </div>
          </div>
        </div>
      </header>

      <main className="app-main">
        <StatsBar stats={stats} />

        <div className="layout">
          <section className="col-form">
            <ReportForm onCreate={handleCreate} />
          </section>

          <section className="col-list">
            <div className="list-toolbar card">
              <div className="filters">
                <label>
                  Status
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="">All</option>
                    {STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Category
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="">All</option>
                    {CATEGORIES.map((c) => (
                      <option key={c.value} value={c.value}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <span className="list-count">{heading}</span>
            </div>

            {error && <p className="form-error card">{error}</p>}

            <div className="report-grid">
              {reports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </section>
        </div>
      </main>

      <footer className="app-footer">
        <p>Citizen Report — a civic engagement demo application.</p>
      </footer>
    </div>
  );
}
