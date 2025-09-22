import { supabaseAdmin } from "../lib/supabaseAdmin";
export const requireAuth = async (c, next) => {
    const auth = c.req.header("authorization") || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!token)
        return c.json({ error: "missing token" }, 401);
    try {
        const sb = supabaseAdmin(c.env);
        // Verify the Supabase JWT token
        const { data: { user }, error } = await sb.auth.getUser(token);
        if (error || !user) {
            return c.json({ error: "invalid token" }, 401);
        }
        // Get user profile to extract org_id and role
        const { data: userProfile, error: profileError } = await sb
            .from("users")
            .select("org_id, role")
            .eq("id", user.id)
            .single();
        if (profileError || !userProfile) {
            return c.json({ error: "user profile not found" }, 401);
        }
        // Create claims object with Supabase user data
        const claims = {
            sub: user.id,
            email: user.email || "",
            org_id: userProfile.org_id,
            role: userProfile.role || "user"
        };
        c.set("claims", claims);
        await next();
    }
    catch (error) {
        console.error("Auth middleware error:", error);
        return c.json({ error: "invalid token" }, 401);
    }
};
