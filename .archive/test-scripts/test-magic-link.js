#!/usr/bin/env node

/**
 * Test the magic link authentication
 */

import https from 'https';

const API_BASE = 'https://client-portal.qilife.workers.dev';
const TEST_EMAIL = 'crice4485@gmail.com';

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

async function testMagicLink() {
  console.log('🧪 Testing Magic Link Authentication...\n');
  
  try {
    // Step 1: Request magic link
    console.log('1️⃣ Testing /api/auth/magic-link...');
    const magicLinkResponse = await makeRequest(`${API_BASE}/api/auth/magic-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: TEST_EMAIL })
    });
    
    console.log('Response status:', magicLinkResponse.status);
    console.log('Response data:', JSON.stringify(magicLinkResponse.data, null, 2));
    
    if (magicLinkResponse.status !== 200 || !magicLinkResponse.data.magicToken) {
      throw new Error(`Magic link request failed: ${JSON.stringify(magicLinkResponse)}`);
    }
    
    const magicToken = magicLinkResponse.data.magicToken;
    console.log('✅ Magic link request successful');
    console.log(`   Magic Token: ${magicToken.substring(0, 20)}...`);
    console.log(`   Expires in: ${magicLinkResponse.data.expiresIn} seconds`);
    
    // Step 2: Verify magic link
    console.log('\n2️⃣ Testing /api/auth/verify-magic-link...');
    const verifyResponse = await makeRequest(`${API_BASE}/api/auth/verify-magic-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ magicToken })
    });
    
    console.log('Response status:', verifyResponse.status);
    console.log('Response data:', JSON.stringify(verifyResponse.data, null, 2));
    
    if (verifyResponse.status !== 200 || !verifyResponse.data.token) {
      throw new Error(`Magic link verification failed: ${JSON.stringify(verifyResponse)}`);
    }
    
    const sessionToken = verifyResponse.data.token;
    console.log('✅ Magic link verification successful');
    console.log(`   Session Token: ${sessionToken.substring(0, 20)}...`);
    console.log(`   User: ${verifyResponse.data.user.name} (${verifyResponse.data.user.email})`);
    
    // Step 3: Test session with /api/auth/me
    console.log('\n3️⃣ Testing /api/auth/me with session token...');
    const meResponse = await makeRequest(`${API_BASE}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionToken}`,
      }
    });
    
    if (meResponse.status !== 200) {
      throw new Error(`/api/auth/me failed: ${JSON.stringify(meResponse)}`);
    }
    
    console.log('✅ /api/auth/me successful');
    console.log(`   User: ${meResponse.data.data.name} (${meResponse.data.data.email})`);
    
    console.log('\n🎉 Magic link authentication test passed!');
    
  } catch (error) {
    console.error('\n❌ Magic link test failed:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run the test
testMagicLink();
