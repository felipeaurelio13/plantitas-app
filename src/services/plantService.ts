import { 
  db, 
  storage, 
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
  writeBatch
} from '../lib/firebase';

interface Plant {
  id: string;
  userId: string;
  name: string;
  species: string;
  variety?: string;
  nickname?: string;
  location: string;
  healthScore: number;
  careProfile: Record<string, any>;
  personality: Record<string, any>;
  dateAdded: Date;
  lastWatered?: Date;
  lastFertilized?: Date;
  createdAt: Date;
  updatedAt?: Date;
  description?: string;
  funFacts?: string[];
  plantEnvironment?: string;
  lightRequirements?: string;
  profileImageId?: string;
}

interface PlantImage {
  id: string;
  plantId: string;
  userId: string;
  storagePath: string;
  healthAnalysis: Record<string, any>;
  isProfileImage: boolean;
  createdAt: Date;
  url: string;
}

interface ChatMessage {
  id: string;
  plantId: string;
  userId: string;
  sender: 'user' | 'plant';
  content: string;
  emotion?: string;
  createdAt: Date;
  context?: Record<string, any>;
}

interface DBPlant {
  [key: string]: any;
}

interface PlantNotification {
  id: string;
  plantId: string;
  userId: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
}

// Helper function to validate Firebase is available
const ensureFirebaseAvailable = () => {
  if (!db) {
    throw new Error('Firebase Firestore not initialized');
  }
};

// Plant CRUD Operations

export const getUserPlants = async (userId: string): Promise<Plant[]> => {
  ensureFirebaseAvailable();
  
  try {
    console.log('[PLANT SERVICE] Fetching plants for user:', userId);
    
    const plantsRef = collection(db!, 'plants');
    const plantsQuery = query(plantsRef, where('userId', '==', userId));
    const plantsSnapshot = await getDocs(plantsQuery);

    const plants: Plant[] = [];

    for (const plantDoc of plantsSnapshot.docs) {
      const plantData = { id: plantDoc.id, ...plantDoc.data() } as DBPlant;

      // Get profile image
      const profileImageQuery = query(
        collection(db!, 'plants', plantDoc.id, 'plant_images'),
        where('isProfileImage', '==', true),
        limit(1)
      );
      const profileImageSnapshot = await getDocs(profileImageQuery);
      if (!profileImageSnapshot.empty) {
        plantData.profileImage = {
          id: profileImageSnapshot.docs[0].id,
          ...profileImageSnapshot.docs[0].data()
        };
      }

      plants.push(plantData as Plant);
    }

    console.log('[PLANT SERVICE] Retrieved plants:', plants.length);
    return plants;
  } catch (error) {
    console.error('[PLANT SERVICE] Error fetching user plants:', error);
    throw error;
  }
};

export const getPlantById = async (plantId: string, includeSubcollections = true): Promise<Plant | null> => {
  ensureFirebaseAvailable();
  
  try {
    console.log('[PLANT SERVICE] Fetching plant by ID:', plantId);
    
    const plantDocRef = doc(db!, 'plants', plantId);
    const plantDoc = await getDoc(plantDocRef);

    if (!plantDoc.exists()) {
      console.log('[PLANT SERVICE] Plant not found');
      return null;
    }

    const plantData = { id: plantDoc.id, ...plantDoc.data() } as DBPlant;

    if (includeSubcollections) {
      // Get subcollections
      const [imagesSnapshot, messagesSnapshot, notificationsSnapshot] = await Promise.all([
        getDocs(query(collection(db!, 'plants', plantId, 'plant_images'), orderBy('createdAt', 'asc'))),
        getDocs(query(collection(db!, 'plants', plantId, 'chat_messages'), orderBy('createdAt', 'asc'))),
        getDocs(query(collection(db!, 'plants', plantId, 'plant_notifications'), orderBy('createdAt', 'asc')))
      ]);

      plantData.images = imagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      plantData.chatMessages = messagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      plantData.notifications = notificationsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }

    return plantData as Plant;
  } catch (error) {
    console.error('[PLANT SERVICE] Error fetching plant by ID:', error);
    throw error;
  }
};

export const createPlant = async (plantData: Omit<Plant, 'id'>): Promise<string> => {
  ensureFirebaseAvailable();
  
  try {
    console.log('[PLANT SERVICE] Creating new plant:', plantData.name);
    
    const plantsRef = collection(db!, 'plants');
    const newPlantDoc = await addDoc(plantsRef, {
      ...plantData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      healthScore: plantData.healthScore || 85,
      dateAdded: new Date(),
    });

    console.log('[PLANT SERVICE] Plant created with ID:', newPlantDoc.id);
    return newPlantDoc.id;
  } catch (error) {
    console.error('[PLANT SERVICE] Error creating plant:', error);
    throw error;
  }
};

export const updatePlant = async (plantId: string, updates: Partial<Plant>): Promise<void> => {
  ensureFirebaseAvailable();
  
  try {
    console.log('[PLANT SERVICE] Updating plant:', plantId);
    
    const plantDocRef = doc(db!, 'plants', plantId);
    await updateDoc(plantDocRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    console.log('[PLANT SERVICE] Plant updated successfully');
  } catch (error) {
    console.error('[PLANT SERVICE] Error updating plant:', error);
    throw error;
  }
};

export const deletePlant = async (plantId: string): Promise<void> => {
  ensureFirebaseAvailable();
  
  try {
    console.log('[PLANT SERVICE] Deleting plant:', plantId);
    
    // Delete subcollections first
    const deleteSubcollection = async (subcollectionName: string) => {
      const subcollectionRef = collection(db!, 'plants', plantId, subcollectionName);
      const snapshot = await getDocs(subcollectionRef);
      
      const batch = writeBatch(db!);
      snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    };

    await Promise.all([
      deleteSubcollection('plant_images'),
      deleteSubcollection('chat_messages'),
      deleteSubcollection('plant_notifications')
    ]);

    // Delete main document
    const plantDocRef = doc(db!, 'plants', plantId);
    await deleteDoc(plantDocRef);

    console.log('[PLANT SERVICE] Plant deleted successfully');
  } catch (error) {
    console.error('[PLANT SERVICE] Error deleting plant:', error);
    throw error;
  }
};

// Chat Operations

export const addChatMessage = async (plantId: string, message: Omit<ChatMessage, 'id'>): Promise<string> => {
  ensureFirebaseAvailable();
  
  try {
    console.log('[PLANT SERVICE] Adding chat message to plant:', plantId);
    
    const messagesRef = collection(db!, 'plants', plantId, 'chat_messages');
    const newMessageDoc = await addDoc(messagesRef, {
      ...message,
      createdAt: serverTimestamp(),
    });

    console.log('[PLANT SERVICE] Chat message added with ID:', newMessageDoc.id);
    return newMessageDoc.id;
  } catch (error) {
    console.error('[PLANT SERVICE] Error adding chat message:', error);
    throw error;
  }
};

export const saveChatMessage = async (plantId: string, message: ChatMessage): Promise<void> => {
  ensureFirebaseAvailable();
  
  try {
    const messagesRef = collection(db!, 'plants', plantId, 'chat_messages');
    const messageDocRef = doc(messagesRef, message.id);
    
    await setDoc(messageDocRef, {
      ...message,
      createdAt: message.createdAt || serverTimestamp(),
    });

    console.log('[PLANT SERVICE] Chat message saved successfully');
  } catch (error) {
    console.error('[PLANT SERVICE] Error saving chat message:', error);
    throw error;
  }
};

// Image Operations

export const addPlantImage = async (plantId: string, imageData: Omit<PlantImage, 'id'>): Promise<string> => {
  ensureFirebaseAvailable();
  
  try {
    console.log('[PLANT SERVICE] Adding plant image to plant:', plantId);
    
    const imagesRef = collection(db!, 'plants', plantId, 'plant_images');
    const newImageDoc = await addDoc(imagesRef, {
      ...imageData,
      createdAt: serverTimestamp(),
    });

    console.log('[PLANT SERVICE] Plant image added with ID:', newImageDoc.id);
    return newImageDoc.id;
  } catch (error) {
    console.error('[PLANT SERVICE] Error adding plant image:', error);
    throw error;
  }
};

export const updatePlantImage = async (plantId: string, imageId: string, updates: Partial<PlantImage>): Promise<void> => {
  ensureFirebaseAvailable();
  
  try {
    console.log('[PLANT SERVICE] Updating plant image:', imageId);
    
    const imageDocRef = doc(db!, 'plants', plantId, 'plant_images', imageId);
    await updateDoc(imageDocRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    console.log('[PLANT SERVICE] Plant image updated successfully');
  } catch (error) {
    console.error('[PLANT SERVICE] Error updating plant image:', error);
    throw error;
  }
};

export const setProfileImage = async (plantId: string, newProfileImageId: string): Promise<void> => {
  ensureFirebaseAvailable();
  
  try {
    console.log('[PLANT SERVICE] Setting profile image for plant:', plantId);
    
    const imagesRef = collection(db!, 'plants', plantId, 'plant_images');
    const batch = writeBatch(db!);

    // Reset all images to not be profile image
    const allImagesSnapshot = await getDocs(imagesRef);
    allImagesSnapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { isProfileImage: false });
    });

    // Set the new profile image
    const newProfileImageRef = doc(imagesRef, newProfileImageId);
    batch.update(newProfileImageRef, { isProfileImage: true });

    // Update the plant document
    const plantDocRef = doc(db!, 'plants', plantId);
    batch.update(plantDocRef, { profileImageId: newProfileImageId });

    await batch.commit();
    console.log('[PLANT SERVICE] Profile image set successfully');
  } catch (error) {
    console.error('[PLANT SERVICE] Error setting profile image:', error);
    throw error;
  }
};

export const deletePlantImage = async (plantId: string, imageId: string): Promise<void> => {
  ensureFirebaseAvailable();
  
  try {
    console.log('[PLANT SERVICE] Deleting plant image:', imageId);
    
    const imageDocRef = doc(db!, 'plants', plantId, 'plant_images', imageId);
    await deleteDoc(imageDocRef);

    console.log('[PLANT SERVICE] Plant image deleted successfully');
  } catch (error) {
    console.error('[PLANT SERVICE] Error deleting plant image:', error);
    throw error;
  }
};

// Notification Operations

export const addPlantNotification = async (plantId: string, notification: Omit<PlantNotification, 'id'>): Promise<string> => {
  ensureFirebaseAvailable();
  
  try {
    console.log('[PLANT SERVICE] Adding notification to plant:', plantId);
    
    const notificationsRef = collection(db!, 'plants', plantId, 'plant_notifications');
    const newNotificationDoc = await addDoc(notificationsRef, {
      ...notification,
      createdAt: serverTimestamp(),
      isRead: false,
    });

    console.log('[PLANT SERVICE] Notification added with ID:', newNotificationDoc.id);
    return newNotificationDoc.id;
  } catch (error) {
    console.error('[PLANT SERVICE] Error adding notification:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (plantId: string, notificationId: string): Promise<void> => {
  ensureFirebaseAvailable();
  
  try {
    const notificationDocRef = doc(db!, 'plants', plantId, 'plant_notifications', notificationId);
    await updateDoc(notificationDocRef, {
      isRead: true,
      readAt: serverTimestamp(),
    });

    console.log('[PLANT SERVICE] Notification marked as read');
  } catch (error) {
    console.error('[PLANT SERVICE] Error marking notification as read:', error);
    throw error;
  }
};

// Health Operations

export const updatePlantHealthScore = async (plantId: string, healthScore: number): Promise<void> => {
  ensureFirebaseAvailable();
  
  try {
    console.log('[PLANT SERVICE] Updating health score for plant:', plantId, 'to:', healthScore);
    
    const plantDocRef = doc(db!, 'plants', plantId);
    await updateDoc(plantDocRef, {
      healthScore,
      updatedAt: serverTimestamp(),
    });

    console.log('[PLANT SERVICE] Health score updated successfully');
  } catch (error) {
    console.error('[PLANT SERVICE] Error updating health score:', error);
    throw error;
  }
};

// Export all functions as a default object for backward compatibility
export default {
  getUserPlants,
  getPlantById,
  createPlant,
  updatePlant,
  deletePlant,
  addChatMessage,
  saveChatMessage,
  addPlantImage,
  updatePlantImage,
  setProfileImage,
  deletePlantImage,
  addPlantNotification,
  markNotificationAsRead,
  updatePlantHealthScore,
}; 