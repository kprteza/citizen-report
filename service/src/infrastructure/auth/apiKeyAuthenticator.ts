import { timingSafeEqual } from "node:crypto";
import type { AuthPrincipal, Authenticator } from "../../application/ports.js";

/** Maps opaque bearer tokens to client identifiers. */
export type ApiKeyMap = Record<string, string>;

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/**
 * Simple bearer-token authenticator. Tokens map to client ids. Comparison is
 * constant-time. This is deliberately behind the Authenticator port so it can be
 * replaced by JWT/Cognito/OAuth without touching the HTTP layer or use cases.
 */
export class ApiKeyAuthenticator implements Authenticator {
  private readonly entries: [string, string][];

  constructor(keys: ApiKeyMap) {
    this.entries = Object.entries(keys);
  }

  async verify(token: string | undefined): Promise<AuthPrincipal | null> {
    if (!token) return null;
    for (const [key, clientId] of this.entries) {
      if (safeEqual(token, key)) return { clientId };
    }
    return null;
  }
}
