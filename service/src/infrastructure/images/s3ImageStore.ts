import { randomUUID } from "node:crypto";
import type { ImageStore, StoredImage } from "../../application/ports.js";

/**
 * Minimal S3 client surface we depend on. Keeping our own interface (rather than
 * importing the SDK type directly here) means the AWS SDK is only referenced in
 * the composition root, so it can be swapped for another blob store later.
 */
export interface S3Like {
  putObject(input: {
    Bucket: string;
    Key: string;
    Body: Buffer;
    ContentType: string;
  }): Promise<unknown>;
}

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export class S3ImageStore implements ImageStore {
  constructor(
    private readonly s3: S3Like,
    private readonly bucket: string,
    private readonly publicBaseUrl: string,
  ) {}

  async put(data: Buffer, contentType: string): Promise<StoredImage> {
    const ext = EXTENSIONS[contentType] ?? "bin";
    const key = `reports/${randomUUID()}.${ext}`;
    await this.s3.putObject({
      Bucket: this.bucket,
      Key: key,
      Body: data,
      ContentType: contentType,
    });
    return { key, url: this.urlFor(key) };
  }

  urlFor(key: string): string {
    return `${this.publicBaseUrl.replace(/\/$/, "")}/${key}`;
  }
}
