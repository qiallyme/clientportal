-- forms + submissions with org RLS
create table if not exists public.forms (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  owner_id uuid not null,
  title text not null,
  schema_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null,
  form_id uuid not null references public.forms(id) on delete cascade,
  submitter_id uuid,
  data_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.forms enable row level security;
alter table public.submissions enable row level security;

-- helpers
create or replace function public.jwt_org_id() returns uuid
language sql stable as $$ select nullif(current_setting('request.jwt.claims', true)::json->>'org_id','')::uuid $$;

create or replace function public.jwt_uid() returns uuid
language sql stable as $$ select nullif(current_setting('request.jwt.claims', true)::json->>'sub','')::uuid $$;

-- RLS policies
drop policy if exists forms_tenant_read on public.forms;
create policy forms_tenant_read on public.forms
for select using (org_id = jwt_org_id());

drop policy if exists forms_owner_write on public.forms;
create policy forms_owner_write on public.forms
for insert with check (org_id = jwt_org_id() and owner_id = jwt_uid())
;

drop policy if exists forms_owner_update on public.forms;
create policy forms_owner_update on public.forms
for update using (owner_id = jwt_uid() and org_id = jwt_org_id())
;

drop policy if exists subs_tenant_read on public.submissions;
create policy subs_tenant_read on public.submissions
for select using (org_id = jwt_org_id());

drop policy if exists subs_tenant_write on public.submissions;
create policy subs_tenant_write on public.submissions
for insert with check (org_id = jwt_org_id());
