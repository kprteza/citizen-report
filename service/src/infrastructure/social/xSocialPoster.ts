import type {
  SocialPost,
  SocialPoster,
  SocialPostResult,
} from "../../application/ports.js";

/**
 * Thin transport abstraction over the X (Twitter) API. Splitting media upload
 * from post creation keeps each step small and lets us unit-test the poster with
 * a fake client, and swap in a real HTTP/OAuth implementation at the edge.
 */
export interface XClient {
  uploadMedia(data: Buffer, contentType: string): Promise<string>;
  createPost(input: { text: string; mediaIds: string[] }): Promise<{ id: string }>;
  /** Username used to build the public status URL. */
  username: string;
}

export class XSocialPoster implements SocialPoster {
  constructor(private readonly client: XClient) {}

  async post(post: SocialPost): Promise<SocialPostResult> {
    const mediaIds: string[] = [];
    if (post.image) {
      const mediaId = await this.client.uploadMedia(
        post.image.data,
        post.image.contentType,
      );
      mediaIds.push(mediaId);
    }
    const { id } = await this.client.createPost({ text: post.text, mediaIds });
    return { id, url: `https://x.com/${this.client.username}/status/${id}` };
  }
}
