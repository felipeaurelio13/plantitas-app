// Debug script to test plant creation
import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugPlantCreation() {
  console.log('🔍 Starting plant creation debug...\n');
  
  // 1. Check environment variables
  console.log('1. Environment Variables:');
  console.log('   SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('   SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
  console.log('');
  
  // 2. Check connection to Supabase
  console.log('2. Testing Supabase Connection:');
  try {
    const { data, error } = await supabase.from('plants').select('count').limit(1);
    if (error) {
      console.log('   ❌ Connection failed:', error.message);
    } else {
      console.log('   ✅ Connected to Supabase');
    }
  } catch (err) {
    console.log('   ❌ Connection error:', err.message);
  }
  console.log('');
  
  // 3. Check authentication status
  console.log('3. Authentication Status:');
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.log('   ❌ Session error:', error.message);
    } else if (session) {
      console.log('   ✅ User is authenticated');
      console.log('   User ID:', session.user.id);
      console.log('   Email:', session.user.email);
    } else {
      console.log('   ❌ User is not authenticated');
      console.log('   👉 You need to log in to create plants');
    }
  } catch (err) {
    console.log('   ❌ Auth check error:', err.message);
  }
  console.log('');
  
  // 4. Test Edge Function availability (if authenticated)
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    console.log('4. Testing Edge Functions:');
    try {
      // Test with a minimal payload
      const { data, error } = await supabase.functions.invoke('analyze-image', {
        body: { test: true },
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });
      
      if (error) {
        if (error.message.includes('404') || error.message.includes('not found')) {
          console.log('   ❌ analyze-image function not found');
          console.log('   👉 Make sure Supabase Edge Functions are deployed');
        } else {
          console.log('   ⚠️  Function exists but test failed:', error.message);
          console.log('   👉 This is expected with test payload');
        }
      } else {
        console.log('   ✅ analyze-image function is available');
      }
    } catch (err) {
      console.log('   ❌ Function test error:', err.message);
    }
  } else {
    console.log('4. Skipping Edge Function test (not authenticated)');
  }
  
  console.log('\n🎯 Next Steps:');
  if (!supabaseUrl || supabaseUrl === 'your-supabase-url') {
    console.log('   1. Set up your .env file with VITE_SUPABASE_URL');
  }
  if (!supabaseAnonKey || supabaseAnonKey === 'your-supabase-anon-key') {
    console.log('   2. Set up your .env file with VITE_SUPABASE_ANON_KEY');
  }
  if (!session) {
    console.log('   3. Log in to your application before trying to create plants');
  }
}

debugPlantCreation().catch(console.error); 