-- Migration: Update schema with org_id and RLS policies
-- Apply this in Supabase SQL Editor

-- Update users table to include org_id
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS org_id UUID DEFAULT gen_random_uuid();

-- Create organizations table
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Update forms table with new schema
DROP TABLE IF EXISTS public.forms CASCADE;
CREATE TABLE public.forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  schema_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Update submissions table with new schema
DROP TABLE IF EXISTS public.submissions CASCADE;
CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  submitter_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  data_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_org_id ON public.users(org_id);
CREATE INDEX IF NOT EXISTS idx_forms_org_id ON public.forms(org_id);
CREATE INDEX IF NOT EXISTS idx_forms_owner_id ON public.forms(owner_id);
CREATE INDEX IF NOT EXISTS idx_submissions_org_id ON public.submissions(org_id);
CREATE INDEX IF NOT EXISTS idx_submissions_form_id ON public.submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_submissions_submitter_id ON public.submissions(submitter_id);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organizations
CREATE POLICY "Users can read their own organization" ON public.organizations
  FOR SELECT USING (id = (SELECT org_id FROM public.users WHERE id = auth.uid()));

-- RLS Policies for forms
CREATE POLICY "forms_tenant_read" ON public.forms
  FOR SELECT USING (org_id = (SELECT org_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "forms_owner_write" ON public.forms
  FOR INSERT WITH CHECK (
    org_id = (SELECT org_id FROM public.users WHERE id = auth.uid()) 
    AND owner_id = auth.uid()
  );

CREATE POLICY "forms_owner_update" ON public.forms
  FOR UPDATE USING (
    org_id = (SELECT org_id FROM public.users WHERE id = auth.uid()) 
    AND owner_id = auth.uid()
  );

CREATE POLICY "forms_owner_delete" ON public.forms
  FOR DELETE USING (
    org_id = (SELECT org_id FROM public.users WHERE id = auth.uid()) 
    AND owner_id = auth.uid()
  );

-- RLS Policies for submissions
CREATE POLICY "subs_tenant_read" ON public.submissions
  FOR SELECT USING (org_id = (SELECT org_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "subs_tenant_write" ON public.submissions
  FOR INSERT WITH CHECK (org_id = (SELECT org_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "subs_tenant_update" ON public.submissions
  FOR UPDATE USING (org_id = (SELECT org_id FROM public.users WHERE id = auth.uid()));

-- Create default organization and update admin user
INSERT INTO public.organizations (id, name, slug) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organization', 'default-org')
ON CONFLICT (id) DO NOTHING;

-- Update admin user to belong to default org
UPDATE public.users 
SET org_id = '00000000-0000-0000-0000-000000000001'
WHERE email = 'admin@example.com' AND org_id IS NULL;
