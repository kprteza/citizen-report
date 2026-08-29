import { useEffect } from "react";
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from "react-leaflet";
import { zoomForDelta, type ReportMapProps } from "./types";

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";

function ensureLeafletCss() {
  if (typeof document === "undefined") return;
  if (!document.getElementById("leaflet-css")) {
    const link = document.createElement("link");
    link.id = "leaflet-css";
    link.rel = "stylesheet";
    link.href = LEAFLET_CSS;
    document.head.appendChild(link);
  }
  if (!document.getElementById("leaflet-dark-tiles")) {
    // Darken the (free, key-less) OSM tiles to match the app theme without
    // affecting marker colors (markers live in a separate SVG pane).
    const style = document.createElement("style");
    style.id = "leaflet-dark-tiles";
    style.textContent =
      ".leaflet-tile-pane{filter:invert(1) hue-rotate(180deg) brightness(0.95) contrast(0.9) grayscale(0.2);}" +
      ".leaflet-container{background:#0f172a;}";
    document.head.appendChild(style);
  }
}

function Recenter({ lat, lng, zoom }: { lat: number; lng: number; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], zoom);
  }, [map, lat, lng, zoom]);
  return null;
}

/** Web map via Leaflet + OpenStreetMap tiles (dark filter applied via CSS). */
export default function ReportMap({ view, markers }: ReportMapProps) {
  useEffect(ensureLeafletCss, []);
  const zoom = zoomForDelta(view.longitudeDelta);

  return (
    <MapContainer
      center={[view.latitude, view.longitude]}
      zoom={zoom}
      style={{ height: "100%", width: "100%", backgroundColor: "#0f172a" }}
      attributionControl={false}
      zoomControl={false}
    >
      <Recenter lat={view.latitude} lng={view.longitude} zoom={zoom} />
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {markers.map((m) => (
        <CircleMarker
          key={m.id}
          center={[m.latitude, m.longitude]}
          radius={8}
          pathOptions={{ color: "#ffffff", weight: 1, fillColor: m.color, fillOpacity: 0.9 }}
        >
          <Tooltip>{m.id}</Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
