-- demo org + admin (replace emails later)
insert into public.organizations(id, name)
values (gen_random_uuid(), 'QiAlly Demo')
on conflict do nothing;

-- pick the org id we just created
with o as (
  select id from public.organizations order by created_at desc limit 1
)
insert into public.users(id, email)
select gen_random_uuid(), 'admin@example.com'
where not exists (select 1 from public.users where email='admin@example.com');

-- attach membership + role
with o as (select id from public.organizations order by created_at desc limit 1),
     u as (select id from public.users where email='admin@example.com' limit 1)
insert into public.memberships(user_id, org_id, role)
select u.id, o.id, 'admin' from u,o
on conflict do nothing;
