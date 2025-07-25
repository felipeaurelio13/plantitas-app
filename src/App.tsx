import React, { Suspense, lazy, useEffect } from 'react';
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

const App: React.FC = () => {
  const { session, isInitialized, initialize } = useAuthStore();
  
  // Monitoreo de performance en desarrollo
  usePerformanceMonitoring();

  useEffect(() => {
    // The initialize function is now async and handles its own lifecycle.
    initialize();
    // No cleanup function is needed here anymore because the subscription
    // is managed entirely within the Zustand store.
  }, [initialize]); // Depend on initialize to re-run if the function itself changes (unlikely for Zustand).

  if (!isInitialized) {
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
              basename="/plantitas-app/"
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <Toaster position="top-center" richColors />
              <Suspense fallback={<FullScreenLoader message="Cargando..." />}>
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