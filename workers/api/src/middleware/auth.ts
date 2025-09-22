import { MiddlewareHandler } from "hono";
import { decodeJwt } from "jose";
import type { Claims } from "../types";

export const requireAuth: MiddlewareHandler = async (c, next) => {
  const auth = c.req.header("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return c.json({ error: "missing token" }, 401);
  try {
    const claims = decodeJwt(token) as unknown as Claims;
    if (!claims.org_id || !claims.sub) return c.json({ error: "bad claims" }, 401);
    c.set("claims", claims);
    await next();
  } catch {
    return c.json({ error: "invalid token" }, 401);
  }
};
