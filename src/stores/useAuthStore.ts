import { create } from 'zustand';
import { produce } from 'immer';
import { auth, db, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from '../lib/firebase'; // Import auth, db, and specific auth functions

interface AuthState {
  user: CurrentUser | null;
  initialized: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
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
  error: null,

  initialize: () => {
    onAuthStateChanged(auth, async (firebaseUser: any | null) => {
      if (firebaseUser) {
        // User signed in or reloaded
        const profileDocRef = db.collection('profiles').doc(firebaseUser.uid);
        const profileDoc = await profileDocRef.get();

        if (profileDoc.exists) {
          set(produce((state) => {
            state.user = { id: firebaseUser.uid, ...profileDoc.data() } as CurrentUser;
            state.initialized = true;
            state.error = null;
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
          await profileDocRef.set(newUserProfile);
          set(produce((state) => {
            state.user = newUserProfile;
            state.initialized = true;
            state.error = null;
          }));
        }
      } else {
        // User signed out
        set(produce((state) => {
          state.user = null;
          state.initialized = true;
          state.error = null;
        }));
      }
    });
  },

  signIn: async (email, password) => {
    try {
      console.log('Attempting sign in with auth object:', auth);
      console.log('Type of signInWithEmailAndPassword:', typeof signInWithEmailAndPassword);
      console.log('Value of signInWithEmailAndPassword:', signInWithEmailAndPassword);
      await signInWithEmailAndPassword(auth, email, password);
      set(produce((state) => { state.error = null; })); // Clear error on successful sign in
      // The onAuthStateChanged listener will update the user state
    } catch (err: any) {
      set(produce((state) => { state.error = err.message || 'Failed to sign in.'; }));
      throw err; // Re-throw to allow component to handle
    }
  },

  signUp: async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      if (firebaseUser) {
        const newUserProfile: CurrentUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          fullName: null,
          avatarUrl: null,
          preferences: {},
        };
        await db.collection('profiles').doc(firebaseUser.uid).set(newUserProfile);
        set(produce((state) => { state.error = null; })); // Clear error on successful sign up
        // The onAuthStateChanged listener will update the user state
      } else {
        throw new Error('User not created during sign up.');
      }
    } catch (err: any) {
      set(produce((state) => { state.error = err.message || 'Failed to sign up.'; }));
      throw err; // Re-throw to allow component to handle
    }
  },

  signOut: async () => {
    try {
      await signOut(auth);
      set(produce((state) => { state.error = null; })); // Clear error on successful sign out
      // The onAuthStateChanged listener will update the user state
    } catch (err: any) {
      set(produce((state) => { state.error = err.message || 'Failed to sign out.'; }));
      throw err; // Re-throw to allow component to handle
    }
  },

  clearError: () => {
    set(produce((state) => { state.error = null; }));
  },
}));

export default useAuthStore; 