// Use global firebase object from compat SDKs
declare const firebase: any;

// Removed as plantService handles image upload directly
// const MAX_IMAGE_SIZE_MB = 5;
// const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

// Helper function to validate image size - No longer needed here
// export const validateImageSize = (dataUrl: string): void => {
//   if (!dataUrl || typeof dataUrl !== 'string') {
//     throw new Error('URL de imagen inválida');
//   }
//   const base64String = dataUrl.split(',')[1];
//   if (!base64String) {
//     throw new Error('Formato de imagen inválido');
//   }
//   const sizeInBytes = (base64String.length * 3) / 4;
//   if (sizeInBytes > MAX_IMAGE_SIZE_BYTES) {
//     const sizeInMB = (sizeInBytes / (1024 * 1024)).toFixed(1);
//     throw new Error(`La imagen es demasiado grande (${sizeInMB}MB). El límite máximo es ${MAX_IMAGE_SIZE_MB}MB. Por favor, usa una imagen más pequeña.`);
//   }
//   console.log(`[imageService] Image size validation passed: ${(sizeInBytes / (1024 * 1024)).toFixed(2)}MB`);
// };

// Helper function to convert data URL to Blob - No longer needed here
// const dataURLtoBlob = (dataurl: string): Blob => {
//   if (import.meta.env.DEV) {
//     console.log('[imageService] Processing data URL, length:', dataurl?.length);
//     console.log('[imageService] Data URL start:', dataurl?.substring(0, 50));
//   }
//   if (!dataurl || typeof dataurl !== 'string') {
//     throw new Error('Invalid data URL: input is not a string');
//   }
//   if (!dataurl.startsWith('data:')) {
//     throw new Error('Invalid data URL: does not start with "data:"');
//   }
//   const arr = dataurl.split(',');
//   if (arr.length !== 2) {
//     throw new Error('Invalid data URL: incorrect format');
//   }
//   const mimeMatch = arr[0].match(/:(.*?);/);
//   if (!mimeMatch) {
//     throw new Error('Invalid data URL: could not extract MIME type');
//   }
//   const mime = mimeMatch[1];
//   if (import.meta.env.DEV) console.log('[imageService] Detected MIME type:', mime);
//   if (!mime.startsWith('image/')) {
//     throw new Error(`Invalid data URL: not an image MIME type (${mime})`);
//   }
//   try {
//     const bstr = atob(arr[1]);
//     let n = bstr.length;
//     const u8arr = new Uint8Array(n);
//     while (n--) {
//       u8arr[n] = bstr.charCodeAt(n);
//     }
//     if (import.meta.env.DEV) console.log('[imageService] Successfully created blob with size:', u8arr.length);
//     return new Blob([u8arr], { type: mime });
//   } catch (error) {
//     throw new Error(`Invalid data URL: failed to decode base64 data - ${error instanceof Error ? error.message : 'Unknown error'}`);
//   }
// };

// This function is no longer needed as plantService handles image upload directly
export const uploadImage = async (
  imageDataUrl: string,
  bucket: string,
  path: string
): Promise<string> => {
    console.warn('ImageService.uploadImage is deprecated and should not be called directly. Use PlantService.addPlantImage instead.');
    throw new Error('Deprecated function: Use PlantService.addPlantImage.');
}; 