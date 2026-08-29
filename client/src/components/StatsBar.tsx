import type { Stats } from "../types";

interface Props {
  stats: Stats | null;
}

export function StatsBar({ stats }: Props) {
  const items = [
    { key: "total", label: "Total reports", value: stats?.total ?? 0, tone: "neutral" },
    { key: "open", label: "Open", value: stats?.byStatus.open ?? 0, tone: "open" },
    {
      key: "in_progress",
      label: "In progress",
      value: stats?.byStatus.in_progress ?? 0,
      tone: "in_progress",
    },
    {
      key: "resolved",
      label: "Resolved",
      value: stats?.byStatus.resolved ?? 0,
      tone: "resolved",
    },
  ];

  return (
    <div className="stats-bar">
      {items.map((item) => (
        <div key={item.key} className={`stat-card stat-${item.tone}`}>
          <span className="stat-value">{item.value}</span>
          <span className="stat-label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
