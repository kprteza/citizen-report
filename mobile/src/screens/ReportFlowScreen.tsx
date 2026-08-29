import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { IssueTypeList } from "../components/IssueTypeList";
import { submitReport } from "../api/reportClient";
import { clientConfig } from "../config";
import { issueTypeDef, type IssueType } from "../domain/issueTypes";
import { useDeviceId } from "../hooks/useDeviceId";
import { useLocation } from "../hooks/useLocation";
import { usePhoto } from "../hooks/usePhoto";
import { isLocalDuplicate, type RecentSubmission } from "../dedupe/localDedupe";
import type { HistoryEntry } from "../history/types";
import { theme } from "../theme";

type Banner = { tone: "success" | "info" | "error"; text: string } | null;

interface Props {
  recentSubmissions: RecentSubmission[];
  onSubmitted: (entry: HistoryEntry) => void;
}

function randomId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function ReportFlowScreen({ recentSubmissions, onSubmitted }: Props) {
  const deviceId = useDeviceId();
  const { permission, coordinate, error: locError, refresh } = useLocation();
  const { photo, pickFromLibrary, takePhoto, clear } = usePhoto();

  const [selected, setSelected] = useState<IssueType | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<Banner>(null);

  const locationReady = permission === "granted" && !!coordinate;
  const canSubmit = !!deviceId && locationReady && !!selected && !submitting;

  const reset = useCallback(() => {
    setSelected(null);
    setNote("");
    clear();
  }, [clear]);

  const handleSubmit = useCallback(async () => {
    if (!deviceId || !coordinate || !selected) return;
    setBanner(null);
    const now = Date.now();

    if (isLocalDuplicate({ issueType: selected, location: coordinate }, recentSubmissions, now)) {
      setBanner({ tone: "info", text: "You already reported this here recently." });
      reset();
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitReport(clientConfig(deviceId), {
        issueType: selected,
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        note: note.trim() || undefined,
        observedAt: new Date(now).toISOString(),
        photoBase64: photo?.base64,
        photoContentType: photo?.contentType,
      });

      if (result.status === "accepted" || result.status === "duplicate_discarded") {
        onSubmitted({
          id: randomId(),
          issueType: selected,
          latitude: coordinate.latitude,
          longitude: coordinate.longitude,
          note: note.trim() || undefined,
          hasPhoto: !!photo,
          createdAt: new Date(now).toISOString(),
          status: result.status,
          correlated: !!result.correlation?.correlated,
          postUrl: result.correlation?.postUrl,
        });
        if (result.status === "duplicate_discarded") {
          setBanner({ tone: "info", text: "You already reported this here recently." });
        } else if (result.correlation?.correlated) {
          setBanner({ tone: "success", text: "Report sent. A related pattern was detected and local police were alerted." });
        } else {
          setBanner({ tone: "success", text: "Report sent. Thank you." });
        }
        reset();
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
  }, [deviceId, coordinate, selected, recentSubmissions, note, photo, onSubmitted, reset]);

  if (!selected) {
    return (
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>Report</Text>
          <Text style={styles.subtitle}>What are you reporting?</Text>
        </View>
        <LocationStatus permission={permission} ready={locationReady} error={locError} onRetry={refresh} />
        {banner && <BannerView banner={banner} />}
        <View style={styles.listWrap}>
          <IssueTypeList onSelect={setSelected} />
        </View>
      </View>
    );
  }

  const def = issueTypeDef(selected);
  return (
    <View style={styles.root}>
      <View style={styles.detailHeader}>
        <TouchableOpacity onPress={reset} accessibilityLabel="Back to report types" style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={[styles.chip, { backgroundColor: def.color }]}>
          <Ionicons name={def.icon as never} size={16} color="#fff" />
          <Text style={styles.chipText}>{def.label}</Text>
        </View>
      </View>

      {/* Top half: photo preview */}
      <View style={styles.photoHalf}>
        {photo ? (
          <>
            <Image source={{ uri: photo.uri }} style={styles.photo} resizeMode="cover" />
            <TouchableOpacity style={styles.photoOverlayBtn} onPress={clear}>
              <Ionicons name="close" size={16} color="#fff" />
              <Text style={styles.photoOverlayText}>Remove</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.photoPlaceholder}>
            <Ionicons name="camera-outline" size={40} color={theme.colors.textMuted} />
            <Text style={styles.placeholderText}>Add a photo (optional)</Text>
            <View style={styles.photoBtns}>
              <TouchableOpacity style={styles.secondaryBtn} onPress={takePhoto}>
                <Ionicons name="camera" size={16} color={theme.colors.text} />
                <Text style={styles.secondaryBtnText}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryBtn} onPress={pickFromLibrary}>
                <Ionicons name="images" size={16} color={theme.colors.text} />
                <Text style={styles.secondaryBtnText}>Library</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      {/* Bottom half: text */}
      <View style={styles.textHalf}>
        <Text style={styles.sectionLabel}>Add details (optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Describe what you saw"
          placeholderTextColor={theme.colors.textMuted}
          value={note}
          onChangeText={setNote}
          multiline
        />
        <LocationStatus permission={permission} ready={locationReady} error={locError} onRetry={refresh} />
        {banner && <BannerView banner={banner} />}
      </View>

      {/* Full-width red submit, sits just above the bottom tab bar */}
      <TouchableOpacity
        accessibilityRole="button"
        style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
        disabled={!canSubmit}
        onPress={handleSubmit}
      >
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.submitText}>Submit report</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

function BannerView({ banner }: { banner: NonNullable<Banner> }) {
  return (
    <View style={[styles.banner, styles[`banner_${banner.tone}`]]}>
      <Text style={styles.bannerText}>{banner.text}</Text>
    </View>
  );
}

function LocationStatus({
  permission,
  ready,
  error,
  onRetry,
}: {
  permission: string;
  ready: boolean;
  error: string | null;
  onRetry: () => void;
}) {
  if (ready) {
    return (
      <View style={[styles.locChip, styles.locOk]}>
        <Ionicons name="location" size={14} color={theme.colors.text} />
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
      <Ionicons name="location-outline" size={14} color={theme.colors.text} />
      <Text style={styles.locText}>{message} Tap to retry.</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.colors.bg },
  header: { paddingHorizontal: theme.spacing(2.5), paddingTop: theme.spacing(2) },
  title: { color: theme.colors.text, fontSize: 28, fontWeight: "800" },
  subtitle: { color: theme.colors.textMuted, fontSize: 14, marginTop: 2, marginBottom: theme.spacing(1) },
  listWrap: { flex: 1, paddingHorizontal: theme.spacing(2.5) },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing(1),
    paddingHorizontal: theme.spacing(2),
    paddingTop: theme.spacing(2),
    paddingBottom: theme.spacing(1),
  },
  backBtn: { padding: 6 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  chipText: { color: "#fff", fontWeight: "700" },
  photoHalf: {
    flex: 1,
    margin: theme.spacing(2),
    borderRadius: theme.radius,
    overflow: "hidden",
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  photo: { width: "100%", height: "100%" },
  photoOverlayBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  photoOverlayText: { color: "#fff", fontWeight: "600", fontSize: 12 },
  photoPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: theme.spacing(1) },
  placeholderText: { color: theme.colors.textMuted },
  photoBtns: { flexDirection: "row", gap: theme.spacing(1.5), marginTop: theme.spacing(1) },
  textHalf: { flex: 1, paddingHorizontal: theme.spacing(2) },
  sectionLabel: { color: theme.colors.text, fontWeight: "700", marginBottom: theme.spacing(1) },
  input: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderColor: theme.colors.border,
    borderWidth: 1,
    borderRadius: theme.radius,
    color: theme.colors.text,
    padding: theme.spacing(1.5),
    textAlignVertical: "top",
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 12,
    paddingVertical: theme.spacing(1.25),
    paddingHorizontal: theme.spacing(2),
  },
  secondaryBtnText: { color: theme.colors.text, fontWeight: "600" },
  locChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 12,
    padding: theme.spacing(1.25),
    marginTop: theme.spacing(1.5),
    marginHorizontal: theme.spacing(2.5),
  },
  locOk: { backgroundColor: "#14532d" },
  locWarn: { backgroundColor: "#7c2d12" },
  locText: { color: theme.colors.text, fontSize: 13, fontWeight: "600" },
  banner: {
    borderRadius: 12,
    padding: theme.spacing(1.5),
    marginTop: theme.spacing(1.5),
    marginHorizontal: theme.spacing(2.5),
  },
  banner_success: { backgroundColor: "#14532d" },
  banner_info: { backgroundColor: "#1e3a8a" },
  banner_error: { backgroundColor: "#7f1d1d" },
  bannerText: { color: theme.colors.text, fontWeight: "600" },
  submitBtn: {
    backgroundColor: theme.colors.danger,
    paddingVertical: theme.spacing(2),
    alignItems: "center",
  },
  submitBtnDisabled: { backgroundColor: theme.colors.surfaceAlt },
  submitText: { color: "#fff", fontSize: 18, fontWeight: "800" },
});
