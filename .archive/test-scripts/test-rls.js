// Test RLS policies after migration
// Run with: node test-rls.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function testRLS() {
  console.log('🔍 Testing RLS Policies...\n');

  // Test 1: Service role can read everything
  console.log('1. Testing service role access...');
  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    const { data: orgs, error: orgError } = await serviceClient
      .from('organizations')
      .select('*');
    
    const { data: users, error: userError } = await serviceClient
      .from('users')
      .select('*');
    
    console.log(`   ✅ Service role: ${orgs?.length || 0} orgs, ${users?.length || 0} users`);
  } catch (error) {
    console.log(`   ❌ Service role error:`, error.message);
  }

  // Test 2: Anon key should be restricted
  console.log('\n2. Testing anon key restrictions...');
  const anonClient = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    const { data: orgs, error: orgError } = await anonClient
      .from('organizations')
      .select('*');
    
    const { data: users, error: userError } = await anonClient
      .from('users')
      .select('*');
    
    if (orgError || userError) {
      console.log(`   ✅ Anon key properly restricted: ${orgError?.message || userError?.message}`);
    } else {
      console.log(`   ⚠️  Anon key can read data - RLS may not be working properly`);
    }
  } catch (error) {
    console.log(`   ✅ Anon key properly restricted: ${error.message}`);
  }

  // Test 3: Check admin user exists
  console.log('\n3. Checking admin user setup...');
  try {
    const { data: adminUser, error } = await serviceClient
      .from('users')
      .select(`
        id,
        name,
        email,
        role,
        org_id,
        organizations!inner(name)
      `)
      .eq('email', 'admin@example.com')
      .single();
    
    if (adminUser) {
      console.log(`   ✅ Admin user found:`);
      console.log(`      Name: ${adminUser.name}`);
      console.log(`      Email: ${adminUser.email}`);
      console.log(`      Role: ${adminUser.role}`);
      console.log(`      Org: ${adminUser.organizations.name}`);
      console.log(`      Org ID: ${adminUser.org_id}`);
    } else {
      console.log(`   ❌ Admin user not found: ${error?.message}`);
    }
  } catch (error) {
    console.log(`   ❌ Error checking admin user: ${error.message}`);
  }

  console.log('\n🎉 RLS test complete!');
}

testRLS().catch(console.error);
