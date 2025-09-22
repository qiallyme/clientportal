-- Initial schema setup for clientportal
-- This migration creates the complete database schema with organizations, users, forms, and submissions
-- Includes RLS policies and proper indexing

-- Enable required extensions
create extension if not exists pgcrypto;

-- Create organizations table
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Update users table to include org_id and additional fields
alter table public.users 
add column if not exists org_id uuid references public.organizations(id),
add column if not exists name text,
add column if not exists role text default 'user',
add column if not exists region text default 'global',
add column if not exists is_active boolean default true,
add column if not exists last_login timestamptz,
add column if not exists updated_at timestamptz default now();

-- Create forms table
drop table if exists public.forms cascade;
create table public.forms (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  owner_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  schema_json jsonb not null default '{}'::jsonb,
  is_active boolean default true,
  is_public boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create submissions table
drop table if exists public.submissions cascade;
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  form_id uuid not null references public.forms(id) on delete cascade,
  submitter_id uuid references public.users(id) on delete set null,
  data_json jsonb not null default '{}'::jsonb,
  status text default 'pending',
  priority text default 'medium',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Create indexes for performance
create index if not exists idx_users_org_id on public.users(org_id);
create index if not exists idx_users_email on public.users(email);
create index if not exists idx_forms_org_id on public.forms(org_id);
create index if not exists idx_forms_owner_id on public.forms(owner_id);
create index if not exists idx_forms_is_active on public.forms(is_active);
create index if not exists idx_submissions_org_id on public.submissions(org_id);
create index if not exists idx_submissions_form_id on public.submissions(form_id);
create index if not exists idx_submissions_submitter_id on public.submissions(submitter_id);
create index if not exists idx_submissions_status on public.submissions(status);

-- Enable Row Level Security
alter table public.organizations enable row level security;
alter table public.forms enable row level security;
alter table public.submissions enable row level security;

-- Helper functions for JWT claims
create or replace function public.jwt_org_id() returns uuid
language sql stable as $$ 
  select nullif(current_setting('request.jwt.claims', true)::json->>'org_id', '')::uuid 
$$;

create or replace function public.jwt_uid() returns uuid
language sql stable as $$ 
  select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid 
$$;

-- RLS Policies for organizations
drop policy if exists "Users can read their own organization" on public.organizations;
create policy "Users can read their own organization" on public.organizations
  for select using (id = (select org_id from public.users where id = auth.uid()));

-- RLS Policies for forms
drop policy if exists "forms_tenant_read" on public.forms;
create policy "forms_tenant_read" on public.forms
  for select using (org_id = (select org_id from public.users where id = auth.uid()));

drop policy if exists "forms_owner_write" on public.forms;
create policy "forms_owner_write" on public.forms
  for insert with check (
    org_id = (select org_id from public.users where id = auth.uid()) 
    and owner_id = auth.uid()
  );

drop policy if exists "forms_owner_update" on public.forms;
create policy "forms_owner_update" on public.forms
  for update using (
    org_id = (select org_id from public.users where id = auth.uid()) 
    and owner_id = auth.uid()
  );

drop policy if exists "forms_owner_delete" on public.forms;
create policy "forms_owner_delete" on public.forms
  for delete using (
    org_id = (select org_id from public.users where id = auth.uid()) 
    and owner_id = auth.uid()
  );

-- RLS Policies for submissions
drop policy if exists "subs_tenant_read" on public.submissions;
create policy "subs_tenant_read" on public.submissions
  for select using (org_id = (select org_id from public.users where id = auth.uid()));

drop policy if exists "subs_tenant_write" on public.submissions;
create policy "subs_tenant_write" on public.submissions
  for insert with check (org_id = (select org_id from public.users where id = auth.uid()));

drop policy if exists "subs_tenant_update" on public.submissions;
create policy "subs_tenant_update" on public.submissions
  for update using (org_id = (select org_id from public.users where id = auth.uid()));

-- Create default organization
insert into public.organizations (id, name, slug) 
values ('00000000-0000-0000-0000-000000000001', 'Default Organization', 'default-org')
on conflict (id) do nothing;
