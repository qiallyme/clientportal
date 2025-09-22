import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { 
  validateRequest,
  LoginRequestSchema,
  RegisterRequestSchema,
  CreateFormRequestSchema,
  CreateSubmissionRequestSchema,
  UpdateSubmissionRequestSchema,
  ApiResponseSchema,
  AuthResponseSchema
} from './schemas.js';

// Environment variables (set via wrangler secret)
const SUPABASE_URL = 'https://vwqkhjnkummwtvfxgqml.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3cWtoam5rdW1td3R2ZnhncW1sIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjAwMzA0OSwiZXhwIjoyMDcxNTc5MDQ5fQ.IonJfbD_34jImKfPIfdEwUHPhLx0bnMRniq2wJ3Uqmc';
const JWT_SECRET = 'uOQbRSkJPy2L6fYKRPAPa+pMYZwKKZaoDMXVyc7nCFH4cQsN+VDqFsxx6fcc2ljXp98bT1Lk558YZGHp6+N8Yw==';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS configuration
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://portal.qially.com',
  'https://ef73e42e.clientportal-3pk.pages.dev',
  'http://localhost:3000'
];

// Rate limiting (simple in-memory store)
const rateLimitStore = new Map();

// Utility functions
function generateRequestId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function getClientIP(request) {
  return request.headers.get('CF-Connecting-IP') || 
         request.headers.get('X-Forwarded-For') || 
         request.headers.get('X-Real-IP') || 
         'unknown';
}

function checkRateLimit(ip, limit = 100, windowMs = 60000) {
  const now = Date.now();
  const key = `${ip}:${Math.floor(now / windowMs)}`;
  const current = rateLimitStore.get(key) || 0;
  
  if (current >= limit) {
    return false;
  }
  
  rateLimitStore.set(key, current + 1);
  return true;
}

function createResponse(data, status = 200, headers = {}) {
  const responseHeaders = {
    ...CORS_HEADERS,
    'Content-Type': 'application/json',
    'X-Request-ID': generateRequestId(),
    'X-Response-Time': Date.now().toString(),
    ...headers
  };

  return new Response(JSON.stringify(data), {
    status,
    headers: responseHeaders
  });
}

function createErrorResponse(message, status = 400, errors = null) {
  return createResponse({
    success: false,
    message,
    errors
  }, status);
}

// JWT utilities
function generateToken(userId, orgId) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ 
    id: userId,
    org_id: orgId,
    exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60) // 30 days
  }));
  const signature = btoa(JWT_SECRET);
  return `${header}.${payload}.${signature}`;
}

function verifyToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }
    return payload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}

async function authenticateRequest(request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('No token provided');
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyToken(token);
  
  // Get user from database
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', payload.id)
    .single();

  if (error || !user) {
    throw new Error('User not found');
  }

  return { user, payload };
}

// API Routes
async function handleHealth() {
  return createResponse({
    success: true,
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      region: 'cloudflare',
      version: '2.0.0'
    }
  });
}

async function handleLogin(request) {
  const body = await request.json();
  const validation = validateRequest(LoginRequestSchema, body);
  
  if (!validation.success) {
    return createErrorResponse('Validation failed', 400, validation.errors);
  }

  const { email, password } = validation.data;

  // Find user
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !user) {
    return createErrorResponse('Invalid credentials', 401);
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return createErrorResponse('Invalid credentials', 401);
  }

  // Generate token
  const token = generateToken(user.id, user.org_id);

  return createResponse({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      region: user.region,
      org_id: user.org_id,
      permissions: user.permissions
    }
  });
}

async function handleRegister(request) {
  const body = await request.json();
  const validation = validateRequest(RegisterRequestSchema, body);
  
  if (!validation.success) {
    return createErrorResponse('Validation failed', 400, validation.errors);
  }

  const { name, email, password } = validation.data;

  // Check if user exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    return createErrorResponse('User already exists', 409);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user (assign to default org)
  const { data: user, error } = await supabase
    .from('users')
    .insert([{
      name,
      email,
      password: hashedPassword,
      role: 'user',
      region: 'global',
      org_id: '00000000-0000-0000-0000-000000000001', // Default org
      is_active: true,
      permissions: {}
    }])
    .select()
    .single();

  if (error) {
    return createErrorResponse('Registration failed', 500);
  }

  // Generate token
  const token = generateToken(user.id, user.org_id);

  return createResponse({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      region: user.region,
      org_id: user.org_id,
      permissions: user.permissions
    }
  }, 201);
}

async function handleGetMe(request) {
  try {
    const { user, payload } = await authenticateRequest(request);
    
    // Check if token is close to expiring (within 7 days) and refresh it
    const tokenExp = payload.exp;
    const now = Math.floor(Date.now() / 1000);
    const daysUntilExpiry = (tokenExp - now) / (24 * 60 * 60);
    
    let responseData = {
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        region: user.region,
        org_id: user.org_id,
        permissions: user.permissions
      }
    };

    // If token expires within 7 days, provide a new one
    if (daysUntilExpiry < 7) {
      const newToken = generateToken(user.id, user.org_id);
      responseData.token = newToken;
      responseData.message = 'Token refreshed';
    }

    return createResponse(responseData);
  } catch (error) {
    return createErrorResponse(error.message, 401);
  }
}

async function handleRefreshToken(request) {
  try {
    const { user } = await authenticateRequest(request);
    
    // Generate new token
    const newToken = generateToken(user.id, user.org_id);
    
    return createResponse({
      success: true,
      token: newToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        region: user.region,
        org_id: user.org_id,
        permissions: user.permissions
      }
    });
  } catch (error) {
    return createErrorResponse(error.message, 401);
  }
}

async function handleGetForms(request) {
  try {
    const { user } = await authenticateRequest(request);
    
    const { data: forms, error } = await supabase
      .from('forms')
      .select('*')
      .eq('org_id', user.org_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      return createErrorResponse('Failed to fetch forms', 500);
    }

    return createResponse({
      success: true,
      data: forms,
      pagination: {
        page: 1,
        limit: 10,
        total: forms.length,
        pages: 1
      }
    });
  } catch (error) {
    return createErrorResponse(error.message, 401);
  }
}

async function handleCreateForm(request) {
  try {
    const { user } = await authenticateRequest(request);
    const body = await request.json();
    const validation = validateRequest(CreateFormRequestSchema, body);
    
    if (!validation.success) {
      return createErrorResponse('Validation failed', 400, validation.errors);
    }

    const { title, description, schema } = validation.data;

    const { data: form, error } = await supabase
      .from('forms')
      .insert([{
        title,
        description,
        schema_json: schema,
        org_id: user.org_id,
        owner_id: user.id,
        is_active: true,
        is_public: false
      }])
      .select()
      .single();

    if (error) {
      return createErrorResponse('Failed to create form', 500);
    }

    return createResponse({
      success: true,
      data: form
    }, 201);
  } catch (error) {
    return createErrorResponse(error.message, 401);
  }
}

async function handleGetSubmissions(request) {
  try {
    const { user } = await authenticateRequest(request);
    
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select(`
        *,
        forms:form_id (
          id,
          title
        )
      `)
      .eq('org_id', user.org_id)
      .order('created_at', { ascending: false });

    if (error) {
      return createErrorResponse('Failed to fetch submissions', 500);
    }

    return createResponse({
      success: true,
      data: submissions,
      pagination: {
        page: 1,
        limit: 10,
        total: submissions.length,
        pages: 1
      }
    });
  } catch (error) {
    return createErrorResponse(error.message, 401);
  }
}

async function handleCreateSubmission(request) {
  try {
    const { user } = await authenticateRequest(request);
    const body = await request.json();
    const validation = validateRequest(CreateSubmissionRequestSchema, body);
    
    if (!validation.success) {
      return createErrorResponse('Validation failed', 400, validation.errors);
    }

    const { form_id, data } = validation.data;

    // Verify form exists and user has access
    const { data: form, error: formError } = await supabase
      .from('forms')
      .select('id, org_id')
      .eq('id', form_id)
      .eq('org_id', user.org_id)
      .single();

    if (formError || !form) {
      return createErrorResponse('Form not found', 404);
    }

    const { data: submission, error } = await supabase
      .from('submissions')
      .insert([{
        form_id,
        data_json: data,
        org_id: user.org_id,
        submitter_id: user.id,
        status: 'pending',
        priority: 'medium'
      }])
      .select()
      .single();

    if (error) {
      return createErrorResponse('Failed to create submission', 500);
    }

    return createResponse({
      success: true,
      data: submission
    }, 201);
  } catch (error) {
    return createErrorResponse(error.message, 401);
  }
}

// Main request handler
export default {
  async fetch(request, env, ctx) {
    const startTime = Date.now();
    const requestId = generateRequestId();
    const clientIP = getClientIP(request);
    
    // Rate limiting
    if (!checkRateLimit(clientIP)) {
      return createErrorResponse('Rate limit exceeded', 429);
    }

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      let response;

      // Route handling
      if (path === '/health' && method === 'GET') {
        response = await handleHealth();
      } else if (path === '/api/auth/login' && method === 'POST') {
        response = await handleLogin(request);
      } else if (path === '/api/auth/register' && method === 'POST') {
        response = await handleRegister(request);
      } else if (path === '/api/auth/me' && method === 'GET') {
        response = await handleGetMe(request);
      } else if (path === '/api/auth/refresh' && method === 'POST') {
        response = await handleRefreshToken(request);
      } else if (path === '/api/forms' && method === 'GET') {
        response = await handleGetForms(request);
      } else if (path === '/api/forms' && method === 'POST') {
        response = await handleCreateForm(request);
      } else if (path === '/api/submissions' && method === 'GET') {
        response = await handleGetSubmissions(request);
      } else if (path === '/api/submissions' && method === 'POST') {
        response = await handleCreateSubmission(request);
      } else {
        response = createErrorResponse('Route not found', 404);
      }

      // Add timing header
      const timing = Date.now() - startTime;
      response.headers.set('X-Response-Time', `${timing}ms`);
      response.headers.set('X-Request-ID', requestId);

      return response;

    } catch (error) {
      console.error(`[${requestId}] Error:`, error);
      return createErrorResponse('Internal server error', 500);
    }
  }
};
