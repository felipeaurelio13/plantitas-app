import { create } from 'zustand';
import { supabase, shouldUseMockAuth } from '../lib/supabase';
import { gardenCacheService } from '../services/gardenCacheService';
import { User } from '@supabase/supabase-js';
import { SignInSchema, SignUpSchema } from '../schemas';
import { z } from 'zod';

type Profile = any; // Placeholder
type SignInCredentials = z.infer<typeof SignInSchema>;
type SignUpCredentials = z.infer<typeof SignUpSchema>;

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: any | null; // Use 'any' for now to avoid module issues
  isLoading: boolean;
  error: string | null;
  isInitialized: boolean;
  isDevelopmentMode: boolean;
}

interface AuthActions {
  initialize: () => Promise<void>; // Now returns a Promise
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signUp: (credentials: SignUpCredentials) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

type AuthStore = AuthState & AuthActions;

// The subscription is now managed internally in the store
let authListener: { subscription: { unsubscribe: () => void } } | null = null;

// Mock user for development mode
const createMockUser = (email: string): User => ({
  id: 'dev-user-123',
  email,
  email_confirmed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  app_metadata: {},
  user_metadata: { full_name: 'Usuario Demo' },
  aud: 'authenticated',
  role: 'authenticated'
});

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: false,
  error: null,
  isInitialized: false,
  isDevelopmentMode: shouldUseMockAuth,

  initialize: async () => {
    console.log('[AUTH] 🚀 Initialize started');
    console.log('[AUTH] Development mode:', shouldUseMockAuth);
    
    set({ isLoading: true });
    
    // Si estamos en modo desarrollo sin Supabase real
    if (shouldUseMockAuth) {
      console.log('[AUTH] Using development mode - no real Supabase connection');
      set({ 
        isInitialized: true, 
        isLoading: false,
        user: null,
        session: null,
        profile: null,
        error: null 
      });
      return;
    }
    
    // 1. Unsubscribe from any existing listener
    if (authListener?.subscription) {
      console.log('[AUTH] Unsubscribing existing listener');
      authListener.subscription.unsubscribe();
    }
    
    // 2. Check for an existing session with reduced timeout for mobile
    try {
      console.log('[AUTH] Getting session with timeout...');
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Session timeout after 5 seconds')), 5000)
      );
      
      const { data: { session }, error } = await Promise.race([
        sessionPromise, 
        timeoutPromise
      ]);
      
      console.log('[AUTH] Session result:', { hasSession: !!session, error: error?.message });
      
      if (error) {
        console.warn('[AUTH] Session error:', error.message);
        // Don't throw, allow app to continue without session
      }
      
      console.log('[AUTH] Setting session state...');
      set({ session, user: session?.user ?? null });

      if (session?.user) {
        try {
          const profilePromise = supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          const profileTimeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Profile timeout')), 3000)
          );
          
          const { data: profile, error: profileError } = await Promise.race([
            profilePromise,
            profileTimeoutPromise
          ]);
          
          if (profileError) {
            console.warn('Profile fetch error:', profileError.message);
          } else {
            set({ profile });
          }
        } catch (profileError: any) {
          console.warn('Profile fetch failed:', profileError.message);
          // Continue without profile
        }
      } else {
        set({ profile: null });
      }
    } catch (e: any) {
      console.warn('Auth initialization failed, continuing without session:', e.message);
      set({ 
        session: null, 
        user: null, 
        profile: null,
        error: null // Don't show error to user, just log it
      });
    } finally {
      console.log('[AUTH] ✅ Marking as initialized');
      set({ isInitialized: true, isLoading: false });
    }

    // 3. Set up the real-time listener for subsequent auth changes
    try {
      const { data } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('[AUTH] State change:', event, !!session);
          set({ session, user: session?.user ?? null, isLoading: false });

          if (event === 'SIGNED_OUT') {
            set({ profile: null });
            return;
          }

          if (session?.user) {
            try {
              const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();

              if (error) throw error;
              set({ profile });
            } catch (error) {
              console.error('Error fetching profile on auth change:', error);
              // Don't set a global error here, as it might be a transient issue
            }
          }
        }
      );
      
      authListener = data;
    } catch (error) {
      console.warn('[AUTH] Failed to set up auth listener:', error);
      // Continue without listener in development mode
    }
  },

  signIn: async (credentials) => {
    const { isDevelopmentMode } = get();
    set({ isLoading: true, error: null });
    
    try {
      const { email, password } = SignInSchema.parse(credentials);
      
      // Mock auth for development
      if (isDevelopmentMode) {
        console.log('[AUTH] Mock sign in for development');
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Simple validation for demo
        if (email && password.length >= 6) {
          const mockUser = createMockUser(email);
          const mockSession = {
            user: mockUser,
            access_token: 'mock-token',
            refresh_token: 'mock-refresh',
            expires_in: 3600,
            token_type: 'bearer'
          };
          
          set({ 
            user: mockUser, 
            session: mockSession,
            profile: { id: mockUser.id, full_name: 'Usuario Demo' }
          });
          
          // Forzar navegación en modo desarrollo
          console.log('[AUTH] Mock login successful - user authenticated');
          
          // Simular un pequeño delay para mejorar la UX
          await new Promise(resolve => setTimeout(resolve, 300));
          return;
        } else {
          throw new Error('Invalid login credentials');
        }
      }
      
      // Real Supabase auth
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // onAuthStateChange will handle the rest
    } catch (e: any) {
      const errorMessage = e.message.includes('Invalid login credentials') 
        ? 'Credenciales inválidas. Verifica tu email y contraseña.'
        : 'Error al iniciar sesión. Intenta de nuevo.';
      set({ error: errorMessage });
      console.error('[AUTH] Sign in error:', e);
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (credentials) => {
    const { isDevelopmentMode } = get();
    set({ isLoading: true, error: null });
    
    try {
      const { email, password, fullName } = SignUpSchema.parse(credentials);
      
      // Mock auth for development
      if (isDevelopmentMode) {
        console.log('[AUTH] Mock sign up for development');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockUser = createMockUser(email);
        const mockSession = {
          user: mockUser,
          access_token: 'mock-token',
          refresh_token: 'mock-refresh',
          expires_in: 3600,
          token_type: 'bearer'
        };
        
        set({ 
          user: mockUser, 
          session: mockSession,
          profile: { id: mockUser.id, full_name: fullName || 'Usuario Demo' }
        });
        return;
      }
      
      // Real Supabase auth
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      // onAuthStateChange will handle the rest
    } catch (e: any) {
      const errorMessage = e.message.includes('already registered')
        ? 'El usuario ya está registrado. Intenta iniciar sesión.'
        : 'Error al registrarse. Verifica los datos e intenta de nuevo.';
      set({ error: errorMessage });
      console.error('[AUTH] Sign up error:', e);
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    const { isDevelopmentMode } = get();
    set({ isLoading: true });
    
    // Clear garden cache before signing out
    gardenCacheService.clearAll();
    
    if (isDevelopmentMode) {
      console.log('[AUTH] Mock sign out for development');
      set({ session: null, user: null, profile: null, isLoading: false });
      return;
    }
    
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        set({ error: 'Error al cerrar sesión.', isLoading: false });
        return;
      }
    } catch (error) {
      console.error('Error signing out:', error);
      set({ error: 'Error al cerrar sesión.', isLoading: false });
      return;
    }
    
    // Clear state immediately for better UX
    set({ session: null, user: null, profile: null, isLoading: false });
  },

  clearError: () => set({ error: null }),
})); 