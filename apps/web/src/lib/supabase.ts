// 🚫 LOCKED — Do not edit without RFC approval (QiEOS God Doc §12.2)
// This file contains working Supabase authentication configuration
// Last verified working: 2025-09-22 - Authentication is functional
import { createClient } from '@supabase/supabase-js';

// Supabase configuration with validation
const envSupabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const envSupabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Use environment variables if they're valid, otherwise use fallbacks
const supabaseUrl = (envSupabaseUrl && envSupabaseUrl.startsWith('http')) 
  ? envSupabaseUrl 
  : 'https://vwqkhjnkummwtvfxgqml.supabase.co';

const supabaseAnonKey = (envSupabaseAnonKey && envSupabaseAnonKey.length > 50) 
  ? envSupabaseAnonKey 
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3cWtoam5rdW1td3R2ZnhncW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMDMwNDksImV4cCI6MjA3MTU3OTA0OX0.Q1_W-sq8iKVPfJ2HfTS2hGNmK5jjzsy50cHszhB_6VQ';

// Debug logging (remove in production)
console.log('Supabase Config:', {
  envUrl: envSupabaseUrl,
  envKey: envSupabaseAnonKey ? `${envSupabaseAnonKey.substring(0, 20)}...` : 'undefined',
  finalUrl: supabaseUrl,
  finalKey: `${supabaseAnonKey.substring(0, 20)}...`
});

// 🔒 LOCK-START: Supabase client configuration — Working authentication setup
// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});
// 🔓 LOCK-END

// Auth helper functions
export const auth = {
  // Sign in with email and password
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Sign up with email and password
  signUp: async (email: string, password: string, userData?: { name?: string; role?: string; region?: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    });
    return { data, error };
  },

  // Sign in with magic link
  signInWithMagicLink: async (email: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    return { data, error };
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Get current session
  getCurrentSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Listen to auth state changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback);
  }
};

export default supabase;
