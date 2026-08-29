import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SavedRegion } from "./types";

const KEY = "citizen-report.regions.v1";

export const regionStore = {
  async all(): Promise<SavedRegion[]> {
    return parseRegions(await AsyncStorage.getItem(KEY));
  },
  async save(regions: SavedRegion[]): Promise<void> {
    await AsyncStorage.setItem(KEY, JSON.stringify(regions));
  },
};

export function parseRegions(raw: string | null): SavedRegion[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedRegion[]) : [];
  } catch {
    return [];
  }
}
