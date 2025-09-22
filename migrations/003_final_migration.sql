-- orgs + forms + submissions + RLS (safe to re-run)
create extension if not exists pgcrypto;

create table if not exists public.organizations(
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  created_at timestamptz default now()
);
alter table public.organizations enable row level security;

create table if not exists public.users(
  id uuid primary key default gen_random_uuid(),
  email text unique,
  org_id uuid references public.organizations(id),
  created_at timestamptz default now()
);

drop table if exists public.forms cascade;
create table public.forms(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  owner_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  schema_json jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);
alter table public.forms enable row level security;

drop table if exists public.submissions cascade;
create table public.submissions(
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  form_id uuid not null references public.forms(id) on delete cascade,
  submitter_id uuid references public.users(id) on delete set null,
  data_json jsonb not null default '{}'::jsonb,
  created_at timestamptz default now()
);
alter table public.submissions enable row level security;

-- helpers for claims
create or replace function public.jwt_org_id() returns uuid
language sql stable as $$ select nullif(current_setting('request.jwt.claims',true)::json->>'org_id','')::uuid $$;
create or replace function public.jwt_uid() returns uuid
language sql stable as $$ select nullif(current_setting('request.jwt.claims',true)::json->>'sub','')::uuid $$;

-- RLS
drop policy if exists forms_select on public.forms;
create policy forms_select on public.forms for select using (org_id = jwt_org_id());

drop policy if exists forms_insert on public.forms;
create policy forms_insert on public.forms for insert with check (org_id = jwt_org_id() and owner_id = jwt_uid());

drop policy if exists forms_update on public.forms;
create policy forms_update on public.forms for update using (owner_id = jwt_uid() and org_id = jwt_org_id());

drop policy if exists subs_select on public.submissions;
create policy subs_select on public.submissions for select using (org_id = jwt_org_id());

drop policy if exists subs_insert on public.submissions;
create policy subs_insert on public.submissions for insert with check (org_id = jwt_org_id());

-- seed default org + admin (idempotent)
insert into public.organizations(name, slug)
values ('QiAlly Default','qially-default')
on conflict (slug) do nothing;

with o as (select id from public.organizations where slug='qially-default')
insert into public.users(email, org_id)
select 'admin@example.com', o.id from o
on conflict (email) do nothing;
