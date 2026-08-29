import type { NextFunction, Request, Response } from "express";
import type { AuthPrincipal, Authenticator } from "../../application/ports.js";

export interface AuthedRequest extends Request {
  principal?: AuthPrincipal;
}

function bearerToken(header: string | undefined): string | undefined {
  if (!header) return undefined;
  const [scheme, value] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !value) return undefined;
  return value.trim();
}

/** Rejects requests without a valid bearer token; attaches the principal. */
export function requireAuth(authenticator: Authenticator) {
  return async (req: AuthedRequest, res: Response, next: NextFunction) => {
    const token = bearerToken(req.header("authorization"));
    const principal = await authenticator.verify(token);
    if (!principal) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    req.principal = principal;
    next();
  };
}
