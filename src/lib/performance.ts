// Configuraciones centralizadas de rendimiento para Plant Care Companion

export const PERFORMANCE_CONFIG = {
  // React Query configurations
  QUERY: {
    STALE_TIME: {
      SHORT: 1000 * 60 * 5,    // 5 minutos - para datos que cambian frecuentemente
      MEDIUM: 1000 * 60 * 15,  // 15 minutos - para datos de plantas
      LONG: 1000 * 60 * 60,    // 1 hora - para datos estáticos
    },
    GC_TIME: {
      SHORT: 1000 * 60 * 10,   // 10 minutos
      MEDIUM: 1000 * 60 * 30,  // 30 minutos  
      LONG: 1000 * 60 * 60,    // 1 hora
    },
    RETRY: {
      COUNT: 1,
      DELAY: 1000,
    }
  },

  // Animation configurations
  ANIMATION: {
    DURATION: {
      FAST: 0.15,
      NORMAL: 0.2,
      SLOW: 0.3,
    },
    STAGGER: {
      FAST: 0.01,
      NORMAL: 0.02,
      SLOW: 0.05,
    },
    EASING: {
      DEFAULT: 'easeOut',
      SMOOTH: [0.4, 0, 0.2, 1],
    }
  },

  // Image loading configurations
  IMAGE: {
    PRIORITY_COUNT: 4,        // Número de imágenes con priority loading
    CACHE_SIZE: 100,          // Máximo número de imágenes en cache
    LAZY_LOADING_THRESHOLD: 8, // Después de cuántos elementos usar lazy loading
    SIZES: {
      THUMBNAIL: "(max-width: 768px) 20vw, 10vw",
      CARD: "(max-width: 768px) 50vw, 25vw", 
      FULL: "(max-width: 768px) 100vw, 50vw",
    }
  },

  // Prefetch configurations
  PREFETCH: {
    ON_HOVER_DELAY: 100,      // ms antes de prefetch en hover
    STALE_TIME: 1000 * 60 * 5, // 5 minutos para datos prefetched
    MAX_CONCURRENT: 3,        // Máximo prefetch concurrentes
  },

  // Bundle splitting thresholds
  BUNDLE: {
    CHUNK_SIZE_LIMIT: 500000, // 500KB límite por chunk
    MAX_PARALLEL_REQUESTS: 6, // Máximo requests paralelos
  }
} as const;

// Utilities para debugging de performance
export const performanceUtils = {
  /**
   * Medir tiempo de ejecución de una función
   */
  measureTime: async <T>(
    name: string, 
    fn: () => Promise<T> | T
  ): Promise<T> => {
    if (!import.meta.env.DEV) {
      return typeof fn === 'function' ? await fn() : fn;
    }

    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
    return result;
  },

  /**
   * Marcar el inicio de una operación crítica
   */
  markStart: (name: string) => {
    if (import.meta.env.DEV) {
      performance.mark(`${name}-start`);
    }
  },

  /**
   * Marcar el fin de una operación y medir duración
   */
  markEnd: (name: string) => {
    if (import.meta.env.DEV) {
      performance.mark(`${name}-end`);
      performance.measure(name, `${name}-start`, `${name}-end`);
      
      const measure = performance.getEntriesByName(name)[0];
      if (measure) {
        console.log(`[Performance] ${name}: ${measure.duration.toFixed(2)}ms`);
      }
    }
  },

  /**
   * Debounce function para limitar ejecuciones
   */
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): T => {
    let timeout: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    }) as T;
  },

  /**
   * Throttle function para limitar frecuencia de ejecución
   */
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): T => {
    let inThrottle: boolean;
    return ((...args: any[]) => {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    }) as T;
  }
};

// Web Vitals monitoring (usando Performance Observer API nativo)
export const initPerformanceMonitoring = async () => {
  if (!import.meta.env.PROD) return;

  try {
    // Usar Performance Observer API nativo en lugar de web-vitals library
    console.log('[Performance] Initializing native Web Vitals monitoring');
    
    // LCP - Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log(`[Web Vitals] LCP: ${lastEntry.startTime.toFixed(2)}ms`);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      
      // CLS - Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
            console.log(`[Web Vitals] CLS: ${clsValue.toFixed(4)}`);
          }
        });
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      
      // FID - First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (entry.processingStart) {
            const fid = entry.processingStart - entry.startTime;
            console.log(`[Web Vitals] FID: ${fid.toFixed(2)}ms`);
          }
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    }
  } catch (error) {
    console.warn('[Performance] Error initializing Web Vitals monitoring:', error);
  }
};