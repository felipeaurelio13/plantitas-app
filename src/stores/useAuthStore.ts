import { create } from 'zustand';
import { produce } from 'immer';
import { auth, db, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, collection, doc, getDoc, setDoc } from '../lib/firebase';

interface AuthState {
  user: CurrentUser | null;
  initialized: boolean;
  isInitialized: boolean; // Alias for backward compatibility
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, confirmPassword?: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => void;
  clearError: () => void;
  // Legacy properties for backward compatibility
  session?: any;
  profile?: CurrentUser;
}

interface CurrentUser {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  preferences: Record<string, any>;
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  initialized: false,
  get isInitialized() {
    return this.initialized;
  },
  isLoading: false,
  error: null,
  session: null,
  get profile() {
    return this.user;
  },

  initialize: () => {
    onAuthStateChanged(auth, async (firebaseUser: any | null) => {
      try {
        if (firebaseUser) {
          // User signed in or reloaded
          console.log('[AUTH STORE] Firebase user detected:', firebaseUser.uid);
          const profilesCollection = collection(db, 'profiles');
          const profileDocRef = doc(profilesCollection, firebaseUser.uid);
          const profileDoc = await getDoc(profileDocRef);

          if (profileDoc.exists()) {
            const profileData = profileDoc.data();
            set(produce((state) => {
              state.user = { id: firebaseUser.uid, ...profileData } as CurrentUser;
              state.initialized = true;
              state.error = null;
              state.isLoading = false;
              state.session = firebaseUser;
            }));
          } else {
            // Create a new profile if it doesn't exist (e.g., first login with email/password)
            const newUserProfile: CurrentUser = {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              fullName: null,
              avatarUrl: null,
              preferences: {},
            };
            await setDoc(profileDocRef, newUserProfile);
            set(produce((state) => {
              state.user = newUserProfile;
              state.initialized = true;
              state.error = null;
              state.isLoading = false;
              state.session = firebaseUser;
            }));
          }
        } else {
          // User signed out
          set(produce((state) => {
            state.user = null;
            state.initialized = true;
            state.error = null;
            state.isLoading = false;
            state.session = null;
          }));
        }
      } catch (error) {
        console.error('[AUTH STORE] Error in auth state change:', error);
        set(produce((state) => {
          state.error = error instanceof Error ? error.message : 'Authentication error';
          state.initialized = true;
          state.isLoading = false;
        }));
      }
    });
  },

  signIn: async (email, password) => {
    try {
      set(produce((state) => { 
        state.isLoading = true; 
        state.error = null; 
      }));

      console.log('[AUTH STORE] Attempting sign in with email:', email);
      await signInWithEmailAndPassword(auth, email, password);
      set(produce((state) => { 
        state.error = null; 
        state.isLoading = false; 
      }));
      // The onAuthStateChanged listener will update the user state
    } catch (err: any) {
      console.error('[AUTH STORE] Sign in error:', err);
      set(produce((state) => { 
        state.error = err.message || 'Failed to sign in.'; 
        state.isLoading = false; 
      }));
      throw err; // Re-throw to allow component to handle
    }
  },

  signUp: async (email, password, confirmPassword, fullName) => {
    try {
      set(produce((state) => { 
        state.isLoading = true; 
        state.error = null; 
      }));

      if (confirmPassword && password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      if (firebaseUser) {
        const newUserProfile: CurrentUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          fullName: fullName || null,
          avatarUrl: null,
          preferences: {},
        };
        const profilesCollection = collection(db, 'profiles');
        const profileDocRef = doc(profilesCollection, firebaseUser.uid);
        await setDoc(profileDocRef, newUserProfile);
        
        set(produce((state) => { 
          state.error = null; 
          state.isLoading = false; 
        }));
        // The onAuthStateChanged listener will update the user state
      } else {
        throw new Error('User not created during sign up.');
      }
    } catch (err: any) {
      console.error('[AUTH STORE] Sign up error:', err);
      set(produce((state) => { 
        state.error = err.message || 'Failed to sign up.'; 
        state.isLoading = false; 
      }));
      throw err; // Re-throw to allow component to handle
    }
  },

  signOut: async () => {
    try {
      set(produce((state) => { 
        state.isLoading = true; 
        state.error = null; 
      }));

      await signOut(auth);
      set(produce((state) => { 
        state.error = null; 
        state.isLoading = false; 
      }));
      // The onAuthStateChanged listener will update the user state
    } catch (err: any) {
      console.error('[AUTH STORE] Sign out error:', err);
      set(produce((state) => { 
        state.error = err.message || 'Failed to sign out.'; 
        state.isLoading = false; 
      }));
      throw err; // Re-throw to allow component to handle
    }
  },

  clearError: () => {
    set(produce((state) => { state.error = null; }));
  },
}));

export default useAuthStore; 