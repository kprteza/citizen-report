import { ISSUE_TYPES, type IssueType } from "../domain/issueTypes";

export interface PeriodCounts {
  total: number;
  byType: Record<IssueType, number>;
}

export interface DashboardData {
  day: PeriodCounts;
  week: PeriodCounts;
  month: PeriodCounts;
  allTime: PeriodCounts;
}

export interface AggregatableEntry {
  issueType: IssueType;
  createdAt: string;
}

function emptyCounts(): PeriodCounts {
  const byType = {} as Record<IssueType, number>;
  for (const t of ISSUE_TYPES) byType[t] = 0;
  return { total: 0, byType };
}

function startOfDay(now: Date): number {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

/** Start of the current week, Monday 00:00 local time. */
function startOfWeek(now: Date): number {
  const day = startOfDay(now);
  // getDay(): 0=Sun..6=Sat; days since Monday.
  const dow = new Date(day).getDay();
  const daysSinceMonday = (dow + 6) % 7;
  return day - daysSinceMonday * 24 * 60 * 60 * 1000;
}

function startOfMonth(now: Date): number {
  return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
}

function add(counts: PeriodCounts, type: IssueType): void {
  counts.total += 1;
  counts.byType[type] += 1;
}

/**
 * Aggregate history entries by report type across four windows anchored at `now`:
 * today, this week (from Monday), this month, and all time. Pure and testable.
 */
export function aggregate(entries: AggregatableEntry[], now: Date): DashboardData {
  const dayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const monthStart = startOfMonth(now);

  const data: DashboardData = {
    day: emptyCounts(),
    week: emptyCounts(),
    month: emptyCounts(),
    allTime: emptyCounts(),
  };

  for (const entry of entries) {
    const t = new Date(entry.createdAt).getTime();
    if (Number.isNaN(t)) continue;
    add(data.allTime, entry.issueType);
    if (t >= monthStart) add(data.month, entry.issueType);
    if (t >= weekStart) add(data.week, entry.issueType);
    if (t >= dayStart) add(data.day, entry.issueType);
  }

  return data;
}
