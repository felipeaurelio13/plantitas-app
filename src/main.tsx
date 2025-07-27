import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import useAuthStore from './stores/useAuthStore';
import { useEffect } from 'react';
import { initAdvancedMobileDebug, logCriticalError } from './utils/mobileDebugAdvanced';

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

// Test de compatibilidad desactivado temporalmente
// El problema podría estar en los compatibility tests

const queryClient = new QueryClient();

// Initialize auth on app start
const initAuth = () => {
  try {
    const { initialize } = useAuthStore.getState();
    initialize();
  } catch (error) {
    console.error('[MAIN] Auth initialization failed:', error);
    // Use a more forgiving error logging
    if (typeof error === 'string') {
      logCriticalError(error, 'AUTH_INIT');
    } else if (error instanceof Error) {
      logCriticalError(error.message, 'AUTH_INIT');
    } else {
      logCriticalError('Unknown auth error', 'AUTH_INIT');
    }
  }
};

// Prefetch de plantas tras login
function PrefetchOnLogin() {
  const { user } = useAuthStore();
  useEffect(() => {
    if (user) {
      // Prefetch user plants when logged in
      console.log('[MAIN] User logged in, prefetching data...');
    }
  }, [user]);
  return null;
}

console.log('[MOBILE] Looking for root container...');
const container = document.getElementById('root');

if (!container) {
  logCriticalError('ROOT_CONTAINER', 'Root container not found');
  throw new Error('Root container not found');
}

console.log('[MOBILE] Root container found, creating React root...');

try {
  const root = ReactDOM.createRoot(container);
  console.log('[MOBILE] React root created, rendering App...');
  
  // Initialize auth system
  initAuth();
  
  root.render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
        <PrefetchOnLogin />
      </BrowserRouter>
    </QueryClientProvider>
  );
  
  console.log('[MOBILE] App render called successfully');
} catch (error) {
  logCriticalError('REACT_RENDER', error);
  throw error;
}