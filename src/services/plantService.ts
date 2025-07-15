import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import {
  Plant,
  PlantImage,
  ChatMessage,
  PlantNotification,
  CareProfile,
  PlantPersonality,
  PlantSummary,
} from '../schemas';
import { uploadImage } from './imageService';
import {
  analyzeImage,
  generatePlantResponse
} from './aiService';

type DBPlant = Database['public']['Tables']['plants']['Row'];
// Type aliases for future use
// type DBChatMessage = Tables<'chat_messages'>;
// type DBPlantImage = Tables<'plant_images'>;
// type DBPlantNotification = Tables<'plant_notifications'>;

// Convert database plant to app plant format
const transformDBPlantToPlant = (
  p: DBPlant,
  images: PlantImage[],
  chatHistory: ChatMessage[],
  notifications: PlantNotification[]
): Plant => {
  return {
    id: p.id,
    name: p.name,
    species: p.species,
    variety: p.variety || undefined,
    nickname: p.nickname || undefined,
    description: p.description || undefined,
    location: p.location,
    dateAdded: new Date(p.date_added!),
    lastWatered: p.last_watered ? new Date(p.last_watered) : undefined,
    lastFertilized: p.last_fertilized ? new Date(p.last_fertilized) : undefined,
    images,
    healthScore: p.health_score || 85,
    careProfile: p.care_profile as unknown as CareProfile,
    personality: p.personality as unknown as PlantPersonality,
    chatHistory,
    notifications,
  };
};

export class PlantService {
  async getUserPlantSummaries(userId: string): Promise<PlantSummary[]> {
    try {
      const { data: dbPlants, error } = await supabase
        .from('plants')
        .select(`
          id,
          name,
          nickname,
          species,
          location,
          health_score,
          last_watered,
          care_profile,
          plant_images ( * )
        `)
        .eq('user_id', userId)
        .eq('plant_images.is_profile_image', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const summaries: PlantSummary[] = dbPlants.map(plant => ({
        id: plant.id,
        name: plant.name,
        nickname: plant.nickname || undefined,
        species: plant.species,
        location: plant.location,
        healthScore: plant.health_score || 85,
        profileImageUrl: plant.plant_images.length > 0 
          ? plant.plant_images[0].url ?? undefined
          : undefined,
        lastWatered: plant.last_watered ? new Date(plant.last_watered) : undefined,
        wateringFrequency: (plant.care_profile as any)?.wateringFrequency,
      }));

      return summaries;

    } catch (error) {
      console.error('Error fetching plant summaries:', error);
      throw error;
    }
  }

  async getUserPlants(userId: string): Promise<Plant[]> {
    try {
      const { data: dbPlants, error } = await supabase
        .from('plants')
        .select(`
          *,
          plant_images ( * ),
          chat_messages ( * ),
          plant_notifications ( * )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const plantsWithData = dbPlants.map((p) => {
        const plantImages: PlantImage[] = (p.plant_images || []).map(
          (img: any) => ({
            id: img.id,
            url: img.url,
            timestamp: new Date(img.created_at!),
            healthAnalysis: img.health_analysis as any,
            isProfileImage: img.is_profile_image || false,
          })
        );

        const chatHistory: ChatMessage[] = (p.chat_messages || []).map(
          (msg: any) => ({
            id: msg.id,
            sender: msg.sender,
            content: msg.content,
            timestamp: new Date(msg.created_at!),
            emotion: msg.emotion,
          })
        );

        const plantNotifications: PlantNotification[] = (p.plant_notifications || []).map((notif: any) => ({
            id: notif.id,
            type: notif.type,
            title: notif.title,
            message: notif.message,
            priority: notif.priority || 'medium',
            scheduledFor: new Date(notif.scheduled_for),
            completed: notif.completed || false,
          }));

        return transformDBPlantToPlant(p, plantImages, chatHistory, plantNotifications);
      });
      
      return plantsWithData;
    } catch (error) {
      console.error('Error fetching plants:', error);
      throw error;
    }
  }

  async getPlantById(plantId: string, userId: string): Promise<Plant | null> {
    try {
      const { data: plant, error } = await supabase
        .from('plants')
        .select(`
          *,
          plant_images ( * ),
          chat_messages ( * ),
          plant_notifications ( * )
        `)
        .eq('id', plantId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      
      if (!plant) return null;

      const plantImages: PlantImage[] = (plant.plant_images || []).map(
        (img: any) => ({
          id: img.id,
          url: img.url,
          timestamp: new Date(img.created_at!),
          healthAnalysis: img.health_analysis as any,
          isProfileImage: img.is_profile_image || false,
        })
      );
      
      const chatHistory: ChatMessage[] = (plant.chat_messages || []).map((msg: any) => ({
        id: msg.id,
        sender: msg.sender,
        content: msg.content,
        timestamp: new Date(msg.created_at!),
        emotion: msg.emotion,
      }));

      const plantNotifications: PlantNotification[] = (plant.plant_notifications || []).map((notif: any) => ({
        id: notif.id,
        type: notif.type,
        title: notif.title,
        message: notif.message,
        priority: notif.priority || 'medium',
        scheduledFor: new Date(notif.scheduled_for),
        completed: notif.completed || false,
      }));

      return transformDBPlantToPlant(plant, plantImages, chatHistory, plantNotifications);
    } catch (error) {
      console.error('Error fetching plant by ID:', error);
      throw error;
    }
  }

  async addPlantFromAnalysis(
    userId: string,
    imageDataUrl: string,
    location: string
  ): Promise<Plant> {
    try {
      // 1. Get AI analysis from the image
      const analysis = await analyzeImage(imageDataUrl);

      // 2. Create the initial plant object from the analysis
      const plantToCreate: Omit<Plant, 'id'> = {
        name: analysis.commonName,
        species: analysis.species,
        description: analysis.generalDescription,
        funFacts: analysis.funFacts,
        variety: analysis.variety ?? undefined,
        nickname: analysis.commonName, // Default nickname to common name
        location: location,
        dateAdded: new Date(),
        healthScore: analysis.health.confidence,
        careProfile: analysis.careProfile,
        personality: analysis.personality,
        images: [],
        chatHistory: [],
        notifications: [],
      };
      
      // 3. Create the plant record in the database
      const newPlant = await this.createPlant(plantToCreate, userId);

      // 4. Create the plant image record (this will also upload it)
      const plantImage: Omit<PlantImage, 'id'> = {
        url: imageDataUrl, // Pass the Data URL to be uploaded
        timestamp: new Date(),
        isProfileImage: true,
        healthAnalysis: analysis.health,
      };

      const savedImage = await this.addPlantImage(newPlant.id, plantImage, userId);
      
      // Return the full plant object with its first image
      newPlant.images.push(savedImage);
      return newPlant;

    } catch (error) {
      console.error('Error adding plant from analysis:', error);
      // Here you might want to handle cleanup, e.g., delete the uploaded image if the DB insert fails
      throw new Error('Failed to create plant from image analysis.');
    }
  }

  async createPlant(plantData: Omit<Plant, 'id'>, userId: string): Promise<Plant> {
    try {
      const { data, error } = await supabase
        .from('plants')
        .insert({
          user_id: userId,
          name: plantData.name,
          species: plantData.species,
          description: plantData.description,
          fun_facts: plantData.funFacts,
          variety: plantData.variety,
          nickname: plantData.nickname,
          location: plantData.location,
          health_score: plantData.healthScore,
          care_profile: plantData.careProfile as any,
          personality: plantData.personality as any,
          date_added: plantData.dateAdded.toISOString(),
          last_watered: plantData.lastWatered?.toISOString(),
          last_fertilized: plantData.lastFertilized?.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return transformDBPlantToPlant(data, [], [], []);
    } catch (error) {
      console.error('Error creating plant:', error);
      throw error;
    }
  }

  async updatePlant(plant: Plant, userId: string): Promise<Plant> {
    try {
      const updateData: any = {
        name: plant.name,
        species: plant.species,
        variety: plant.variety,
        nickname: plant.nickname,
        location: plant.location,
        health_score: plant.healthScore,
        care_profile: plant.careProfile as any,
        personality: plant.personality as any,
        last_watered: plant.lastWatered?.toISOString(),
        last_fertilized: plant.lastFertilized?.toISOString(),
      };

      const { data, error } = await supabase
        .from('plants')
        .update(updateData)
        .eq('id', plant.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;

      return transformDBPlantToPlant(data, plant.images, plant.chatHistory, plant.notifications);
    } catch (error) {
      console.error('Error updating plant:', error);
      throw error;
    }
  }

  async deletePlant(plantId: string, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('plants')
        .delete()
        .eq('id', plantId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting plant:', error);
      throw error;
    }
  }

  async sendChatMessageAndGetResponse(plant: Plant, userMessage: Omit<ChatMessage, 'id'>, userId: string): Promise<[ChatMessage, ChatMessage]> {
    // 1. Save the user's message
    const savedUserMessage = await this.addChatMessage(plant.id, userMessage, userId);

    // 2. Generate the plant's response
    const plantResponse = await generatePlantResponse(plant, userMessage.content);
    
    // 3. Save the plant's response
    const plantChatMessage: Omit<ChatMessage, 'id'> = {
      sender: 'plant',
      content: plantResponse.content,
      emotion: plantResponse.emotion,
      timestamp: new Date(),
    };
    const savedPlantMessage = await this.addChatMessage(plant.id, plantChatMessage, userId);
    
    // 4. Return both persisted messages
    return [savedUserMessage, savedPlantMessage];
  }

  async addChatMessage(plantId: string, message: Omit<ChatMessage, 'id'>, userId: string): Promise<ChatMessage> {
    try {
      console.log('💬 Adding chat message:', { plantId, message, userId });
      
      const insertData = {
        plant_id: plantId,
        user_id: userId,
        sender: message.sender,
        content: message.content,
        emotion: message.emotion || null,
      };
      
      console.log('📤 Insert data:', insertData);
      
      const { data, error } = await supabase
        .from('chat_messages')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      return {
        id: data.id,
        sender: data.sender as 'user' | 'plant',
        content: data.content,
        timestamp: new Date(data.created_at!),
        emotion: data.emotion as any,
      };
    } catch (error) {
      console.error('Error adding chat message:', error);
      throw error;
    }
  }

  async addPlantImage(plantId: string, image: Omit<PlantImage, 'id'>, userId: string): Promise<PlantImage> {
    try {
      // The `image.url` coming in here is the base64 data URL
      const imagePath = `${userId}/${plantId}/${crypto.randomUUID()}.jpg`;
      const imageUrl = await uploadImage(image.url, 'plant-images', imagePath);
      
      const { data, error } = await supabase
        .from('plant_images')
        .insert({
          plant_id: plantId,
          user_id: userId,
          url: imageUrl, // This is the public URL from storage
          storage_path: imagePath,
          is_profile_image: image.isProfileImage,
          health_analysis: image.healthAnalysis as any,
        })
        .select()
        .single();

      if (error) throw error;
      if (!data.url) throw new Error('Image URL not returned from database.');

      return {
        id: data.id,
        url: data.url, // Return the public URL
        timestamp: new Date(data.created_at!),
        isProfileImage: data.is_profile_image || false,
        healthAnalysis: data.health_analysis as any,
      };
    } catch (error) {
      console.error('Error adding plant image:', error);
      throw new Error(`Image upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export const plantService = new PlantService(); 