import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { SignJWT, decodeJwt } from "jose";
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
        success: true,
        data: {
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
        }
    }, 200);
});
// Refresh endpoint - Uses Supabase session refresh
auth.post("/api/auth/refresh", async (c) => {
    try {
        const { refresh_token } = await c.req.json();
        if (!refresh_token) {
            return c.json({ error: "Refresh token is required" }, 400);
        }
        const sb = supabaseAdmin(c.env);
        // Use Supabase to refresh the session
        const { data, error } = await sb.auth.refreshSession({
            refresh_token
        });
        if (error) {
            console.error("Session refresh error:", error);
            return c.json({ error: "Failed to refresh session" }, 401);
        }
        if (!data.session) {
            return c.json({ error: "No session returned" }, 401);
        }
        return c.json({
            success: true,
            session: data.session
        }, 200);
    }
    catch (error) {
        console.error("Refresh error:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
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
// Register endpoint - Uses Supabase Auth
auth.post("/api/auth/register", async (c) => {
    try {
        const { name, email, password, role = "user", region = "global" } = await c.req.json();
        if (!name || !email || !password) {
            return c.json({ error: "Name, email, and password are required" }, 400);
        }
        const sb = supabaseAdmin(c.env);
        // Use Supabase Auth to create user
        const { data: authData, error: authError } = await sb.auth.signUp({
            email,
            password,
            options: {
                data: {
                    name,
                    role,
                    region
                }
            }
        });
        if (authError) {
            console.error("Supabase Auth registration error:", authError);
            return c.json({ error: authError.message }, 400);
        }
        if (!authData.user) {
            return c.json({ error: "Failed to create user" }, 500);
        }
        // Get or create default organization
        const { data: defaultOrg } = await sb
            .from("organizations")
            .select("id")
            .eq("slug", "default-org")
            .single();
        let orgId = defaultOrg?.id;
        if (!orgId) {
            // Create default organization if it doesn't exist
            const { data: newOrg, error: orgError } = await sb
                .from("organizations")
                .insert({
                id: "00000000-0000-0000-0000-000000000001",
                name: "Default Organization",
                slug: "default-org"
            })
                .select("id")
                .single();
            if (orgError) {
                console.error("Failed to create default org:", orgError);
                return c.json({ error: "Failed to create organization" }, 500);
            }
            orgId = newOrg.id;
        }
        // Create user profile in our users table
        const { data: user, error: userError } = await sb
            .from("users")
            .insert({
            id: authData.user.id, // Use Supabase Auth user ID
            name,
            email,
            role,
            region,
            is_active: true,
            org_id: orgId,
            created_at: new Date().toISOString()
        })
            .select("id, email, name, role, region, org_id, is_active")
            .single();
        if (userError) {
            console.error("User profile creation error:", userError);
            return c.json({ error: "Failed to create user profile" }, 500);
        }
        return c.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                region: user.region,
                permissions: {
                    canCreateForms: user.role === 'admin',
                    canManageUsers: user.role === 'admin',
                    canViewAllSubmissions: user.role === 'admin',
                    canEditSubmissions: user.role === 'admin'
                },
                isActive: user.is_active
            },
            session: authData.session // Return Supabase session
        }, 201);
    }
    catch (error) {
        console.error("Registration error:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
});
// Login endpoint - Uses Supabase Auth
auth.post("/api/auth/login", async (c) => {
    try {
        const { email, password } = await c.req.json();
        if (!email || !password) {
            return c.json({ error: "Email and password are required" }, 400);
        }
        const sb = supabaseAdmin(c.env);
        // Use Supabase Auth to authenticate user
        const { data: authData, error: authError } = await sb.auth.signInWithPassword({
            email,
            password
        });
        if (authError) {
            console.error("Supabase Auth login error:", authError);
            return c.json({ error: "Invalid credentials" }, 401);
        }
        if (!authData.user || !authData.session) {
            return c.json({ error: "Authentication failed" }, 401);
        }
        // Get user profile from our users table
        const { data: user, error: userError } = await sb
            .from("users")
            .select("id, email, name, role, region, org_id, is_active")
            .eq("id", authData.user.id)
            .eq("is_active", true)
            .single();
        if (userError || !user) {
            console.error("User profile fetch error:", userError);
            return c.json({ error: "User profile not found" }, 404);
        }
        return c.json({
            success: true,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                region: user.region,
                permissions: {
                    canCreateForms: user.role === 'admin',
                    canManageUsers: user.role === 'admin',
                    canViewAllSubmissions: user.role === 'admin',
                    canEditSubmissions: user.role === 'admin'
                },
                isActive: user.is_active
            },
            session: authData.session // Return Supabase session
        }, 200);
    }
    catch (error) {
        console.error("Login error:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
});
// Logout endpoint - Uses Supabase Auth
auth.post("/api/auth/logout", async (c) => {
    try {
        const { refresh_token } = await c.req.json();
        if (!refresh_token) {
            return c.json({ error: "Refresh token is required" }, 400);
        }
        const sb = supabaseAdmin(c.env);
        // Use Supabase to sign out
        const { error } = await sb.auth.signOut();
        if (error) {
            console.error("Logout error:", error);
            return c.json({ error: "Failed to logout" }, 500);
        }
        return c.json({
            success: true,
            message: "Logged out successfully"
        }, 200);
    }
    catch (error) {
        console.error("Logout error:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
});
// Magic link authentication endpoint
auth.post("/api/auth/magic-link", async (c) => {
    try {
        const { email } = await c.req.json();
        if (!email) {
            return c.json({ error: "Email is required" }, 400);
        }
        const sb = supabaseAdmin(c.env);
        // Check if user exists
        const { data: user, error } = await sb
            .from("users")
            .select("id, email, name, role, region, org_id, is_active")
            .eq("email", email)
            .eq("is_active", true)
            .single();
        if (error || !user) {
            return c.json({ error: "User not found or inactive" }, 404);
        }
        // Generate magic link token (simplified - in production you'd send an email)
        const iat = Math.floor(Date.now() / 1000);
        const exp = iat + 15 * 60; // 15 minutes for magic link
        const secret = new TextEncoder().encode(c.env.JWT_HS256_SECRET);
        const magicToken = await new SignJWT({
            iss: c.env.JWT_ISSUER,
            sub: user.id,
            org_id: user.org_id,
            role: user.role || "user",
            type: "magic_link"
        })
            .setProtectedHeader({ alg: "HS256", typ: "JWT" })
            .setIssuedAt(iat)
            .setExpirationTime(exp)
            .setIssuer(c.env.JWT_ISSUER)
            .setSubject(user.id)
            .sign(secret);
        // In production, you would send this token via email
        // For now, we'll return it directly for testing
        return c.json({
            success: true,
            message: "Magic link sent to your email",
            magicToken, // Remove this in production
            expiresIn: 15 * 60 // 15 minutes
        }, 200);
    }
    catch (error) {
        console.error("Magic link error:", error);
        return c.json({ error: "Internal server error" }, 500);
    }
});
// Verify magic link and exchange for session token
auth.post("/api/auth/verify-magic-link", async (c) => {
    try {
        const { magicToken } = await c.req.json();
        if (!magicToken) {
            return c.json({ error: "Magic token is required" }, 400);
        }
        // Verify the magic link token
        const secret = new TextEncoder().encode(c.env.JWT_HS256_SECRET);
        const claims = await decodeJwt(magicToken);
        if (claims.type !== "magic_link") {
            return c.json({ error: "Invalid token type" }, 400);
        }
        const sb = supabaseAdmin(c.env);
        // Get user data
        const { data: user, error } = await sb
            .from("users")
            .select("id, email, name, role, region, org_id, is_active")
            .eq("id", claims.sub)
            .eq("is_active", true)
            .single();
        if (error || !user) {
            return c.json({ error: "User not found or inactive" }, 404);
        }
        // Generate session token
        const iat = Math.floor(Date.now() / 1000);
        const exp = iat + 30 * 24 * 3600; // 30 days
        const sessionToken = await new SignJWT({
            iss: c.env.JWT_ISSUER,
            sub: user.id,
            org_id: user.org_id,
            role: user.role || "user"
        })
            .setProtectedHeader({ alg: "HS256", typ: "JWT" })
            .setIssuedAt(iat)
            .setExpirationTime(exp)
            .setIssuer(c.env.JWT_ISSUER)
            .setSubject(user.id)
            .sign(secret);
        return c.json({
            success: true,
            token: sessionToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                region: user.region,
                permissions: {
                    canCreateForms: user.role === 'admin',
                    canManageUsers: user.role === 'admin',
                    canViewAllSubmissions: user.role === 'admin',
                    canEditSubmissions: user.role === 'admin'
                },
                isActive: user.is_active
            }
        }, 200);
    }
    catch (error) {
        console.error("Magic link verification error:", error);
        return c.json({ error: "Invalid or expired magic link" }, 400);
    }
});
// DEV ONLY
auth.post("/api/auth/dev-login", async (c) => {
    try {
        console.log("Dev-login called with headers:", Object.fromEntries(c.req.raw.headers.entries()));
        console.log("Origin:", c.req.header("origin"));
        console.log("Referer:", c.req.header("referer"));
        if (c.env.JWT_ISSUER !== "clientportal")
            return c.json({ error: "disabled" }, 403); // simple guard
        const { email = "crice4485@gmail.com" } = await c.req.json().catch(() => ({}));
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
        // Get user data for response
        const { data: userData, error: userError } = await sb
            .from("users")
            .select("id, email, name, role, region, is_active")
            .eq("id", u.id)
            .single();
        if (userError || !userData) {
            return c.json({ error: "Failed to get user data" }, 500);
        }
        return c.json({
            success: true,
            token,
            user: {
                id: userData.id,
                name: userData.name || "Admin User",
                email: userData.email,
                role: userData.role || "admin",
                region: userData.region || "global",
                permissions: {
                    canCreateForms: true,
                    canManageUsers: true,
                    canViewAllSubmissions: true,
                    canEditSubmissions: true
                },
                isActive: userData.is_active
            }
        }, 200);
    }
    catch (error) {
        console.log("Dev-login error:", error);
        return c.json({ error: error instanceof Error ? error.message : String(error) }, 500);
    }
});
