import { useCallback, useEffect, useState } from "react";
import { historyStore } from "../history/historyStore";
import type { HistoryEntry } from "../history/types";

export interface UseHistory {
  entries: HistoryEntry[];
  loading: boolean;
  add: (entry: HistoryEntry) => Promise<void>;
  reload: () => Promise<void>;
}

/** Loads and mutates the locally-cached report history. */
export function useHistory(): UseHistory {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setEntries(await historyStore.all());
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const add = useCallback(async (entry: HistoryEntry) => {
    const next = await historyStore.add(entry);
    setEntries(next);
  }, []);

  return { entries, loading, add, reload };
}
