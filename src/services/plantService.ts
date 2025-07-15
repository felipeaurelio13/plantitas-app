import { supabase } from '../lib/supabase';
import { Tables, TablesInsert, TablesUpdate } from '../lib/database.types';
import {
  Plant,
  PlantImage,
  ChatMessage,
  PlantNotification,
  CareProfile,
  PlantPersonality,
  PlantSummary,
} from '../schemas';
import { imageService } from './imageService';
import { generatePlantResponse } from './aiService';

type DBPlant = Tables<'plants'>;
type DBPlantInsert = TablesInsert<'plants'>;
type DBPlantUpdate = TablesUpdate<'plants'>;
// Type aliases for future use
// type DBChatMessage = Tables<'chat_messages'>;
// type DBPlantImage = Tables<'plant_images'>;
// type DBPlantNotification = Tables<'plant_notifications'>;

// Convert database plant to app plant format
const transformDBPlantToPlant = (
  dbPlant: DBPlant,
  images: PlantImage[] = [],
  chatHistory: ChatMessage[] = [],
  notifications: PlantNotification[] = []
): Plant => ({
  id: dbPlant.id,
  name: dbPlant.name,
  species: dbPlant.species,
  variety: dbPlant.variety ?? undefined,
  nickname: dbPlant.nickname ?? undefined,
  location: dbPlant.location,
  dateAdded: new Date(dbPlant.date_added ?? dbPlant.created_at!),
  lastWatered: dbPlant.last_watered ? new Date(dbPlant.last_watered) : undefined,
  lastFertilized: dbPlant.last_fertilized ? new Date(dbPlant.last_fertilized) : undefined,
  images,
  healthScore: dbPlant.health_score || 85,
  careProfile: dbPlant.care_profile as unknown as CareProfile,
  personality: dbPlant.personality as unknown as PlantPersonality,
  chatHistory,
  notifications,
});

// Convert app plant to database format
const transformPlantToDBPlant = (plant: Plant, userId: string): DBPlantInsert => ({
  user_id: userId,
  name: plant.name,
  species: plant.species,
  variety: plant.variety,
  nickname: plant.nickname,
  location: plant.location,
  health_score: plant.healthScore,
  care_profile: plant.careProfile as any,
  personality: plant.personality as any,
  date_added: plant.dateAdded.toISOString(),
  last_watered: plant.lastWatered?.toISOString(),
  last_fertilized: plant.lastFertilized?.toISOString(),
});

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
          plant_images ( storage_path )
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
          ? imageService.getPublicUrlForPath(plant.plant_images[0].storage_path)
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
            url: imageService.getPublicUrlForPath(img.storage_path),
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
          url: imageService.getPublicUrlForPath(img.storage_path),
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

  async createPlant(plant: Omit<Plant, 'id'>, userId: string): Promise<Plant> {
    try {
      const plantData = transformPlantToDBPlant(plant as Plant, userId);
      
      const { data, error } = await supabase
        .from('plants')
        .insert(plantData)
        .select()
        .single();

      if (error) throw error;

      return transformDBPlantToPlant(data, plant.images, plant.chatHistory, plant.notifications);
    } catch (error) {
      console.error('Error creating plant:', error);
      throw error;
    }
  }

  async updatePlant(plant: Plant, userId: string): Promise<Plant> {
    try {
      const updateData: DBPlantUpdate = {
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
      // Upload image to Supabase Storage if it's a data URL
      let storagePath = image.url;
      if (image.url.startsWith('data:')) {
        storagePath = await imageService.uploadImageFromDataUrl(userId, plantId, image.url);
      }

      const { data, error } = await supabase
        .from('plant_images')
        .insert({
          plant_id: plantId,
          user_id: userId,
          storage_path: storagePath,
          health_analysis: image.healthAnalysis as any,
          is_profile_image: image.isProfileImage,
        })
        .select()
        .single();

      if (error) throw error;

      // Get the public URL for the image
      const publicUrl = await imageService.getImageUrl(storagePath);

      return {
        id: data.id,
        url: publicUrl,
        timestamp: new Date(data.created_at!),
        healthAnalysis: data.health_analysis as any,
        isProfileImage: data.is_profile_image || false,
      };
    } catch (error) {
      console.error('Error adding plant image:', error);
      throw error;
    }
  }
}

export const plantService = new PlantService(); 