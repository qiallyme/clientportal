import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Initialize Supabase client
const supabase = createClient(
  'https://vwqkhjnkummwtvfxgqml.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3cWtoam5rdW1td3R2ZnhncW1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjAwMzA0OSwiZXhwIjoyMDcxNTc5MDQ5fQ.IonJfbD_34jImKfPIfdEwUHPhLx0bnMRniq2wJ3Uqmc'
);

// JWT secret
const JWT_SECRET = 'uOQbRSkJPy2L6fYKRPAPa+pMYZwKKZaoDMXVyc7nCFH4cQsN+VDqFsxx6fcc2ljXp98bT1Lk558YZGHp6+N8Yw==';

// Simple JWT implementation
function generateToken(userId) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ 
    id: userId, 
    exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
  }));
  const signature = btoa(JWT_SECRET);
  return `${header}.${payload}.${signature}`;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // Health check
      if (path === '/api/health') {
        return new Response(JSON.stringify({
          status: 'OK',
          timestamp: new Date().toISOString(),
          region: 'cloudflare'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Login endpoint
      if (path === '/api/auth/login' && request.method === 'POST') {
        const { email, password } = await request.json();

        // Find user in Supabase
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();

        if (error || !user) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Invalid credentials'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Invalid credentials'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Generate token
        const token = generateToken(user.id);

        return new Response(JSON.stringify({
          success: true,
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            region: user.region,
            permissions: user.permissions
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Register endpoint
      if (path === '/api/auth/register' && request.method === 'POST') {
        const { name, email, password } = await request.json();

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user in Supabase
        const { data: user, error } = await supabase
          .from('users')
          .insert([{
            name,
            email,
            password: hashedPassword,
            role: 'user',
            region: 'global',
            is_active: true,
            permissions: {}
          }])
          .select()
          .single();

        if (error) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Registration failed'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        // Generate token
        const token = generateToken(user.id);

        return new Response(JSON.stringify({
          success: true,
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            region: user.region,
            permissions: user.permissions
          }
        }), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Get current user endpoint
      if (path === '/api/auth/me' && request.method === 'GET') {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({
            success: false,
            message: 'No token provided'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const token = authHeader.split(' ')[1];
        // Simple token validation (in production, use proper JWT verification)
        const payload = JSON.parse(atob(token.split('.')[1]));
        
        const { data: user, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', payload.id)
          .single();

        if (error || !user) {
          return new Response(JSON.stringify({
            success: false,
            message: 'User not found'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({
          success: true,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            region: user.region,
            permissions: user.permissions
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Forms endpoints
      if (path === '/api/forms' && request.method === 'GET') {
        const { data: forms, error } = await supabase
          .from('forms')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });

        if (error) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Failed to fetch forms'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({
          success: true,
          data: forms,
          pagination: {
            page: 1,
            limit: 10,
            total: forms.length,
            pages: 1
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Create form endpoint
      if (path === '/api/forms' && request.method === 'POST') {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Authentication required'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { title, description, fields } = await request.json();
        const token = authHeader.split(' ')[1];
        const payload = JSON.parse(atob(token.split('.')[1]));

        const { data: form, error } = await supabase
          .from('forms')
          .insert([{
            title,
            description,
            fields,
            is_active: true,
            is_public: false,
            created_by: payload.id
          }])
          .select()
          .single();

        if (error) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Failed to create form'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({
          success: true,
          data: form
        }), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Submissions endpoints
      if (path === '/api/submissions' && request.method === 'GET') {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Authentication required'
          }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const { data: submissions, error } = await supabase
          .from('submissions')
          .select(`
            *,
            forms:form_id (
              id,
              title
            )
          `)
          .order('created_at', { ascending: false });

        if (error) {
          return new Response(JSON.stringify({
            success: false,
            message: 'Failed to fetch submissions'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        return new Response(JSON.stringify({
          success: true,
          data: submissions,
          pagination: {
            page: 1,
            limit: 10,
            total: submissions.length,
            pages: 1
          }
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // 404 for other routes
      return new Response(JSON.stringify({
        success: false,
        message: 'Route not found'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Server error'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};
