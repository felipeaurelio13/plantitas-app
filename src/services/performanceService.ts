import { getPerformance, trace, Trace } from 'firebase/performance';
import { getFirestore } from '../lib/firebase';

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'firebase' | 'ui' | 'network' | 'custom';
  metadata?: Record<string, any>;
}

interface WebVitals {
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
}

class PerformanceService {
  private performance: any = null;
  private metrics: PerformanceMetric[] = [];
  private webVitals: WebVitals = {};
  private activeTraces: Map<string, Trace> = new Map();
  private batchSize = 50;
  private batchInterval = 30000; // 30 seconds
  private batchTimer: NodeJS.Timeout | null = null;

  async initialize(): Promise<void> {
    try {
      // Initialize Firebase Performance
      const { getAnalytics } = await import('firebase/analytics');
      const { app } = await import('../lib/firebase');
      
      if (app) {
        this.performance = getPerformance(app);
        console.log('✅ Firebase Performance initialized');
      }

      // Initialize Web Vitals monitoring
      this.initializeWebVitals();
      
      // Start batch timer
      this.startBatchTimer();
      
      console.log('✅ Performance service initialized');
    } catch (error) {
      console.warn('⚠️ Performance monitoring not available:', error);
    }
  }

  private initializeWebVitals(): void {
    // Dynamic import to avoid bloating the bundle
    import('web-vitals').then(({ getLCP, getFID, getCLS, getFCP, getTTFB }) => {
      getLCP((metric) => {
        this.webVitals.lcp = metric.value;
        this.recordMetric({
          name: 'web_vitals_lcp',
          value: metric.value,
          timestamp: Date.now(),
          category: 'ui',
          metadata: { rating: metric.rating }
        });
      });

      getFID((metric) => {
        this.webVitals.fid = metric.value;
        this.recordMetric({
          name: 'web_vitals_fid',
          value: metric.value,
          timestamp: Date.now(),
          category: 'ui',
          metadata: { rating: metric.rating }
        });
      });

      getCLS((metric) => {
        this.webVitals.cls = metric.value;
        this.recordMetric({
          name: 'web_vitals_cls',
          value: metric.value,
          timestamp: Date.now(),
          category: 'ui',
          metadata: { rating: metric.rating }
        });
      });

      getFCP((metric) => {
        this.webVitals.fcp = metric.value;
        this.recordMetric({
          name: 'web_vitals_fcp',
          value: metric.value,
          timestamp: Date.now(),
          category: 'ui'
        });
      });

      getTTFB((metric) => {
        this.webVitals.ttfb = metric.value;
        this.recordMetric({
          name: 'web_vitals_ttfb',
          value: metric.value,
          timestamp: Date.now(),
          category: 'network'
        });
      });
    }).catch(error => {
      console.warn('⚠️ Web Vitals not available:', error);
    });
  }

  startTrace(name: string, metadata?: Record<string, string>): string {
    const traceId = `${name}_${Date.now()}`;
    
    try {
      if (this.performance) {
        const firebaseTrace = trace(this.performance, name);
        
        if (metadata) {
          Object.entries(metadata).forEach(([key, value]) => {
            firebaseTrace.putAttribute(key, value);
          });
        }
        
        firebaseTrace.start();
        this.activeTraces.set(traceId, firebaseTrace);
      }
      
      console.log(`🚀 Started trace: ${name}`);
      return traceId;
    } catch (error) {
      console.warn(`⚠️ Failed to start trace ${name}:`, error);
      return traceId;
    }
  }

  stopTrace(traceId: string, customMetrics?: Record<string, number>): void {
    try {
      const firebaseTrace = this.activeTraces.get(traceId);
      
      if (firebaseTrace) {
        if (customMetrics) {
          Object.entries(customMetrics).forEach(([key, value]) => {
            firebaseTrace.putMetric(key, value);
          });
        }
        
        firebaseTrace.stop();
        this.activeTraces.delete(traceId);
        
        console.log(`✅ Stopped trace: ${traceId}`);
      }
    } catch (error) {
      console.warn(`⚠️ Failed to stop trace ${traceId}:`, error);
    }
  }

  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    
    // Log significant performance issues
    if (metric.category === 'firebase' && metric.value > 5000) {
      console.warn(`⚠️ Slow Firebase operation: ${metric.name} took ${metric.value}ms`);
    }
    
    if (metric.category === 'ui' && metric.name.includes('lcp') && metric.value > 2500) {
      console.warn(`⚠️ Poor LCP performance: ${metric.value}ms`);
    }

    // Trigger batch upload if buffer is full
    if (this.metrics.length >= this.batchSize) {
      this.uploadMetricsBatch();
    }
  }

  measureOperation<T>(
    name: string, 
    operation: () => Promise<T>, 
    category: PerformanceMetric['category'] = 'custom'
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      const startTime = performance.now();
      const traceId = this.startTrace(name);
      
      try {
        const result = await operation();
        const duration = performance.now() - startTime;
        
        this.stopTrace(traceId, { duration });
        this.recordMetric({
          name,
          value: duration,
          timestamp: Date.now(),
          category,
          metadata: { success: true }
        });
        
        resolve(result);
      } catch (error) {
        const duration = performance.now() - startTime;
        
        this.stopTrace(traceId, { duration, error: 1 });
        this.recordMetric({
          name,
          value: duration,
          timestamp: Date.now(),
          category,
          metadata: { 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error'
          }
        });
        
        reject(error);
      }
    });
  }

  measureFirebaseOperation<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    return this.measureOperation(`firebase_${operationName}`, operation, 'firebase');
  }

  private startBatchTimer(): void {
    this.batchTimer = setInterval(() => {
      if (this.metrics.length > 0) {
        this.uploadMetricsBatch();
      }
    }, this.batchInterval);
  }

  private async uploadMetricsBatch(): Promise<void> {
    if (this.metrics.length === 0) return;

    const batch = this.metrics.splice(0, this.batchSize);
    
    try {
      // In a real implementation, you would send these to your analytics service
      console.log(`📊 Uploading ${batch.length} performance metrics`, {
        firebase: batch.filter(m => m.category === 'firebase').length,
        ui: batch.filter(m => m.category === 'ui').length,
        network: batch.filter(m => m.category === 'network').length,
        custom: batch.filter(m => m.category === 'custom').length,
      });
      
      // Store in local storage for debugging
      if (import.meta.env.DEV) {
        const existing = JSON.parse(localStorage.getItem('performance_metrics') || '[]');
        existing.push(...batch);
        localStorage.setItem('performance_metrics', JSON.stringify(existing.slice(-500))); // Keep last 500
      }
    } catch (error) {
      console.error('❌ Failed to upload performance metrics:', error);
      // Put metrics back in queue
      this.metrics.unshift(...batch);
    }
  }

  getPerformanceReport(): {
    webVitals: WebVitals;
    averages: Record<string, number>;
    recentMetrics: PerformanceMetric[];
    slowOperations: PerformanceMetric[];
  } {
    const recentMetrics = this.metrics.slice(-20);
    
    // Calculate averages by category
    const averages: Record<string, number> = {};
    const categories = ['firebase', 'ui', 'network', 'custom'];
    
    categories.forEach(category => {
      const categoryMetrics = this.metrics.filter(m => m.category === category);
      if (categoryMetrics.length > 0) {
        averages[category] = categoryMetrics.reduce((sum, m) => sum + m.value, 0) / categoryMetrics.length;
      }
    });

    // Find slow operations (>95th percentile)
    const sortedMetrics = [...this.metrics].sort((a, b) => b.value - a.value);
    const slowThreshold = sortedMetrics[Math.floor(sortedMetrics.length * 0.05)]?.value || 1000;
    const slowOperations = this.metrics.filter(m => m.value > slowThreshold);

    return {
      webVitals: this.webVitals,
      averages,
      recentMetrics,
      slowOperations: slowOperations.slice(-10)
    };
  }

  destroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = null;
    }
    
    // Upload remaining metrics
    if (this.metrics.length > 0) {
      this.uploadMetricsBatch();
    }
    
    // Stop all active traces
    this.activeTraces.forEach((trace, id) => {
      try {
        trace.stop();
      } catch (error) {
        console.warn(`⚠️ Failed to stop trace ${id}:`, error);
      }
    });
    this.activeTraces.clear();
  }
}

// Create singleton instance
const performanceService = new PerformanceService();

// Initialize automatically
performanceService.initialize().catch(error => {
  console.warn('⚠️ Performance service initialization failed:', error);
});

export default performanceService;
export { PerformanceService, type PerformanceMetric, type WebVitals };

// Utility function to wrap Firebase operations with performance monitoring
export const withPerformanceMonitoring = <T>(
  operationName: string,
  operation: () => Promise<T>
): Promise<T> => {
  return performanceService.measureFirebaseOperation(operationName, operation);
};