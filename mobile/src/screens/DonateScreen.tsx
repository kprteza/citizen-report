import { Ionicons } from "@expo/vector-icons";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { theme } from "../theme";

const DONATE_URL = "https://example.org/citizen-report/donate";

const TIERS = [
  { amount: "¥500", label: "Support server costs for a day" },
  { amount: "¥2,000", label: "Fund map rendering for a week" },
  { amount: "¥5,000", label: "Keep the service running for a month" },
];

export function DonateScreen() {
  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Donate</Text>
        <Text style={styles.subtitle}>Help keep Citizen Report free</Text>
      </View>

      <View style={styles.hero}>
        <View style={styles.heartWrap}>
          <Ionicons name="heart" size={36} color="#fff" />
        </View>
        <Text style={styles.heroText}>
          Citizen Report is a community service. Donations cover hosting, map
          rendering, and moderation so anyone can report issues for free.
        </Text>
      </View>

      <View style={styles.tiers}>
        {TIERS.map((tier) => (
          <TouchableOpacity
            key={tier.amount}
            style={styles.tier}
            onPress={() => Linking.openURL(DONATE_URL)}
          >
            <Text style={styles.tierAmount}>{tier.amount}</Text>
            <Text style={styles.tierLabel}>{tier.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.donateBtn}
        accessibilityRole="button"
        onPress={() => Linking.openURL(DONATE_URL)}
      >
        <Ionicons name="heart" size={18} color="#fff" />
        <Text style={styles.donateText}>Donate</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  header: { paddingHorizontal: theme.spacing(2.5), paddingTop: theme.spacing(2) },
  title: { color: theme.colors.text, fontSize: 28, fontWeight: "800" },
  subtitle: { color: theme.colors.textMuted, fontSize: 14, marginTop: 2 },
  hero: { alignItems: "center", padding: theme.spacing(3), gap: theme.spacing(2) },
  heartWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: theme.colors.danger,
    alignItems: "center",
    justifyContent: "center",
  },
  heroText: { color: theme.colors.textMuted, textAlign: "center", fontSize: 15, lineHeight: 22 },
  tiers: { paddingHorizontal: theme.spacing(2.5), gap: theme.spacing(1.5) },
  tier: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius,
    padding: theme.spacing(2),
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(2),
  },
  tierAmount: { color: theme.colors.text, fontWeight: "800", fontSize: 18, width: 80 },
  tierLabel: { color: theme.colors.textMuted, flex: 1 },
  donateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: theme.colors.danger,
    margin: theme.spacing(2.5),
    marginTop: theme.spacing(3),
    paddingVertical: theme.spacing(2),
    borderRadius: theme.radius,
  },
  donateText: { color: "#fff", fontWeight: "800", fontSize: 18 },
});
