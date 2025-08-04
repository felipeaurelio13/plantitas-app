import React, { Suspense, lazy, useEffect, useState, useMemo } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import useAuthStore from './stores/useAuthStore';
import usePlantStore from './stores/usePlantStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ToastProvider as NewToastProvider } from './components/ui/Toast/ToastProvider';
import { ToastProvider } from './components/ui/Toast';
import { usePerformanceMonitoring } from './hooks/usePerformanceMonitoring';
import { initViewportFix, getMobileDeviceInfo } from './utils/mobileViewport';
import { MobileDebugPanel } from './components/MobileDebugPanel';
import { EmergencyDebugOverlay } from './components/EmergencyDebugOverlay';
import { FirebaseConfigMissing } from './components/FirebaseConfigMissing';
import { logCriticalError } from './utils/mobileDebugAdvanced';
import { isFirebaseReady } from './lib/firebase';

import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { routes } from './lib/navigation';
import { PERFORMANCE_CONFIG } from './lib/performance';
import { Leaf, Loader2 } from 'lucide-react';

// Crítico: Cargar inmediatamente
import Dashboard from './pages/Dashboard';

// Importante: Lazy load con prioridad alta
const PlantDetail = lazy(() => 
  import('./pages/PlantDetail').then(module => {
    // Preload related components while loading
    import('./pages/Chat');
    return module;
  })
);

const CameraPage = lazy(() => import('./pages/Camera'));

// Opcional: Lazy load con prioridad baja
const ChatPage = lazy(() => import('./pages/Chat'));
const GardenChatPage = lazy(() => import('./pages/GardenChat'));
const Settings = lazy(() => import('./pages/Settings'));
const AuthPage = lazy(() => import('./pages/Auth'));

// Skeleton Components
const DashboardSkeleton = () => (
  <div className="p-4 space-y-4">
    <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-48 bg-gray-200 rounded animate-pulse"></div>
      ))}
    </div>
  </div>
);

const AdvancedLoader: React.FC<{ message: string; progress?: number }> = ({ message, progress }) => (
  <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
    <Leaf className="w-12 h-12 text-green-500 animate-bounce mb-4" />
    <div className="flex items-center space-x-2 mb-2">
      <Loader2 className="w-4 h-4 animate-spin" />
      <p className="text-lg text-muted-foreground">{message}</p>
    </div>
    {progress !== undefined && (
      <div className="w-64 bg-gray-200 rounded-full h-2">
        <div 
          className="bg-green-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    )}
  </div>
);

// Smart basename detection
const getBasename = (): string => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return '/';
  }
  if (window.location.pathname.startsWith('/plantitas-app')) {
    return '/plantitas-app/';
  }
  return '/';
};

// Optimized QueryClient with intelligent caching
const createOptimizedQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: PERFORMANCE_CONFIG.QUERY.STALE_TIME.MEDIUM,
      gcTime: PERFORMANCE_CONFIG.QUERY.GC_TIME.MEDIUM,
      refetchOnWindowFocus: false,
      refetchOnReconnect: 'always',
      retry: (failureCount, error) => {
        // Don't retry on auth errors
        if (error?.message?.includes('auth') || error?.message?.includes('permission')) {
          return false;
        }
        return failureCount < PERFORMANCE_CONFIG.QUERY.RETRY.COUNT;
      },
      retryDelay: attemptIndex => Math.min(PERFORMANCE_CONFIG.QUERY.RETRY.DELAY * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: PERFORMANCE_CONFIG.QUERY.RETRY.COUNT,
      retryDelay: PERFORMANCE_CONFIG.QUERY.RETRY.DELAY,
    },
  },
});

enum InitializationPhase {
  STARTING = 'starting',
  FIREBASE = 'firebase',
  AUTH = 'auth',
  DATA = 'data',
  COMPLETE = 'complete'
}

const App: React.FC = () => {
  const { user, isInitialized, initialize } = useAuthStore();
  const { loadPlants } = usePlantStore();
  
  const [initPhase, setInitPhase] = useState<InitializationPhase>(InitializationPhase.STARTING);
  const [initProgress, setInitProgress] = useState(0);
  const [forceRender, setForceRender] = useState(false);

  // Memoized QueryClient to prevent recreation
  const queryClient = useMemo(() => createOptimizedQueryClient(), []);

  // Check Firebase configuration
  const firebaseConfigured = useMemo(() => !!(
    import.meta.env.VITE_FIREBASE_API_KEY && 
    import.meta.env.VITE_FIREBASE_PROJECT_ID
  ), []);

  usePerformanceMonitoring();

  // Phased initialization
  useEffect(() => {
    let isMounted = true;
    
    const initializeApp = async () => {
      try {
        console.log('[APP] Starting phased initialization...');
        
        // Phase 1: Firebase and viewport setup
        setInitPhase(InitializationPhase.FIREBASE);
        setInitProgress(20);
        
        const cleanupViewport = initViewportFix();
        
        if (import.meta.env.DEV) {
          console.log('[Mobile Debug]', getMobileDeviceInfo());
        }

        // Wait for Firebase to be ready
        let firebaseReady = false;
        let attempts = 0;
        while (!firebaseReady && attempts < 10 && isMounted) {
          firebaseReady = isFirebaseReady();
          if (!firebaseReady) {
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
          }
        }

        if (!isMounted) return;

        // Phase 2: Auth initialization
        setInitPhase(InitializationPhase.AUTH);
        setInitProgress(50);
        
        initialize();
        
        // Wait for auth to be initialized
        let authInitialized = false;
        attempts = 0;
        while (!authInitialized && attempts < 20 && isMounted) {
          authInitialized = isInitialized;
          if (!authInitialized) {
            await new Promise(resolve => setTimeout(resolve, 250));
            attempts++;
          }
        }

        if (!isMounted) return;

        // Phase 3: Data preloading (if user is authenticated)
        if (user?.id) {
          setInitPhase(InitializationPhase.DATA);
          setInitProgress(80);
          
          try {
            // Preload critical data in parallel
            await Promise.allSettled([
              loadPlants(user.id),
              // Add other critical data preloading here
            ]);
          } catch (error) {
            console.warn('[APP] Non-critical data preloading failed:', error);
          }
        }

        // Phase 4: Complete
        setInitPhase(InitializationPhase.COMPLETE);
        setInitProgress(100);
        
        return () => {
          cleanupViewport();
        };
      } catch (error) {
        logCriticalError(error, 'APP_INITIALIZATION');
        console.error('[APP] Initialization failed:', error);
        setForceRender(true);
      }
    };

    initializeApp();

    return () => {
      isMounted = false;
    };
  }, [initialize, isInitialized, user?.id, loadPlants]);

  // Emergency timeout
  useEffect(() => {
    const emergencyTimeout = setTimeout(() => {
      if (initPhase !== InitializationPhase.COMPLETE) {
        console.warn('[APP] Emergency timeout - forcing app render');
        setForceRender(true);
      }
    }, 8000);
    
    return () => clearTimeout(emergencyTimeout);
  }, [initPhase]);

  // Firebase configuration check
  if (!firebaseConfigured) {
    return (
      <>
        <MobileDebugPanel />
        <EmergencyDebugOverlay />
        <FirebaseConfigMissing />
      </>
    );
  }

  // Loading states with progress
  if ((initPhase !== InitializationPhase.COMPLETE && !forceRender)) {
    const getLoadingMessage = () => {
      switch (initPhase) {
        case InitializationPhase.STARTING:
          return 'Iniciando aplicación...';
        case InitializationPhase.FIREBASE:
          return 'Conectando con Firebase...';
        case InitializationPhase.AUTH:
          return 'Verificando autenticación...';
        case InitializationPhase.DATA:
          return 'Cargando tus plantas...';
        default:
          return 'Finalizando carga...';
      }
    };

    return <AdvancedLoader message={getLoadingMessage()} progress={initProgress} />;
  }

  const PrivateRoutes = () => (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={
          <Suspense fallback={<DashboardSkeleton />}>
            <Dashboard />
          </Suspense>
        } />
        <Route path="camera" element={
          <Suspense fallback={<AdvancedLoader message="Preparando cámara..." />}>
            <CameraPage />
          </Suspense>
        } />
        <Route path="settings" element={
          <Suspense fallback={<AdvancedLoader message="Cargando configuración..." />}>
            <Settings />
          </Suspense>
        } />
        <Route path="garden-chat" element={
          <Suspense fallback={<AdvancedLoader message="Cargando chat del jardín..." />}>
            <GardenChatPage />
          </Suspense>
        } />
        <Route path="plant/:plantId" element={
          <Suspense fallback={<AdvancedLoader message="Cargando planta..." />}>
            <PlantDetail />
          </Suspense>
        } />
        <Route path="plant/:plantId/chat" element={
          <Suspense fallback={<AdvancedLoader message="Preparando chat..." />}>
            <ChatPage />
          </Suspense>
        } />
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
              <EmergencyDebugOverlay />
              <Suspense fallback={<AdvancedLoader message="Cargando..." />}>
                <Routes>
                  <Route
                    path={routes.auth}
                    element={!user ? (
                      <Suspense fallback={<AdvancedLoader message="Cargando autenticación..." />}>
                        <AuthPage />
                      </Suspense>
                    ) : (
                      <Navigate to={routes.dashboard} replace />
                    )}
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