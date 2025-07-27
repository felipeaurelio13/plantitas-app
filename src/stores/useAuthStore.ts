import { create } from 'zustand';
import { produce } from 'immer';
import { 
  auth, 
  db, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  signInWithPopup,
  googleProvider,
  doc,
  getDoc,
  setDoc,
  FirebaseUser
} from '../lib/firebase';

interface AuthState {
  user: CurrentUser | null;
  initialized: boolean;
  isInitialized: boolean; // Alias for compatibility
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, confirmPassword?: string, fullName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => void;
  clearError: () => void;
  updateProfile: (updates: Partial<CurrentUser>) => Promise<void>;
}

interface CurrentUser {
  id: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  preferences: Record<string, any>;
  createdAt?: any;
  updatedAt?: any;
}

const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  initialized: false,
  get isInitialized() {
    return get().initialized;
  },
  isLoading: false,
  error: null,

  initialize: () => {
    console.log('🔐 [AUTH] Starting auth initialization...');
    
    if (!auth) {
      console.error('❌ [AUTH] Firebase auth not initialized');
      set(produce((state) => {
        state.initialized = true;
        state.error = 'Firebase not configured';
      }));
      return;
    }

    console.log('✅ [AUTH] Firebase auth available, setting up listener...');

    onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('🔐 [AUTH] Auth state changed:', {
        hasUser: !!firebaseUser,
        uid: firebaseUser?.uid,
        email: firebaseUser?.email,
        emailVerified: firebaseUser?.emailVerified
      });

      set(produce((state) => {
        state.isLoading = true;
      }));

      try {
        if (firebaseUser) {
          // User signed in or reloaded
          console.log('✅ [AUTH] User authenticated:', firebaseUser.uid);
          
          if (!db) {
            throw new Error('Firestore not initialized');
          }

          console.log('🔥 [AUTH] Fetching user profile from Firestore...');
          const profileDocRef = doc(db, 'profiles', firebaseUser.uid);
          const profileDoc = await getDoc(profileDocRef);

          if (profileDoc.exists()) {
            const profileData = profileDoc.data();
            console.log('✅ [AUTH] User profile found in Firestore');
            set(produce((state) => {
              state.user = { 
                id: firebaseUser.uid, 
                ...profileData 
              } as CurrentUser;
              state.initialized = true;
              state.isLoading = false;
              state.error = null;
            }));
          } else {
            // Create a new profile if it doesn't exist
            console.log('🔄 [AUTH] Creating new user profile in Firestore...');
            const newUserProfile: CurrentUser = {
              id: firebaseUser.uid,
              email: firebaseUser.email,
              fullName: firebaseUser.displayName || null,
              avatarUrl: firebaseUser.photoURL || null,
              preferences: {},
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };
            
            await setDoc(profileDocRef, newUserProfile);
            console.log('✅ [AUTH] New user profile created');
            
            set(produce((state) => {
              state.user = newUserProfile;
              state.initialized = true;
              state.isLoading = false;
              state.error = null;
            }));
          }
        } else {
          // User signed out
          console.log('🔐 [AUTH] User signed out');
          set(produce((state) => {
            state.user = null;
            state.initialized = true;
            state.isLoading = false;
            state.error = null;
          }));
        }
      } catch (error) {
        console.error('❌ [AUTH] Error in auth state change:', error);
        console.error('❌ [AUTH] Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          isFirebaseError: error?.constructor?.name?.includes('Firebase')
        });
        set(produce((state) => {
          state.error = error instanceof Error ? error.message : 'Authentication error';
          state.initialized = true;
          state.isLoading = false;
        }));
      }
    });
  },

  signIn: async (email, password) => {
    console.log('🔐 [AUTH] Sign in attempt started', { email });
    
    if (!auth) {
      console.error('❌ [AUTH] Firebase auth not initialized for signIn');
      throw new Error('Firebase auth not initialized');
    }

    console.log('✅ [AUTH] Firebase auth available for signIn');

    set(produce((state) => { 
      state.isLoading = true; 
      state.error = null; 
    }));

    try {
      console.log('🔐 [AUTH] Calling signInWithEmailAndPassword...');
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ [AUTH] Sign in successful:', {
        uid: result.user?.uid,
        email: result.user?.email,
        emailVerified: result.user?.emailVerified
      });
      // The onAuthStateChanged listener will update the user state
    } catch (err: any) {
      console.error('❌ [AUTH] Sign in error:', err);
      console.error('❌ [AUTH] Sign in error details:', {
        code: err.code,
        message: err.message,
        name: err.name,
        customData: err.customData
      });
      set(produce((state) => { 
        state.error = err.message || 'Failed to sign in.';
        state.isLoading = false;
      }));
      throw err;
    }
  },

  signUp: async (email, password, confirmPassword, fullName) => {
    if (!auth || !db) {
      throw new Error('Firebase not initialized');
    }

    if (confirmPassword && password !== confirmPassword) {
      throw new Error('Passwords do not match');
    }

    set(produce((state) => { 
      state.isLoading = true; 
      state.error = null; 
    }));

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      if (firebaseUser) {
        const newUserProfile: CurrentUser = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          fullName: fullName || null,
          avatarUrl: null,
          preferences: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        const profileDocRef = doc(db, 'profiles', firebaseUser.uid);
        await setDoc(profileDocRef, newUserProfile);
        
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
      throw err;
    }
  },

  signInWithGoogle: async () => {
    if (!auth) {
      throw new Error('Firebase auth not initialized');
    }

    set(produce((state) => { 
      state.isLoading = true; 
      state.error = null; 
    }));

    try {
      await signInWithPopup(auth, googleProvider);
      // The onAuthStateChanged listener will update the user state
    } catch (err: any) {
      console.error('[AUTH STORE] Google sign in error:', err);
      set(produce((state) => { 
        state.error = err.message || 'Failed to sign in with Google.';
        state.isLoading = false;
      }));
      throw err;
    }
  },

  signOut: async () => {
    if (!auth) {
      throw new Error('Firebase auth not initialized');
    }

    try {
      await signOut(auth);
      // The onAuthStateChanged listener will update the user state
    } catch (err: any) {
      console.error('[AUTH STORE] Sign out error:', err);
      set(produce((state) => { 
        state.error = err.message || 'Failed to sign out.'; 
      }));
      throw err;
    }
  },

  updateProfile: async (updates: Partial<CurrentUser>) => {
    const { user } = get();
    if (!user || !db) {
      throw new Error('User not authenticated or Firebase not initialized');
    }

    try {
      const profileDocRef = doc(db, 'profiles', user.id);
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      
      await setDoc(profileDocRef, updatedData, { merge: true });
      
      set(produce((state) => {
        if (state.user) {
          Object.assign(state.user, updatedData);
        }
      }));
    } catch (err: any) {
      console.error('[AUTH STORE] Update profile error:', err);
      set(produce((state) => { 
        state.error = err.message || 'Failed to update profile.'; 
      }));
      throw err;
    }
  },

  clearError: () => {
    set(produce((state) => { state.error = null; }));
  },
}));

export default useAuthStore; 