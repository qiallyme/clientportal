// Script to apply database migration
// Run this with: node apply-migration.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyMigration() {
  console.log('🚀 Applying database migration...');
  
  try {
    // Read the migration file
    const fs = require('fs');
    const migrationSQL = fs.readFileSync('./migrations/001_update_schema_with_org_rls.sql', 'utf8');
    
    console.log('📝 Migration SQL loaded, length:', migrationSQL.length);
    console.log('⚠️  Please apply this migration manually in the Supabase SQL Editor:');
    console.log('   1. Go to your Supabase dashboard');
    console.log('   2. Navigate to SQL Editor');
    console.log('   3. Copy and paste the contents of migrations/001_update_schema_with_org_rls.sql');
    console.log('   4. Execute the migration');
    console.log('');
    console.log('📋 Migration contents:');
    console.log('─'.repeat(50));
    console.log(migrationSQL);
    console.log('─'.repeat(50));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

applyMigration();
