import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Verificar si las variables de entorno están configuradas correctamente
const isValidSupabaseConfig = () => {
  return supabaseUrl && 
         supabaseAnonKey && 
         supabaseUrl.includes('supabase.co') &&
         supabaseAnonKey.length > 50; // JWT tokens son largos
};

// Para desarrollo: usar configuración mock si no hay credenciales válidas
const shouldUseMockAuth = !isValidSupabaseConfig();

if (shouldUseMockAuth) {
  console.warn('🚨 [DEVELOPMENT] Using mock auth - configure real Supabase credentials in .env');
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'plantitas-app'
    }
  },
  // Add timeout to prevent infinite hanging
  realtime: {
    timeout: 10000
  }
});

// Helper to check if user is authenticated
export const getCurrentUser = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  } catch (error) {
    console.warn('Error getting current user:', error);
    return null;
  }
};

// Helper to sign out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Export helper to check if we're using mock auth
export { shouldUseMockAuth }; 