import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Tables } from '../lib/database.types';

type Profile = Tables<'profiles'>;

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
}

interface AuthActions {
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  fetchProfile: (userId: string) => Promise<void>;
  initialize: () => Promise<void>;
}

type AuthStore = AuthState & AuthActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  profile: null,
  session: null,
  loading: true,
  initialized: false,

  // Actions
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),
  setInitialized: (initialized) => set({ initialized }),

  signUp: async (email: string, password: string, fullName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;
  },

  signIn: async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  updateProfile: async (updates: Partial<Profile>) => {
    const { user } = get();
    if (!user) throw new Error('No user logged in');

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;

    // Refresh profile
    await get().fetchProfile(user.id);
  },

  fetchProfile: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile:', error);
        return;
      }

      set({ profile: data });
    } catch (error) {
      console.error('Error fetching profile:', error);
    }
  },

  initialize: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        return;
      }

      set({
        session,
        user: session?.user ?? null,
        loading: false,
        initialized: true,
      });

      // Fetch profile if user exists
      if (session?.user) {
        await get().fetchProfile(session.user.id);
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({
        loading: false,
        initialized: true,
      });
    }
  },
}));

// Auto-initialize auth and set up auth listener
let authListenerInitialized = false;

export const initializeAuth = () => {
  if (authListenerInitialized) return;
  authListenerInitialized = true;

  // Initialize auth state
  useAuthStore.getState().initialize();

  // Listen for auth changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    console.log('Auth state changed:', event, session?.user?.id);
    
    const { setSession, setUser, setLoading, setInitialized, fetchProfile, initialized } = useAuthStore.getState();
    
    setSession(session);
    setUser(session?.user ?? null);
    
    // Only set loading to false if we haven't initialized yet
    if (!initialized) {
      setLoading(false);
      setInitialized(true);
    }

    // Fetch profile for new user or clear profile for signed out user
    if (session?.user) {
      await fetchProfile(session.user.id);
    } else {
      useAuthStore.setState({ profile: null });
    }
  });
}; 