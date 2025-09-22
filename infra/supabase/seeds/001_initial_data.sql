-- Initial seed data for clientportal
-- This file contains the default organization and admin user setup

-- Create default organization (idempotent)
insert into public.organizations (id, name, slug) 
values ('00000000-0000-0000-0000-000000000001', 'Default Organization', 'default-org')
on conflict (id) do nothing;

-- Create admin user (idempotent)
-- Note: This user will be created through Supabase Auth, but we need the profile record
insert into public.users (
  id,
  name, 
  email, 
  role, 
  region, 
  is_active, 
  org_id
)
values (
  '00000000-0000-0000-0000-000000000001', -- This should match the Supabase Auth user ID
  'Admin User',
  'admin@example.com',
  'admin',
  'global',
  true,
  '00000000-0000-0000-0000-000000000001'
)
on conflict (email) do update set
  name = excluded.name,
  role = excluded.role,
  region = excluded.region,
  is_active = excluded.is_active,
  org_id = excluded.org_id,
  updated_at = now();

-- Create a sample form for testing
insert into public.forms (
  id,
  org_id,
  owner_id,
  title,
  description,
  schema_json,
  is_active,
  is_public
)
values (
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Sample Contact Form',
  'A simple contact form for testing purposes',
  '{
    "fields": [
      {
        "name": "name",
        "label": "Full Name",
        "type": "text",
        "required": true
      },
      {
        "name": "email",
        "label": "Email Address",
        "type": "email",
        "required": true
      },
      {
        "name": "message",
        "label": "Message",
        "type": "textarea",
        "required": true
      }
    ]
  }'::jsonb,
  true,
  true
)
on conflict (id) do nothing;
