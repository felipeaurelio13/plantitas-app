interface ValidationConfig {
  chat: {
    minLength: number;
    maxLength: number;
    allowedCharacters: RegExp;
    rateLimitWindow: number; // milliseconds
    rateLimitMax: number; // max messages per window
  };
  ai: {
    maxTokens: number;
    blockedPatterns: RegExp[];
    sensitiveDataPatterns: RegExp[];
  };
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedInput?: string;
  characterCount: number;
  wordCount: number;
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

export class InputValidationService {
  private config: ValidationConfig;
  private rateLimitMap: Map<string, RateLimitEntry> = new Map();

  constructor() {
    this.config = {
      chat: {
        minLength: 1,
        maxLength: 2000,
        allowedCharacters: /^[\p{L}\p{N}\p{P}\p{Z}\p{S}\p{M}]*$/u, // Unicode-aware
        rateLimitWindow: 60000, // 1 minute
        rateLimitMax: 30, // 30 messages per minute
      },
      ai: {
        maxTokens: 4000, // Approximate token limit
        blockedPatterns: [
          /(?:hack|exploit|bypass|inject|script)/gi,
          /(?:password|token|secret|key)\s*[:=]\s*\S+/gi,
        ],
        sensitiveDataPatterns: [
          /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, // Credit card
          /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
          /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
          /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, // Phone
        ],
      },
    };
  }

  /**
   * Comprehensive input validation for chat messages
   */
  validateChatInput(
    input: string, 
    userId?: string,
    context: 'plant-chat' | 'garden-chat' = 'plant-chat'
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    // Basic sanitization
    const trimmedInput = input.trim();
    const sanitizedInput = this.sanitizeInput(trimmedInput);
    
    // Character and word count
    const characterCount = sanitizedInput.length;
    const wordCount = this.countWords(sanitizedInput);

    // Length validation
    if (characterCount < this.config.chat.minLength) {
      errors.push('El mensaje no puede estar vacío');
    }
    
    if (characterCount > this.config.chat.maxLength) {
      errors.push(`El mensaje no puede exceder ${this.config.chat.maxLength} caracteres`);
    }

    // Character set validation
    if (!this.config.chat.allowedCharacters.test(sanitizedInput)) {
      warnings.push('El mensaje contiene caracteres especiales que fueron removidos');
    }

    // Rate limiting
    if (userId) {
      const rateLimitResult = this.checkRateLimit(userId);
      if (!rateLimitResult.allowed) {
        errors.push(`Demasiados mensajes. Intenta de nuevo en ${Math.ceil(rateLimitResult.timeUntilReset / 1000)} segundos`);
      }
    }

    // AI-specific validation
    const aiValidation = this.validateForAI(sanitizedInput);
    errors.push(...aiValidation.errors);
    warnings.push(...aiValidation.warnings);

    // Context-specific validation
    if (context === 'garden-chat') {
      const gardenValidation = this.validateGardenChatInput(sanitizedInput);
      warnings.push(...gardenValidation.warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      sanitizedInput: sanitizedInput,
      characterCount,
      wordCount,
    };
  }

  /**
   * Sanitize input to prevent XSS and other attacks
   */
  private sanitizeInput(input: string): string {
    // Remove HTML tags
    let sanitized = input.replace(/<[^>]*>/g, '');
    
    // Remove script-like patterns
    sanitized = sanitized.replace(/javascript:/gi, '');
    sanitized = sanitized.replace(/on\w+\s*=/gi, '');
    
    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ');
    
    // Remove control characters except newlines and tabs
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    return sanitized.trim();
  }

  /**
   * Validate input for AI processing
   */
  private validateForAI(input: string): { errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for blocked patterns
    for (const pattern of this.config.ai.blockedPatterns) {
      if (pattern.test(input)) {
        errors.push('El mensaje contiene contenido no permitido');
        break;
      }
    }

    // Check for sensitive data
    for (const pattern of this.config.ai.sensitiveDataPatterns) {
      if (pattern.test(input)) {
        warnings.push('Se detectó posible información sensible. Por favor, verifica tu mensaje');
        break;
      }
    }

    // Estimate token count (rough approximation)
    const estimatedTokens = this.estimateTokenCount(input);
    if (estimatedTokens > this.config.ai.maxTokens) {
      errors.push('El mensaje es demasiado largo para procesar');
    }

    return { errors, warnings };
  }

  /**
   * Garden chat specific validation
   */
  private validateGardenChatInput(input: string): { warnings: string[] } {
    const warnings: string[] = [];
    
    // Check if message seems plant-related
    const plantKeywords = /\b(?:plant|garden|flower|leaf|water|soil|sun|fertilizer|prune|bloom|root|seed|planta|jardín|flor|hoja|agua|tierra|sol|fertilizante|podar|raíz|semilla)\b/gi;
    
    if (!plantKeywords.test(input) && input.length > 50) {
      warnings.push('Tu mensaje parece no estar relacionado con plantas. ¿Estás seguro?');
    }

    return { warnings };
  }

  /**
   * Rate limiting check
   */
  private checkRateLimit(userId: string): { allowed: boolean; timeUntilReset: number } {
    const now = Date.now();
    const entry = this.rateLimitMap.get(userId);

    if (!entry || now - entry.windowStart > this.config.chat.rateLimitWindow) {
      // New window or first request
      this.rateLimitMap.set(userId, { count: 1, windowStart: now });
      return { allowed: true, timeUntilReset: 0 };
    }

    if (entry.count >= this.config.chat.rateLimitMax) {
      // Rate limit exceeded
      const timeUntilReset = this.config.chat.rateLimitWindow - (now - entry.windowStart);
      return { allowed: false, timeUntilReset };
    }

    // Increment count
    entry.count++;
    return { allowed: true, timeUntilReset: 0 };
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Estimate token count (rough approximation)
   */
  private estimateTokenCount(text: string): number {
    // Rough estimate: ~4 characters per token on average
    return Math.ceil(text.length / 4);
  }

  /**
   * Get validation config for UI
   */
  getValidationLimits() {
    return {
      maxLength: this.config.chat.maxLength,
      minLength: this.config.chat.minLength,
      rateLimitMax: this.config.chat.rateLimitMax,
      rateLimitWindow: this.config.chat.rateLimitWindow,
    };
  }

  /**
   * Clean up old rate limit entries
   */
  cleanupRateLimit(): void {
    const now = Date.now();
    const expiredEntries: string[] = [];

    this.rateLimitMap.forEach((entry, userId) => {
      if (now - entry.windowStart > this.config.chat.rateLimitWindow) {
        expiredEntries.push(userId);
      }
    });

    expiredEntries.forEach(userId => {
      this.rateLimitMap.delete(userId);
    });
  }
}

// Singleton instance
export const inputValidationService = new InputValidationService();

// Clean up rate limit entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    inputValidationService.cleanupRateLimit();
  }, 5 * 60 * 1000);
}