import React, { Suspense, lazy, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Leaf } from 'lucide-react';

import { useAuthInitialization } from './hooks/useAuthInitialization';
import { ToastProvider } from './components/ui/Toast';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { routes } from './lib/navigation';
import { PERFORMANCE_CONFIG } from './lib/performance';
import { initViewportFix } from './utils/mobileViewport';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const PlantDetail = lazy(() => import('./pages/PlantDetail'));
const CameraPage = lazy(() => import('./pages/Camera'));
const ChatPage = lazy(() => import('./pages/Chat'));
const GardenChatPage = lazy(() => import('./pages/GardenChat'));
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
      retryDelay: attemptIndex =>
        Math.min(PERFORMANCE_CONFIG.QUERY.RETRY.DELAY * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: PERFORMANCE_CONFIG.QUERY.RETRY.COUNT,
      retryDelay: PERFORMANCE_CONFIG.QUERY.RETRY.DELAY,
    },
  },
});

const FullScreenLoader: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-screen bg-emerald-50 text-emerald-900">
    <Leaf className="w-12 h-12 text-emerald-500 animate-bounce mb-4" />
    <p className="text-lg text-emerald-800/80">{message}</p>
  </div>
);

const getBasename = (): string => {
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return '/';
  }

  if (window.location.pathname.startsWith('/plantitas-app')) {
    return '/plantitas-app/';
  }

  return '/';
};

const App: React.FC = () => {
  const authState = useAuthInitialization();

  useEffect(() => {
    const cleanup = initViewportFix();
    return () => {
      cleanup();
    };
  }, []);

  if (!authState.initialized) {
    const message = authState.loading
      ? authState.progress.message
      : authState.error || 'Inicializando...';

    return <FullScreenLoader message={message} />;
  }

  const PrivateRoutes = () => (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="camera" element={<CameraPage />} />
        <Route path="settings" element={<Settings />} />
        <Route path="garden-chat" element={<GardenChatPage />} />
        <Route path="plant/:plantId" element={<PlantDetail />} />
        <Route path="plant/:plantId/chat" element={<ChatPage />} />
        <Route path="*" element={<Navigate to={routes.dashboard} replace />} />
      </Route>
    </Routes>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ErrorBoundary>
          <Router basename={getBasename()}>
            <Toaster position="top-center" richColors />
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
