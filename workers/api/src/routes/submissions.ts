import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { requireAuth } from "../middleware/auth";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { SubmissionCreate } from "../types";
import type { Bindings, Variables } from "../index";

export const submissions = new Hono<{ Bindings: Bindings; Variables: Variables }>();

submissions.get("/api/submissions", requireAuth, async (c) => {
  const { org_id } = c.get("claims");
  const sb = supabaseAdmin(c.env);
  const { data, error } = await sb.from("submissions").select("*").eq("org_id", org_id).order("created_at", { ascending: false });
  if (error) return c.json({ error: error.message }, 500);
  return c.json(data ?? [], 200);
});

submissions.post(
  "/api/submissions",
  requireAuth,
  zValidator("json", SubmissionCreate, (result, c) => {
    if (!result.success) {
      return c.json({ error: result.error.issues }, 400);
    }
  }),
  async (c) => {
    const { org_id, sub } = c.get("claims");
    const body = c.req.valid("json");
    const sb = supabaseAdmin(c.env);
    const { error } = await sb
      .from("submissions")
      .insert([{ org_id, form_id: body.form_id, submitter_id: sub, data_json: body.data }]);
    if (error) return c.json({ error: error.message }, 500);
    return c.body(null, 201);
  }
);
