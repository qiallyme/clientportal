import { Hono } from "hono";
import { requireAuth } from "../middleware/auth";
import { SignJWT } from "jose";
import { supabaseAdmin } from "../lib/supabaseAdmin";
import type { Bindings, Variables } from "../index";

export const auth = new Hono<{ Bindings: Bindings; Variables: Variables }>();

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

auth.post("/api/auth/refresh", requireAuth, async (c) => {
  const claims = c.get("claims");
  const iat = Math.floor(Date.now()/1000);
  const exp = iat + 30*24*3600; // 30 days
  // NOTE: use a real keypair/secret in env; this is sketch-only
  const secret = new TextEncoder().encode(c.env.JWT_HS256_SECRET);
  const token = await new SignJWT({...claims, iat, exp})
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt(iat)
    .setExpirationTime(exp)
    .setIssuer(c.env.JWT_ISSUER)
    .setSubject(claims.sub)
    .sign(secret);
  return c.json({ success: true, token, exp }, 200);
});

// DEV ONLY - Test Supabase connection
auth.get("/api/auth/test-supabase", async (c) => {
  try {
    const sb = supabaseAdmin(c.env);
    const { data, error } = await sb.from("organizations").select("id, name").limit(1);
    if (error) return c.json({ error: error.message, code: error.code }, 500);
    return c.json({ success: true, data }, 200);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// DEV ONLY - Check user org_id
auth.get("/api/auth/check-user", async (c) => {
  try {
    const sb = supabaseAdmin(c.env);
    const { data, error } = await sb.from("users").select("id, email, org_id").eq("email", "admin@example.com").single();
    if (error) return c.json({ error: error.message, code: error.code }, 500);
    return c.json({ success: true, data }, 200);
  } catch (error) {
    return c.json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

// Register endpoint
auth.post("/api/auth/register", async (c) => {
  try {
    const { name, email, password, role = "user", region = "global" } = await c.req.json();
    
    if (!name || !email || !password) {
      return c.json({ error: "Name, email, and password are required" }, 400);
    }
    
    const sb = supabaseAdmin(c.env);
    
    // Check if user already exists
    const { data: existingUser } = await sb
      .from("users")
      .select("id")
      .eq("email", email)
      .single();
    
    if (existingUser) {
      return c.json({ error: "User already exists with this email" }, 400);
    }
    
    // Create new user
    const { data: user, error } = await sb
      .from("users")
      .insert({
        name,
        email,
        role,
        region,
        is_active: true,
        created_at: new Date().toISOString()
      })
      .select("id, email, name, role, region, org_id, is_active")
      .single();
    
    if (error || !user) {
      console.error("Registration error:", error);
      return c.json({ error: "Failed to create user" }, 500);
    }
    
    // Generate JWT token
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 7 * 24 * 3600; // 7 days
    const secret = new TextEncoder().encode(c.env.JWT_HS256_SECRET);
    const token = await new SignJWT({
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
      token,
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
    }, 201);
  } catch (error) {
    console.error("Registration error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Login endpoint
auth.post("/api/auth/login", async (c) => {
  try {
    const { email, password } = await c.req.json();
    
    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }
    
    const sb = supabaseAdmin(c.env);
    
    // For now, we'll use a simple check against the users table
    // In production, you'd want proper password hashing
    const { data: user, error } = await sb
      .from("users")
      .select("id, email, name, role, region, org_id, is_active")
      .eq("email", email)
      .eq("is_active", true)
      .single();
    
    if (error || !user) {
      return c.json({ error: "Invalid credentials" }, 401);
    }
    
    // TODO: Add proper password verification here
    // For now, we'll accept any password for development
    
    // Generate JWT token
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + 7 * 24 * 3600; // 7 days
    const secret = new TextEncoder().encode(c.env.JWT_HS256_SECRET);
    const token = await new SignJWT({
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
      token,
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
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// DEV ONLY
auth.post("/api/auth/dev-login", async (c) => {
  try {
    console.log("Dev-login called with headers:", Object.fromEntries(c.req.raw.headers.entries()));
    console.log("Origin:", c.req.header("origin"));
    console.log("Referer:", c.req.header("referer"));
    
    if (c.env.JWT_ISSUER !== "qieos") return c.json({error:"disabled"}, 403); // simple guard
    const { email = "admin@example.com" } = await c.req.json().catch(()=>({}));
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

    const iat = Math.floor(Date.now()/1000);
    const exp = iat + 30*24*3600;
    const secret = new TextEncoder().encode(c.env.JWT_HS256_SECRET);
    const token = await new SignJWT({ iss, sub: u.id, org_id: u.org_id, role:"admin" })
      .setProtectedHeader({ alg:"HS256", typ:"JWT" })
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
  } catch (error) {
    console.log("Dev-login error:", error);
    return c.json({ error: error instanceof Error ? error.message : String(error) }, 500);
  }
});