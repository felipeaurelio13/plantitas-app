import { initializeApp, type FirebaseApp } from "firebase/app";
import { 
  getAuth as getFirebaseAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  type Auth,
  type User
} from "firebase/auth";
import { 
  getFirestore as getFirebaseFirestore, 
  serverTimestamp, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  writeBatch,
  type Firestore
} from "firebase/firestore";
import { 
  getStorage as getFirebaseStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject,
  type FirebaseStorage 
} from "firebase/storage";

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

class FirebaseManager {
  private static instance: FirebaseManager | null = null;
  private app: FirebaseApp | null = null;
  private auth: Auth | null = null;
  private db: Firestore | null = null;
  private storage: FirebaseStorage | null = null;
  private isInitialized = false;
  private initializationPromise: Promise<boolean> | null = null;
  private retryCount = 0;
  private maxRetries = 3;

  private constructor() {}

  static getInstance(): FirebaseManager {
    if (!FirebaseManager.instance) {
      FirebaseManager.instance = new FirebaseManager();
    }
    return FirebaseManager.instance;
  }

  private validateConfig(): { isValid: boolean; config: FirebaseConfig | null; errors: string[] } {
    const errors: string[] = [];
    const config: Partial<FirebaseConfig> = {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
    };

    const requiredKeys: (keyof FirebaseConfig)[] = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
    
    requiredKeys.forEach(key => {
      if (!config[key]) {
        errors.push(`Missing ${key} (VITE_FIREBASE_${key.toUpperCase()})`);
      }
    });

    console.log('🔥 Firebase Config Validation:', {
      environment: import.meta.env.MODE,
      hasAllKeys: errors.length === 0,
      errors,
      projectId: config.projectId || 'MISSING'
    });

    return {
      isValid: errors.length === 0,
      config: errors.length === 0 ? config as FirebaseConfig : null,
      errors
    };
  }

  private async initializeWithRetry(): Promise<boolean> {
    const { isValid, config, errors } = this.validateConfig();
    
    if (!isValid) {
      const errorMessage = `Firebase configuration invalid: ${errors.join(', ')}`;
      console.error('❌ Firebase Config Error:', errorMessage);
      
      if (import.meta.env.DEV) {
        console.error('💡 Development: Ensure your .env file contains all VITE_FIREBASE_* variables');
      } else {
        console.error('💡 Production: Verify environment variables are set correctly');
      }
      
      throw new Error(errorMessage);
    }

    while (this.retryCount < this.maxRetries) {
      try {
        console.log(`🔥 Firebase initialization attempt ${this.retryCount + 1}/${this.maxRetries}`);
        
        this.app = initializeApp(config!);
        this.auth = getFirebaseAuth(this.app);
        this.db = getFirebaseFirestore(this.app);
        this.storage = getFirebaseStorage(this.app);

        // Health check
        await this.performHealthCheck();
        
        this.isInitialized = true;
        console.log('✅ Firebase initialized successfully');
        
        // Global debug access
        (window as any).firebaseManager = this;
        
        return true;
      } catch (error) {
        this.retryCount++;
        const delay = Math.min(1000 * Math.pow(2, this.retryCount), 10000);
        
        console.error(`❌ Firebase initialization failed (attempt ${this.retryCount}):`, error);
        
        if (this.retryCount < this.maxRetries) {
          console.log(`🔄 Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        } else {
          console.error('❌ All Firebase initialization attempts failed');
          throw error;
        }
      }
    }
    
    return false;
  }

  private async performHealthCheck(): Promise<void> {
    if (!this.db) throw new Error('Firestore not initialized');
    
    try {
      // Simple connectivity test
      const testDoc = doc(this.db, '__health__', 'test');
      await getDoc(testDoc);
      console.log('✅ Firebase connectivity verified');
    } catch (error) {
      console.warn('⚠️ Firebase health check failed:', error);
      // Don't throw here, as the document might not exist
    }
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;
    if (this.initializationPromise) return this.initializationPromise;

    this.initializationPromise = this.initializeWithRetry();
    return this.initializationPromise;
  }

  getAuth(): Auth {
    if (!this.isInitialized || !this.auth) {
      throw new Error('Firebase Auth not initialized. Call initialize() first.');
    }
    return this.auth;
  }

  getFirestore(): Firestore {
    if (!this.isInitialized || !this.db) {
      throw new Error('Firestore not initialized. Call initialize() first.');
    }
    return this.db;
  }

  getStorage(): FirebaseStorage {
    if (!this.isInitialized || !this.storage) {
      throw new Error('Firebase Storage not initialized. Call initialize() first.');
    }
    return this.storage;
  }

  getApp(): FirebaseApp | null {
    return this.app;
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

// Create global instance
const firebaseManager = FirebaseManager.getInstance();

// Initialize Firebase immediately
firebaseManager.initialize().catch(error => {
  console.error('❌ Critical: Firebase initialization failed:', error);
});

// Export services with safety checks
export const getAuth = () => firebaseManager.getAuth();
export const getFirestore = () => firebaseManager.getFirestore();
export const getStorage = () => firebaseManager.getStorage();
export const getApp = () => firebaseManager.getApp();
export const isFirebaseReady = () => firebaseManager.isReady();

// Re-export Firebase functions
export { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  serverTimestamp, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  onSnapshot,
  writeBatch,
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject,
  type User as FirebaseUser
};

// Legacy exports for backward compatibility
export const auth = firebaseManager.isReady() ? firebaseManager.getAuth() : null;
export const db = firebaseManager.isReady() ? firebaseManager.getFirestore() : null;
export const storage = firebaseManager.isReady() ? firebaseManager.getStorage() : null;
export const googleProvider = new GoogleAuthProvider();

// Helper functions for Firestore operations
export const firestoreHelpers = {
  // Collections
  getCollection: (collectionName: string) => collection(firebaseManager.getFirestore(), collectionName),
  
  // Documents
  getDocRef: (collectionName: string, docId: string) => doc(firebaseManager.getFirestore(), collectionName, docId),
  
  // Subcollections
  getSubcollection: (parentCollection: string, parentDocId: string, subcollectionName: string) => 
    collection(firebaseManager.getFirestore(), parentCollection, parentDocId, subcollectionName),
  
  // Queries
  createQuery: (collectionRef: any, ...queryConstraints: any[]) => query(collectionRef, ...queryConstraints),
  
  // Batch operations
  getBatch: () => writeBatch(firebaseManager.getFirestore()),
}; 