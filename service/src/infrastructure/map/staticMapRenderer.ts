import type {
  MapRenderer,
  MapRenderRequest,
  RenderedImage,
} from "../../application/ports.js";
import type { GeoPoint } from "../../domain/geo.js";

export interface HttpFetcher {
  (url: string): Promise<{ ok: boolean; status: number; arrayBuffer(): Promise<ArrayBuffer> }>;
}

/**
 * Renders a static map PNG using a tile/static-map HTTP provider. The provider
 * URL is templated so any compatible service (e.g. a self-hosted static map
 * server or a commercial one) can be configured without code changes.
 */
export class StaticMapRenderer implements MapRenderer {
  constructor(
    private readonly baseUrl: string,
    private readonly fetcher: HttpFetcher = fetch as unknown as HttpFetcher,
  ) {}

  buildUrl(request: MapRenderRequest): string {
    const markers = request.points
      .map((p) => `${p.latitude.toFixed(6)},${p.longitude.toFixed(6)}`)
      .join("|");
    const params = new URLSearchParams({ markers });
    if (request.drawPath && request.points.length >= 2) {
      params.set("path", buildPath(request.points));
    }
    return `${this.baseUrl}?${params.toString()}`;
  }

  async render(request: MapRenderRequest): Promise<RenderedImage> {
    const url = this.buildUrl(request);
    const res = await this.fetcher(url);
    if (!res.ok) {
      throw new Error(`Map render failed with status ${res.status}`);
    }
    const data = Buffer.from(await res.arrayBuffer());
    return { data, contentType: "image/png", url };
  }
}

function buildPath(points: GeoPoint[]): string {
  return points
    .map((p) => `${p.latitude.toFixed(6)},${p.longitude.toFixed(6)}`)
    .join(";");
}
