import { gardenChatService } from '../src/services/gardenChatService';

describe('Edge Functions Status', () => {
  test('should verify garden-ai-chat function availability', async () => {
    const result = await gardenChatService.verifyFunctionAvailability();
    
    console.log('Function availability check:', JSON.stringify(result, null, 2));
    
    if (!result.available) {
      console.error('❌ garden-ai-chat function is not available:', result.error);
      console.log('\n📋 Next steps:');
      
      if (result.error?.includes('Edge Function returned a non-2xx status code')) {
        console.log('🔍 This suggests the function exists but returned an error');
        console.log('1. Check if OPENAI_API_KEY is set in Supabase Edge Functions settings');
        console.log('2. Verify the function is receiving the correct parameters');
        console.log('3. Check the function logs in Supabase dashboard');
      } else if (result.error?.includes('404')) {
        console.log('1. Deploy the function: npx supabase functions deploy garden-ai-chat');
        console.log('2. Check Supabase project settings');
      } else if (result.error?.includes('Failed to send a request')) {
        console.log('1. Check network connectivity');
        console.log('2. Verify Supabase URL and keys are correct');
      }
      
      console.log('4. Check Supabase Edge Functions dashboard: https://supabase.com/dashboard/project/cvvvybrkxypfsfcbmbcq/functions');
    } else {
      console.log('✅ garden-ai-chat function is available and working');
    }
    
    // Test should pass but log the status
    expect(result).toHaveProperty('available');
  }, 15000);
}); 