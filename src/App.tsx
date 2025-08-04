import React, { Suspense, lazy, useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useAuthInitialization } from './hooks/useAuthInitialization';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
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
  // Use enhanced auth initialization hook
  const authState = useAuthInitialization();
  
  // Solo log en desarrollo para debugging
  if (import.meta.env.DEV) {
    console.log('[APP] App component mounting... User:', !!authState.user, 'Initialized:', authState.initialized);
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
      
      return () => {
        console.log('[APP] Cleanup running...');
        cleanupViewport();
      };
    } catch (error) {
      logCriticalError('APP_INITIALIZATION', error);
      throw error;
    }
  }, []); // Remove initialize dependency as it's handled by the hook

  // Show loading screen with progress if not initialized
  if (!authState.initialized) {
    const message = authState.loading 
      ? authState.progress.message 
      : authState.error || "Inicializando...";
    
    return <FullScreenLoader message={message} />;
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
                element={!authState.user ? <AuthPage /> : <Navigate to={routes.dashboard} replace />}
              />
              <Route
                path="/*"
                element={authState.user ? <PrivateRoutes /> : <Navigate to={routes.auth} replace />}
              />
            </Routes>
          </Suspense>
        </Router>
      </ErrorBoundary>
      </ToastProvider>
    </QueryClientProvider>
  );
};

export default App;