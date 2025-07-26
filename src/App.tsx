import React, { Suspense, lazy, useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import useAuthStore from './stores/useAuthStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ToastProvider as NewToastProvider } from './components/ui/Toast/ToastProvider';
import { ToastProvider } from './components/ui/Toast';
import { usePerformanceMonitoring } from './hooks/usePerformanceMonitoring';
import { initViewportFix, getMobileDeviceInfo } from './utils/mobileViewport';
import { MobileDebugPanel } from './components/MobileDebugPanel';
import { logCriticalError } from './utils/mobileDebugAdvanced';

import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { routes } from './lib/navigation';
import { PERFORMANCE_CONFIG } from './lib/performance';
import { Leaf } from 'lucide-react';

// Importaciones directas para páginas core (mejor UX)
import Dashboard from './pages/Dashboard';
import PlantDetail from './pages/PlantDetail';
import CameraPage from './pages/Camera';
import ChatPage from './pages/Chat';
import GardenChatPage from './pages/GardenChat';

// Lazy loading solo para páginas secundarias
const Settings = lazy(() => import('./pages/Settings'));
const AuthPage = lazy(() => import('./pages/Auth'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: PERFORMANCE_CONFIG.QUERY.STALE_TIME.MEDIUM,
      gcTime: PERFORMANCE_CONFIG.QUERY.GC_TIME.MEDIUM,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: PERFORMANCE_CONFIG.QUERY.RETRY.COUNT,
      retryDelay: attemptIndex => Math.min(PERFORMANCE_CONFIG.QUERY.RETRY.DELAY * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: PERFORMANCE_CONFIG.QUERY.RETRY.COUNT,
      retryDelay: PERFORMANCE_CONFIG.QUERY.RETRY.DELAY,
    },
  },
});

const FullScreenLoader: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
    <Leaf className="w-12 h-12 text-green-500 animate-bounce mb-4" />
    <p className="text-lg text-muted-foreground">{message}</p>
  </div>
);

// Smart basename detection para mobile compatibility
const getBasename = (): string => {
  // Local development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return '/';
  }
  
  // GitHub Pages detection
  if (window.location.pathname.startsWith('/plantitas-app')) {
    return '/plantitas-app/';
  }
  
  // Fallback
  return '/';
};

const App: React.FC = () => {
  const { user, isInitialized, initialize } = useAuthStore();
  
  // Solo log en desarrollo para debugging
  if (import.meta.env.DEV) {
    console.log('[APP] App component mounting... User:', !!user, 'Initialized:', isInitialized);
  }
  
  // Monitoreo de performance en desarrollo
  usePerformanceMonitoring();

  useEffect(() => {
    console.log('[APP] useEffect running...');
    
    try {
      // Initialize viewport fix for mobile compatibility
      const cleanupViewport = initViewportFix();
      
      // Log mobile device info for debugging
      if (import.meta.env.DEV) {
        console.log('[Mobile Debug]', getMobileDeviceInfo());
      }
      
      // The initialize function is now async and handles its own lifecycle.
      console.log('[APP] Calling initialize...');
      initialize();
      console.log('[APP] Initialize called');
      
      return () => {
        console.log('[APP] Cleanup running...');
        cleanupViewport();
      };
    } catch (error) {
      logCriticalError(error, 'APP_INITIALIZATION');
      throw error;
    }
  }, [initialize]);

  // 🚨 EMERGENCY FIX: Timeout para auth initialization
  const [forceRender, setForceRender] = useState(false);
  
  useEffect(() => {
    // Si después de 3 segundos no se inicializa, forzar render
    const emergencyTimeout = setTimeout(() => {
      if (!isInitialized) {
        console.warn('[APP] Emergency timeout - forcing app render');
        setForceRender(true);
      }
    }, 3000);
    
    return () => clearTimeout(emergencyTimeout);
  }, [isInitialized]);

      if (!isInitialized && !forceRender) {
      return <FullScreenLoader message="Inicializando..." />;
    }

  const PrivateRoutes = () => (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Main Routes */}
        <Route index element={<Dashboard />} />
        <Route path="camera" element={<CameraPage />} />
        <Route path="settings" element={<Settings />} />
        
        {/* Chat Routes - Clearly separated */}
        <Route path="garden-chat" element={<GardenChatPage />} />
        
        {/* Plant Routes */}
        <Route path="plant/:plantId" element={<PlantDetail />} />
        <Route path="plant/:plantId/chat" element={<ChatPage />} />
        
        {/* Catch all - redirect to dashboard with replace to avoid history pollution */}
        <Route path="*" element={<Navigate to={routes.dashboard} replace />} />
      </Route>
    </Routes>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <NewToastProvider>
        <ToastProvider>
          <ErrorBoundary>
            <Router 
              basename={getBasename()}
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <Toaster position="top-center" richColors />
              <MobileDebugPanel />
              <Suspense fallback={<FullScreenLoader message="Cargando..." />}>
              <Routes>
                <Route
                  path={routes.auth}
                  element={!user ? <AuthPage /> : <Navigate to={routes.dashboard} replace />}
                />
                <Route
                  path="/*"
                  element={!!user ? <PrivateRoutes /> : <Navigate to={routes.auth} replace />}
                />
              </Routes>
            </Suspense>
          </Router>
        </ErrorBoundary>
        </ToastProvider>
      </NewToastProvider>
    </QueryClientProvider>
  );
};

export default App;