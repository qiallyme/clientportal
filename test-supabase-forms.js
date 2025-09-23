// Test script to create a form in Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vwqkhjnkummwtvfxgqml.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3cWtoam5rdW1td3R2ZnhncW1sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwMDMwNDksImV4cCI6MjA3MTU3OTA0OX0.Q1_W-sq8iKVPfJ2HfTS2hGNmK5jjzsy50cHszhB_6VQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseForms() {
  console.log('Testing Supabase forms connection...');
  
  try {
    // First, let's check if we can read the forms table
    console.log('1. Testing read access to forms table...');
    const { data: forms, error: readError } = await supabase
      .from('forms')
      .select('*');
    
    if (readError) {
      console.error('Read error:', readError);
    } else {
      console.log('Forms found:', forms);
    }
    
    // Check if organizations table exists
    console.log('2. Testing organizations table...');
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('*');
    
    if (orgError) {
      console.error('Organizations error:', orgError);
    } else {
      console.log('Organizations found:', orgs);
    }
    
    // Check if users table exists
    console.log('3. Testing users table...');
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*');
    
    if (userError) {
      console.error('Users error:', userError);
    } else {
      console.log('Users found:', users);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSupabaseForms();
