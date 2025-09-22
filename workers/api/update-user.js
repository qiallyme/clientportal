#!/usr/bin/env node

/**
 * Update existing admin user to use Chris's email
 */

import https from 'https';

const API_BASE = 'https://client-portal.qilife.workers.dev';

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

async function updateUser() {
  console.log('🔧 Updating admin user email...\n');
  
  try {
    // First, let's test the dev-login with the old email to get a token
    console.log('1️⃣ Getting token with old admin email...');
    const loginResponse = await makeRequest(`${API_BASE}/api/auth/dev-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'admin@example.com' })
    });
    
    if (loginResponse.status !== 200) {
      throw new Error(`Failed to get token: ${JSON.stringify(loginResponse)}`);
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Got token successfully');
    
    // Now let's try to update the profile (this might not work if the endpoint doesn't exist)
    console.log('\n2️⃣ Attempting to update user profile...');
    const updateResponse = await makeRequest(`${API_BASE}/api/auth/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Chris Rice',
        email: 'crice4485@gmail.com'
      })
    });
    
    console.log('Update response status:', updateResponse.status);
    console.log('Update response data:', JSON.stringify(updateResponse.data, null, 2));
    
    if (updateResponse.status === 200) {
      console.log('✅ User profile updated successfully!');
    } else {
      console.log('ℹ️  Profile update not available, but we can still use the existing user');
    }
    
    // Test login with the new email
    console.log('\n3️⃣ Testing login with new email...');
    const newLoginResponse = await makeRequest(`${API_BASE}/api/auth/dev-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: 'crice4485@gmail.com' })
    });
    
    if (newLoginResponse.status === 200) {
      console.log('✅ Login with new email works!');
      console.log(`   User: ${newLoginResponse.data.user.name} (${newLoginResponse.data.user.email})`);
    } else {
      console.log('ℹ️  New email login failed, but old email still works');
      console.log('   You can use admin@example.com for now');
    }
    
  } catch (error) {
    console.error('\n❌ Update failed:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run the script
updateUser();
