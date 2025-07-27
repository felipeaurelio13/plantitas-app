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

// Validate Firebase configuration
const validateFirebaseConfig = () => {
  const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
  const missingKeys = requiredKeys.filter(key => !firebaseConfig[key as keyof typeof firebaseConfig]);
  
  if (missingKeys.length > 0) {
    console.warn(`Firebase config missing: ${missingKeys.join(', ')}`);
    return false;
  }
  return true;
};

// Initialize Firebase
let app: FirebaseApp | undefined;
let auth: Auth | undefined;
let db: Firestore | undefined;
let storage: FirebaseStorage | undefined;

try {
  if (validateFirebaseConfig()) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    console.log('Firebase initialized successfully');
  } else {
    console.warn('Firebase initialization skipped due to missing configuration');
  }
} catch (error) {
  console.error('Firebase initialization failed:', error);
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