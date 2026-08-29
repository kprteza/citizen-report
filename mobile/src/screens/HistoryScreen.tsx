import { Ionicons } from "@expo/vector-icons";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { issueTypeDef } from "../domain/issueTypes";
import type { HistoryEntry } from "../history/types";
import { theme } from "../theme";

interface Props {
  entries: HistoryEntry[];
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoryScreen({ entries }: Props) {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>History</Text>
        <Text style={styles.subtitle}>Your reports on this device</Text>
      </View>

      {entries.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="time-outline" size={40} color={theme.colors.textMuted} />
          <Text style={styles.emptyText}>No reports yet. Submit one from the Report tab.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {entries.map((entry) => {
            const def = issueTypeDef(entry.issueType);
            return (
              <View key={entry.id} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.iconWrap, { backgroundColor: def.color }]}>
                    <Ionicons name={def.icon as never} size={18} color="#fff" />
                  </View>
                  <View style={styles.cardTextWrap}>
                    <Text style={styles.cardTitle}>{def.label}</Text>
                    <Text style={styles.cardMeta}>{formatDate(entry.createdAt)}</Text>
                  </View>
                  {entry.correlated && (
                    <View style={styles.correlatedBadge}>
                      <Text style={styles.correlatedText}>Alerted</Text>
                    </View>
                  )}
                </View>

                {entry.note ? <Text style={styles.note}>{entry.note}</Text> : null}

                <View style={styles.cardFooter}>
                  <Text style={styles.coords}>
                    {entry.latitude.toFixed(4)}, {entry.longitude.toFixed(4)}
                    {entry.hasPhoto ? "  ·  photo" : ""}
                  </Text>
                  {entry.postUrl ? (
                    <TouchableOpacity
                      style={styles.linkBtn}
                      accessibilityRole="link"
                      onPress={() => Linking.openURL(entry.postUrl!)}
                    >
                      <Ionicons name="logo-twitter" size={14} color={theme.colors.primary} />
                      <Text style={styles.linkText}>View post</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  header: { paddingHorizontal: theme.spacing(2.5), paddingTop: theme.spacing(2) },
  title: { color: theme.colors.text, fontSize: 28, fontWeight: "800" },
  subtitle: { color: theme.colors.textMuted, fontSize: 14, marginTop: 2 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing(1), padding: theme.spacing(4) },
  emptyText: { color: theme.colors.textMuted, textAlign: "center" },
  list: { padding: theme.spacing(2.5), gap: theme.spacing(1.5) },
  card: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: theme.spacing(1.75),
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: theme.spacing(1.5) },
  iconWrap: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  cardTextWrap: { flex: 1 },
  cardTitle: { color: theme.colors.text, fontWeight: "700", fontSize: 15 },
  cardMeta: { color: theme.colors.textMuted, fontSize: 12, marginTop: 2 },
  correlatedBadge: { backgroundColor: "#14532d", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  correlatedText: { color: theme.colors.text, fontSize: 11, fontWeight: "700" },
  note: { color: theme.colors.text, marginTop: theme.spacing(1), fontSize: 14 },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: theme.spacing(1.25),
  },
  coords: { color: theme.colors.textMuted, fontSize: 12 },
  linkBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  linkText: { color: theme.colors.primary, fontWeight: "700", fontSize: 13 },
});
