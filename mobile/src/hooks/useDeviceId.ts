import { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "citizen-report.deviceId";

function randomId(): string {
  return `dev-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

/** Stable per-install device id, persisted in AsyncStorage. */
export function useDeviceId(): string | null {
  const [deviceId, setDeviceId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      let id = await AsyncStorage.getItem(KEY);
      if (!id) {
        id = randomId();
        await AsyncStorage.setItem(KEY, id);
      }
      if (active) setDeviceId(id);
    })();
    return () => {
      active = false;
    };
  }, []);

  return deviceId;
}
