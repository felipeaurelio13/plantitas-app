import { useState, useEffect } from 'react';

export const useOfflineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    networkQuality: 'unknown',
    isSlowConnection: false,
    networkType: 'unknown',
    connectionSpeed: 0,
    connectionLatency: 0,
    networkStatus: {
      isOnline,
      isOffline: !isOnline,
      networkQuality: 'unknown',
      isSlowConnection: false,
      networkType: 'unknown',
      connectionSpeed: 0,
      connectionLatency: 0,
    }
  };
};