import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { IssueTypeGrid } from "../components/IssueTypeGrid";
import { submitReport } from "../api/reportClient";
import { clientConfig } from "../config";
import { useDeviceId } from "../hooks/useDeviceId";
import { useLocation } from "../hooks/useLocation";
import { usePhoto } from "../hooks/usePhoto";
import {
  isLocalDuplicate,
  recordSubmission,
  type RecentSubmission,
} from "../dedupe/localDedupe";
import type { IssueType } from "../domain/issueTypes";
import { theme } from "../theme";

type Banner = { tone: "success" | "info" | "error"; text: string } | null;

export function ReportScreen() {
  const deviceId = useDeviceId();
  const { permission, coordinate, error: locError, refresh } = useLocation();
  const { photo, pickFromLibrary, takePhoto, clear } = usePhoto();

  const [issueType, setIssueType] = useState<IssueType | null>(null);
  const [note, setNote] = useState("");
  const [recent, setRecent] = useState<RecentSubmission[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<Banner>(null);

  const canSubmit = useMemo(
    () => !!deviceId && permission === "granted" && !!coordinate && !!issueType && !submitting,
    [deviceId, permission, coordinate, issueType, submitting],
  );

  const handleSubmit = useCallback(async () => {
    if (!deviceId || !coordinate || !issueType) return;
    setBanner(null);

    const now = Date.now();
    const candidate = { issueType, location: coordinate };

    // Silently discard duplicate reports from this device at the same location.
    if (isLocalDuplicate(candidate, recent, now)) {
      setBanner({ tone: "info", text: "You already reported this here recently." });
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitReport(clientConfig(deviceId), {
        issueType,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        note: note.trim() || undefined,
        observedAt: new Date(now).toISOString(),
        photoBase64: photo?.base64,
        photoContentType: photo?.contentType,
      });

      if (result.status === "accepted" || result.status === "duplicate_discarded") {
        setRecent((prev) => recordSubmission(prev, candidate, now));
        setNote("");
        clear();
        setIssueType(null);
        if (result.status === "duplicate_discarded") {
          setBanner({ tone: "info", text: "You already reported this here recently." });
        } else if (result.correlation?.correlated) {
          setBanner({
            tone: "success",
            text: "Report sent. A related pattern was detected and local police were alerted.",
          });
        } else {
          setBanner({ tone: "success", text: "Report sent. Thank you." });
        }
      } else if (result.status === "unauthorized") {
        setBanner({ tone: "error", text: "Authentication failed. Please update the app." });
      } else if (result.status === "invalid") {
        setBanner({ tone: "error", text: "The report was rejected as invalid." });
      } else {
        setBanner({ tone: "error", text: "Could not send the report. Try again." });
      }
    } catch {
      setBanner({ tone: "error", text: "Network error. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }, [deviceId, coordinate, issueType, recent, note, photo, clear]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Citizen Report</Text>
        <Text style={styles.subtitle}>市民通報 · Report a local nuisance</Text>

        <LocationStatus
          permission={permission}
          hasCoordinate={!!coordinate}
          error={locError}
          onRetry={refresh}
        />

        <Text style={styles.sectionLabel}>What are you reporting?</Text>
        <IssueTypeGrid selected={issueType} onSelect={setIssueType} />

        <Text style={styles.sectionLabel}>Add a note (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Describe the issue"
          placeholderTextColor={theme.colors.textMuted}
          value={note}
          onChangeText={setNote}
          multiline
        />

        <Text style={styles.sectionLabel}>Add a photo (optional)</Text>
        {photo ? (
          <View style={styles.photoRow}>
            <Image source={{ uri: photo.uri }} style={styles.photo} />
            <TouchableOpacity style={styles.secondaryBtn} onPress={clear}>
              <Text style={styles.secondaryBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.photoRow}>
            <TouchableOpacity style={styles.secondaryBtn} onPress={takePhoto}>
              <Text style={styles.secondaryBtnText}>Camera</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryBtn} onPress={pickFromLibrary}>
              <Text style={styles.secondaryBtnText}>Library</Text>
            </TouchableOpacity>
          </View>
        )}

        {banner && (
          <View style={[styles.banner, styles[`banner_${banner.tone}`]]}>
            <Text style={styles.bannerText}>{banner.text}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          accessibilityRole="button"
          style={[styles.reportBtn, !canSubmit && styles.reportBtnDisabled]}
          disabled={!canSubmit}
          onPress={handleSubmit}
        >
          {submitting ? (
            <ActivityIndicator color={theme.colors.primaryText} />
          ) : (
            <Text style={styles.reportBtnText}>Report</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

function LocationStatus({
  permission,
  hasCoordinate,
  error,
  onRetry,
}: {
  permission: string;
  hasCoordinate: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  if (permission === "granted" && hasCoordinate) {
    return (
      <View style={[styles.locChip, styles.locOk]}>
        <Text style={styles.locText}>Location ready</Text>
      </View>
    );
  }
  const message =
    permission === "denied"
      ? "Location permission is required to report."
      : error ?? "Getting your location…";
  return (
    <TouchableOpacity style={[styles.locChip, styles.locWarn]} onPress={onRetry}>
      <Text style={styles.locText}>{message} Tap to retry.</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  content: { padding: theme.spacing(2.5), paddingBottom: theme.spacing(12) },
  title: { color: theme.colors.text, fontSize: 30, fontWeight: "800", marginTop: theme.spacing(4) },
  subtitle: { color: theme.colors.textMuted, fontSize: 14, marginBottom: theme.spacing(2) },
  sectionLabel: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginTop: theme.spacing(2.5),
    marginBottom: theme.spacing(1.5),
  },
  input: {
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius,
    color: theme.colors.text,
    padding: theme.spacing(1.5),
    minHeight: 72,
    textAlignVertical: "top",
  },
  photoRow: { flexDirection: "row", alignItems: "center", gap: theme.spacing(1.5) },
  photo: { width: 72, height: 72, borderRadius: 12 },
  secondaryBtn: {
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 12,
    paddingVertical: theme.spacing(1.25),
    paddingHorizontal: theme.spacing(2),
  },
  secondaryBtnText: { color: theme.colors.text, fontWeight: "600" },
  locChip: { borderRadius: 12, padding: theme.spacing(1.5), marginBottom: theme.spacing(1) },
  locOk: { backgroundColor: "#14532d" },
  locWarn: { backgroundColor: "#7c2d12" },
  locText: { color: theme.colors.text, fontSize: 13, fontWeight: "600" },
  banner: { marginTop: theme.spacing(2), borderRadius: 12, padding: theme.spacing(1.5) },
  banner_success: { backgroundColor: "#14532d" },
  banner_info: { backgroundColor: "#1e3a8a" },
  banner_error: { backgroundColor: "#7f1d1d" },
  bannerText: { color: theme.colors.text, fontWeight: "600" },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: theme.spacing(2),
    backgroundColor: theme.colors.bg,
    borderTopColor: theme.colors.border,
    borderTopWidth: 1,
  },
  reportBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius,
    paddingVertical: theme.spacing(2),
    alignItems: "center",
  },
  reportBtnDisabled: { backgroundColor: theme.colors.surfaceAlt },
  reportBtnText: { color: theme.colors.primaryText, fontSize: 18, fontWeight: "800" },
});
