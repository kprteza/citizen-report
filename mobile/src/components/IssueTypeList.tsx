import { Ionicons } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ISSUE_TYPE_DEFS, type IssueType } from "../domain/issueTypes";
import { theme } from "../theme";

interface Props {
  onSelect: (value: IssueType) => void;
}

/** Tap-to-continue list of report types — one tap selects and advances. */
export function IssueTypeList({ onSelect }: Props) {
  return (
    <ScrollView contentContainerStyle={styles.list}>
      {ISSUE_TYPE_DEFS.map((def) => (
        <TouchableOpacity
          key={def.value}
          style={styles.row}
          accessibilityRole="button"
          accessibilityLabel={def.label}
          onPress={() => onSelect(def.value)}
        >
          <View style={[styles.iconWrap, { backgroundColor: def.color }]}>
            <Ionicons name={def.icon as never} size={22} color="#fff" />
          </View>
          <View style={styles.textWrap}>
            <Text style={styles.label}>{def.label}</Text>
            <Text style={styles.labelJa}>{def.labelJa}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  list: { paddingVertical: theme.spacing(1) },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: theme.spacing(1.75),
    marginBottom: theme.spacing(1.25),
    gap: theme.spacing(1.5),
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: { flex: 1 },
  label: { color: theme.colors.text, fontSize: 16, fontWeight: "700" },
  labelJa: { color: theme.colors.textMuted, fontSize: 13, marginTop: 2 },
});
