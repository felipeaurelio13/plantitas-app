interface ImageSizes {
  thumbnail: string; // 150x150
  small: string;     // 300x300
  medium: string;    // 600x600
  large: string;     // 1200x1200
}

interface OptimizedImage {
  webp: ImageSizes;
  jpeg: ImageSizes;
  blurDataUrl: string;
  aspectRatio: number;
}

export class ImageOptimizationService {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  /**
   * Compress and optimize image with multiple sizes and formats
   */
  async optimizeImage(
    file: File | string,
    options: {
      quality?: number;
      generateSizes?: boolean;
      generateWebP?: boolean;
    } = {}
  ): Promise<OptimizedImage> {
    const {
      quality = 0.8,
      generateSizes = true,
      generateWebP = true
    } = options;

    const img = await this.loadImage(file);
    const aspectRatio = img.width / img.height;

    // Generate blur placeholder
    const blurDataUrl = await this.generateBlurPlaceholder(img);

    const sizes = generateSizes ? [150, 300, 600, 1200] : [600];
    const sizeKeys: (keyof ImageSizes)[] = ['thumbnail', 'small', 'medium', 'large'];

    const jpegSizes: Partial<ImageSizes> = {};
    const webpSizes: Partial<ImageSizes> = {};

    for (let i = 0; i < sizes.length; i++) {
      const size = sizes[i];
      const key = sizeKeys[i] || 'medium';
      
      // Calculate dimensions maintaining aspect ratio
      const { width, height } = this.calculateDimensions(img.width, img.height, size);

      // Generate JPEG
      const jpegDataUrl = await this.resizeAndCompress(img, width, height, 'image/jpeg', quality);
      jpegSizes[key] = jpegDataUrl;

      // Generate WebP if supported
      if (generateWebP && this.supportsWebP()) {
        const webpDataUrl = await this.resizeAndCompress(img, width, height, 'image/webp', quality);
        webpSizes[key] = webpDataUrl;
      }
    }

    return {
      jpeg: jpegSizes as ImageSizes,
      webp: webpSizes as ImageSizes,
      blurDataUrl,
      aspectRatio
    };
  }

  /**
   * Load image from File or data URL
   */
  private loadImage(source: File | string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => resolve(img);
      img.onerror = reject;

      if (typeof source === 'string') {
        img.src = source;
      } else {
        const reader = new FileReader();
        reader.onload = (e) => {
          img.src = e.target?.result as string;
        };
        reader.readAsDataURL(source);
      }
    });
  }

  /**
   * Calculate optimal dimensions for target size
   */
  private calculateDimensions(
    originalWidth: number, 
    originalHeight: number, 
    targetSize: number
  ): { width: number; height: number } {
    const aspectRatio = originalWidth / originalHeight;
    
    if (aspectRatio > 1) {
      // Landscape
      return {
        width: targetSize,
        height: Math.round(targetSize / aspectRatio)
      };
    } else {
      // Portrait or square
      return {
        width: Math.round(targetSize * aspectRatio),
        height: targetSize
      };
    }
  }

  /**
   * Resize and compress image
   */
  private async resizeAndCompress(
    img: HTMLImageElement,
    width: number,
    height: number,
    mimeType: string,
    quality: number
  ): Promise<string> {
    this.canvas.width = width;
    this.canvas.height = height;

    // Apply smooth scaling
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';

    // Clear canvas and draw resized image
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.drawImage(img, 0, 0, width, height);

    return this.canvas.toDataURL(mimeType, quality);
  }

  /**
   * Generate blur placeholder (low quality, small size)
   */
  private async generateBlurPlaceholder(img: HTMLImageElement): Promise<string> {
    const smallSize = 20;
    const { width, height } = this.calculateDimensions(img.width, img.height, smallSize);
    
    return this.resizeAndCompress(img, width, height, 'image/jpeg', 0.1);
  }

  /**
   * Check WebP support
   */
  private supportsWebP(): boolean {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
  }

  /**
   * Get optimal image source based on browser support and size
   */
  getOptimalSource(optimizedImage: OptimizedImage, size: keyof ImageSizes = 'medium'): string {
    if (this.supportsWebP() && optimizedImage.webp[size]) {
      return optimizedImage.webp[size];
    }
    return optimizedImage.jpeg[size] || optimizedImage.jpeg.medium;
  }

  /**
   * Generate srcSet for responsive images
   */
  generateSrcSet(optimizedImage: OptimizedImage, format: 'webp' | 'jpeg' = 'jpeg'): string {
    const sources = optimizedImage[format];
    const srcSetEntries: string[] = [];

    if (sources.thumbnail) srcSetEntries.push(`${sources.thumbnail} 150w`);
    if (sources.small) srcSetEntries.push(`${sources.small} 300w`);
    if (sources.medium) srcSetEntries.push(`${sources.medium} 600w`);
    if (sources.large) srcSetEntries.push(`${sources.large} 1200w`);

    return srcSetEntries.join(', ');
  }
}

// Singleton instance
export const imageOptimizationService = new ImageOptimizationService();