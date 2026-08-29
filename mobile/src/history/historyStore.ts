import AsyncStorage from "@react-native-async-storage/async-storage";
import type { HistoryEntry } from "./types";

const KEY = "citizen-report.history.v1";
const MAX_ENTRIES = 500;

/**
 * AsyncStorage-backed cache of this device's reports. Kept small and simple; the
 * serialization helpers are pure so they can be unit tested without a device.
 */
export const historyStore = {
  async all(): Promise<HistoryEntry[]> {
    const raw = await AsyncStorage.getItem(KEY);
    return parseHistory(raw);
  },

  async add(entry: HistoryEntry): Promise<HistoryEntry[]> {
    const current = await this.all();
    const next = [entry, ...current].slice(0, MAX_ENTRIES);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
    return next;
  },

  async clear(): Promise<void> {
    await AsyncStorage.removeItem(KEY);
  },
};

/** Pure parse with defensive handling of corrupt storage. */
export function parseHistory(raw: string | null): HistoryEntry[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as HistoryEntry[]) : [];
  } catch {
    return [];
  }
}
