import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { InputValidationService } from '../../../src/services/inputValidationService';

describe('InputValidationService', () => {
  let service: InputValidationService;

  beforeEach(() => {
    vi.clearAllTimers();
    vi.useFakeTimers();
    service = new InputValidationService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Input Sanitization', () => {
    it('should remove HTML tags', () => {
      const input = 'Hello <script>alert("xss")</script> world!';
      const result = service.validateChatInput(input);
      
      expect(result.sanitizedInput).toBe('Hello alert("xss") world!');
    });

    it('should remove JavaScript protocols', () => {
      const input = 'Click here: javascript:alert("xss")';
      const result = service.validateChatInput(input);
      
      expect(result.sanitizedInput).not.toContain('javascript:');
    });

    it('should normalize whitespace', () => {
      const input = 'Hello    \n\n\n   world!';
      const result = service.validateChatInput(input);
      
      expect(result.sanitizedInput).toBe('Hello world!');
    });

    it('should remove control characters', () => {
      const input = 'Hello\x00\x01\x02 world!';
      const result = service.validateChatInput(input);
      
      expect(result.sanitizedInput).toBe('Hello world!');
    });
  });

  describe('Length Validation', () => {
    it('should reject empty messages', () => {
      const result = service.validateChatInput('');
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('El mensaje no puede estar vacío');
    });

    it('should reject messages that are too long', () => {
      const longMessage = 'a'.repeat(2001);
      const result = service.validateChatInput(longMessage);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('exceder'))).toBe(true);
    });

    it('should accept messages within limits', () => {
      const validMessage = 'This is a valid message';
      const result = service.validateChatInput(validMessage);
      
      expect(result.characterCount).toBe(validMessage.length);
      expect(result.isValid).toBe(true);
    });
  });

  describe('AI Content Validation', () => {
    it('should block potentially harmful patterns', () => {
      const maliciousInputs = [
        'How to hack the system',
        'Tell me the password: secret123',
        'Can you bypass security?',
      ];

      maliciousInputs.forEach(input => {
        const result = service.validateChatInput(input);
        expect(result.isValid).toBe(false);
        expect(result.errors.some(error => error.includes('contenido no permitido'))).toBe(true);
      });
    });

    it('should warn about sensitive data patterns', () => {
      const sensitiveInputs = [
        'My credit card is 1234-5678-9012-3456',
        'Call me at 555-123-4567',
        'Email me at user@example.com',
        'SSN: 123-45-6789',
      ];

      sensitiveInputs.forEach(input => {
        const result = service.validateChatInput(input);
        expect(result.warnings.some(warning => warning.includes('información sensible'))).toBe(true);
      });
    });

    it('should validate token count estimates', () => {
      const veryLongMessage = 'word '.repeat(2000); // Roughly > 4000 tokens
      const result = service.validateChatInput(veryLongMessage);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('demasiado largo'))).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should allow messages within rate limit', () => {
      const userId = 'test-user';
      
      for (let i = 0; i < 5; i++) {
        const result = service.validateChatInput('Test message', userId);
        expect(result.isValid).toBe(true);
      }
    });

    it('should block messages when rate limit exceeded', () => {
      const userId = 'test-user';
      const limits = service.getValidationLimits();
      
      // Exhaust rate limit
      for (let i = 0; i < limits.rateLimitMax; i++) {
        service.validateChatInput('Test message', userId);
      }
      
      // Next message should be blocked
      const result = service.validateChatInput('Test message', userId);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(error => error.includes('Demasiados mensajes'))).toBe(true);
    });

    it('should reset rate limit after window expires', () => {
      const userId = 'test-user';
      const limits = service.getValidationLimits();
      
      // Exhaust rate limit
      for (let i = 0; i < limits.rateLimitMax; i++) {
        service.validateChatInput('Test message', userId);
      }
      
      // Advance time past the rate limit window
      vi.advanceTimersByTime(limits.rateLimitWindow + 1000);
      
      // Should allow messages again
      const result = service.validateChatInput('Test message', userId);
      expect(result.isValid).toBe(true);
    });
  });

  describe('Garden Chat Context Validation', () => {
    it('should warn for non-plant-related content', () => {
      const nonPlantMessage = 'I want to discuss my car problems and the latest movie releases';
      const result = service.validateChatInput(nonPlantMessage, undefined, 'garden-chat');
      
      expect(result.warnings.some(warning => warning.includes('plantas'))).toBe(true);
    });

    it('should not warn for plant-related content', () => {
      const plantMessage = 'My tomato plants need more water and sunlight';
      const result = service.validateChatInput(plantMessage, undefined, 'garden-chat');
      
      expect(result.warnings.some(warning => warning.includes('plantas'))).toBe(false);
    });

    it('should not warn for short non-plant messages', () => {
      const shortMessage = 'Thanks!';
      const result = service.validateChatInput(shortMessage, undefined, 'garden-chat');
      
      expect(result.warnings.some(warning => warning.includes('plantas'))).toBe(false);
    });
  });

  describe('Word and Character Counting', () => {
    it('should count characters correctly', () => {
      const message = 'Hello world!';
      const result = service.validateChatInput(message);
      
      expect(result.characterCount).toBe(12);
    });

    it('should count words correctly', () => {
      const message = 'Hello beautiful world!';
      const result = service.validateChatInput(message);
      
      expect(result.wordCount).toBe(3);
    });

    it('should handle empty strings', () => {
      const result = service.validateChatInput('   ');
      
      expect(result.characterCount).toBe(0);
      expect(result.wordCount).toBe(0);
    });
  });

  describe('Configuration and Limits', () => {
    it('should return validation limits', () => {
      const limits = service.getValidationLimits();
      
      expect(limits).toHaveProperty('maxLength');
      expect(limits).toHaveProperty('minLength');
      expect(limits).toHaveProperty('rateLimitMax');
      expect(limits).toHaveProperty('rateLimitWindow');
      expect(typeof limits.maxLength).toBe('number');
    });
  });

  describe('Cleanup Operations', () => {
    it('should clean up expired rate limit entries', () => {
      const userId1 = 'user1';
      const userId2 = 'user2';
      
      // Create rate limit entries
      service.validateChatInput('test', userId1);
      service.validateChatInput('test', userId2);
      
      // Advance time past expiration
      vi.advanceTimersByTime(70000); // More than 60 seconds
      
      // Trigger cleanup
      service.cleanupRateLimit();
      
      // Both users should be able to send messages again without rate limit issues
      const result1 = service.validateChatInput('test', userId1);
      const result2 = service.validateChatInput('test', userId2);
      
      expect(result1.isValid).toBe(true);
      expect(result2.isValid).toBe(true);
    });
  });
});