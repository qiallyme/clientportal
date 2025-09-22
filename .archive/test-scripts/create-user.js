#!/usr/bin/env node

/**
 * Create user in Supabase database
 * This is a temporary script to create the admin user
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

async function createUser() {
  console.log('🔧 Creating admin user...\n');
  
  try {
    // Use the register endpoint to create the user
    const registerResponse = await makeRequest(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'Chris Rice',
        email: 'crice4485@gmail.com',
        password: 'password123',
        role: 'admin',
        region: 'global'
      })
    });
    
    console.log('Response status:', registerResponse.status);
    console.log('Response data:', JSON.stringify(registerResponse.data, null, 2));
    
    if (registerResponse.status === 201 || registerResponse.status === 200) {
      console.log('✅ User created successfully!');
      console.log(`   User: ${registerResponse.data.user.name} (${registerResponse.data.user.email})`);
      console.log(`   Role: ${registerResponse.data.user.role}`);
    } else if (registerResponse.status === 400 && registerResponse.data.error?.includes('already exists')) {
      console.log('ℹ️  User already exists');
    } else {
      throw new Error(`User creation failed: ${JSON.stringify(registerResponse)}`);
    }
    
  } catch (error) {
    console.error('\n❌ User creation failed:');
    console.error(error.message);
    process.exit(1);
  }
}

// Run the script
createUser();
