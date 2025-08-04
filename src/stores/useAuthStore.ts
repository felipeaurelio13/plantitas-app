import { create } from 'zustand';
import { produce } from 'immer';
import { persist } from 'zustand/middleware';
import { getAuth, getFirestore, isFirebaseReady } from '../lib/firebase';
import { 
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

interface ConnectionState {
  isOnline: boolean;
  isConnectedToFirebase: boolean;
  lastConnectionCheck: Date | null;
  connectionError: string | null;
}

interface AuthState {
  user: CurrentUser | null;
  initialized: boolean;
  isInitialized: boolean;
  isLoading: boolean;
  isSigningIn: boolean;
  isSigningUp: boolean;
  isSigningOut: boolean;
  error: string | null;
  connection: ConnectionState;
  retryQueue: Array<() => Promise<void>>;
}

interface AuthActions {
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, confirmPassword?: string, fullName?: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => void;
  clearError: () => void;
  updateProfile: (updates: Partial<CurrentUser>) => Promise<void>;
  checkConnection: () => Promise<boolean>;
  retryFailedOperations: () => Promise<void>;
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

const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      initialized: false,
      get isInitialized() {
        return get().initialized;
      },
      isLoading: false,
      isSigningIn: false,
      isSigningUp: false,
      isSigningOut: false,
      error: null,
      connection: {
        isOnline: navigator.onLine,
        isConnectedToFirebase: false,
        lastConnectionCheck: null,
        connectionError: null
      },
      retryQueue: [],

      checkConnection: async () => {
        console.log('🔍 Checking Firebase connection...');
        
        set(produce((state) => {
          state.connection.lastConnectionCheck = new Date();
        }));

        try {
          if (!isFirebaseReady()) {
            throw new Error('Firebase not initialized');
          }

          const db = getFirestore();
          const testDoc = doc(db, '__connection_test__', 'test');
          await getDoc(testDoc);
          
          set(produce((state) => {
            state.connection.isConnectedToFirebase = true;
            state.connection.connectionError = null;
          }));
          
          console.log('✅ Firebase connection verified');
          return true;
        } catch (error) {
          console.error('❌ Firebase connection failed:', error);
          
          set(produce((state) => {
            state.connection.isConnectedToFirebase = false;
            state.connection.connectionError = error instanceof Error ? error.message : 'Connection failed';
          }));
          
          return false;
        }
      },

      retryFailedOperations: async () => {
        const { retryQueue } = get();
        if (retryQueue.length === 0) return;

        console.log(`🔄 Retrying ${retryQueue.length} failed operations...`);

        const isConnected = await get().checkConnection();
        if (!isConnected) {
          console.warn('⚠️ Still offline, operations remain queued');
          return;
        }

        set(produce((state) => {
          state.isLoading = true;
        }));

        const failedOperations: Array<() => Promise<void>> = [];

        for (const operation of retryQueue) {
          try {
            await operation();
            console.log('✅ Retry operation successful');
          } catch (error) {
            console.error('❌ Retry operation failed:', error);
            failedOperations.push(operation);
          }
        }

        set(produce((state) => {
          state.retryQueue = failedOperations;
          state.isLoading = false;
        }));
      },

      initialize: () => {
        console.log('🔐 [AUTH] Starting enhanced auth initialization...');
        
        // Check online status
        window.addEventListener('online', () => {
          console.log('🌐 Network connection restored');
          set(produce((state) => {
            state.connection.isOnline = true;
          }));
          get().checkConnection();
          get().retryFailedOperations();
        });

        window.addEventListener('offline', () => {
          console.log('🌐 Network connection lost');
          set(produce((state) => {
            state.connection.isOnline = false;
            state.connection.isConnectedToFirebase = false;
          }));
        });

        if (!isFirebaseReady()) {
          console.error('❌ [AUTH] Firebase not ready during initialization');
          set(produce((state) => {
            state.initialized = true;
            state.error = 'Firebase not configured properly';
            state.connection.isConnectedToFirebase = false;
          }));
          return;
        }

        const auth = getAuth();
        console.log('✅ [AUTH] Firebase auth available, setting up listener...');

        onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
          console.log('🔐 [AUTH] Auth state changed:', {
            hasUser: !!firebaseUser,
            uid: firebaseUser?.uid,
            email: firebaseUser?.email
          });

          set(produce((state) => {
            state.isLoading = true;
          }));

          try {
            if (firebaseUser) {
              const isConnected = await get().checkConnection();
              if (!isConnected) {
                console.warn('⚠️ Firebase disconnected during auth state change');
                // Queue the profile fetch for later
                set(produce((state) => {
                  state.retryQueue.push(async () => {
                    const db = getFirestore();
                    const profileDocRef = doc(db, 'profiles', firebaseUser.uid);
                    const profileDoc = await getDoc(profileDocRef);
                    
                    if (profileDoc.exists()) {
                      const profileData = profileDoc.data();
                      set(produce((state) => {
                        state.user = { 
                          id: firebaseUser.uid, 
                          ...profileData 
                        } as CurrentUser;
                      }));
                    }
                  });
                }));
                return;
              }

              const db = getFirestore();
              const profileDocRef = doc(db, 'profiles', firebaseUser.uid);
              const profileDoc = await getDoc(profileDocRef);

              if (profileDoc.exists()) {
                const profileData = profileDoc.data();
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
                
                set(produce((state) => {
                  state.user = newUserProfile;
                  state.initialized = true;
                  state.isLoading = false;
                  state.error = null;
                }));
              }
            } else {
              set(produce((state) => {
                state.user = null;
                state.initialized = true;
                state.isLoading = false;
                state.error = null;
              }));
            }
          } catch (error) {
            console.error('❌ [AUTH] Error in auth state change:', error);
            set(produce((state) => {
              state.error = error instanceof Error ? error.message : 'Authentication error';
              state.initialized = true;
              state.isLoading = false;
            }));
          }
        });

        // Initial connection check
        get().checkConnection();
      },

      signIn: async (email, password) => {
        set(produce((state) => { 
          state.isSigningIn = true; 
          state.error = null; 
        }));

        try {
          const isConnected = await get().checkConnection();
          if (!isConnected) {
            throw new Error('No connection to Firebase. Please check your internet connection.');
          }

          const auth = getAuth();
          await signInWithEmailAndPassword(auth, email, password);
        } catch (err: any) {
          console.error('❌ [AUTH] Sign in error:', err);
          set(produce((state) => { 
            state.error = err.message || 'Failed to sign in.';
            state.isSigningIn = false;
          }));
          throw err;
        } finally {
          set(produce((state) => { 
            state.isSigningIn = false; 
          }));
        }
      },

      signUp: async (email, password, confirmPassword, fullName) => {
        set(produce((state) => { 
          state.isSigningUp = true; 
          state.error = null; 
        }));

        try {
          const isConnected = await get().checkConnection();
          if (!isConnected) {
            throw new Error('No connection to Firebase. Please check your internet connection.');
          }

          if (confirmPassword && password !== confirmPassword) {
            throw new Error('Passwords do not match');
          }

          const auth = getAuth();
          const db = getFirestore();
          
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
          }
        } catch (err: any) {
          console.error('[AUTH STORE] Sign up error:', err);
          set(produce((state) => { 
            state.error = err.message || 'Failed to sign up.';
          }));
          throw err;
        } finally {
          set(produce((state) => { 
            state.isSigningUp = false; 
          }));
        }
      },

      signInWithGoogle: async () => {
        set(produce((state) => { 
          state.isSigningIn = true; 
          state.error = null; 
        }));

        try {
          const isConnected = await get().checkConnection();
          if (!isConnected) {
            throw new Error('No connection to Firebase. Please check your internet connection.');
          }

          const auth = getAuth();
          await signInWithPopup(auth, googleProvider);
        } catch (err: any) {
          console.error('[AUTH STORE] Google sign in error:', err);
          set(produce((state) => { 
            state.error = err.message || 'Failed to sign in with Google.';
          }));
          throw err;
        } finally {
          set(produce((state) => { 
            state.isSigningIn = false; 
          }));
        }
      },

      signOut: async () => {
        set(produce((state) => { 
          state.isSigningOut = true; 
        }));

        try {
          const auth = getAuth();
          await signOut(auth);
        } catch (err: any) {
          console.error('[AUTH STORE] Sign out error:', err);
          set(produce((state) => { 
            state.error = err.message || 'Failed to sign out.'; 
          }));
          throw err;
        } finally {
          set(produce((state) => { 
            state.isSigningOut = false; 
          }));
        }
      },

      updateProfile: async (updates: Partial<CurrentUser>) => {
        const { user } = get();
        if (!user) {
          throw new Error('User not authenticated');
        }

        try {
          const isConnected = await get().checkConnection();
          if (!isConnected) {
            // Queue the update for later
            set(produce((state) => {
              state.retryQueue.push(async () => {
                const db = getFirestore();
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
              });
            }));
            
            // Update local state immediately for optimistic updates
            set(produce((state) => {
              if (state.user) {
                Object.assign(state.user, updates);
              }
            }));
            
            console.log('⚠️ Profile update queued for when connection is restored');
            return;
          }

          const db = getFirestore();
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
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({ 
        user: state.user,
        connection: {
          isOnline: state.connection.isOnline,
          lastConnectionCheck: state.connection.lastConnectionCheck
        }
      }),
    }
  )
);

export default useAuthStore; 