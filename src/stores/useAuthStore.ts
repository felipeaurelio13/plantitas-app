import { create } from 'zustand';
import { supabase } from '../lib/supabase';
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

export const useAuthStore = create<AuthStore>((set, _get) => ({
  user: null,
  profile: null,
  session: null,
  isLoading: false,
  error: null,
  isInitialized: false,

  initialize: async () => {
    // 1. Unsubscribe from any existing listener
    if (authListener?.subscription) {
      authListener.subscription.unsubscribe();
    }
    
    // 2. Check for an existing session on startup with timeout
    try {
      // Create timeout wrapper for mobile compatibility
      const sessionPromise = supabase.auth.getSession();
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Session timeout after 8 seconds')), 8000)
      );
      
      const { data: { session }, error } = await Promise.race([
        sessionPromise, 
        timeoutPromise
      ]);
      
      if (error) {
        console.warn('Session error:', error.message);
        // Don't throw, allow app to continue without session
      }
      
      set({ session, user: session?.user ?? null });

      if (session?.user) {
        try {
          const profilePromise = supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          const profileTimeoutPromise = new Promise<never>((_, reject) => 
            setTimeout(() => reject(new Error('Profile timeout')), 5000)
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
      // Progressive enhancement: allow app to load without auth
      set({ 
        session: null, 
        user: null, 
        profile: null,
        error: null // Don't show error to user, just log it
      });
    } finally {
      // 3. Mark as initialized AFTER the initial check is complete
      set({ isInitialized: true });
    }

    // 4. Set up the real-time listener for subsequent auth changes
    const { data } = supabase.auth.onAuthStateChange(
      async (event, session) => {
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
  },

  signIn: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const { email, password } = SignInSchema.parse(credentials);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      // onAuthStateChange will handle the rest
    } catch (e: any) {
      const errorMessage = e.message.includes('Invalid login credentials') 
        ? 'Credenciales inválidas.'
        : 'Error al iniciar sesión.';
      set({ error: errorMessage });
      console.error(e);
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  signUp: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const { email, password, fullName } = SignUpSchema.parse(credentials);
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) throw error;
      // onAuthStateChange will handle the rest
      // You might want to show a "Check your email" message
    } catch (e: any) {
      const errorMessage = e.message.includes('already registered')
        ? 'El usuario ya está registrado.'
        : 'Error al registrarse.';
      set({ error: errorMessage });
      console.error(e);
      throw e;
    } finally {
      set({ isLoading: false });
    }
  },

  signOut: async () => {
    set({ isLoading: true });
    
    // Clear garden cache before signing out
    gardenCacheService.clearAll();
    
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      set({ error: 'Error al cerrar sesión.', isLoading: false });
    }
    // onAuthStateChange will clear user, session, and profile
    // We manually clear state here for a faster UI response
    set({ session: null, user: null, profile: null, isLoading: false });
  },

  clearError: () => set({ error: null }),
})); 