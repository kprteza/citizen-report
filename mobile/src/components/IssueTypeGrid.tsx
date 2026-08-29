import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ISSUE_TYPE_DEFS, type IssueType } from "../domain/issueTypes";
import { theme } from "../theme";

interface Props {
  selected: IssueType | null;
  onSelect: (value: IssueType) => void;
}

export function IssueTypeGrid({ selected, onSelect }: Props) {
  return (
    <View style={styles.grid}>
      {ISSUE_TYPE_DEFS.map((def) => {
        const active = def.value === selected;
        return (
          <TouchableOpacity
            key={def.value}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={[
              styles.tile,
              { borderColor: active ? def.color : theme.colors.border },
              active && { backgroundColor: def.color },
            ]}
            onPress={() => onSelect(def.value)}
          >
            <View style={[styles.dot, { backgroundColor: def.color }]} />
            <Text style={[styles.label, active && styles.labelActive]}>{def.label}</Text>
            <Text style={[styles.labelJa, active && styles.labelActive]}>{def.labelJa}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: theme.spacing(1.5),
  },
  tile: {
    width: "47%",
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderRadius: theme.radius,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1.5),
    minHeight: 92,
    justifyContent: "center",
  },
  dot: { width: 14, height: 14, borderRadius: 7, marginBottom: theme.spacing(1) },
  label: { color: theme.colors.text, fontWeight: "700", fontSize: 15 },
  labelJa: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  labelActive: { color: theme.colors.primaryText },
});
