import { randomUUID } from "node:crypto";
import type {
  Clock,
  IdGenerator,
  ImageStore,
  MapRenderer,
  MapRenderRequest,
  PoliceDirectory,
  RenderedImage,
  SocialPost,
  SocialPoster,
  SocialPostResult,
  StoredImage,
} from "../application/ports.js";
import type { GeoPoint } from "../domain/geo.js";

/** Deterministic clock for tests and reproducible behaviour. */
export class FixedClock implements Clock {
  constructor(private current: Date) {}
  now(): Date {
    return this.current;
  }
  set(date: Date): void {
    this.current = date;
  }
}

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}

/** Predictable sequential IDs for tests. */
export class SequentialIdGenerator implements IdGenerator {
  private n = 0;
  constructor(private readonly prefix = "id") {}
  next(): string {
    this.n += 1;
    return `${this.prefix}-${this.n}`;
  }
}

export class RandomIdGenerator implements IdGenerator {
  next(): string {
    return randomUUID();
  }
}

/** Stores image bytes in memory and returns a synthetic URL. */
export class InMemoryImageStore implements ImageStore {
  private readonly blobs = new Map<string, { data: Buffer; contentType: string }>();
  private n = 0;

  async put(data: Buffer, contentType: string): Promise<StoredImage> {
    this.n += 1;
    const key = `img-${this.n}`;
    this.blobs.set(key, { data, contentType });
    return { key, url: this.urlFor(key) };
  }

  urlFor(key: string): string {
    return `memory://images/${key}`;
  }

  get(key: string) {
    return this.blobs.get(key);
  }
}

/** Produces a tiny placeholder image and records what it was asked to render. */
export class FakeMapRenderer implements MapRenderer {
  readonly requests: MapRenderRequest[] = [];

  async render(request: MapRenderRequest): Promise<RenderedImage> {
    this.requests.push(request);
    return {
      data: Buffer.from(`map:${JSON.stringify(request.points)}`),
      contentType: "image/png",
      url: "memory://maps/rendered.png",
    };
  }
}

/** Records posts instead of contacting X. Also the safe default at runtime. */
export class FakeSocialPoster implements SocialPoster {
  readonly posts: SocialPost[] = [];
  private n = 0;

  constructor(private readonly log = false) {}

  async post(post: SocialPost): Promise<SocialPostResult> {
    this.n += 1;
    this.posts.push(post);
    const id = `post-${this.n}`;
    const url = `https://x.com/citizenreport/status/${id}`;
    if (this.log) {
      console.log(
        `[social:fake] would post to X${post.image ? " (with map image)" : ""}: ` +
          `${post.text} -> ${url}`,
      );
    }
    return { id, url };
  }
}

/** Fixed police handle, useful in tests. */
export class StaticPoliceDirectory implements PoliceDirectory {
  constructor(private readonly handle: string | null) {}
  async handleFor(_point: GeoPoint): Promise<string | null> {
    return this.handle;
  }
}
