import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import ReportMap from "../components/map/ReportMap";
import type { MapMarker, MapRegionView } from "../components/map/types";
import { LayerSelector, type LayerValue } from "../components/LayerSelector";
import { fetchReports, type MapReport } from "../api/reportClient";
import { clientConfig } from "../config";
import { ISSUE_TYPE_DEFS, issueTypeDef } from "../domain/issueTypes";
import { JAPAN_NATIONAL } from "../regions/catalog";
import type { SavedRegion } from "../regions/types";
import { theme } from "../theme";

interface Props {
  deviceId: string | null;
  regions: SavedRegion[];
}

const REGION_DELTA = 1.4;

function bboxOf(view: MapRegionView): [number, number, number, number] {
  return [
    view.longitude - view.longitudeDelta / 2,
    view.latitude - view.latitudeDelta / 2,
    view.longitude + view.longitudeDelta / 2,
    view.latitude + view.latitudeDelta / 2,
  ];
}

export function DashboardScreen({ deviceId, regions }: Props) {
  const [scope, setScope] = useState<string>("national");
  const [layer, setLayer] = useState<LayerValue>("all");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [reports, setReports] = useState<MapReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const view = useMemo<MapRegionView>(() => {
    if (scope === "national") return JAPAN_NATIONAL;
    const region = regions.find((r) => r.id === scope);
    if (!region) return JAPAN_NATIONAL;
    return {
      latitude: region.latitude,
      longitude: region.longitude,
      latitudeDelta: REGION_DELTA,
      longitudeDelta: REGION_DELTA,
    };
  }, [scope, regions]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReports(clientConfig(deviceId ?? "dashboard"), {
        issueType: layer === "all" ? undefined : layer,
        bbox: bboxOf(view),
        limit: 2000,
      });
      setReports(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [deviceId, layer, view]);

  useEffect(() => {
    load();
  }, [load]);

  const markers = useMemo<MapMarker[]>(
    () =>
      reports.map((r) => ({
        id: r.id,
        latitude: r.latitude,
        longitude: r.longitude,
        color: issueTypeDef(r.issueType).color,
      })),
    [reports],
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of reports) map[r.issueType] = (map[r.issueType] ?? 0) + 1;
    return map;
  }, [reports]);

  const layerLabel = layer === "all" ? "All types" : issueTypeDef(layer).label;
  const scopeLabel =
    scope === "national" ? "National" : regions.find((r) => r.id === scope)?.name ?? "Region";

  return (
    <View style={styles.root}>
      {/* Scope tabs */}
      <View style={styles.header}>
        <Text style={styles.title}>{layerLabel}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scopeRow}>
          <ScopeTab label="National" active={scope === "national"} onPress={() => setScope("national")} />
          {regions.map((r) => (
            <ScopeTab
              key={r.id}
              label={r.name}
              active={scope === r.id}
              onPress={() => setScope(r.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Legend */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.legend} contentContainerStyle={styles.legendContent}>
        {ISSUE_TYPE_DEFS.map((d) => (
          <View key={d.value} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: d.color }]} />
            <Text style={styles.legendText}>{d.label}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Map */}
      <View style={styles.mapWrap}>
        <ReportMap view={view} markers={markers} />
        {loading && (
          <View style={styles.mapOverlay} pointerEvents="none">
            <ActivityIndicator color="#fff" />
          </View>
        )}

        {/* Floating layers button */}
        <TouchableOpacity
          style={styles.layersBtn}
          accessibilityLabel="Select layer"
          onPress={() => setSheetOpen(true)}
        >
          <Ionicons name="layers" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Bottom info card */}
      <View style={styles.infoCard}>
        <View style={styles.infoTop}>
          <Text style={styles.infoScope}>{scopeLabel}</Text>
          <Text style={styles.infoCount}>{reports.length} unique issues</Text>
        </View>
        {error ? (
          <Text style={styles.infoError}>{error}</Text>
        ) : (
          <View style={styles.infoBreakdown}>
            {ISSUE_TYPE_DEFS.filter((d) => counts[d.value]).map((d) => (
              <View key={d.value} style={styles.infoChip}>
                <View style={[styles.legendDot, { backgroundColor: d.color }]} />
                <Text style={styles.infoChipText}>
                  {d.label} {counts[d.value]}
                </Text>
              </View>
            ))}
            {reports.length === 0 && (
              <Text style={styles.infoEmpty}>No issues in this area yet.</Text>
            )}
          </View>
        )}
      </View>

      <LayerSelector
        visible={sheetOpen}
        current={layer}
        onSelect={setLayer}
        onClose={() => setSheetOpen(false)}
      />
    </View>
  );
}

function ScopeTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.scopeTab, active && styles.scopeTabActive]}
      onPress={onPress}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <Text style={[styles.scopeTabText, active && styles.scopeTabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  header: { paddingHorizontal: theme.spacing(2), paddingTop: theme.spacing(1.5) },
  title: { color: theme.colors.text, fontSize: 22, fontWeight: "800" },
  scopeRow: { marginTop: theme.spacing(1) },
  scopeTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: theme.colors.surface,
    marginRight: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  scopeTabActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  scopeTabText: { color: theme.colors.textMuted, fontWeight: "700" },
  scopeTabTextActive: { color: "#fff" },
  legend: { maxHeight: 34, marginTop: theme.spacing(1) },
  legendContent: { paddingHorizontal: theme.spacing(2), gap: theme.spacing(1.5), alignItems: "center" },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5, marginRight: 10 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { color: theme.colors.textMuted, fontSize: 12 },
  mapWrap: { flex: 1, marginTop: theme.spacing(1), overflow: "hidden" },
  mapOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    padding: 8,
    zIndex: 1200,
  },
  layersBtn: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
    // Sit above the Leaflet map panes/controls (which use z-index up to ~1000).
    zIndex: 1200,
  },
  infoCard: {
    backgroundColor: theme.colors.surface,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
    padding: theme.spacing(2),
  },
  infoTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  infoScope: { color: theme.colors.text, fontSize: 16, fontWeight: "800" },
  infoCount: { color: theme.colors.primary, fontSize: 15, fontWeight: "800" },
  infoBreakdown: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: theme.spacing(1) },
  infoChip: { flexDirection: "row", alignItems: "center", gap: 5 },
  infoChipText: { color: theme.colors.textMuted, fontSize: 12 },
  infoEmpty: { color: theme.colors.textMuted, fontStyle: "italic" },
  infoError: { color: theme.colors.danger, marginTop: theme.spacing(1) },
});
