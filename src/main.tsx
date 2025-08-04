import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from './stores/useAuthStore';
import plantService from './services/plantService';
import cacheService from './services/cacheService';
import performanceService from './services/performanceService';
import { initAdvancedMobileDebug, logCriticalError } from './utils/mobileDebugAdvanced';
import { Toaster } from 'sonner';

// 🚨 CRITICAL: iOS Safari compatibility check
// ResizeObserver es ampliamente soportado en navegadores modernos

// 🚨 CRITICAL MOBILE DEBUG - Inicializar INMEDIATAMENTE
console.log('[MOBILE] 🚨 Main.tsx loading started');
console.log('[MOBILE] Location:', window.location.href);
console.log('[MOBILE] Pathname:', window.location.pathname);
console.log('[MOBILE] User Agent:', navigator.userAgent);

// Function to handle global errors (for advanced debugging)
(window as any).logGlobalError = (error: Error, type: string = 'GLOBAL', details: any = {}) => {
  logCriticalError(error, type, details);
};

// Initialize services
const initializeServices = async () => {
  try {
    console.log('[SERVICES] Initializing application services...');
    
    // Initialize cache service first (for offline capability)
    await cacheService.initialize();
    console.log('[SERVICES] ✅ Cache service initialized');
    
    // Performance service is auto-initialized
    console.log('[SERVICES] ✅ Performance service initialized');
    
    console.log('[SERVICES] All services initialized successfully');
  } catch (error) {
    console.error('[SERVICES] Failed to initialize services:', error);
    logCriticalError('SERVICES_INITIALIZATION', error);
  }
};

// Start service initialization
initializeServices();

// Test de compatibilidad desactivado temporalmente
// El problema podría estar en los compatibility tests

const queryClient = new QueryClient();

// Prefetch de plantas tras login
function PrefetchOnLogin() {
  const { user } = useAuthStore();
  React.useEffect(() => {
    if (user?.id) {
      queryClient.prefetchQuery({
        queryKey: ['plants', user.id],
        queryFn: () => plantService.getUserPlants(user.id),
        staleTime: 1000 * 60 * 5,
      });
    }
  }, [user?.id]);
  return null;
}

console.log('[MOBILE] Looking for root container...');
const rootElement = document.getElementById('root');

if (!rootElement) {
  logCriticalError('ROOT_CONTAINER', 'Root container not found');
  throw new Error('Root container not found');
}

console.log('[MOBILE] Root container found, creating React root...');

try {
  const root = ReactDOM.createRoot(rootElement);
  console.log('[MOBILE] React root created, rendering App...');
  
  root.render(
    <React.StrictMode>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <PrefetchOnLogin />
          <App />
          <Toaster />
        </QueryClientProvider>
      </ThemeProvider>
    </React.StrictMode>
  );
  
  console.log('[MOBILE] App render called successfully');
} catch (error) {
  logCriticalError('REACT_RENDER', error);
  throw error;
}