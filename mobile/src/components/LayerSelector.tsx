import { Ionicons } from "@expo/vector-icons";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ISSUE_TYPE_DEFS, type IssueType } from "../domain/issueTypes";
import { theme } from "../theme";

export type LayerValue = IssueType | "all";

interface Props {
  visible: boolean;
  current: LayerValue;
  onSelect: (value: LayerValue) => void;
  onClose: () => void;
}

interface Row {
  value: LayerValue;
  label: string;
  icon: string;
  color: string;
}

const ROWS: Row[] = [
  { value: "all", label: "All types", icon: "layers", color: theme.colors.primary },
  ...ISSUE_TYPE_DEFS.map((d) => ({
    value: d.value as LayerValue,
    label: d.label,
    icon: d.icon,
    color: d.color,
  })),
];

/** Bottom sheet that expands from the bottom to pick the map's report-type layer. */
export function LayerSelector({ visible, current, onSelect, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.sheetHead}>
          <Text style={styles.sheetTitle}>Select Layer</Text>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Close layers">
            <Ionicons name="close" size={22} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
        <ScrollView>
          {ROWS.map((row) => {
            const active = row.value === current;
            return (
              <TouchableOpacity
                key={row.value}
                style={styles.row}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  onSelect(row.value);
                  onClose();
                }}
              >
                <View style={[styles.dot, { backgroundColor: row.color }]}>
                  <Ionicons name={row.icon as never} size={16} color="#fff" />
                </View>
                <Text style={[styles.rowLabel, active && styles.rowLabelActive]}>
                  {row.label}
                </Text>
                {active && (
                  <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  sheet: {
    backgroundColor: theme.colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: theme.spacing(3),
    maxHeight: "70%",
  },
  sheetHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: theme.spacing(2),
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
  },
  sheetTitle: { color: theme.colors.text, fontSize: 18, fontWeight: "800" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(1.5),
    paddingVertical: theme.spacing(1.5),
    paddingHorizontal: theme.spacing(2),
  },
  dot: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rowLabel: { flex: 1, color: theme.colors.text, fontSize: 16, fontWeight: "600" },
  rowLabelActive: { color: theme.colors.primary, fontWeight: "800" },
});
