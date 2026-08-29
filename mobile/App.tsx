import { useMemo, useState } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { TabBar } from "./src/components/TabBar";
import type { TabKey } from "./src/navigation/tabs";
import { ReportFlowScreen } from "./src/screens/ReportFlowScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { DonateScreen } from "./src/screens/DonateScreen";
import { useHistory } from "./src/hooks/useHistory";
import type { RecentSubmission } from "./src/dedupe/localDedupe";

export default function App() {
  const [tab, setTab] = useState<TabKey>("report");
  const { entries, add } = useHistory();

  // Persisted history doubles as the client-side dedupe source.
  const recentSubmissions = useMemo<RecentSubmission[]>(
    () =>
      entries.map((e) => ({
        issueType: e.issueType,
        latitude: e.latitude,
        longitude: e.longitude,
        at: new Date(e.createdAt).getTime(),
      })),
    [entries],
  );

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" />
      <View style={styles.screen}>
        {tab === "report" && (
          <ReportFlowScreen recentSubmissions={recentSubmissions} onSubmitted={add} />
        )}
        {tab === "history" && <HistoryScreen entries={entries} />}
        {tab === "dashboard" && <DashboardScreen entries={entries} />}
        {tab === "donate" && <DonateScreen />}
      </View>
      <TabBar active={tab} onChange={setTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f172a" },
  screen: { flex: 1 },
});
