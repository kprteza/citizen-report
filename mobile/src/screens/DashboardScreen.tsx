import { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { ISSUE_TYPE_DEFS } from "../domain/issueTypes";
import { aggregate, type PeriodCounts } from "../dashboard/aggregate";
import type { HistoryEntry } from "../history/types";
import { theme } from "../theme";

interface Props {
  entries: HistoryEntry[];
}

const PERIODS: { key: "day" | "week" | "month" | "allTime"; label: string }[] = [
  { key: "day", label: "Today" },
  { key: "week", label: "This week" },
  { key: "month", label: "This month" },
  { key: "allTime", label: "All time" },
];

export function DashboardScreen({ entries }: Props) {
  const data = useMemo(() => aggregate(entries, new Date()), [entries]);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Reports by type</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {PERIODS.map((period) => (
          <PeriodCard key={period.key} label={period.label} counts={data[period.key]} />
        ))}
      </ScrollView>
    </View>
  );
}

function PeriodCard({ label, counts }: { label: string; counts: PeriodCounts }) {
  const max = Math.max(1, ...ISSUE_TYPE_DEFS.map((d) => counts.byType[d.value]));
  return (
    <View style={styles.card}>
      <View style={styles.cardHead}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardTotal}>{counts.total}</Text>
      </View>
      {counts.total === 0 ? (
        <Text style={styles.noData}>No reports</Text>
      ) : (
        ISSUE_TYPE_DEFS.filter((d) => counts.byType[d.value] > 0).map((d) => {
          const value = counts.byType[d.value];
          return (
            <View key={d.value} style={styles.row}>
              <Text style={styles.rowLabel} numberOfLines={1}>
                {d.label}
              </Text>
              <View style={styles.barTrack}>
                <View
                  style={[styles.barFill, { width: `${(value / max) * 100}%`, backgroundColor: d.color }]}
                />
              </View>
              <Text style={styles.rowValue}>{value}</Text>
            </View>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  header: { paddingHorizontal: theme.spacing(2.5), paddingTop: theme.spacing(2) },
  title: { color: theme.colors.text, fontSize: 28, fontWeight: "800" },
  subtitle: { color: theme.colors.textMuted, fontSize: 14, marginTop: 2 },
  content: { padding: theme.spacing(2.5), gap: theme.spacing(1.5) },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: theme.spacing(2),
  },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: theme.spacing(1) },
  cardLabel: { color: theme.colors.text, fontSize: 16, fontWeight: "700" },
  cardTotal: { color: theme.colors.primary, fontSize: 22, fontWeight: "800" },
  noData: { color: theme.colors.textMuted, fontStyle: "italic" },
  row: { flexDirection: "row", alignItems: "center", gap: theme.spacing(1), marginTop: theme.spacing(0.75) },
  rowLabel: { color: theme.colors.textMuted, fontSize: 12, width: 120 },
  barTrack: { flex: 1, height: 10, backgroundColor: theme.colors.surfaceAlt, borderRadius: 6, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 6 },
  rowValue: { color: theme.colors.text, fontWeight: "700", width: 24, textAlign: "right" },
});
