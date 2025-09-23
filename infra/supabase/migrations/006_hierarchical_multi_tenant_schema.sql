-- Hierarchical Multi-Tenant Schema for QiAlly Portal
-- This migration implements the complete hierarchical structure:
-- QiAlly (Super Admin) -> Tenants -> Departments -> Users -> Resources

-- Enable required extensions
create extension if not exists pgcrypto;

-- Drop existing tables to recreate with proper hierarchy
drop table if exists public.submissions cascade;
drop table if exists public.forms cascade;
drop table if exists public.users cascade;
drop table if exists public.departments cascade;
drop table if exists public.organizations cascade;

-- 1. TENANTS TABLE (Top-level client organizations)
-- These are the main client companies that subscribe to QiAlly
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  domain text unique, -- Custom domain if applicable
  settings jsonb default '{}'::jsonb, -- Tenant-specific settings
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. DEPARTMENTS TABLE (Sub-organizations within tenants)
-- These are departments, divisions, or teams within a tenant
create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  slug text not null,
  parent_department_id uuid references public.departments(id), -- For nested departments
  settings jsonb default '{}'::jsonb, -- Department-specific settings
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Ensure unique slug within tenant
  unique(tenant_id, slug)
);

-- 3. USERS TABLE (Hierarchical user structure)
-- Users belong to departments within tenants
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  department_id uuid references public.departments(id) on delete set null,
  name text,
  role text not null default 'user', -- 'super_admin', 'tenant_admin', 'department_admin', 'user', 'viewer'
  permissions jsonb default '{}'::jsonb, -- Granular permissions
  is_active boolean default true,
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. FORMS TABLE (Scoped to departments)
create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  department_id uuid references public.departments(id) on delete cascade,
  owner_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  description text,
  schema_json jsonb not null default '{}'::jsonb,
  is_active boolean default true,
  is_public boolean default false,
  settings jsonb default '{}'::jsonb, -- Form-specific settings
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. SUBMISSIONS TABLE (Scoped to forms/departments)
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  department_id uuid references public.departments(id) on delete cascade,
  form_id uuid not null references public.forms(id) on delete cascade,
  submitter_id uuid references public.users(id) on delete set null,
  data_json jsonb not null default '{}'::jsonb,
  status text default 'pending',
  priority text default 'medium',
  assigned_to uuid references public.users(id),
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 6. KNOWLEDGE BASES TABLE (Scoped to departments)
create table if not exists public.knowledge_bases (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  department_id uuid references public.departments(id) on delete cascade,
  name text not null,
  description text,
  settings jsonb default '{}'::jsonb,
  is_active boolean default true,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 7. CHATS TABLE (Scoped to departments)
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  department_id uuid references public.departments(id) on delete cascade,
  title text,
  type text default 'group', -- 'group', 'direct', 'support'
  is_active boolean default true,
  created_by uuid not null references public.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. CHAT MESSAGES TABLE
create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  message text not null,
  message_type text default 'text', -- 'text', 'file', 'image', 'system'
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- 9. TASKS TABLE (Scoped to departments)
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  department_id uuid references public.departments(id) on delete cascade,
  title text not null,
  description text,
  status text default 'todo', -- 'todo', 'in_progress', 'completed', 'cancelled'
  priority text default 'medium', -- 'low', 'medium', 'high', 'urgent'
  assigned_to uuid references public.users(id),
  created_by uuid not null references public.users(id),
  due_date timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 10. DOCUMENTS TABLE (Scoped to departments)
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  department_id uuid references public.departments(id) on delete cascade,
  name text not null,
  description text,
  file_path text not null,
  file_size bigint,
  mime_type text,
  uploaded_by uuid not null references public.users(id),
  version text default '1.0',
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 11. PROJECTS TABLE (Scoped to departments)
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  department_id uuid references public.departments(id) on delete cascade,
  name text not null,
  description text,
  status text default 'active', -- 'active', 'completed', 'paused', 'cancelled'
  start_date date,
  end_date date,
  created_by uuid not null references public.users(id),
  is_active boolean default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 12. AUDIT LOGS TABLE (For compliance and security)
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid references public.users(id) on delete set null,
  user_email text, -- Store email for cases where user is deleted
  action text not null, -- 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'LOGIN', etc.
  resource_type text not null, -- 'FORM', 'USER', 'SUBMISSION', 'CHAT', etc.
  resource_id uuid,
  details jsonb, -- Additional context about the action
  ip_address inet,
  user_agent text,
  timestamp timestamptz not null default now()
);

-- Create indexes for performance
create index if not exists idx_users_tenant_id on public.users(tenant_id);
create index if not exists idx_users_department_id on public.users(department_id);
create index if not exists idx_users_role on public.users(role);

create index if not exists idx_departments_tenant_id on public.departments(tenant_id);
create index if not exists idx_departments_parent_id on public.departments(parent_department_id);

create index if not exists idx_forms_tenant_id on public.forms(tenant_id);
create index if not exists idx_forms_department_id on public.forms(department_id);

create index if not exists idx_submissions_tenant_id on public.submissions(tenant_id);
create index if not exists idx_submissions_department_id on public.submissions(department_id);
create index if not exists idx_submissions_form_id on public.submissions(form_id);

create index if not exists idx_knowledge_bases_tenant_id on public.knowledge_bases(tenant_id);
create index if not exists idx_knowledge_bases_department_id on public.knowledge_bases(department_id);

create index if not exists idx_chats_tenant_id on public.chats(tenant_id);
create index if not exists idx_chats_department_id on public.chats(department_id);

create index if not exists idx_chat_messages_chat_id on public.chat_messages(chat_id);

create index if not exists idx_tasks_tenant_id on public.tasks(tenant_id);
create index if not exists idx_tasks_department_id on public.tasks(department_id);
create index if not exists idx_tasks_assigned_to on public.tasks(assigned_to);

create index if not exists idx_documents_tenant_id on public.documents(tenant_id);
create index if not exists idx_documents_department_id on public.documents(department_id);

create index if not exists idx_projects_tenant_id on public.projects(tenant_id);
create index if not exists idx_projects_department_id on public.projects(department_id);

create index if not exists idx_audit_logs_tenant_id on public.audit_logs(tenant_id);
create index if not exists idx_audit_logs_timestamp on public.audit_logs(timestamp desc);
create index if not exists idx_audit_logs_action on public.audit_logs(action);

-- Enable Row Level Security on all tables
alter table public.tenants enable row level security;
alter table public.departments enable row level security;
alter table public.users enable row level security;
alter table public.forms enable row level security;
alter table public.submissions enable row level security;
alter table public.knowledge_bases enable row level security;
alter table public.chats enable row level security;
alter table public.chat_messages enable row level security;
alter table public.tasks enable row level security;
alter table public.documents enable row level security;
alter table public.projects enable row level security;
alter table public.audit_logs enable row level security;

-- Helper functions for JWT claims
create or replace function public.jwt_tenant_id() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::json->>'tenant_id', '')::uuid
$$;

create or replace function public.jwt_department_id() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::json->>'department_id', '')::uuid
$$;

create or replace function public.jwt_uid() returns uuid
language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::uuid
$$;

create or replace function public.jwt_user_role() returns text
language sql stable as $$
  select nullif(current_setting('request.jwt.claims', true)::json->>'role', '')::text
$$;

-- RLS Policies for hierarchical access control

-- TENANTS: Super admins can see all tenants, tenant admins can only see their own
drop policy if exists "Super admins can access all tenants" on public.tenants;
create policy "Super admins can access all tenants" on public.tenants
  for all using (jwt_user_role() = 'super_admin');

drop policy if exists "Tenant admins can access their tenant" on public.tenants;
create policy "Tenant admins can access their tenant" on public.tenants
  for all using (id = jwt_tenant_id());

-- DEPARTMENTS: Users can only access departments within their tenant
drop policy if exists "Users can access departments in their tenant" on public.departments;
create policy "Users can access departments in their tenant" on public.departments
  for all using (tenant_id = jwt_tenant_id());

-- USERS: Users can only access users within their tenant
drop policy if exists "Users can access users in their tenant" on public.users;
create policy "Users can access users in their tenant" on public.users
  for all using (tenant_id = jwt_tenant_id());

-- FORMS: Hierarchical access - tenant admins see all, department admins see only their department
drop policy if exists "Tenant admins can access all forms in tenant" on public.forms;
create policy "Tenant admins can access all forms in tenant" on public.forms
  for all using (tenant_id = jwt_tenant_id() and jwt_user_role() = 'tenant_admin');

drop policy if exists "Department users can access forms in their department" on public.forms;
create policy "Department users can access forms in their department" on public.forms
  for all using (tenant_id = jwt_tenant_id() and department_id = jwt_department_id());

-- SUBMISSIONS: Same hierarchical access as forms
drop policy if exists "Tenant admins can access all submissions in tenant" on public.submissions;
create policy "Tenant admins can access all submissions in tenant" on public.submissions
  for all using (tenant_id = jwt_tenant_id() and jwt_user_role() = 'tenant_admin');

drop policy if exists "Department users can access submissions in their department" on public.submissions;
create policy "Department users can access submissions in their department" on public.submissions
  for all using (tenant_id = jwt_tenant_id() and department_id = jwt_department_id());

-- Similar policies for other resources (knowledge_bases, chats, tasks, documents, projects)
drop policy if exists "Tenant admins can access all resources in tenant" on public.knowledge_bases;
create policy "Tenant admins can access all resources in tenant" on public.knowledge_bases
  for all using (tenant_id = jwt_tenant_id() and jwt_user_role() = 'tenant_admin');

drop policy if exists "Department users can access resources in their department" on public.knowledge_bases;
create policy "Department users can access resources in their department" on public.knowledge_bases
  for all using (tenant_id = jwt_tenant_id() and department_id = jwt_department_id());

-- Apply same pattern to chats, tasks, documents, projects
drop policy if exists "Tenant admins can access all resources in tenant" on public.chats;
create policy "Tenant admins can access all resources in tenant" on public.chats
  for all using (tenant_id = jwt_tenant_id() and jwt_user_role() = 'tenant_admin');

drop policy if exists "Department users can access resources in their department" on public.chats;
create policy "Department users can access resources in their department" on public.chats
  for all using (tenant_id = jwt_tenant_id() and department_id = jwt_department_id());

drop policy if exists "Tenant admins can access all resources in tenant" on public.tasks;
create policy "Tenant admins can access all resources in tenant" on public.tasks
  for all using (tenant_id = jwt_tenant_id() and jwt_user_role() = 'tenant_admin');

drop policy if exists "Department users can access resources in their department" on public.tasks;
create policy "Department users can access resources in their department" on public.tasks
  for all using (tenant_id = jwt_tenant_id() and department_id = jwt_department_id());

drop policy if exists "Tenant admins can access all resources in tenant" on public.documents;
create policy "Tenant admins can access all resources in tenant" on public.documents
  for all using (tenant_id = jwt_tenant_id() and jwt_user_role() = 'tenant_admin');

drop policy if exists "Department users can access resources in their department" on public.documents;
create policy "Department users can access resources in their department" on public.documents
  for all using (tenant_id = jwt_tenant_id() and department_id = jwt_department_id());

drop policy if exists "Tenant admins can access all resources in tenant" on public.projects;
create policy "Tenant admins can access all resources in tenant" on public.projects
  for all using (tenant_id = jwt_tenant_id() and jwt_user_role() = 'tenant_admin');

drop policy if exists "Department users can access resources in their department" on public.projects;
create policy "Department users can access resources in their department" on public.projects
  for all using (tenant_id = jwt_tenant_id() and department_id = jwt_department_id());

-- CHAT MESSAGES: Users can only access messages in chats they have access to
drop policy if exists "Users can access chat messages in accessible chats" on public.chat_messages;
create policy "Users can access chat messages in accessible chats" on public.chat_messages
  for all using (
    exists (
      select 1 from public.chats c
      where c.id = chat_messages.chat_id
      and c.tenant_id = jwt_tenant_id()
      and (c.department_id = jwt_department_id() or jwt_user_role() = 'tenant_admin')
    )
  );

-- AUDIT LOGS: Strict access control for compliance
drop policy if exists "Super admins can access all audit logs" on public.audit_logs;
create policy "Super admins can access all audit logs" on public.audit_logs
  for all using (jwt_user_role() = 'super_admin');

drop policy if exists "Tenant admins can access their tenant's audit logs" on public.audit_logs;
create policy "Tenant admins can access their tenant's audit logs" on public.audit_logs
  for all using (tenant_id = jwt_tenant_id() and jwt_user_role() = 'tenant_admin');
