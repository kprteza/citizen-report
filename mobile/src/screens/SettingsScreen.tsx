import { useState } from "react";
import {
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocation } from "../hooks/useLocation";
import { JAPAN_PREFECTURES, type Prefecture } from "../regions/catalog";
import { MAX_REGIONS, type SavedRegion } from "../regions/types";
import { distanceMeters } from "../domain/geo";
import { theme } from "../theme";

const DONATE_URL = "https://example.org/citizen-report/donate";
const APP_VERSION = "0.3.0";

interface Props {
  regions: SavedRegion[];
  canAddRegion: boolean;
  onAddRegion: (region: SavedRegion) => void;
  onRemoveRegion: (id: string) => void;
}

function nearestPrefectureName(lat: number, lng: number): string {
  let best = JAPAN_PREFECTURES[0];
  let bestD = Infinity;
  for (const p of JAPAN_PREFECTURES) {
    const d = distanceMeters({ latitude: lat, longitude: lng }, { latitude: p.latitude, longitude: p.longitude });
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best.name;
}

export function SettingsScreen({ regions, canAddRegion, onAddRegion, onRemoveRegion }: Props) {
  const { coordinate } = useLocation();
  const [editing, setEditing] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [language, setLanguage] = useState<"en" | "ja">("en");

  const addByGps = () => {
    if (!coordinate) return;
    onAddRegion({
      id: `gps-${Date.now()}`,
      name: nearestPrefectureName(coordinate.latitude, coordinate.longitude),
      latitude: coordinate.latitude,
      longitude: coordinate.longitude,
      source: "gps",
    });
  };

  const addByPrefecture = (p: Prefecture) => {
    onAddRegion({
      id: p.code,
      name: p.name,
      latitude: p.latitude,
      longitude: p.longitude,
      source: "manual",
      prefectureCode: p.code,
    });
    setPickerOpen(false);
  };

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        {/* Saved Regions */}
        <View style={styles.sectionHeadRow}>
          <Text style={styles.sectionHead}>
            Saved Regions {regions.length} / {MAX_REGIONS}
          </Text>
          {regions.length > 0 && (
            <TouchableOpacity onPress={() => setEditing((e) => !e)}>
              <Text style={styles.editLink}>{editing ? "Done" : "Edit"}</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.card}>
          {regions.length === 0 ? (
            <Text style={styles.muted}>No saved regions. Add up to {MAX_REGIONS}.</Text>
          ) : (
            regions.map((r) => (
              <View key={r.id} style={styles.regionRow}>
                <Ionicons
                  name={r.source === "gps" ? "navigate" : "location"}
                  size={18}
                  color={theme.colors.primary}
                />
                <Text style={styles.regionName}>{r.name}</Text>
                {editing && (
                  <TouchableOpacity onPress={() => onRemoveRegion(r.id)} accessibilityLabel={`Remove ${r.name}`}>
                    <Ionicons name="trash" size={18} color={theme.colors.danger} />
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
          <View style={styles.addRow}>
            <TouchableOpacity
              style={[styles.addBtn, !canAddRegion && styles.disabled]}
              disabled={!canAddRegion || !coordinate}
              onPress={addByGps}
            >
              <Ionicons name="navigate" size={16} color="#fff" />
              <Text style={styles.addBtnText}>Use GPS</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addBtn, !canAddRegion && styles.disabled]}
              disabled={!canAddRegion}
              onPress={() => setPickerOpen(true)}
            >
              <Ionicons name="list" size={16} color="#fff" />
              <Text style={styles.addBtnText}>By region</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Supporters' Club / Donate */}
        <Text style={styles.sectionHead}>Support</Text>
        <TouchableOpacity style={styles.card} onPress={() => Linking.openURL(DONATE_URL)}>
          <View style={styles.supportRow}>
            <View style={styles.heart}>
              <Ionicons name="heart" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowLabel}>Supporters' Club</Text>
              <Text style={styles.muted}>Help keep Citizen Report free — donate</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.textMuted} />
          </View>
        </TouchableOpacity>

        {/* App settings */}
        <Text style={styles.sectionHead}>Settings</Text>
        <View style={styles.card}>
          <SettingRow
            icon="language"
            label="Language"
            value={language === "en" ? "English" : "日本語"}
            onPress={() => setLangOpen(true)}
          />
          <SettingRow icon="color-palette" label="Appearance" value="Dark" />
          <SettingRow icon="notifications" label="Notifications" value="On" />
        </View>

        {/* About */}
        <Text style={styles.sectionHead}>About this app</Text>
        <View style={styles.card}>
          <SettingRow icon="information-circle" label="Version" value={APP_VERSION} />
          <SettingRow icon="document-text" label="Terms of Service" onPress={() => {}} />
          <SettingRow icon="lock-closed" label="Privacy Policy" onPress={() => {}} />
          <SettingRow icon="code-slash" label="License Information" onPress={() => {}} />
          <SettingRow icon="mail" label="Contact Us" onPress={() => {}} />
        </View>
      </ScrollView>

      {/* Manual region picker */}
      <Modal visible={pickerOpen} transparent animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>Select a region</Text>
            <TouchableOpacity onPress={() => setPickerOpen(false)}>
              <Ionicons name="close" size={22} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {JAPAN_PREFECTURES.map((p) => (
              <TouchableOpacity key={p.code} style={styles.pickRow} onPress={() => addByPrefecture(p)}>
                <Text style={styles.pickName}>{p.name}</Text>
                <Text style={styles.pickNameJa}>{p.nameJa}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>

      {/* Language picker */}
      <Modal visible={langOpen} transparent animationType="slide" onRequestClose={() => setLangOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setLangOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHead}>
            <Text style={styles.sheetTitle}>Language</Text>
            <TouchableOpacity onPress={() => setLangOpen(false)}>
              <Ionicons name="close" size={22} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          {(["en", "ja"] as const).map((l) => (
            <TouchableOpacity
              key={l}
              style={styles.pickRow}
              onPress={() => {
                setLanguage(l);
                setLangOpen(false);
              }}
            >
              <Text style={styles.pickName}>{l === "en" ? "English" : "日本語"}</Text>
              {language === l && <Ionicons name="checkmark" size={20} color={theme.colors.primary} />}
            </TouchableOpacity>
          ))}
        </View>
      </Modal>
    </View>
  );
}

function SettingRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.settingRow} disabled={!onPress} onPress={onPress}>
      <Ionicons name={icon as never} size={18} color={theme.colors.textMuted} />
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {onPress ? <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} /> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing(2), paddingBottom: theme.spacing(4) },
  title: { color: theme.colors.text, fontSize: 28, fontWeight: "800", marginBottom: theme.spacing(1) },
  sectionHeadRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: theme.spacing(2) },
  sectionHead: { color: theme.colors.textMuted, fontSize: 13, fontWeight: "800", textTransform: "uppercase", marginTop: theme.spacing(2), marginBottom: theme.spacing(1) },
  editLink: { color: theme.colors.primary, fontWeight: "700" },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: theme.spacing(1.5),
  },
  muted: { color: theme.colors.textMuted },
  regionRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing(1.25), paddingVertical: theme.spacing(1) },
  regionName: { color: theme.colors.text, fontWeight: "600", flex: 1 },
  addRow: { flexDirection: "row", gap: theme.spacing(1.25), marginTop: theme.spacing(1) },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.colors.primary,
    borderRadius: 10,
    paddingVertical: theme.spacing(1),
    paddingHorizontal: theme.spacing(1.75),
  },
  addBtnText: { color: "#fff", fontWeight: "700" },
  disabled: { opacity: 0.4 },
  supportRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing(1.5) },
  heart: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.danger, alignItems: "center", justifyContent: "center" },
  settingRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing(1.25), paddingVertical: theme.spacing(1.25) },
  rowLabel: { color: theme.colors.text, fontWeight: "600", flex: 1 },
  rowValue: { color: theme.colors.textMuted, fontWeight: "600" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: { backgroundColor: theme.colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "70%", paddingBottom: theme.spacing(3) },
  sheetHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: theme.spacing(2), borderBottomColor: theme.colors.border, borderBottomWidth: 1 },
  sheetTitle: { color: theme.colors.text, fontSize: 18, fontWeight: "800" },
  pickRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: theme.spacing(1.5), paddingHorizontal: theme.spacing(2), borderBottomColor: theme.colors.border, borderBottomWidth: 1 },
  pickName: { color: theme.colors.text, fontSize: 16, fontWeight: "600" },
  pickNameJa: { color: theme.colors.textMuted, fontSize: 14 },
});
