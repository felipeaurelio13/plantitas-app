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
import { ToastProvider } from './components/ui/Toast';

import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import { Leaf } from 'lucide-react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const PlantDetail = lazy(() => import('./pages/PlantDetail'));
const Settings = lazy(() => import('./pages/Settings'));
const AuthPage = lazy(() => import('./pages/Auth'));
const CameraPage = lazy(() => import('./pages/Camera'));
const ChatPage = lazy(() => import('./pages/Chat'));
const GardenChatPage = lazy(() => import('./pages/GardenChat'));

const queryClient = new QueryClient();

const FullScreenLoader: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
    <Leaf className="w-12 h-12 text-green-500 animate-bounce mb-4" />
    <p className="text-lg text-muted-foreground">{message}</p>
  </div>
);

const App: React.FC = () => {
  const { session, isInitialized, initialize } = useAuthStore();

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
    <Layout>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="plant/:plantId">
          <Route index element={<PlantDetail />} />
          <Route path="chat" element={<ChatPage />} />
        </Route>
        <Route path="garden-chat" element={<GardenChatPage />} />
        <Route path="settings" element={<Settings />} />
        <Route path="camera" element={<CameraPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Layout>
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ErrorBoundary>
          <Router basename="/plantitas-app">
            <Toaster position="top-center" richColors />
            <Suspense fallback={<FullScreenLoader message="Cargando página..." />}>
            <Routes>
              <Route
                path="/auth"
                element={!session ? <AuthPage /> : <Navigate to="/" />}
              />
              <Route
                path="/*"
                element={session ? <PrivateRoutes /> : <Navigate to="/auth" />}
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