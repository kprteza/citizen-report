export interface MapRegionView {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

export interface MapMarker {
  id: string;
  latitude: number;
  longitude: number;
  /** Marker color (per report type). */
  color: string;
}

export interface ReportMapProps {
  view: MapRegionView;
  markers: MapMarker[];
}

/** Approximate Leaflet zoom level for a given longitude span. */
export function zoomForDelta(longitudeDelta: number): number {
  return Math.max(3, Math.min(16, Math.round(Math.log2(360 / longitudeDelta))));
}
