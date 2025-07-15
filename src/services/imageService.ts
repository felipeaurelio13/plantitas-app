import { supabase } from '../lib/supabase';
import { supabaseUrl } from '../lib/supabase';

export class ImageService {
  private bucketName = 'plant-images';

  /**
   * Constructs the public URL for a given file path in Supabase Storage.
   * This is a performant, synchronous operation.
   * @param path The path to the file in the storage bucket.
   * @returns The full public URL for the image.
   */
  getPublicUrlForPath(path: string): string {
    // If the path is already a full URL, return it directly.
    if (path.startsWith('http')) {
      return path;
    }
    return `${supabaseUrl}/storage/v1/object/public/${this.bucketName}/${path}`;
  }

  async uploadImage(userId: string, plantId: string, file: File): Promise<string> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${userId}/${plantId}/${fileName}`;

      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      return data.path;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  async uploadImageFromDataUrl(userId: string, plantId: string, dataUrl: string): Promise<string> {
    try {
      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      // Create file from blob
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.jpg`;
      const file = new File([blob], fileName, { type: 'image/jpeg' });
      
      return await this.uploadImage(userId, plantId, file);
    } catch (error) {
      console.error('Error uploading image from data URL:', error);
      throw error;
    }
  }

  /**
   * @deprecated Use `getPublicUrlForPath` for better performance. This method makes an unnecessary API call.
   */
  async getImageUrl(path: string): Promise<string> {
    try {
      const { data } = await supabase.storage
        .from(this.bucketName)
        .getPublicUrl(path);

      return data.publicUrl;
    } catch (error) {
      console.error('Error getting image URL:', error);
      throw error;
    }
  }

  async deleteImage(path: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([path]);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  async getUserImages(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list(userId, {
          limit: 100,
          offset: 0,
        });

      if (error) throw error;

      return data.map(file => `${userId}/${file.name}`);
    } catch (error) {
      console.error('Error listing user images:', error);
      throw error;
    }
  }

  async getPlantImages(userId: string, plantId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .list(`${userId}/${plantId}`, {
          limit: 100,
          offset: 0,
        });

      if (error) throw error;

      return data.map(file => `${userId}/${plantId}/${file.name}`);
    } catch (error) {
      console.error('Error listing plant images:', error);
      throw error;
    }
  }
}

export const imageService = new ImageService(); 