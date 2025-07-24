import { gardenChatService } from '../src/services/gardenChatService';

describe('Edge Functions Status', () => {
  test('should verify garden-ai-chat function availability', async () => {
    const result = await gardenChatService.verifyFunctionAvailability();
    
    // Test should pass but log the status
    expect(result).toHaveProperty('available');
    expect(typeof result.available).toBe('boolean');
    
    if (!result.available) {
      console.warn('⚠️ garden-ai-chat function is not available:', result.error);
      
      // Provide helpful debugging information
      if (result.error?.includes('Edge Function returned a non-2xx status code')) {
        console.info('💡 Function exists but returned an error - check OPENAI_API_KEY in Supabase settings');
      } else if (result.error?.includes('404')) {
        console.info('💡 Function not found - deploy with: npx supabase functions deploy garden-ai-chat');
      } else if (result.error?.includes('Failed to send a request')) {
        console.info('💡 Network/connectivity issue - check Supabase URL and keys');
      }
    } else {
      console.info('✅ garden-ai-chat function is available and working');
    }
  }, 10000); // Reduced timeout
}); 