export interface AuthConfig {
  initialization: {
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
    emergencyFallbackTimeout: number;
  };
  performance: {
    trackInitialization: boolean;
    slowConnectionThreshold: number;
    performanceLogging: boolean;
  };
  ui: {
    showProgressIndicator: boolean;
    progressSteps: string[];
    minLoadingTime: number; // Prevent flash
  };
}

export const AUTH_CONFIG: AuthConfig = {
  initialization: {
    timeout: 5000, // 5 seconds primary timeout
    retryAttempts: 2,
    retryDelay: 1000, // 1 second between retries
    emergencyFallbackTimeout: 8000, // 8 seconds emergency fallback
  },
  performance: {
    trackInitialization: true,
    slowConnectionThreshold: 3000, // Consider slow if > 3s
    performanceLogging: import.meta.env.DEV,
  },
  ui: {
    showProgressIndicator: true,
    progressSteps: [
      'Conectando...',
      'Verificando sesión...',
      'Cargando perfil...',
      'Inicializando...'
    ],
    minLoadingTime: 500, // Show loading for at least 500ms
  },
};

export interface AuthInitializationMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  retryCount: number;
  errors: string[];
  success: boolean;
  isSlowConnection: boolean;
  emergencyFallbackUsed: boolean;
}

export class AuthPerformanceTracker {
  private metrics: AuthInitializationMetrics;

  constructor() {
    this.metrics = {
      startTime: Date.now(),
      retryCount: 0,
      errors: [],
      success: false,
      isSlowConnection: false,
      emergencyFallbackUsed: false,
    };
  }

  recordRetry(error?: string): void {
    this.metrics.retryCount++;
    if (error) {
      this.metrics.errors.push(error);
    }
  }

  recordError(error: string): void {
    this.metrics.errors.push(error);
  }

  recordSuccess(): void {
    this.metrics.endTime = Date.now();
    this.metrics.duration = this.metrics.endTime - this.metrics.startTime;
    this.metrics.success = true;
    this.metrics.isSlowConnection = this.metrics.duration > AUTH_CONFIG.performance.slowConnectionThreshold;
  }

  recordEmergencyFallback(): void {
    this.metrics.emergencyFallbackUsed = true;
    if (!this.metrics.endTime) {
      this.metrics.endTime = Date.now();
      this.metrics.duration = this.metrics.endTime - this.metrics.startTime;
    }
  }

  getMetrics(): AuthInitializationMetrics {
    return { ...this.metrics };
  }

  logPerformance(): void {
    if (!AUTH_CONFIG.performance.performanceLogging) return;

    const { duration, retryCount, errors, success, isSlowConnection, emergencyFallbackUsed } = this.metrics;
    
    console.group('[Auth Performance]');
    console.log('Duration:', duration ? `${duration}ms` : 'In progress');
    console.log('Success:', success);
    console.log('Retry Count:', retryCount);
    console.log('Slow Connection:', isSlowConnection);
    console.log('Emergency Fallback Used:', emergencyFallbackUsed);
    
    if (errors.length > 0) {
      console.warn('Errors:', errors);
    }
    
    if (isSlowConnection) {
      console.warn('Slow connection detected. Consider optimizing auth flow.');
    }
    
    console.groupEnd();
  }
}