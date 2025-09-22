import { createClient } from "@supabase/supabase-js";

export function supabaseAdmin(env: Env) {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  return createClient(url, key, { auth: { persistSession: true } });
}

export type Env = {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  JWT_ISSUER: string;
};
