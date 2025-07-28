import { initializeApp, type FirebaseApp } from "firebase/app";
import { 
  getAuth, 
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
  getFirestore, 
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
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject,
  type FirebaseStorage 
} from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Log de configuración para debug
console.log('🔥 Firebase Config Debug:', {
  apiKeyPresent: !!firebaseConfig.apiKey,
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  environment: import.meta.env.MODE,
  allEnvVars: {
    NODE_ENV: import.meta.env.NODE_ENV,
    MODE: import.meta.env.MODE,
    PROD: import.meta.env.PROD,
    DEV: import.meta.env.DEV,
    // No log sensitive data, just check presence
    hasApiKey: !!import.meta.env.VITE_FIREBASE_API_KEY,
    hasProjectId: !!import.meta.env.VITE_FIREBASE_PROJECT_ID,
    hasAuthDomain: !!import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  }
});

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);
  
  console.log('🔥 Firebase Config Check:', {
    hasAllKeys: missingKeys.length === 0,
    missingKeys,
    configKeys: Object.keys(firebaseConfig),
    configValues: Object.fromEntries(
      Object.entries(firebaseConfig).map(([key, value]) => [
        key, 
        value ? `${value.substring(0, 10)}...` : 'MISSING'
      ])
    )
  });
  
  if (missingKeys.length > 0) {
    console.error(`🔥 Firebase config missing: ${missingKeys.join(', ')}`);
    
    // En desarrollo, mostrar error detallado
    if (import.meta.env.DEV) {
      console.error('🔥 Dev Mode: Check your .env file has all VITE_FIREBASE_* variables');
    } else {
      console.error('🔥 Production Mode: Check GitHub Secrets are configured correctly');
    }
    return false;
  }
  return true;
};

// Initialize Firebase
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

console.log('🔥 Starting Firebase initialization...');

try {
  if (validateFirebaseConfig()) {
    console.log('✅ Firebase config validation passed');
    
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized');
    
    auth = getAuth(app);
    console.log('✅ Firebase Auth initialized');
    
    db = getFirestore(app);
    console.log('✅ Firestore initialized');
    
    storage = getStorage(app);
    console.log('✅ Firebase Storage initialized');
    
    // Make Firebase available globally for debugging
    (window as any).firebaseApp = app;
    (window as any).firebaseAuth = auth;
    (window as any).firebaseDb = db;
    
    console.log('✅ Firebase initialized successfully - all services ready');
  } else {
    console.error('❌ Firebase initialization skipped due to missing configuration');
    
    // Create mock Firebase services for development/testing
    console.warn('🔄 Creating mock Firebase services for fallback mode');
    
    (window as any).firebaseApp = null;
    (window as any).firebaseAuth = null;
    (window as any).firebaseDb = null;
    
    // En modo de fallback, la app debería mostrar un mensaje de configuración
    console.warn('🔄 App will run in fallback mode - some features may be limited');
  }
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  console.error('❌ Error details:', {
    name: error instanceof Error ? error.name : 'Unknown',
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined
  });
  
  // Fallback to mock services
  (window as any).firebaseApp = null;
  (window as any).firebaseAuth = null;
  (window as any).firebaseDb = null;
}

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();

// Helper functions for Firestore operations
export const firestoreHelpers = {
  // Collections
  getCollection: (collectionName: string) => collection(db!, collectionName),
  
  // Documents
  getDocRef: (collectionName: string, docId: string) => doc(db!, collectionName, docId),
  
  // Subcollections
  getSubcollection: (parentCollection: string, parentDocId: string, subcollectionName: string) => 
    collection(db!, parentCollection, parentDocId, subcollectionName),
  
  // Queries
  createQuery: (collectionRef: any, ...queryConstraints: any[]) => query(collectionRef, ...queryConstraints),
  
  // Batch operations
  getBatch: () => writeBatch(db!),
};

// Export Firebase services and utilities
export { 
  app, 
  auth, 
  db, 
  storage,
  googleProvider
};

// Export auth functions
export { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  signInWithPopup,
  type User as FirebaseUser
};

// Export Firestore functions
export { 
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
  writeBatch
};

// Export Storage functions
export { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject
}; 