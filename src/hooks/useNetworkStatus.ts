import { useState, useEffect } from 'react';

interface NetworkInfo {
  isOnline: boolean;
  connectionType?: string;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
}

export const useNetworkStatus = (): NetworkInfo => {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    isOnline: navigator.onLine,
  });

  useEffect(() => {
    const updateNetworkInfo = () => {
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;

      setNetworkInfo({
        isOnline: navigator.onLine,
        connectionType: connection?.type,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
      });
    };

    const handleOnline = () => {
      console.log('[Network] Connection restored');
      updateNetworkInfo();
    };

    const handleOffline = () => {
      console.log('[Network] Connection lost');
      updateNetworkInfo();
    };

    const handleConnectionChange = () => {
      console.log('[Network] Connection changed');
      updateNetworkInfo();
    };

    // Set initial state
    updateNetworkInfo();

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes (if supported)
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return networkInfo;
};

export const useConnectionQuality = () => {
  const networkInfo = useNetworkStatus();

  const getConnectionQuality = (): 'fast' | 'slow' | 'offline' => {
    if (!networkInfo.isOnline) return 'offline';
    
    if (networkInfo.effectiveType) {
      switch (networkInfo.effectiveType) {
        case '4g':
          return 'fast';
        case '3g':
          return 'slow';
        case '2g':
          return 'slow';
        case 'slow-2g':
          return 'slow';
        default:
          return 'fast';
      }
    }

    // Fallback based on downlink speed
    if (networkInfo.downlink !== undefined) {
      return networkInfo.downlink > 1.5 ? 'fast' : 'slow';
    }

    return 'fast'; // Default assumption
  };

  return {
    ...networkInfo,
    quality: getConnectionQuality(),
  };
};