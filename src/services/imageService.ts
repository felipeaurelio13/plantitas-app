import { supabase } from '../lib/supabase';
import { v4 as uuidv4 } from 'uuid';

// Helper function to convert data URL to Blob
const dataURLtoBlob = (dataurl: string): Blob => {
  console.log('[imageService] Processing data URL, length:', dataurl?.length);
  console.log('[imageService] Data URL start:', dataurl?.substring(0, 50));
  
  if (!dataurl || typeof dataurl !== 'string') {
    throw new Error('Invalid data URL: input is not a string');
  }
  
  if (!dataurl.startsWith('data:')) {
    throw new Error('Invalid data URL: does not start with "data:"');
  }
  
  const arr = dataurl.split(',');
  if (arr.length !== 2) {
    throw new Error('Invalid data URL: incorrect format');
  }
  
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) {
    throw new Error('Invalid data URL: could not extract MIME type');
  }
  
  const mime = mimeMatch[1];
  console.log('[imageService] Detected MIME type:', mime);
  
  if (!mime.startsWith('image/')) {
    throw new Error(`Invalid data URL: not an image MIME type (${mime})`);
  }
  
  try {
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    
    console.log('[imageService] Successfully created blob with size:', u8arr.length);
    return new Blob([u8arr], { type: mime });
  } catch (error) {
    throw new Error(`Invalid data URL: failed to decode base64 data - ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
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