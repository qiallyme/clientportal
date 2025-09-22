import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { SignJWT } from "jose";
import { supabaseAdmin } from "../lib/supabaseAdmin";
export const auth = new Hono();
auth.get("/api/auth/me", requireAuth, async (c) => {
    const claims = c.get("claims");
    const sb = supabaseAdmin(c.env);
    // Get full user data from database
    const { data: user, error } = await sb.from("users").select("*").eq("id", claims.sub).single();
    if (error) {
        return c.json({ error: error.message }, 500);
    }
    // Return user data in the expected format
    return c.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || claims.role,
        region: user.region,
        permissions: {
            canCreateForms: user.role === 'admin',
            canManageUsers: user.role === 'admin',
            canViewAllSubmissions: user.role === 'admin',
            canEditSubmissions: user.role === 'admin'
        },
        isActive: user.is_active,
        lastLogin: user.last_login,
        createdAt: user.created_at
    }, 200);
});
auth.post("/api/auth/refresh", requireAuth, async (c) => {
    const claims = c.get("claims");
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 30 * 24 * 3600; // 30 days
    // NOTE: use a real keypair/secret in env; this is sketch-only
    const secret = new TextEncoder().encode(c.env.JWT_HS256_SECRET);
    const token = await new SignJWT({ ...claims, iat, exp })
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setIssuedAt(iat)
        .setExpirationTime(exp)
        .setIssuer(c.env.JWT_ISSUER)
        .setSubject(claims.sub)
        .sign(secret);
    return c.json({ token, exp }, 200);
});
// DEV ONLY - Test Supabase connection
auth.get("/api/auth/test-supabase", async (c) => {
    try {
        const sb = supabaseAdmin(c.env);
        const { data, error } = await sb.from("organizations").select("id, name").limit(1);
        if (error)
            return c.json({ error: error.message, code: error.code }, 500);
        return c.json({ success: true, data }, 200);
    }
    catch (error) {
        return c.json({ error: error instanceof Error ? error.message : String(error) }, 500);
    }
});
// DEV ONLY - Check user org_id
auth.get("/api/auth/check-user", async (c) => {
    try {
        const sb = supabaseAdmin(c.env);
        const { data, error } = await sb.from("users").select("id, email, org_id").eq("email", "admin@example.com").single();
        if (error)
            return c.json({ error: error.message, code: error.code }, 500);
        return c.json({ success: true, data }, 200);
    }
    catch (error) {
        return c.json({ error: error instanceof Error ? error.message : String(error) }, 500);
    }
});
// DEV ONLY
auth.post("/api/auth/dev-login", async (c) => {
    try {
        console.log("Dev-login called with headers:", Object.fromEntries(c.req.raw.headers.entries()));
        console.log("Origin:", c.req.header("origin"));
        console.log("Referer:", c.req.header("referer"));
        if (c.env.JWT_ISSUER !== "qieos")
            return c.json({ error: "disabled" }, 403); // simple guard
        const { email = "admin@example.com" } = await c.req.json().catch(() => ({}));
        console.log("Email:", email);
        const iss = c.env.JWT_ISSUER;
        // fetch user/org
        const sb = supabaseAdmin(c.env);
        const { data: u, error } = await sb.from("users").select("id,org_id").eq("email", email).single();
        if (error) {
            console.log("Supabase error:", error);
            return c.json({ error: error.message }, 500);
        }
        if (!u) {
            console.log("No user found for email:", email);
            return c.json({ error: "no user" }, 404);
        }
        const iat = Math.floor(Date.now() / 1000);
        const exp = iat + 30 * 24 * 3600;
        const secret = new TextEncoder().encode(c.env.JWT_HS256_SECRET);
        const token = await new SignJWT({ iss, sub: u.id, org_id: u.org_id, role: "admin" })
            .setProtectedHeader({ alg: "HS256", typ: "JWT" })
            .setIssuedAt(iat).setExpirationTime(exp).setIssuer(iss).setSubject(u.id).sign(secret);
        console.log("Token generated successfully for user:", u.id);
        return c.json({ token, exp }, 200);
    }
    catch (error) {
        console.log("Dev-login error:", error);
        return c.json({ error: error instanceof Error ? error.message : String(error) }, 500);
    }
});
