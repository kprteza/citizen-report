import type { Report, ReportStatus } from "../types";
import { CATEGORY_LABEL, STATUS_LABEL, STATUSES } from "../constants";

interface Props {
  report: Report;
  onStatusChange: (id: string, status: ReportStatus) => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ReportCard({ report, onStatusChange }: Props) {
  return (
    <article className="card report-card">
      <div className="report-card-head">
        <span className={`badge badge-severity-${report.severity}`}>
          {report.severity}
        </span>
        <span className={`badge badge-status-${report.status}`}>
          {STATUS_LABEL[report.status]}
        </span>
      </div>

      <h3>{report.title}</h3>
      <p className="report-desc">{report.description}</p>

      <dl className="report-meta">
        <div>
          <dt>Category</dt>
          <dd>{CATEGORY_LABEL[report.category]}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd>{report.address}</dd>
        </div>
        <div>
          <dt>Reported by</dt>
          <dd>{report.reporter_name}</dd>
        </div>
        <div>
          <dt>Reported</dt>
          <dd>{formatDate(report.created_at)}</dd>
        </div>
      </dl>

      <label className="status-control">
        Update status
        <select
          value={report.status}
          onChange={(e) =>
            onStatusChange(report.id, e.target.value as ReportStatus)
          }
        >
          {STATUSES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
    </article>
  );
}
