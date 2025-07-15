import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Helper function to convert data URL to Blob
const dataURLtoBlob = (dataurl: string): Blob => {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) {
    throw new Error('Invalid data URL');
  }
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

export const uploadImage = async (
  imageDataUrl: string,
  bucket: string,
  path: string
): Promise<string> => {
  try {
    const blob = dataURLtoBlob(imageDataUrl);
    const fileExt = blob.type.split('/')[1];
    const fileName = `${path}/${uuidv4()}.${fileExt}`;

    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, blob, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Error uploading image to Supabase Storage:', error);
      throw new Error(`Storage error: ${error.message}`);
    }
    
    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error('Could not get public URL for uploaded image.');
    }

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Failed to upload image:', error);
    if (error instanceof Error) {
      throw new Error(`Image upload failed: ${error.message}`);
    }
    throw new Error('An unknown error occurred during image upload.');
  }
}; 