import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ImageOptimizationService } from '../../../src/services/imageOptimizationService';

// Mock canvas and image APIs
const createMockCanvas = () => ({
  width: 0,
  height: 0,
  getContext: vi.fn(() => ({
    imageSmoothingEnabled: true,
    imageSmoothingQuality: 'high',
    clearRect: vi.fn(),
    drawImage: vi.fn(),
  })),
  toDataURL: vi.fn(() => 'data:image/jpeg;base64,mockdata'),
});

const createMockImage = (width = 800, height = 600) => ({
  width,
  height,
  onload: null as any,
  onerror: null as any,
  src: '',
  crossOrigin: '',
});

describe('ImageOptimizationService', () => {
  let service: ImageOptimizationService;

  beforeEach(() => {
    // Mock document.createElement
    vi.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'canvas') {
        return createMockCanvas() as any;
      }
      return {} as any;
    });

    service = new ImageOptimizationService();
  });

  describe('optimizeImage', () => {
    it('should generate multiple image sizes', async () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock image loading
      vi.spyOn(service as any, 'loadImage').mockResolvedValue(createMockImage(1200, 800));
      vi.spyOn(service as any, 'generateBlurPlaceholder').mockResolvedValue('data:blur');
      vi.spyOn(service as any, 'resizeAndCompress').mockResolvedValue('data:image/jpeg;base64,resized');

      const result = await service.optimizeImage(mockFile);

      expect(result).toHaveProperty('jpeg');
      expect(result).toHaveProperty('webp');
      expect(result).toHaveProperty('blurDataUrl');
      expect(result).toHaveProperty('aspectRatio');
      expect(result.aspectRatio).toBe(1.5); // 1200/800
    });

    it('should calculate correct aspect ratio', async () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      vi.spyOn(service as any, 'loadImage').mockResolvedValue(createMockImage(600, 400));
      vi.spyOn(service as any, 'generateBlurPlaceholder').mockResolvedValue('data:blur');
      vi.spyOn(service as any, 'resizeAndCompress').mockResolvedValue('data:image/jpeg;base64,test');

      const result = await service.optimizeImage(mockFile);

      expect(result.aspectRatio).toBe(1.5); // 600/400
    });

    it('should handle WebP generation when supported', async () => {
      const mockFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      vi.spyOn(service as any, 'loadImage').mockResolvedValue(createMockImage());
      vi.spyOn(service as any, 'generateBlurPlaceholder').mockResolvedValue('data:blur');
      vi.spyOn(service as any, 'resizeAndCompress').mockResolvedValue('data:image/webp;base64,test');
      vi.spyOn(service as any, 'supportsWebP').mockReturnValue(true);

      const result = await service.optimizeImage(mockFile, { generateWebP: true });

      expect(result.webp).toBeDefined();
    });
  });

  describe('calculateDimensions', () => {
    it('should maintain aspect ratio for landscape images', () => {
      const result = (service as any).calculateDimensions(1200, 800, 600);
      
      expect(result.width).toBe(600);
      expect(result.height).toBe(400); // 600 / 1.5
    });

    it('should maintain aspect ratio for portrait images', () => {
      const result = (service as any).calculateDimensions(800, 1200, 600);
      
      expect(result.width).toBe(400); // 600 * (800/1200)
      expect(result.height).toBe(600);
    });

    it('should handle square images correctly', () => {
      const result = (service as any).calculateDimensions(800, 800, 600);
      
      expect(result.width).toBe(600);
      expect(result.height).toBe(600);
    });
  });

  describe('getOptimalSource', () => {
    it('should return WebP when supported and available', () => {
      vi.spyOn(service as any, 'supportsWebP').mockReturnValue(true);
      
      const optimizedImage = {
        webp: { medium: 'webp-url' },
        jpeg: { medium: 'jpeg-url' },
        blurDataUrl: 'blur',
        aspectRatio: 1
      } as any;

      const result = service.getOptimalSource(optimizedImage, 'medium');
      expect(result).toBe('webp-url');
    });

    it('should fallback to JPEG when WebP not supported', () => {
      vi.spyOn(service as any, 'supportsWebP').mockReturnValue(false);
      
      const optimizedImage = {
        webp: { medium: 'webp-url' },
        jpeg: { medium: 'jpeg-url' },
        blurDataUrl: 'blur',
        aspectRatio: 1
      } as any;

      const result = service.getOptimalSource(optimizedImage, 'medium');
      expect(result).toBe('jpeg-url');
    });
  });

  describe('generateSrcSet', () => {
    it('should generate proper srcSet string', () => {
      const optimizedImage = {
        jpeg: {
          thumbnail: 'thumb-url',
          small: 'small-url',
          medium: 'medium-url',
          large: 'large-url'
        }
      } as any;

      const result = service.generateSrcSet(optimizedImage, 'jpeg');
      
      expect(result).toContain('thumb-url 150w');
      expect(result).toContain('small-url 300w');
      expect(result).toContain('medium-url 600w');
      expect(result).toContain('large-url 1200w');
    });

    it('should handle missing sizes gracefully', () => {
      const optimizedImage = {
        jpeg: {
          small: 'small-url',
          medium: 'medium-url'
        }
      } as any;

      const result = service.generateSrcSet(optimizedImage, 'jpeg');
      
      expect(result).toContain('small-url 300w');
      expect(result).toContain('medium-url 600w');
      expect(result).not.toContain('thumb-url');
      expect(result).not.toContain('large-url');
    });
  });
});