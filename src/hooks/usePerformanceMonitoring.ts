import { useEffect } from 'react';
import { performanceUtils } from '../lib/performance';

/**
 * Hook para monitorear performance durante desarrollo
 * Solo se activa en modo desarrollo para evitar overhead en producción
 */
export const usePerformanceMonitoring = () => {
  useEffect(() => {
    if (!import.meta.env.DEV) return;

    // Monitorear métricas básicas de navegación
    const logNavigationTiming = () => {
      if (typeof window !== 'undefined' && window.performance) {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          console.group('[Performance] Navigation Timing');
          console.log('DOM Content Loaded:', `${navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart}ms`);
          console.log('Load Event:', `${navigation.loadEventEnd - navigation.loadEventStart}ms`);
          console.log('Total Page Load:', `${navigation.loadEventEnd - navigation.fetchStart}ms`);
          console.groupEnd();
        }
      }
    };

    // Monitorear LCP (Largest Contentful Paint)
    const observeLCP = () => {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log('[Performance] LCP:', `${lastEntry.startTime.toFixed(2)}ms`);
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
        
        // Cleanup después de 10 segundos
        setTimeout(() => observer.disconnect(), 10000);
      } catch (error) {
        console.warn('[Performance] LCP observer not supported');
      }
    };

    // Monitorear FID (First Input Delay)
    const observeFID = () => {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            // Cast to PerformanceEventTiming para acceder a processingStart
            const eventEntry = entry as any;
            if (eventEntry.processingStart) {
              console.log('[Performance] FID:', `${eventEntry.processingStart - entry.startTime}ms`);
            }
          });
        });
        
        observer.observe({ entryTypes: ['first-input'] });
        
        // FID solo se mide una vez
        setTimeout(() => observer.disconnect(), 30000);
      } catch (error) {
        console.warn('[Performance] FID observer not supported');
      }
    };

    // Monitorear CLS (Cumulative Layout Shift)
    const observeCLS = () => {
      try {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              console.log('[Performance] CLS (cumulative):', clsValue.toFixed(4));
            }
          });
        });
        
        observer.observe({ entryTypes: ['layout-shift'] });
        
        // Cleanup después de 30 segundos
        setTimeout(() => observer.disconnect(), 30000);
      } catch (error) {
        console.warn('[Performance] CLS observer not supported');
      }
    };

    // Ejecutar después de que la página se haya cargado
    const initMonitoring = () => {
      logNavigationTiming();
      observeLCP();
      observeFID();
      observeCLS();
    };

    if (document.readyState === 'complete') {
      initMonitoring();
    } else {
      window.addEventListener('load', initMonitoring);
    }

    // Monitorear errores de recursos
    const handleResourceError = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'IMG') {
        console.warn('[Performance] Image failed to load:', (target as HTMLImageElement).src);
      }
    };

    document.addEventListener('error', handleResourceError, true);

    return () => {
      window.removeEventListener('load', initMonitoring);
      document.removeEventListener('error', handleResourceError, true);
    };
  }, []);

  // Retornar utilidades de performance para uso en componentes
  return {
    measureTime: performanceUtils.measureTime,
    markStart: performanceUtils.markStart,
    markEnd: performanceUtils.markEnd,
    debounce: performanceUtils.debounce,
    throttle: performanceUtils.throttle,
  };
};