import React, { Suspense, lazy, useEffect, useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { useAuthStore } from './stores/useAuthStore';
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
import { Leaf, WifiOff } from 'lucide-react';

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

const FullScreenLoader: React.FC<{ message: string; showDevelopmentInfo?: boolean }> = ({ 
  message, 
  showDevelopmentInfo = false 
}) => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-foreground px-4">
    <div className="text-center max-w-md">
      <Leaf className="w-16 h-16 text-green-500 animate-bounce mb-6 mx-auto" />
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Plantitas</h1>
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">{message}</p>
      
      {showDevelopmentInfo && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mt-6">
          <div className="flex items-center justify-center mb-2">
            <WifiOff className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2" />
            <span className="text-sm font-medium text-blue-800 dark:text-blue-300">Modo Desarrollo</span>
          </div>
          <p className="text-xs text-blue-600 dark:text-blue-400">
            Configurar Supabase en .env para funcionalidad completa
          </p>
        </div>
      )}
      
      <div className="flex justify-center mt-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    </div>
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
  const { session, isInitialized, isDevelopmentMode, initialize } = useAuthStore();
  
  // 🚨 EMERGENCY FIX: Timeout para auth initialization con tiempo más corto para móvil
  const [forceRender, setForceRender] = useState(false);
  const [initializationFailed, setInitializationFailed] = useState(false);
  
  // Solo log en desarrollo para debugging
  if (import.meta.env.DEV) {
    console.log('[APP] App component mounting... Session:', !!session, 'Initialized:', isInitialized, 'Dev mode:', isDevelopmentMode);
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
      initialize().catch((error) => {
        console.error('[APP] Initialize failed:', error);
        setInitializationFailed(true);
        setForceRender(true);
      });
      console.log('[APP] Initialize called');
      
      return () => {
        console.log('[APP] Cleanup running...');
        cleanupViewport();
      };
    } catch (error) {
      logCriticalError('APP_INITIALIZATION', error);
      setInitializationFailed(true);
      setForceRender(true);
    }
  }, [initialize]);

  useEffect(() => {
    // Si después de 2 segundos no se inicializa, forzar render (más rápido para móvil)
    const emergencyTimeout = setTimeout(() => {
      if (!isInitialized) {
        console.warn('[APP] Emergency timeout - forcing app render');
        setForceRender(true);
      }
    }, 2000);
    
    return () => clearTimeout(emergencyTimeout);
  }, [isInitialized]);

  // Show loading until initialized or forced render
  if (!isInitialized && !forceRender) {
    return (
      <FullScreenLoader 
        message={initializationFailed ? "Iniciando en modo sin conexión..." : "Inicializando..."}
        showDevelopmentInfo={isDevelopmentMode || initializationFailed}
      />
    );
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
              {import.meta.env.DEV && <MobileDebugPanel />}
              <Suspense fallback={
                <FullScreenLoader 
                  message="Cargando..." 
                  showDevelopmentInfo={isDevelopmentMode}
                />
              }>
                <Routes>
                  <Route
                    path={routes.auth}
                    element={!session ? <AuthPage /> : <Navigate to={routes.dashboard} replace />}
                  />
                  <Route
                    path="/*"
                    element={session ? <PrivateRoutes /> : <Navigate to={routes.auth} replace />}
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