import { getFirestore, doc, getDoc } from '../lib/firebase';
import { isFirebaseReady } from '../lib/firebase';
import cacheService from './cacheService';

interface CircuitBreakerState {
  state: 'closed' | 'open' | 'half-open';
  failureCount: number;
  lastFailureTime: number;
  successCount: number;
}

interface HealthStatus {
  firebase: boolean;
  firestore: boolean;
  auth: boolean;
  storage: boolean;
  lastCheck: number;
  consecutiveFailures: number;
}

interface RecoveryStrategy {
  name: string;
  canHandle: (operation: string) => boolean;
  execute: (operation: string, params: any) => Promise<any>;
}

class FirebaseRecoveryService {
  private circuitBreaker: CircuitBreakerState = {
    state: 'closed',
    failureCount: 0,
    lastFailureTime: 0,
    successCount: 0
  };

  private healthStatus: HealthStatus = {
    firebase: false,
    firestore: false,
    auth: false,
    storage: false,
    lastCheck: 0,
    consecutiveFailures: 0
  };

  private readonly FAILURE_THRESHOLD = 5;
  private readonly RECOVERY_TIMEOUT = 60000; // 1 minute
  private readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
  private readonly MAX_BACKOFF_TIME = 300000; // 5 minutes

  private healthCheckTimer: NodeJS.Timeout | null = null;
  private recoveryStrategies: RecoveryStrategy[] = [];

  constructor() {
    this.initializeRecoveryStrategies();
    this.startHealthMonitoring();
  }

  private initializeRecoveryStrategies(): void {
    this.recoveryStrategies = [
      {
        name: 'cache_fallback_read',
        canHandle: (operation) => operation.startsWith('read_') || operation.startsWith('get_'),
        execute: async (operation, params) => {
          console.log(`🔄 Using cache fallback for ${operation}`);
          
          switch (operation) {
            case 'getUserPlants':
              return await cacheService.getCachedPlants(params.userId);
            case 'getChatMessages':
              return await cacheService.getCachedChatMessages(params.plantId);
            default:
              throw new Error(`No cache fallback available for ${operation}`);
          }
        }
      },
      {
        name: 'queue_write_operations',
        canHandle: (operation) => operation.startsWith('create_') || operation.startsWith('update_') || operation.startsWith('delete_'),
        execute: async (operation, params) => {
          console.log(`📤 Queueing ${operation} for later sync`);
          
          const collection = operation.split('_')[1]; // e.g., 'create_plant' -> 'plant'
          const operationType = operation.split('_')[0]; // e.g., 'create_plant' -> 'create'
          
          await cacheService.addToSyncQueue(operationType as any, collection, params);
          
          // For create operations, return a temporary ID
          if (operationType === 'create') {
            return `temp_${Date.now()}`;
          }
          
          return { success: true, queued: true };
        }
      },
      {
        name: 'local_storage_fallback',
        canHandle: (operation) => operation.includes('profile') || operation.includes('settings'),
        execute: async (operation, params) => {
          console.log(`💾 Using local storage fallback for ${operation}`);
          
          const key = `fallback_${operation}`;
          
          if (operation.startsWith('get_')) {
            const cached = localStorage.getItem(key);
            return cached ? JSON.parse(cached) : null;
          }
          
          if (operation.startsWith('update_')) {
            localStorage.setItem(key, JSON.stringify(params));
            return { success: true, local: true };
          }
          
          throw new Error(`No local storage fallback for ${operation}`);
        }
      }
    ];
  }

  async executeWithRecovery<T>(
    operation: string,
    firebaseOperation: () => Promise<T>,
    params?: any
  ): Promise<T> {
    // Check circuit breaker
    if (this.circuitBreaker.state === 'open') {
      const timeSinceLastFailure = Date.now() - this.circuitBreaker.lastFailureTime;
      
      if (timeSinceLastFailure < this.RECOVERY_TIMEOUT) {
        console.log(`⚡ Circuit breaker is open, attempting fallback for ${operation}`);
        return this.attemptFallback(operation, params);
      } else {
        // Try to transition to half-open
        this.circuitBreaker.state = 'half-open';
        this.circuitBreaker.successCount = 0;
        console.log(`🔄 Circuit breaker transitioning to half-open for ${operation}`);
      }
    }

    try {
      // Check if Firebase is ready
      if (!isFirebaseReady()) {
        throw new Error('Firebase not ready');
      }

      // Execute the operation
      const result = await firebaseOperation();
      
      // Success - update circuit breaker
      this.onOperationSuccess();
      
      return result;
    } catch (error) {
      console.error(`❌ Firebase operation failed: ${operation}`, error);
      
      // Update circuit breaker
      this.onOperationFailure();
      
      // Attempt fallback
      return this.attemptFallback(operation, params);
    }
  }

  private async attemptFallback<T>(operation: string, params?: any): Promise<T> {
    for (const strategy of this.recoveryStrategies) {
      if (strategy.canHandle(operation)) {
        try {
          console.log(`🔄 Attempting fallback strategy: ${strategy.name} for ${operation}`);
          const result = await strategy.execute(operation, params);
          
          if (result !== null && result !== undefined) {
            console.log(`✅ Fallback successful with strategy: ${strategy.name}`);
            return result;
          }
        } catch (error) {
          console.warn(`⚠️ Fallback strategy ${strategy.name} failed:`, error);
        }
      }
    }

    // No fallback available
    throw new Error(`No fallback strategy available for operation: ${operation}`);
  }

  private onOperationSuccess(): void {
    if (this.circuitBreaker.state === 'half-open') {
      this.circuitBreaker.successCount++;
      
      // If we have enough successes, close the circuit
      if (this.circuitBreaker.successCount >= 3) {
        this.circuitBreaker.state = 'closed';
        this.circuitBreaker.failureCount = 0;
        console.log('✅ Circuit breaker closed - Firebase operations restored');
      }
    } else if (this.circuitBreaker.state === 'closed') {
      // Reset failure count on success
      this.circuitBreaker.failureCount = 0;
    }

    // Update health status
    this.healthStatus.consecutiveFailures = 0;
  }

  private onOperationFailure(): void {
    this.circuitBreaker.failureCount++;
    this.circuitBreaker.lastFailureTime = Date.now();
    
    if (this.circuitBreaker.failureCount >= this.FAILURE_THRESHOLD) {
      this.circuitBreaker.state = 'open';
      console.warn(`⚡ Circuit breaker opened after ${this.FAILURE_THRESHOLD} failures`);
    }

    // Update health status
    this.healthStatus.consecutiveFailures++;
  }

  private startHealthMonitoring(): void {
    this.healthCheckTimer = setInterval(() => {
      this.performHealthCheck();
    }, this.HEALTH_CHECK_INTERVAL);

    // Perform initial health check
    this.performHealthCheck();
  }

  private async performHealthCheck(): Promise<void> {
    console.log('🏥 Performing Firebase health check...');
    
    const healthCheck = {
      firebase: false,
      firestore: false,
      auth: false,
      storage: false,
      lastCheck: Date.now(),
      consecutiveFailures: this.healthStatus.consecutiveFailures
    };

    try {
      // Check Firebase availability
      healthCheck.firebase = isFirebaseReady();
      
      if (healthCheck.firebase) {
        // Check Firestore connectivity
        try {
          const db = getFirestore();
          const testDoc = doc(db, '__health__', 'test');
          await getDoc(testDoc);
          healthCheck.firestore = true;
        } catch (error) {
          console.warn('⚠️ Firestore health check failed:', error);
        }

        // Check Auth (basic availability)
        try {
          const { getAuth } = await import('../lib/firebase');
          const auth = getAuth();
          healthCheck.auth = !!auth;
        } catch (error) {
          console.warn('⚠️ Auth health check failed:', error);
        }

        // Check Storage (basic availability)
        try {
          const { getStorage } = await import('../lib/firebase');
          const storage = getStorage();
          healthCheck.storage = !!storage;
        } catch (error) {
          console.warn('⚠️ Storage health check failed:', error);
        }
      }

      this.healthStatus = healthCheck;

      // If health is restored, try to process queued operations
      if (healthCheck.firebase && healthCheck.firestore) {
        console.log('✅ Firebase health restored, processing queued operations...');
        await this.processQueuedOperations();
      }

    } catch (error) {
      console.error('❌ Health check failed:', error);
      this.healthStatus = {
        ...healthCheck,
        consecutiveFailures: this.healthStatus.consecutiveFailures + 1
      };
    }

    console.log('🏥 Health check completed:', this.healthStatus);
  }

  private async processQueuedOperations(): Promise<void> {
    try {
      await cacheService.processSyncQueue();
      console.log('✅ Queued operations processed successfully');
    } catch (error) {
      console.error('❌ Failed to process queued operations:', error);
    }
  }

  getHealthStatus(): HealthStatus {
    return { ...this.healthStatus };
  }

  getCircuitBreakerStatus(): CircuitBreakerState {
    return { ...this.circuitBreaker };
  }

  isHealthy(): boolean {
    return this.healthStatus.firebase && 
           this.healthStatus.firestore && 
           this.circuitBreaker.state !== 'open';
  }

  forceRecoveryAttempt(): Promise<void> {
    console.log('🔧 Forcing recovery attempt...');
    
    // Reset circuit breaker to half-open
    this.circuitBreaker.state = 'half-open';
    this.circuitBreaker.successCount = 0;
    
    // Perform immediate health check
    return this.performHealthCheck();
  }

  destroy(): void {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }
  }
}

// Create singleton instance
const firebaseRecoveryService = new FirebaseRecoveryService();

export default firebaseRecoveryService;
export { FirebaseRecoveryService, type HealthStatus, type CircuitBreakerState };

// Utility function to wrap Firebase operations with recovery
export const withRecovery = <T>(
  operation: string,
  firebaseOperation: () => Promise<T>,
  params?: any
): Promise<T> => {
  return firebaseRecoveryService.executeWithRecovery(operation, firebaseOperation, params);
};