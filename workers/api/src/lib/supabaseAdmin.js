import { createClient } from "@supabase/supabase-js";
export function supabaseAdmin(env) {
    const url = env.SUPABASE_URL;
    const key = env.SUPABASE_SERVICE_ROLE_KEY;
    return createClient(url, key, { auth: { persistSession: false } });
}
