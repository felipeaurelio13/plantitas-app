import OpenAI from 'https://esm.sh/openai@4.10.0';

// ============================================================================
// INTERFACES Y TIPOS
// ============================================================================

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitterRange: number;
}

export interface ErrorClassification {
  isRetryable: boolean;
  errorType: 'rate_limit' | 'server_error' | 'auth_error' | 'timeout' | 'content_policy' | 'unknown';
  recommendedAction: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AIOperationMetrics {
  operation: string;
  model: string;
  tokensUsed?: number;
  responseTime: number;
  cost?: number;
  success: boolean;
  error?: string;
  cacheHit?: boolean;
  retryAttempt?: number;
  timestamp: string;
}

export interface ModelConfig {
  name: string;
  costPer1KTokens: number;
  maxTokens: number;
  suitable_for: string[];
  complexity_level: 'low' | 'medium' | 'high';
}

// ============================================================================
// CONFIGURACIONES
// ============================================================================

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  jitterRange: 0.3
};

export const MODEL_CONFIGURATIONS: Record<string, ModelConfig> = {
  'gpt-4o-mini': {
    name: 'gpt-4o-mini',
    costPer1KTokens: 0.00015,
    maxTokens: 128000,
    suitable_for: ['simple_analysis', 'basic_chat', 'quick_insights'],
    complexity_level: 'low'
  },
  'gpt-4o': {
    name: 'gpt-4o',
    costPer1KTokens: 0.0025,
    maxTokens: 128000,
    suitable_for: ['image_analysis', 'complex_chat', 'garden_analysis', 'health_diagnosis'],
    complexity_level: 'medium'
  },
  'o1-mini': {
    name: 'o1-mini',
    costPer1KTokens: 0.003,
    maxTokens: 65536,
    suitable_for: ['complex_reasoning', 'multi_step_analysis', 'strategic_planning'],
    complexity_level: 'high'
  }
};

// ============================================================================
// UTILIDADES DE ERROR
// ============================================================================

export function classifyError(error: any): ErrorClassification {
  // Rate limiting
  if (error?.status === 429 || error?.code === 'rate_limit_exceeded') {
    return {
      isRetryable: true,
      errorType: 'rate_limit',
      recommendedAction: 'Retry with exponential backoff',
      severity: 'medium'
    };
  }

  // Server errors (5xx)
  if (error?.status >= 500 && error?.status < 600) {
    return {
      isRetryable: true,
      errorType: 'server_error',
      recommendedAction: 'Retry with backoff',
      severity: 'high'
    };
  }

  // Auth errors
  if (error?.status === 401 || error?.status === 403) {
    return {
      isRetryable: false,
      errorType: 'auth_error',
      recommendedAction: 'Check API key and permissions',
      severity: 'critical'
    };
  }

  // Timeout errors
  if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT' || error?.name === 'AbortError') {
    return {
      isRetryable: true,
      errorType: 'timeout',
      recommendedAction: 'Retry with longer timeout',
      severity: 'medium'
    };
  }

  // Content policy violations
  if (error?.status === 400 && error?.message?.includes('content_policy')) {
    return {
      isRetryable: false,
      errorType: 'content_policy',
      recommendedAction: 'Modify content to comply with policies',
      severity: 'low'
    };
  }

  // Unknown errors
  return {
    isRetryable: false,
    errorType: 'unknown',
    recommendedAction: 'Log error and investigate',
    severity: 'medium'
  };
}

export class EnhancedAIError extends Error {
  public readonly classification: ErrorClassification;
  public readonly context: Record<string, any>;
  public readonly originalError: any;

  constructor(originalError: any, context: Record<string, any> = {}) {
    super(originalError?.message || 'Unknown AI operation error');
    this.name = 'EnhancedAIError';
    this.classification = classifyError(originalError);
    this.context = context;
    this.originalError = originalError;
  }
}

// ============================================================================
// SISTEMA DE RETRY CON EXPONENTIAL BACKOFF
// ============================================================================

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  context: Record<string, any> = {}
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: any;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const classification = classifyError(error);
      
      // No reintentar si el error no es reintentable
      if (!classification.isRetryable || attempt === retryConfig.maxRetries) {
        throw new EnhancedAIError(error, { 
          ...context, 
          attempt, 
          classification 
        });
      }

      // Calcular delay con jitter
      const exponentialDelay = Math.min(
        retryConfig.maxDelay,
        retryConfig.baseDelay * Math.pow(retryConfig.backoffMultiplier, attempt)
      );
      
      const jitter = exponentialDelay * retryConfig.jitterRange * (Math.random() * 2 - 1);
      const delay = exponentialDelay + jitter;

      console.log(`[AI-Retry] Attempt ${attempt + 1}/${retryConfig.maxRetries + 1} failed: ${error.message}. Retrying in ${Math.round(delay)}ms`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw new EnhancedAIError(lastError, { ...context, attempts: retryConfig.maxRetries + 1 });
}

// ============================================================================
// SELECTOR INTELIGENTE DE MODELOS
// ============================================================================

export function selectOptimalModel(
  task: string, 
  complexity: 'low' | 'medium' | 'high' = 'medium',
  budget_priority: 'cost' | 'performance' | 'balanced' = 'balanced'
): string {
  const taskModelMatrix: Record<string, Record<string, string[]>> = {
    'image_analysis': {
      'low': ['gpt-4o-mini'],
      'medium': ['gpt-4o'],
      'high': ['gpt-4o']
    },
    'chat_response': {
      'low': ['gpt-4o-mini'],
      'medium': ['gpt-4o-mini', 'gpt-4o'],
      'high': ['gpt-4o']
    },
    'garden_analysis': {
      'low': ['gpt-4o-mini'],
      'medium': ['gpt-4o'],
      'high': ['o1-mini', 'gpt-4o']
    },
    'health_diagnosis': {
      'low': ['gpt-4o-mini'],
      'medium': ['gpt-4o'],
      'high': ['gpt-4o']
    },
    'plant_insights': {
      'low': ['gpt-4o-mini'],
      'medium': ['gpt-4o-mini', 'gpt-4o'],
      'high': ['gpt-4o']
    }
  };

  const candidates = taskModelMatrix[task]?.[complexity] || ['gpt-4o'];
  
  // Aplicar lógica de prioridad
  switch (budget_priority) {
    case 'cost':
      return candidates.sort((a, b) => 
        MODEL_CONFIGURATIONS[a].costPer1KTokens - MODEL_CONFIGURATIONS[b].costPer1KTokens
      )[0];
    
    case 'performance':
      return candidates[candidates.length - 1]; // El último es típicamente el más potente
    
    case 'balanced':
    default:
      return candidates[Math.floor(candidates.length / 2)]; // Opción intermedia
  }
}

// ============================================================================
// ESTIMADOR DE TOKENS Y COSTOS
// ============================================================================

export function estimateTokens(text: string, includeImages = false): number {
  // Estimación aproximada: ~4 caracteres por token en inglés/español
  const textTokens = Math.ceil(text.length / 4);
  
  // Las imágenes consumen tokens adicionales
  const imageTokens = includeImages ? 765 : 0; // Token promedio para imágenes high-detail
  
  return textTokens + imageTokens;
}

export function estimateCost(tokens: number, model: string): number {
  const modelConfig = MODEL_CONFIGURATIONS[model];
  if (!modelConfig) return 0;
  
  return (tokens / 1000) * modelConfig.costPer1KTokens;
}

// ============================================================================
// SISTEMA DE LOGGING Y MÉTRICAS
// ============================================================================

export async function logAIOperation(
  metrics: Omit<AIOperationMetrics, 'timestamp'>
): Promise<void> {
  const logEntry = {
    ...metrics,
    timestamp: new Date().toISOString()
  };

  try {
    // En producción, esto iría a una base de datos o servicio de logging
    console.log(`[AI-Metrics] ${JSON.stringify(logEntry)}`);
    
    // TODO: Implementar envío a Supabase cuando tengamos la tabla configurada
    // await supabase.from('ai_operation_logs').insert(logEntry);
  } catch (error) {
    console.error('Failed to log AI operation:', error);
    // No lanzar error para no interrumpir el flujo principal
  }
}

export async function monitoredAICall<T>(
  operation: string,
  model: string,
  aiCall: () => Promise<T>,
  context: Record<string, any> = {}
): Promise<T> {
  const startTime = Date.now();
  let tokensUsed: number | undefined;
  let cost: number | undefined;

  try {
    const result = await aiCall();
    const responseTime = Date.now() - startTime;
    
    // Extraer información de tokens si está disponible
    if (typeof result === 'object' && result !== null) {
      const usage = (result as any).usage;
      if (usage?.total_tokens) {
        tokensUsed = usage.total_tokens;
        cost = estimateCost(tokensUsed, model);
      }
    }

    await logAIOperation({
      operation,
      model,
      tokensUsed,
      responseTime,
      cost,
      success: true,
      cacheHit: context.cacheHit || false
    });

    return result;
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    await logAIOperation({
      operation,
      model,
      responseTime,
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });

    throw error;
  }
}

// ============================================================================
// UTILIDADES DE TIMEOUT ADAPTATIVO
// ============================================================================

export function getAdaptiveTimeout(operation: string, complexity: 'low' | 'medium' | 'high'): number {
  const baseTimeouts = {
    'image_analysis': { low: 30000, medium: 45000, high: 60000 },
    'chat_response': { low: 15000, medium: 25000, high: 35000 },
    'garden_analysis': { low: 20000, medium: 35000, high: 50000 },
    'health_diagnosis': { low: 25000, medium: 40000, high: 55000 },
    'plant_insights': { low: 15000, medium: 25000, high: 35000 }
  };

  return baseTimeouts[operation]?.[complexity] || 30000;
}

export function createAbortController(timeoutMs: number): AbortController {
  const controller = new AbortController();
  
  setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  return controller;
}

// ============================================================================
// WRAPPER PRINCIPAL PARA LLAMADAS A OPENAI
// ============================================================================

export async function enhancedOpenAICall<T>(
  openai: OpenAI,
  operation: string,
  apiCall: (signal: AbortSignal) => Promise<T>,
  options: {
    model?: string;
    complexity?: 'low' | 'medium' | 'high';
    retryConfig?: Partial<RetryConfig>;
    context?: Record<string, any>;
  } = {}
): Promise<T> {
  const {
    model = 'gpt-4o',
    complexity = 'medium',
    retryConfig = {},
    context = {}
  } = options;

  const timeout = getAdaptiveTimeout(operation, complexity);
  
  return monitoredAICall(
    operation,
    model,
    () => withRetry(
      async () => {
        const controller = createAbortController(timeout);
        return apiCall(controller.signal);
      },
      retryConfig,
      { ...context, model, complexity, timeout }
    ),
    context
  );
} 