#!/usr/bin/env node

/**
 * Test the new login endpoint
 */

import https from 'https';

const API_BASE = 'https://client-portal.qilife.workers.dev';
const TEST_EMAIL = 'crice4485@gmail.com';
const TEST_PASSWORD = 'password123'; // This will be accepted for now since we don't have password verification yet

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

async function testLogin() {
  console.log('🧪 Testing Login Endpoint...\n');
  
  try {
    // Test login endpoint
    console.log('1️⃣ Testing /api/auth/login...');
    const loginResponse = await makeRequest(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: TEST_EMAIL,
        password: TEST_PASSWORD
      })
    });
    
    console.log('Response status:', loginResponse.status);
    console.log('Response data:', JSON.stringify(loginResponse.data, null, 2));
    
    if (loginResponse.status !== 200 || !loginResponse.data.token) {
      throw new Error(`Login failed: ${JSON.stringify(loginResponse)}`);
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Login successful');
    console.log(`   Token: ${token.substring(0, 20)}...`);
    console.log(`   User: ${loginResponse.data.user.name} (${loginResponse.data.user.email})`);
    
    // Test /api/auth/me with the new token
    console.log('\n2️⃣ Testing /api/auth/me with login token...');
    const meResponse = await makeRequest(`${API_BASE}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      }
    });
    
    if (meResponse.status !== 200) {
      throw new Error(`/api/auth/me failed: ${JSON.stringify(meResponse)}`);
    }
    
    console.log('✅ /api/auth/me successful');
    console.log(`   User: ${meResponse.data.data.name} (${meResponse.data.data.email})`);
    
    console.log('\n🎉 Login endpoint test passed!');
    
  } catch (error) {
    console.error('\n❌ Login test failed:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run the test
testLogin();
