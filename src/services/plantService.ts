import { getUnixTime } from 'date-fns';
import { db, storage, serverTimestamp, FieldValue } from '../lib/firebase'; // Import db, storage, and serverTimestamp from modular SDK

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
  // Using any for flexibility with Firestore documents
  [key: string]: any;
}

export class PlantService {
  constructor() {
    // Firebase instances are now imported directly
  }

  private transformDBPlantToPlant(dbPlant: DBPlant): Plant {
    return {
      id: dbPlant.id,
      userId: dbPlant.userId,
      name: dbPlant.name,
      species: dbPlant.species,
      variety: dbPlant.variety || undefined,
      nickname: dbPlant.nickname || undefined,
      location: dbPlant.location,
      healthScore: dbPlant.healthScore,
      careProfile: dbPlant.careProfile || {},
      personality: dbPlant.personality || {},
      dateAdded: dbPlant.dateAdded?.toDate ? dbPlant.dateAdded.toDate() : new Date(dbPlant.dateAdded),
      lastWatered: dbPlant.lastWatered?.toDate ? dbPlant.lastWatered.toDate() : undefined,
      lastFertilized: dbPlant.lastFertilized?.toDate ? dbPlant.lastFertilized.toDate() : undefined,
      createdAt: dbPlant.createdAt?.toDate ? dbPlant.createdAt.toDate() : new Date(dbPlant.createdAt),
      updatedAt: dbPlant.updatedAt?.toDate ? dbPlant.updatedAt.toDate() : undefined,
      description: dbPlant.description || undefined,
      funFacts: dbPlant.funFacts || [],
      plantEnvironment: dbPlant.plantEnvironment || undefined,
      lightRequirements: dbPlant.lightRequirements || undefined,
      profileImageId: dbPlant.profileImageId || undefined, // Add this property
    };
  }

  async getUserPlantSummaries(userId: string): Promise<Plant[]> {
    const plantsRef = db.collection('plants');
    const q = plantsRef.where('userId', '==', userId).orderBy('dateAdded', 'desc');
    const snapshot = await q.get();
    const plants: Plant[] = [];

    for (const doc of snapshot.docs) {
      const plantData = this.transformDBPlantToPlant({
        id: doc.id,
        ...doc.data()
      });

      // Fetch the profile image for each plant
      const profileImageQuery = db.collection('plants').doc(doc.id).collection('plant_images').where('isProfileImage', '==', true).limit(1);
      const profileImageSnapshot = await profileImageQuery.get();
      if (!profileImageSnapshot.empty) {
        plantData.profileImageId = profileImageSnapshot.docs[0].id; // Store image ID
        // You can also add the URL directly if needed
        // plantData.profileImageUrl = profileImageSnapshot.docs[0].data().url;
      }
      plants.push(plantData);
    }
    return plants;
  }

  async getUserPlants(userId: string): Promise<Plant[]> {
    const plantsRef = db.collection('plants');
    const q = plantsRef.where('userId', '==', userId).orderBy('dateAdded', 'desc');
    const snapshot = await q.get();
    const plants: Plant[] = [];

    for (const doc of snapshot.docs) {
      const plantData = this.transformDBPlantToPlant({
        id: doc.id,
        ...doc.data()
      });

      // Fetch subcollections
      plantData.images = (await db.collection('plants').doc(doc.id).collection('plant_images').orderBy('createdAt', 'asc').get()).docs.map((imgDoc: any) => ({ id: imgDoc.id, ...imgDoc.data() }));
      plantData.chatMessages = (await db.collection('plants').doc(doc.id).collection('chat_messages').orderBy('createdAt', 'asc').get()).docs.map((msgDoc: any) => ({ id: msgDoc.id, ...msgDoc.data() }));
      plantData.notifications = (await db.collection('plants').doc(doc.id).collection('plant_notifications').orderBy('createdAt', 'asc').get()).docs.map((notifDoc: any) => ({ id: notifDoc.id, ...notifDoc.data() }));

      plants.push(plantData);
    }
    return plants;
  }

  async getPlantById(plantId: string): Promise<Plant | null> {
    const plantDocRef = db.collection('plants').doc(plantId);
    const plantDoc = await plantDocRef.get();

    if (!plantDoc.exists) {
      return null;
    }

    const plantData = this.transformDBPlantToPlant({
      id: plantDoc.id,
      ...plantDoc.data()
    });

    // Fetch subcollections
    plantData.images = (await plantDocRef.collection('plant_images').orderBy('createdAt', 'asc').get()).docs.map((imgDoc: any) => ({ id: imgDoc.id, ...imgDoc.data() }));
    plantData.chatMessages = (await plantDocRef.collection('chat_messages').orderBy('createdAt', 'asc').get()).docs.map((msgDoc: any) => ({ id: msgDoc.id, ...msgDoc.data() }));
    plantData.notifications = (await plantDocRef.collection('plant_notifications').orderBy('createdAt', 'asc').get()).docs.map((notifDoc: any) => ({ id: notifDoc.id, ...notifDoc.data() }));

    return plantData;
  }

  async createPlant(plant: Omit<Plant, 'id' | 'createdAt' | 'updatedAt'>): Promise<Plant> {
    const newPlantRef = db.collection('plants').doc(); // Firestore auto-generates ID

    const plantToSave = {
      ...plant,
      userId: plant.userId,
      dateAdded: plant.dateAdded || serverTimestamp(), // Use provided dateAdded or server timestamp
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      healthScore: plant.healthScore || 85, // Default health score
      careProfile: plant.careProfile || {},
      personality: plant.personality || {},
      funFacts: plant.funFacts || [],
    };

    await newPlantRef.set(plantToSave);
    const createdPlantDoc = await newPlantRef.get();
    return this.transformDBPlantToPlant({
      id: createdPlantDoc.id,
      ...createdPlantDoc.data()
    });
  }

  async updatePlantInfo(plantId: string, updatedFields: Partial<Plant>): Promise<void> {
    const plantDocRef = db.collection('plants').doc(plantId);

    const fieldsToUpdate = {
      ...updatedFields,
      updatedAt: serverTimestamp(),
    };

    await plantDocRef.update(fieldsToUpdate);
  }

  async updatePlantHealthScore(plantId: string, imageId: string, healthScore: number, healthAnalysis: Record<string, any>): Promise<void> {
    const plantDocRef = db.collection('plants').doc(plantId);
    const imageDocRef = plantDocRef.collection('plant_images').doc(imageId);

    const batch = db.batch();

    // Update plant's overall health score
    batch.update(plantDocRef, {
      healthScore: healthScore,
      updatedAt: serverTimestamp(),
    });

    // Update the specific image's health analysis
    batch.update(imageDocRef, {
      healthAnalysis: healthAnalysis,
      updatedAt: serverTimestamp(), // Assuming images also have an updatedAt field
    });

    await batch.commit();
  }

  async updatePlant(plantId: string, plantData: Partial<Plant>): Promise<void> {
    const plantDocRef = db.collection('plants').doc(plantId);

    await plantDocRef.update({
      ...plantData,
      updatedAt: serverTimestamp(),
    });
  }

  async deletePlant(plantId: string): Promise<void> {
    const plantDocRef = db.collection('plants').doc(plantId);

    // 1. Delete all subcollection documents (images, chat messages, notifications)
    const deleteSubcollection = async (collectionRef: any) => {
      const snapshot = await collectionRef.get();
      const batch = db.batch();
      snapshot.docs.forEach((doc: any) => {
        batch.delete(doc.ref);
      });
      await batch.commit();
    };

    // Delete plant_images and associated storage objects
    const plantImagesRef = plantDocRef.collection('plant_images');
    const imageSnapshot = await plantImagesRef.get();
    for (const imgDoc of imageSnapshot.docs) {
      const storagePath = imgDoc.data().storagePath;
      if (storagePath) {
        const imageRef = storage.ref(storagePath);
        try {
          await imageRef.delete();
        } catch (error: any) {
          if (error.code === 'storage/object-not-found') {
            console.warn(`Storage object not found for deletion: ${storagePath}`);
          } else {
            console.error(`Error deleting storage object ${storagePath}:`, error);
          }
        }
      }
      // Delete the Firestore document for the image
      await imgDoc.ref.delete();
    }

    await deleteSubcollection(plantDocRef.collection('chat_messages'));
    await deleteSubcollection(plantDocRef.collection('plant_notifications'));

    // 2. Delete the main plant document
    await plantDocRef.delete();
  }

  async sendChatMessageAndGetResponse(plantId: string, userId: string, message: string): Promise<ChatMessage> {
    // Save user message to Firestore
    const userMessage: ChatMessage = {
      id: db.collection('plants').doc(plantId).collection('chat_messages').doc().id, // Generate a new ID
      plantId: plantId,
      userId: userId,
      sender: 'user',
      content: message,
      createdAt: serverTimestamp(),
    };
    await this.addChatMessage(plantId, userMessage);

    // TODO: Replace with actual AI service call (Firebase Cloud Function)
    // For now, return a mock response
    console.warn('MOCK DATA: Returning mock AI response. Replace with Firebase Cloud Function call.');
    const mockResponse: ChatMessage = {
      id: db.collection('plants').doc(plantId).collection('chat_messages').doc().id, // Generate a new ID
      plantId: plantId,
      userId: userId,
      sender: 'plant',
      content: `Hello, I am a mock plant AI response for your message: "${message}". I hope you are having a great day!`,
      emotion: 'happy',
      createdAt: serverTimestamp(),
      context: {},
    };
    await this.addChatMessage(plantId, mockResponse);
    return mockResponse;
  }

  async addChatMessage(plantId: string, message: Omit<ChatMessage, 'id' | 'createdAt'> & { id?: string, createdAt?: any }): Promise<ChatMessage> {
    const chatMessagesRef = db.collection('plants').doc(plantId).collection('chat_messages');
    const messageToSave = {
      ...message,
      id: message.id || chatMessagesRef.doc().id, // Ensure ID if not provided
      createdAt: message.createdAt || serverTimestamp(),
    };
    await chatMessagesRef.doc(messageToSave.id).set(messageToSave);
    return messageToSave as ChatMessage; // Cast back for type safety
  }

  async addPlantImage(plantId: string, userId: string, imageBase64: string, isProfileImage: boolean = false): Promise<PlantImage> {
    const imageId = db.collection('plants').doc(plantId).collection('plant_images').doc().id;
    const storagePath = `plant_images/${plantId}/${imageId}.jpg`; // Example path

    // Upload to Firebase Storage
    const imageRef = storage.ref(storagePath);
    await imageRef.putString(imageBase64, 'data_url');
    const imageUrl = await imageRef.getDownloadURL();

    // Save image metadata to Firestore subcollection
    const newImage: PlantImage = {
      id: imageId,
      plantId: plantId,
      userId: userId,
      storagePath: storagePath,
      healthAnalysis: {}, // Initial empty analysis
      isProfileImage: isProfileImage,
      createdAt: serverTimestamp(),
      url: imageUrl, // Store download URL
    };

    await db.collection('plants').doc(plantId).collection('plant_images').doc(imageId).set(newImage);

    // If this is the new profile image, update other images for this plant
    if (isProfileImage) {
      await this.setProfileImage(plantId, imageId);
    }

    return newImage;
  }

  async setProfileImage(plantId: string, newProfileImageId: string): Promise<void> {
    const plantImagesRef = db.collection('plants').doc(plantId).collection('plant_images');

    // Use a batch write to update multiple documents atomically
    const batch = db.batch();

    // Set all other images to isProfileImage: false
    const currentProfileImages = await plantImagesRef.where('isProfileImage', '==', true).get();
    currentProfileImages.docs.forEach((doc: any) => {
      if (doc.id !== newProfileImageId) {
        batch.update(doc.ref, { isProfileImage: false });
      }
    });

    // Set the new profile image to isProfileImage: true
    const newProfileImageRef = plantImagesRef.doc(newProfileImageId);
    batch.update(newProfileImageRef, { isProfileImage: true });

    await batch.commit();

    // Also update the main plant document with the new profileImageId
    const plantDocRef = db.collection('plants').doc(plantId);
    await plantDocRef.update({ profileImageId: newProfileImageId });
  }

  async deleteImage(plantId: string, imageId: string): Promise<void> {
    const imageDocRef = db.collection('plants').doc(plantId).collection('plant_images').doc(imageId);
    const imageDoc = await imageDocRef.get();

    if (!imageDoc.exists) {
      console.warn(`Image document ${imageId} not found for plant ${plantId}.`);
      return;
    }

    const imageData = imageDoc.data();
    const storagePath = imageData?.storagePath;
    const isProfileImage = imageData?.isProfileImage;

    // Delete from Firebase Storage
    if (storagePath) {
      const imageRef = storage.ref(storagePath);
      try {
        await imageRef.delete();
        console.log(`Deleted image from Storage: ${storagePath}`);
      } catch (error: any) {
        if (error.code === 'storage/object-not-found') {
          console.warn(`Storage object not found for deletion: ${storagePath}. Skipping storage deletion.`);
        } else {
          console.error(`Error deleting storage object ${storagePath}:`, error);
          throw error; // Re-throw to indicate a problem with storage deletion
        }
      }
    }

    // Delete Firestore document
    await imageDocRef.delete();
    console.log(`Deleted image document from Firestore: ${imageId}`);

    // If the deleted image was the profile image, clear profileImageId on plant
    if (isProfileImage) {
      const plantDocRef = db.collection('plants').doc(plantId);
      await plantDocRef.update({ profileImageId: FieldValue.delete() });
    }
  }
}

export const plantService = new PlantService(); 