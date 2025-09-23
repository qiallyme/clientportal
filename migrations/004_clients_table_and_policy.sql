-- Migration: Create clients table and update INSERT policy
-- Apply this in Supabase SQL Editor

-- Create clients table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create profiles table if it doesn't exist (needed for the policy)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admins and staff can create clients" ON public.clients;

-- Create the new INSERT policy with wrapped auth.uid()
CREATE POLICY "Admins and staff can create clients" ON public.clients 
FOR INSERT TO authenticated 
WITH CHECK ( 
  (SELECT profiles.role FROM profiles WHERE (profiles.id = (SELECT auth.uid())) ) = ANY (ARRAY['admin'::text, 'staff'::text]) 
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_clients_org_id ON public.clients(org_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
