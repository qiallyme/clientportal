#!/usr/bin/env node

/**
 * Authentication Flow Test
 * 
 * This script tests the complete authentication flow to ensure it works correctly.
 * Run this after any changes to auth routes to prevent regressions.
 */

import https from 'https';

const API_BASE = 'https://client-portal.qilife.workers.dev';
const TEST_EMAIL = 'admin@example.com';

async function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function testAuthFlow() {
  console.log('🧪 Testing Authentication Flow...\n');
  
  try {
    // Step 1: Test dev-login
    console.log('1️⃣ Testing dev-login...');
    const loginResponse = await makeRequest(`${API_BASE}/api/auth/dev-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: TEST_EMAIL })
    });
    
    if (loginResponse.status !== 200 || !loginResponse.data.token) {
      throw new Error(`Dev-login failed: ${JSON.stringify(loginResponse)}`);
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Dev-login successful');
    
    // Step 2: Test /api/auth/me
    console.log('2️⃣ Testing /api/auth/me...');
    const meResponse = await makeRequest(`${API_BASE}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    
    if (meResponse.status !== 200) {
      throw new Error(`/api/auth/me failed: ${JSON.stringify(meResponse)}`);
    }
    
    // Validate user object structure
    const user = meResponse.data;
    const requiredFields = ['id', 'name', 'email', 'role', 'permissions'];
    for (const field of requiredFields) {
      if (!user[field]) {
        throw new Error(`User object missing required field: ${field}`);
      }
    }
    
    console.log('✅ /api/auth/me successful');
    console.log(`   User: ${user.name} (${user.email})`);
    console.log(`   Role: ${user.role}`);
    
    // Step 3: Test forms endpoint
    console.log('3️⃣ Testing /api/forms...');
    const formsResponse = await makeRequest(`${API_BASE}/api/forms`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    
    if (formsResponse.status !== 200) {
      throw new Error(`/api/forms failed: ${JSON.stringify(formsResponse)}`);
    }
    
    console.log('✅ /api/forms successful');
    
    // Step 4: Test token refresh
    console.log('4️⃣ Testing token refresh...');
    const refreshResponse = await makeRequest(`${API_BASE}/api/auth/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    
    if (refreshResponse.status !== 200 || !refreshResponse.data.token) {
      throw new Error(`Token refresh failed: ${JSON.stringify(refreshResponse)}`);
    }
    
    console.log('✅ Token refresh successful');
    
    console.log('\n🎉 All authentication tests passed!');
    console.log('🔒 Routes are locked and working correctly.');
    
  } catch (error) {
    console.error('\n❌ Authentication test failed:');
    console.error(error.message);
    console.error('\n🚨 ROUTE LOCK FAILED - DO NOT DEPLOY');
    process.exit(1);
  }
}

// Run the test
testAuthFlow();
