import { useMemo, useState } from "react";
import { SafeAreaView, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { TabBar } from "./src/components/TabBar";
import type { TabKey } from "./src/navigation/tabs";
import { ReportFlowScreen } from "./src/screens/ReportFlowScreen";
import { HistoryScreen } from "./src/screens/HistoryScreen";
import { DashboardScreen } from "./src/screens/DashboardScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { useHistory } from "./src/hooks/useHistory";
import { useRegions } from "./src/hooks/useRegions";
import { useDeviceId } from "./src/hooks/useDeviceId";
import type { RecentSubmission } from "./src/dedupe/localDedupe";

export default function App() {
  const [tab, setTab] = useState<TabKey>("report");
  const { entries, add } = useHistory();
  const { regions, canAdd, add: addRegion, remove: removeRegion } = useRegions();
  const deviceId = useDeviceId();

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
        {tab === "dashboard" && <DashboardScreen deviceId={deviceId} regions={regions} />}
        {tab === "settings" && (
          <SettingsScreen
            regions={regions}
            canAddRegion={canAdd}
            onAddRegion={addRegion}
            onRemoveRegion={removeRegion}
          />
        )}
      </View>
      <TabBar active={tab} onChange={setTab} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#0f172a" },
  screen: { flex: 1 },
});
