import { describe, it, expect } from 'vitest';
import { 
  formatDate, 
  formatHealthScore, 
  getHealthColor, 
  validateImageFile,
  truncateText,
  generatePlantId,
  calculateAverageHealth,
  formatTimeAgo
} from '../../../src/lib/utils';

describe('Utils Functions', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const formatted = formatDate(date);
      
      expect(formatted).toMatch(/15 de enero de 2024/);
    });

    it('should handle invalid date', () => {
      const invalidDate = new Date('invalid');
      const formatted = formatDate(invalidDate);
      
      expect(formatted).toBe('Fecha inválida');
    });
  });

  describe('formatHealthScore', () => {
    it('should format health score as percentage', () => {
      expect(formatHealthScore(85)).toBe('85%');
      expect(formatHealthScore(0)).toBe('0%');
      expect(formatHealthScore(100)).toBe('100%');
    });

    it('should handle decimal scores', () => {
      expect(formatHealthScore(85.5)).toBe('86%');
      expect(formatHealthScore(85.4)).toBe('85%');
    });
  });

  describe('getHealthColor', () => {
    it('should return green for good health', () => {
      expect(getHealthColor(90)).toBe('text-green-500');
      expect(getHealthColor(85)).toBe('text-green-500');
      expect(getHealthColor(80)).toBe('text-green-500');
    });

    it('should return yellow for moderate health', () => {
      expect(getHealthColor(70)).toBe('text-yellow-500');
      expect(getHealthColor(60)).toBe('text-yellow-500');
      expect(getHealthColor(50)).toBe('text-yellow-500');
    });

    it('should return red for poor health', () => {
      expect(getHealthColor(40)).toBe('text-red-500');
      expect(getHealthColor(30)).toBe('text-red-500');
      expect(getHealthColor(20)).toBe('text-red-500');
    });

    it('should handle edge cases', () => {
      expect(getHealthColor(100)).toBe('text-green-500');
      expect(getHealthColor(0)).toBe('text-red-500');
      expect(getHealthColor(-10)).toBe('text-red-500');
    });
  });

  describe('validateImageFile', () => {
    it('should validate correct image file', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = validateImageFile(file);
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should reject non-image files', () => {
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const result = validateImageFile(file);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('Tipo de archivo no válido');
    });

    it('should reject files that are too large', () => {
      // Crear un archivo que simule ser muy grande
      const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      const result = validateImageFile(largeFile);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('El archivo es demasiado grande');
    });

    it('should accept various image formats', () => {
      const jpegFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const pngFile = new File(['test'], 'test.png', { type: 'image/png' });
      const webpFile = new File(['test'], 'test.webp', { type: 'image/webp' });
      
      expect(validateImageFile(jpegFile).isValid).toBe(true);
      expect(validateImageFile(pngFile).isValid).toBe(true);
      expect(validateImageFile(webpFile).isValid).toBe(true);
    });
  });

  describe('truncateText', () => {
    it('should truncate long text', () => {
      const longText = 'Este es un texto muy largo que debería ser truncado para mostrar solo una parte del contenido original';
      const truncated = truncateText(longText, 20);
      
      expect(truncated).toBe('Este es un texto muy...');
      expect(truncated.length).toBeLessThanOrEqual(23); // 20 + 3 for '...'
    });

    it('should not truncate short text', () => {
      const shortText = 'Texto corto';
      const result = truncateText(shortText, 20);
      
      expect(result).toBe(shortText);
    });

    it('should handle empty string', () => {
      expect(truncateText('', 10)).toBe('');
    });

    it('should handle null or undefined', () => {
      expect(truncateText(null as any, 10)).toBe('');
      expect(truncateText(undefined as any, 10)).toBe('');
    });
  });

  describe('generatePlantId', () => {
    it('should generate unique IDs', () => {
      const id1 = generatePlantId();
      const id2 = generatePlantId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
    });

    it('should generate IDs with correct format', () => {
      const id = generatePlantId();
      
      // Debería ser un UUID v4
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    });
  });

  describe('calculateAverageHealth', () => {
    it('should calculate average health correctly', () => {
      const plants = [
        { healthScore: 80 },
        { healthScore: 90 },
        { healthScore: 70 }
      ];
      
      const average = calculateAverageHealth(plants);
      expect(average).toBe(80);
    });

    it('should handle empty array', () => {
      const average = calculateAverageHealth([]);
      expect(average).toBe(0);
    });

    it('should handle plants without health score', () => {
      const plants = [
        { healthScore: 80 },
        { healthScore: undefined },
        { healthScore: 90 }
      ];
      
      const average = calculateAverageHealth(plants);
      expect(average).toBe(85); // (80 + 90) / 2
    });

    it('should round to nearest integer', () => {
      const plants = [
        { healthScore: 85 },
        { healthScore: 86 }
      ];
      
      const average = calculateAverageHealth(plants);
      expect(average).toBe(86); // (85 + 86) / 2 = 85.5 -> 86
    });
  });

  describe('formatTimeAgo', () => {
    it('should format recent dates correctly', () => {
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      
      expect(formatTimeAgo(oneHourAgo)).toContain('hora');
    });

    it('should format older dates correctly', () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      expect(formatTimeAgo(oneDayAgo)).toContain('día');
    });

    it('should handle very old dates', () => {
      const oldDate = new Date('2020-01-01');
      const result = formatTimeAgo(oldDate);
      
      expect(result).toContain('año');
    });

    it('should handle invalid dates', () => {
      const invalidDate = new Date('invalid');
      const result = formatTimeAgo(invalidDate);
      
      expect(result).toBe('Fecha inválida');
    });
  });
}); 