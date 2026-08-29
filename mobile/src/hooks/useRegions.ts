import { useCallback, useEffect, useState } from "react";
import { addRegion, canAddRegion, removeRegion } from "../regions/regionOps";
import { regionStore } from "../regions/regionStore";
import type { SavedRegion } from "../regions/types";

export interface UseRegions {
  regions: SavedRegion[];
  canAdd: boolean;
  add: (region: SavedRegion) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

/** Loads and mutates the user's saved regions (persisted, max 3). */
export function useRegions(): UseRegions {
  const [regions, setRegions] = useState<SavedRegion[]>([]);

  useEffect(() => {
    regionStore.all().then(setRegions);
  }, []);

  const persist = useCallback(async (next: SavedRegion[]) => {
    setRegions(next);
    await regionStore.save(next);
  }, []);

  const add = useCallback(
    async (region: SavedRegion) => {
      await persist(addRegion(regions, region));
    },
    [regions, persist],
  );

  const remove = useCallback(
    async (id: string) => {
      await persist(removeRegion(regions, id));
    },
    [regions, persist],
  );

  return { regions, canAdd: canAddRegion(regions), add, remove };
}
