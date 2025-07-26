import { create } from 'zustand';
import { produce } from 'immer';
import { auth, db, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, doc, getDoc, setDoc } from '../lib/firebase'; // Import auth, db, and specific auth functions

interface AuthState {
  user: CurrentUser | null;
  initialized: boolean;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, confirmPassword?: string, fullName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => void;
  clearError: () => void;
}

interface CurrentUser {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  preferences: Record<string, any>;
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  initialized: false,
  isLoading: false,
  error: null,

  initialize: () => {
    onAuthStateChanged(auth, async (firebaseUser: any | null) => {
      try {
        if (firebaseUser) {
          // User signed in or reloaded
          console.log('[AUTH STORE] User authenticated:', firebaseUser.uid);
          
          // Use modern Firestore v9+ API
          const profileDocRef = doc(db, 'profiles', firebaseUser.uid);
          const profileDoc = await getDoc(profileDocRef);

          if (profileDoc.exists()) {
            const userData = profileDoc.data();
            set(produce((state) => {
              state.user = { id: firebaseUser.uid, ...userData } as CurrentUser;
              state.initialized = true;
              state.error = null;
              state.isLoading = false;
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
            }));
          }
        } else {
          // User signed out
          set(produce((state) => {
            state.user = null;
            state.initialized = true;
            state.error = null;
            state.isLoading = false;
          }));
        }
      } catch (error) {
        console.error('[AUTH STORE] Error in auth state change:', error);
        set(produce((state) => {
          state.error = error instanceof Error ? error.message : 'Error de autenticación';
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
      
      // No need to set isLoading false here, onAuthStateChanged will handle it
      // The onAuthStateChanged listener will update the user state
    } catch (err: any) {
      console.error('[AUTH STORE] Sign in error:', err);
      set(produce((state) => { 
        state.error = err.message || 'Error al iniciar sesión'; 
        state.isLoading = false;
      }));
      throw err; // Re-throw to allow component to handle
    }
  },

  signUp: async (email, password, confirmPassword?, fullName?) => {
    try {
      set(produce((state) => { 
        state.isLoading = true; 
        state.error = null; 
      }));

      // Validate passwords match if confirmPassword is provided
      if (confirmPassword && password !== confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
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
        
        // Use modern Firestore v9+ API
        const profileDocRef = doc(db, 'profiles', firebaseUser.uid);
        await setDoc(profileDocRef, newUserProfile);
        
        // No need to set isLoading false here, onAuthStateChanged will handle it
        // The onAuthStateChanged listener will update the user state
      } else {
        throw new Error('Error al crear el usuario');
      }
    } catch (err: any) {
      console.error('[AUTH STORE] Sign up error:', err);
      set(produce((state) => { 
        state.error = err.message || 'Error al crear la cuenta'; 
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
      
      // No need to set isLoading false here, onAuthStateChanged will handle it
      // The onAuthStateChanged listener will update the user state
    } catch (err: any) {
      console.error('[AUTH STORE] Sign out error:', err);
      set(produce((state) => { 
        state.error = err.message || 'Error al cerrar sesión'; 
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