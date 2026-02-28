/**
 * Seed Test Users Only
 * Creates test users in Supabase Auth
 */

const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseKey) {
  console.error('Error: SUPABASE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Test users
const TEST_USERS = [
  { email: 'john.doe@example.com', password: 'Password123!' },
  { email: 'jane.smith@example.com', password: 'Password123!' },
  { email: 'demo@demo.com', password: 'DemoPassword123!' }
];

async function createTestUsers() {
  console.log('Creating test users...\n');
  
  for (const user of TEST_USERS) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: user.email,
        password: user.password
      });
      
      if (error) {
        if (error.message.includes('already registered')) {
          console.log(` ${user.email} - already exists`);
        } else if (error.message.includes('rate limit')) {
          console.log(` ${user.email} - rate limited (try again later)`);
        } else {
          console.log(` ${user.email} - ${error.message}`);
        }
      } else {
        console.log(` ${user.email} - created!`);
        console.log(`  User ID: ${data.user?.id}`);
      }
    } catch (err) {
      console.error(` ${user.email} - ${err.message}`);
    }
    
    // Small delay between requests
    await new Promise(r => setTimeout(r, 500));
  }
  
  console.log('\nTest Credentials:');
  TEST_USERS.forEach(u => console.log(`   ${u.email} / ${u.password}`));
  
  console.log('\nNote: If emails require verification, go to Supabase Dashboard');
  console.log('   Authentication → Users → Click "Invite" to manually add users');
}

createTestUsers()
  .then(() => console.log('\nDone!'))
  .catch(console.error);
