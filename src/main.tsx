import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/useAuthStore';
import { plantService } from './services/plantService';

const queryClient = new QueryClient();

// Prefetch de plantas tras login
function PrefetchOnLogin() {
  const { user } = useAuthStore();
  React.useEffect(() => {
    if (user?.id) {
      queryClient.prefetchQuery({
        queryKey: ['plants', user.id],
        queryFn: () => plantService.getUserPlantSummaries(user.id),
        staleTime: 1000 * 60 * 5,
      });
    }
  }, [user?.id]);
  return null;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <PrefetchOnLogin />
        <App />
      </QueryClientProvider>
    </ThemeProvider>
  </React.StrictMode>
);