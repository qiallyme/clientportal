import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { requireAuth } from "../middleware/auth";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import { FormCreate } from "../types";
export const forms = new Hono();
forms.get("/api/forms", requireAuth, async (c) => {
    const { org_id } = c.get("claims");
    const sb = supabaseAdmin(c.env);
    const { data, error } = await sb.from("forms").select("*").eq("org_id", org_id).order("created_at", { ascending: false });
    if (error)
        return c.json({ error: error.message }, 500);
    return c.json(data ?? [], 200);
});
forms.post("/api/forms", requireAuth, zValidator("json", FormCreate, (result, c) => {
    if (!result.success) {
        return c.json({ error: result.error.issues }, 400);
    }
}), async (c) => {
    const { org_id, sub } = c.get("claims");
    const body = c.req.valid("json");
    const sb = supabaseAdmin(c.env);
    const { data, error } = await sb
        .from("forms")
        .insert([{ org_id, owner_id: sub, title: body.title, schema_json: body.schema }])
        .select("id")
        .single();
    if (error)
        return c.json({ error: error.message }, 500);
    return c.json({ id: data.id }, 201);
});
