# Supabase Setup Guide

## Quick Setup Steps

1. **Go to [Supabase](https://supabase.com) and create a free account**

2. **Create a new project:**

   - Click "New Project"
   - Choose your organization
   - Enter project name: "client-portal"
   - Choose a strong database password
   - Select a region close to you
   - Click "Create new project"

3. **Get your credentials:**

   - Go to Settings → API
   - Copy your Project URL
   - Copy your anon/public key
   - Copy your service_role key (keep this secret!)

4. **Update your environment:**

   - Open `.env` file in the root directory
   - Replace the placeholder values:

   ```
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

5. **Create the database tables:**
   - Go to SQL Editor in Supabase dashboard
   - Run the SQL script below to create the required tables

## Database Schema

Run this SQL in the Supabase SQL Editor:

```sql
-- Create users table
CREATE TABLE users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  region VARCHAR(50) DEFAULT 'us',
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create forms table
CREATE TABLE forms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  fields JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create submissions table
CREATE TABLE submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID REFERENCES forms(id),
  data JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  priority VARCHAR(50) DEFAULT 'medium',
  assigned_to UUID REFERENCES users(id),
  submitted_by VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_forms_active ON forms(is_active);
CREATE INDEX idx_submissions_form_status ON submissions(form_id, status);
CREATE INDEX idx_submissions_created_at ON submissions(created_at DESC);

-- Insert default admin user (password: 'password')
INSERT INTO users (name, email, password, role, region, is_active, permissions)
VALUES (
  'Admin User',
  'admin@example.com',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin',
  'global',
  true,
  '{"canCreateForms": true, "canManageUsers": true, "canViewAllSubmissions": true, "canEditSubmissions": true}'
);
```

## Testing the Setup

After completing the setup:

1. Start the backend: `npm run dev`
2. Start the frontend: `cd frontend && npm start`
3. Visit http://localhost:3000
4. Login with: admin@example.com / password

## Troubleshooting

- **Connection issues**: Make sure your Supabase URL and keys are correct
- **Table errors**: Ensure you've run the SQL schema script
- **CORS issues**: Check that your Supabase project allows your localhost URL
