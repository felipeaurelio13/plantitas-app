import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as imageService from '../../../src/services/imageService';

// Mock de Supabase
vi.mock('../../../src/lib/supabase', () => ({
  supabase: {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(),
        getPublicUrl: vi.fn(),
        remove: vi.fn()
      }))
    }
  }
}));

describe('imageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Solo tests para uploadImage y validateImageSize, usando dataURL string
  describe('uploadImage', () => {
    const validDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVRPUjozRTI0QjYzQzAtN0QzQy00QzEwLThFQjUtQzYwQzYwQzYwQzYw';
    const invalidDataUrl = 'data:text/plain;base64,SGVsbG8sIHdvcmxkIQ==';

    it('should upload image successfully', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      const mockUrl = 'https://example.com/test-image.jpg';

      (supabase.storage.from as any).mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: { path: 'plants/test-image.jpg' },
          error: null
        }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: mockUrl }
        }),
        remove: vi.fn()
      });

      const result = await imageService.uploadImage(validDataUrl, 'plant-images', 'plants');

      expect(supabase.storage.from).toHaveBeenCalledWith('plant-images');
      expect(result).toBe(mockUrl);
    });

    it('should handle upload errors', async () => {
      const { supabase } = await import('../../../src/lib/supabase');

      (supabase.storage.from as any).mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Upload failed' }
        }),
        getPublicUrl: vi.fn(),
        remove: vi.fn()
      });

      await expect(imageService.uploadImage(validDataUrl, 'plant-images', 'plants')).rejects.toThrow();
    });

    it('should handle network errors', async () => {
      const { supabase } = await import('../../../src/lib/supabase');

      (supabase.storage.from as any).mockReturnValue({
        upload: vi.fn().mockRejectedValue(new Error('Network error')),
        getPublicUrl: vi.fn(),
        remove: vi.fn()
      });

      await expect(imageService.uploadImage(validDataUrl, 'plant-images', 'plants')).rejects.toThrow('Network error');
    });

    it('should validate file type', async () => {
      await expect(imageService.uploadImage(invalidDataUrl, 'plant-images', 'plants')).rejects.toThrow();
    });

    it('should handle large files', async () => {
      // El dataURL supera el límite de 5MB (5*1024*1024*4/3 = ~7MB base64)
      const largeDataUrl = 'data:image/jpeg;base64,' + 'A'.repeat(8 * 1024 * 1024); // 8MB base64
      await expect(imageService.uploadImage(largeDataUrl, 'plant-images', 'plants')).rejects.toThrow(/demasiado grande/i);
    });
  });

  describe('validateImageSize', () => {
    const validDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVRPUjozRTI0QjYzQzAtN0QzQy00QzEwLThFQjUtQzYwQzYwQzYwQzYw';
    it('should validate file size', () => {
      expect(() => imageService.validateImageSize(validDataUrl)).not.toThrow();
      const largeDataUrl = 'data:image/jpeg;base64,' + 'A'.repeat(8 * 1024 * 1024); // 8MB base64
      expect(() => imageService.validateImageSize(largeDataUrl)).toThrow(/demasiado grande/i);
    });
  });

  describe('error handling', () => {
    const validDataUrl = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD//gA7Q1JFQVRPUjozRTI0QjYzQzAtN0QzQy00QzEwLThFQjUtQzYwQzYwQzYwQzYw';
    it('should handle invalid file input', async () => {
      await expect(imageService.uploadImage(null as any, 'plant-images', 'plants')).rejects.toThrow(/not a string|inválida/i);
    });
    it('should handle empty file', async () => {
      await expect(imageService.uploadImage('', 'plant-images', 'plants')).rejects.toThrow();
    });
    it('should handle storage bucket errors', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      (supabase.storage.from as any).mockReturnValue({
        upload: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Storage bucket not found' }
        }),
        getPublicUrl: vi.fn(),
        remove: vi.fn()
      });
      await expect(imageService.uploadImage(validDataUrl, 'plant-images', 'plants')).rejects.toThrow(/storage bucket not found/i);
    });
    it('should handle timeout errors', async () => {
      const { supabase } = await import('../../../src/lib/supabase');
      (supabase.storage.from as any).mockReturnValue({
        upload: vi.fn().mockRejectedValue(new Error('Timeout')),
        getPublicUrl: vi.fn(),
        remove: vi.fn()
      });
      await expect(imageService.uploadImage(validDataUrl, 'plant-images', 'plants')).rejects.toThrow(/timeout/i);
    });
  });
}); 