import { useCallback, useEffect, useState } from "react";
import * as Location from "expo-location";
import type { Coordinate } from "../domain/geo";

export type LocationPermission = "unknown" | "granted" | "denied";

export interface LocationState {
  permission: LocationPermission;
  coordinate: Coordinate | null;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Requests foreground location permission and provides the current coordinate.
 * The app requires location access to submit a report.
 */
export function useLocation(): LocationState {
  const [permission, setPermission] = useState<LocationPermission>("unknown");
  const [coordinate, setCoordinate] = useState<Coordinate | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setPermission("denied");
        return;
      }
      setPermission("granted");
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoordinate({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get location");
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { permission, coordinate, error, refresh };
}
