import { StyleSheet } from "react-native";
import MapView, { Marker } from "react-native-maps";
import type { ReportMapProps } from "./types";

/** Native map (iOS/Android) via react-native-maps. */
export default function ReportMap({ view, markers }: ReportMapProps) {
  return (
    <MapView
      style={styles.map}
      region={{
        latitude: view.latitude,
        longitude: view.longitude,
        latitudeDelta: view.latitudeDelta,
        longitudeDelta: view.longitudeDelta,
      }}
    >
      {markers.map((m) => (
        <Marker
          key={m.id}
          coordinate={{ latitude: m.latitude, longitude: m.longitude }}
          pinColor={m.color}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
