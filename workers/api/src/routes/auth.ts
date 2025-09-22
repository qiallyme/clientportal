import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";

export const auth = new Hono();
auth.get("/api/auth/me", requireAuth, (c) => {
  const claims = c.get("claims");
  return c.json(claims, 200);
});
