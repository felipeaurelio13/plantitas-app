import { supabase as supabaseDefault } from '../lib/supabase';
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
    funFacts: (p.fun_facts as string[]) || [],
    location: p.location,
    // Nuevos campos para ambiente y luz
    plantEnvironment: p.plant_environment as 'interior' | 'exterior' | 'ambos' | undefined,
    lightRequirements: p.light_requirements as 'poca_luz' | 'luz_indirecta' | 'luz_directa_parcial' | 'pleno_sol' | undefined,
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
  private supabase: typeof supabaseDefault;
  constructor(supabaseInstance: typeof supabaseDefault = supabaseDefault) {
    this.supabase = supabaseInstance;
  }

  async getUserPlantSummaries(userId: string): Promise<PlantSummary[]> {
    try {
      // Optimized single query with LEFT JOIN for profile images
      const { data: dbPlants, error: plantsError } = await this.supabase
        .from('plants')
        .select(`
          id,
          name,
          nickname,
          species,
          location,
          plant_environment,
          light_requirements,
          health_score,
          last_watered,
          care_profile,
          plant_images!left(url, is_profile_image)
        `)
        .eq('user_id', userId)
        .or('plant_images.is_profile_image.eq.true,plant_images.is.null')
        .order('created_at', { ascending: false });

      if (plantsError) throw plantsError;

      // Process results - each plant may have 0 or 1 profile image
      const profileImageMap = new Map<string, string>();
      
      // Extract profile images from the joined data
      dbPlants.forEach(plant => {
        if (plant.plant_images && plant.plant_images.length > 0) {
          const profileImage = plant.plant_images.find((img: any) => img.is_profile_image);
          if (profileImage) {
            profileImageMap.set(plant.id, profileImage.url);
          }
        }
      });

      const summaries: PlantSummary[] = dbPlants.map(plant => ({
        id: plant.id,
        name: plant.name,
        nickname: plant.nickname || undefined,
        species: plant.species,
        location: plant.location,
        // Nuevos campos para ambiente y luz
        plantEnvironment: plant.plant_environment as 'interior' | 'exterior' | 'ambos' | undefined,
        lightRequirements: plant.light_requirements as 'poca_luz' | 'luz_indirecta' | 'luz_directa_parcial' | 'pleno_sol' | undefined,
        healthScore: plant.health_score || 85,
        profileImageUrl: profileImageMap.get(plant.id),
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
      const { data: dbPlants, error } = await this.supabase
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
      const { data: plant, error } = await this.supabase
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
      console.log('[PlantService] Iniciando análisis IA...');
      const analysis = await analyzeImage(imageDataUrl);
      console.log('[PlantService] Resultado IA:', analysis);

      const plantToCreate: Omit<Plant, 'id' | 'images' | 'chatHistory' | 'notifications'> = {
        name: analysis.commonName,
        species: analysis.species,
        description: analysis.generalDescription,
        funFacts: analysis.funFacts,
        variety: analysis.variety ?? undefined,
        nickname: analysis.commonName,
        location,
        plantEnvironment: analysis.plantEnvironment,
        lightRequirements: analysis.lightRequirements,
        dateAdded: new Date(),
        healthScore: analysis.health.confidence,
        careProfile: analysis.careProfile,
        personality: analysis.personality,
      };
      console.log('[PlantService] Payload a createPlant:', plantToCreate);

      const newPlant = await this.createPlant(plantToCreate, userId);
      console.log('[PlantService] Planta creada:', newPlant);

      (async () => {
        let imageUploadSuccess = false;
        let chatInitSuccess = false;
        try {
          console.log(`[PlantService] Starting image upload for plant ${newPlant.id}`);
          const imageUrl = await uploadImage(
            imageDataUrl, 
            'plant-images',
            `${userId}/${newPlant.id}`
          );
          console.log(`[PlantService] Imagen subida:`, imageUrl);
          await this.addPlantImage(newPlant.id, {
            url: imageUrl,
            timestamp: new Date(),
            isProfileImage: true,
            healthAnalysis: analysis.health,
          }, userId);
          imageUploadSuccess = true;
          console.log(`[PlantService] Image upload completed for plant ${newPlant.id}`);
        } catch (imageError) {
          console.error(`[PlantService] Image upload failed for plant ${newPlant.id}:`, imageError);
          alert('Error subiendo imagen: ' + (imageError instanceof Error ? imageError.message : JSON.stringify(imageError)));
        }
        try {
          console.log(`[PlantService] Starting chat initialization for plant ${newPlant.id}`);
          const greetingResponse = await generatePlantResponse(newPlant, "¡Hola! Acabo de llegar. ¿Cómo te llamas?");
          console.log(`[PlantService] Respuesta IA chat:`, greetingResponse);
          await this.addChatMessage(newPlant.id, {
            sender: 'plant',
            content: greetingResponse.content,
            timestamp: new Date(),
            emotion: greetingResponse.emotion,
          }, userId);
          chatInitSuccess = true;
          console.log(`[PlantService] Chat initialization completed for plant ${newPlant.id}`);
        } catch (chatError) {
          console.error(`[PlantService] Chat initialization failed for plant ${newPlant.id}:`, chatError);
          alert('Error inicializando chat: ' + (chatError instanceof Error ? chatError.message : JSON.stringify(chatError)));
        }
        if (imageUploadSuccess && chatInitSuccess) {
          console.log(`[PlantService] All background tasks for plant ${newPlant.id} completed successfully.`);
        } else if (imageUploadSuccess || chatInitSuccess) {
          console.log(`[PlantService] Background tasks for plant ${newPlant.id} partially completed.`);
        }
      })().catch((backgroundError) => {
        console.error(`[PlantService] Error during background tasks for plant ${newPlant.id}:`, backgroundError);
        alert('Error en tareas de fondo: ' + (backgroundError instanceof Error ? backgroundError.message : JSON.stringify(backgroundError)));
      });
      return newPlant;
    } catch (error) {
      console.error('Error adding plant from analysis:', error);
      alert('Error creando planta: ' + (error instanceof Error ? error.message : JSON.stringify(error)));
      throw error;
    }
  }

  async createPlant(
    plantData: Omit<Plant, 'id' | 'images' | 'chatHistory' | 'notifications'>,
    userId: string
  ): Promise<Plant> {
    try {
      const dbPlant: Omit<DBPlant, 'id' | 'created_at'> = {
        user_id: userId,
        name: plantData.name,
        species: plantData.species,
        variety: plantData.variety || null,
        nickname: plantData.nickname || null,
        description: plantData.description || null,
        fun_facts: plantData.funFacts || null,
        location: plantData.location,
        plant_environment: plantData.plantEnvironment || null,
        light_requirements: plantData.lightRequirements || null,
        date_added: plantData.dateAdded.toISOString(),
        last_watered: null,
        last_fertilized: null,
        health_score: plantData.healthScore,
        care_profile: plantData.careProfile as any,
        personality: plantData.personality as any,
        updated_at: null,
      };
      console.log('[PlantService] Payload a Supabase:', dbPlant);
      const { data: newDbPlant, error } = await this.supabase
        .from('plants')
        .insert(dbPlant)
        .select('*')
        .single();
      console.log('[PlantService] Respuesta Supabase:', newDbPlant, error);
      if (error) {
        console.error('Supabase error:', {
          message: error.message,
          details: error.details,
          code: error.code,
        });
        alert('Error Supabase: ' + error.message);
        throw new Error(`Supabase error creating plant: ${error.message}`);
      }
      if (!newDbPlant) {
        alert('No se pudo crear la planta en la base de datos, no se devolvieron datos.');
        throw new Error('Failed to create plant in the database, no data returned.');
      }
      return transformDBPlantToPlant(newDbPlant, [], [], []);
    } catch (error) {
      console.error('Error creating plant:', error);
      alert('Error creando planta: ' + (error instanceof Error ? error.message : JSON.stringify(error)));
      throw error;
    }
  }

  /**
   * Actualiza información específica de una planta (como ambiente y luz)
   */
  async updatePlantInfo(
    plantId: string,
    userId: string,
    updates: {
      plantEnvironment?: 'interior' | 'exterior' | 'ambos';
      lightRequirements?: 'poca_luz' | 'luz_indirecta' | 'luz_directa_parcial' | 'pleno_sol';
      description?: string;
      funFacts?: string[];
    }
  ): Promise<Plant> {
    try {
      const updateData: any = {};
      
      if (updates.plantEnvironment !== undefined) {
        updateData.plant_environment = updates.plantEnvironment;
      }
      if (updates.lightRequirements !== undefined) {
        updateData.light_requirements = updates.lightRequirements;
      }
      if (updates.description !== undefined) {
        updateData.description = updates.description;
      }
      if (updates.funFacts !== undefined) {
        updateData.fun_facts = updates.funFacts;
      }

      const { data: updatedPlant, error } = await this.supabase
        .from('plants')
        .update(updateData)
        .eq('id', plantId)
        .eq('user_id', userId)
        .select('*')
        .single();

      if (error) {
        console.error('Supabase error updating plant:', error);
        throw new Error(`Error updating plant: ${error.message}`);
      }

      if (!updatedPlant) {
        throw new Error('Plant not found or not updated.');
      }

      // Retornar la planta actualizada (sin imágenes, chat, etc. para simplificar)
      return transformDBPlantToPlant(updatedPlant, [], [], []);
    } catch (error) {
      console.error('Error updating plant info:', error);
      throw error;
    }
  }

  /**
   * Actualiza el score de salud de una planta en la base de datos
   */
  async updatePlantHealthScore(
    plantId: string,
    userId: string,
    healthScore: number,
    healthAnalysis?: any,
    imageId?: string
  ): Promise<void> {
    try {
      console.log('🏥 [DB] Actualizando health score en BD:', {
        plantId,
        healthScore,
        hasAnalysis: !!healthAnalysis
      });

      // Actualizar el health score de la planta
      const { error: plantError } = await this.supabase
        .from('plants')
        .update({ health_score: healthScore })
        .eq('id', plantId)
        .eq('user_id', userId);

      if (plantError) {
        console.error('💥 [DB] Error actualizando health score:', plantError);
        throw new Error(`Error updating plant health score: ${plantError.message}`);
      }

      // Si tenemos análisis de salud e ID de imagen, actualizar también la imagen
      if (healthAnalysis && imageId) {
        console.log('📸 [DB] Actualizando análisis de salud en imagen:', imageId);
        
        const { error: imageError } = await this.supabase
          .from('plant_images')
          .update({ health_analysis: healthAnalysis })
          .eq('id', imageId)
          .eq('user_id', userId);

        if (imageError) {
          console.warn('⚠️ [DB] Error actualizando análisis en imagen:', imageError);
          // No lanzamos error aquí porque el health score ya se actualizó exitosamente
        }
      }

      console.log('✅ [DB] Health score actualizado exitosamente');
    } catch (error) {
      console.error('💥 [DB] Error en updatePlantHealthScore:', error);
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
        description: plant.description,
        fun_facts: plant.funFacts,
        location: plant.location,
        health_score: plant.healthScore,
        care_profile: plant.careProfile as any,
        personality: plant.personality as any,
        last_watered: plant.lastWatered?.toISOString(),
        last_fertilized: plant.lastFertilized?.toISOString(),
      };

      const { data, error } = await this.supabase
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
      const { error } = await this.supabase
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
    // 2.1. Si plantResponse tiene insights o acciones, incluirlas en context
    const context: any = {};
    if (plantResponse.insights) context.insights = plantResponse.insights;
    if (plantResponse.suggestedActions) context.suggestedActions = plantResponse.suggestedActions;

    // 3. Save the plant's response
    const plantChatMessage: Omit<ChatMessage, 'id'> = {
      sender: 'plant',
      content: plantResponse.content,
      emotion: plantResponse.emotion,
      timestamp: new Date(),
      ...(Object.keys(context).length > 0 ? { context } : {}),
    };
    const savedPlantMessage = await this.addChatMessage(plant.id, plantChatMessage, userId);
    // 4. Return both persisted messages
    return [savedUserMessage, savedPlantMessage];
  }

  async addChatMessage(plantId: string, message: Omit<ChatMessage, 'id'>, userId: string): Promise<ChatMessage> {
    try {
      if (import.meta.env.DEV) console.log('💬 Adding chat message:', { plantId, message, userId });
      const insertData: any = {
        plant_id: plantId,
        user_id: userId,
        sender: message.sender,
        content: message.content,
        emotion: message.emotion || null,
      };
      if (message.context) {
        insertData.context = message.context;
      }
      if (import.meta.env.DEV) console.log('📤 Insert data:', insertData);
      const { data, error } = await this.supabase
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
        context: data.context || undefined,
      };
    } catch (error) {
      console.error('Error adding chat message:', error);
      throw error;
    }
  }

  async addPlantImage(plantId: string, image: Omit<PlantImage, 'id'>, userId: string): Promise<PlantImage> {
    try {
      // The `image.url` is already the uploaded URL from Supabase Storage
      const imageUrl = image.url;
      
      // Extract the storage path from the URL if available
      let storagePath = '';
      try {
        const url = new URL(imageUrl);
        const pathParts = url.pathname.split('/');
        const objectIndex = pathParts.findIndex(part => part === 'object');
        if (objectIndex !== -1 && objectIndex + 2 < pathParts.length) {
          storagePath = pathParts.slice(objectIndex + 2).join('/');
        }
      } catch (error) {
        console.warn('Could not extract storage path from URL:', imageUrl);
        storagePath = `${userId}/${plantId}/${Date.now()}.jpg`;
      }
      
              const { data, error } = await this.supabase
        .from('plant_images')
        .insert({
          plant_id: plantId,
          user_id: userId,
          url: imageUrl, // This is the public URL from storage
          storage_path: storagePath,
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

  /**
   * Actualiza una imagen como imagen de perfil principal
   */
  async setProfileImage(plantId: string, imageId: string, userId: string): Promise<void> {
    try {
      // Primero, quitar la marca de perfil de todas las imágenes existentes
      await this.supabase
        .from('plant_images')
        .update({ is_profile_image: false })
        .eq('plant_id', plantId)
        .eq('user_id', userId);

      // Luego, marcar la imagen seleccionada como de perfil
      const { error } = await this.supabase
        .from('plant_images')
        .update({ is_profile_image: true })
        .eq('id', imageId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error setting profile image:', error);
      throw error;
    }
  }

  /**
   * Elimina una imagen de una planta
   */
  async deleteImage(imageId: string, userId: string): Promise<void> {
    try {
      // Obtener información de la imagen antes de eliminar
      const { data: imageData, error: fetchError } = await this.supabase
        .from('plant_images')
        .select('storage_path')
        .eq('id', imageId)
        .eq('user_id', userId)
        .single();

      if (fetchError) throw fetchError;

      // Eliminar imagen de Storage si existe path
      if (imageData?.storage_path) {
        await this.supabase.storage
          .from('plant-images')
          .remove([imageData.storage_path]);
      }

      // Eliminar registro de la base de datos
      const { error } = await this.supabase
        .from('plant_images')
        .delete()
        .eq('id', imageId)
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }
}

export const plantService = new PlantService(supabaseDefault); 