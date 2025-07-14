import { supabase } from '../lib/supabase';
import { Tables, TablesInsert, TablesUpdate } from '../lib/database.types';
import {
  Plant,
  PlantImage,
  ChatMessage,
  PlantNotification,
  CareProfile,
  PlantPersonality,
} from '../schemas';
import { imageService } from './imageService';

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
  variety: dbPlant.variety || undefined,
  nickname: dbPlant.nickname || undefined,
  location: dbPlant.location,
  dateAdded: new Date(dbPlant.date_added || dbPlant.created_at!),
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
  async getUserPlants(userId: string): Promise<Plant[]> {
    try {
      // Get plants with associated data
      const { data: plants, error } = await supabase
        .from('plants')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get images for all plants
      const plantIds = plants.map(p => p.id);
      const { data: images } = await supabase
        .from('plant_images')
        .select('*')
        .in('plant_id', plantIds)
        .order('created_at', { ascending: false });

      // Get chat messages for all plants
      const { data: messages } = await supabase
        .from('chat_messages')
        .select('*')
        .in('plant_id', plantIds)
        .order('created_at', { ascending: true });

      // Get notifications for all plants
      const { data: notifications } = await supabase
        .from('plant_notifications')
        .select('*')
        .in('plant_id', plantIds)
        .order('scheduled_for', { ascending: true });

      // Group data by plant
      const plantsWithData = await Promise.all(plants.map(async plant => {
        const plantImages: PlantImage[] = await Promise.all(
          (images || [])
            .filter(img => img.plant_id === plant.id)
            .map(async img => ({
              id: img.id,
              url: await imageService.getImageUrl(img.storage_path),
              timestamp: new Date(img.created_at!),
              healthAnalysis: img.health_analysis as any,
              isProfileImage: img.is_profile_image || false,
            }))
        );

        const chatHistory: ChatMessage[] = (messages || [])
          .filter(msg => msg.plant_id === plant.id)
          .map(msg => ({
            id: msg.id,
            sender: msg.sender as 'user' | 'plant',
            content: msg.content,
            timestamp: new Date(msg.created_at!),
            emotion: msg.emotion as any,
          }));

        const plantNotifications: PlantNotification[] = (notifications || [])
          .filter(notif => notif.plant_id === plant.id)
          .map(notif => ({
            id: notif.id,
            type: notif.type as any,
            title: notif.title,
            message: notif.message,
            priority: notif.priority as any || 'medium',
            scheduledFor: new Date(notif.scheduled_for),
            completed: notif.completed || false,
          }));

        return transformDBPlantToPlant(plant, plantImages, chatHistory, plantNotifications);
      }));

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
        .select('*')
        .eq('id', plantId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      // Get associated data
      const [imagesResult, messagesResult, notificationsResult] = await Promise.all([
        supabase
          .from('plant_images')
          .select('*')
          .eq('plant_id', plantId)
          .order('created_at', { ascending: false }),
        supabase
          .from('chat_messages')
          .select('*')
          .eq('plant_id', plantId)
          .order('created_at', { ascending: true }),
        supabase
          .from('plant_notifications')
          .select('*')
          .eq('plant_id', plantId)
          .order('scheduled_for', { ascending: true })
      ]);

      const images: PlantImage[] = await Promise.all(
        (imagesResult.data || []).map(async img => ({
          id: img.id,
          url: await imageService.getImageUrl(img.storage_path),
          timestamp: new Date(img.created_at!),
          healthAnalysis: img.health_analysis as any,
          isProfileImage: img.is_profile_image || false,
        }))
      );

      const chatHistory: ChatMessage[] = (messagesResult.data || []).map(msg => ({
        id: msg.id,
        sender: msg.sender as 'user' | 'plant',
        content: msg.content,
        timestamp: new Date(msg.created_at!),
        emotion: msg.emotion as any,
      }));

      const notifications: PlantNotification[] = (notificationsResult.data || []).map(notif => ({
        id: notif.id,
        type: notif.type as any,
        title: notif.title,
        message: notif.message,
        priority: notif.priority as any || 'medium',
        scheduledFor: new Date(notif.scheduled_for),
        completed: notif.completed || false,
      }));

      return transformDBPlantToPlant(plant, images, chatHistory, notifications);
    } catch (error) {
      console.error('Error fetching plant:', error);
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