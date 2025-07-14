import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuthStore, usePlantStore, initializeAuth, initializeTheme } from './stores';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import PlantDetail from './pages/PlantDetail';
import Camera from './pages/Camera';
import Chat from './pages/Chat';
import Settings from './pages/Settings';
import AuthPage from './pages/Auth';
import ErrorBoundary from './components/ErrorBoundary';
import OfflineIndicator from './components/OfflineIndicator';

// Main App Content that needs auth
const AppContent: React.FC = () => {
  const { user, loading } = useAuthStore();
  const loadPlants = usePlantStore((state) => state.loadPlants);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Load plants when user changes
  useEffect(() => {
    if (user) {
      loadPlants(user.id);
    }
  }, [user, loadPlants]);

  // Add timeout for loading state to detect infinite loading
  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000); // 10 seconds timeout

      return () => clearTimeout(timeout);
    } else {
      setLoadingTimeout(false);
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            {loadingTimeout ? 'Reconectando...' : 'Cargando...'}
          </p>
          {loadingTimeout && (
            <div className="text-sm text-gray-500 dark:text-gray-500">
              <p className="mb-2">Si esto toma demasiado tiempo, intenta:</p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600 transition-colors"
              >
                Recargar página
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage mode={authMode} onModeChange={setAuthMode} />;
  }

  return (
    <Router
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <OfflineIndicator />
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/plant/:id" element={<PlantDetail />} />
          <Route path="/camera" element={<Camera />} />
          <Route path="/chat/:id" element={<Chat />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Layout>
    </Router>
  );
};

function App() {
  // Initialize stores on app start
  useEffect(() => {
    initializeAuth();
    initializeTheme();
  }, []);

  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;