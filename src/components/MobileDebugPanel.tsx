import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, X, Eye, EyeOff, AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react';

interface DebugLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  details?: any;
}

interface FirebaseStatus {
  config: boolean;
  auth: boolean;
  firestore: boolean;
  initialized: boolean;
  user: boolean;
}

export const MobileDebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [firebaseStatus, setFirebaseStatus] = useState<FirebaseStatus>({
    config: false,
    auth: false,
    firestore: false,
    initialized: false,
    user: false,
  });
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);
  const [autoOpened, setAutoOpened] = useState(false);

  // Interceptar console.log, console.warn, console.error
  useEffect(() => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const addLog = (level: 'info' | 'warn' | 'error' | 'success', message: string, ...args: any[]) => {
      const logEntry: DebugLog = {
        id: Date.now().toString(),
        timestamp: new Date(),
        level,
        message: typeof message === 'string' ? message : JSON.stringify(message),
        details: args.length > 0 ? args : undefined,
      };

      setLogs(prev => [...prev.slice(-49), logEntry]); // Keep last 50 logs
    };

    console.log = (message: any, ...args: any[]) => {
      originalLog(message, ...args);
      addLog('info', message, ...args);
    };

    console.warn = (message: any, ...args: any[]) => {
      originalWarn(message, ...args);
      addLog('warn', message, ...args);
    };

    console.error = (message: any, ...args: any[]) => {
      originalError(message, ...args);
      addLog('error', message, ...args);
    };

    // Interceptar errores globales
    const handleError = (event: ErrorEvent) => {
      addLog('error', `Global Error: ${event.message}`, {
        filename: event.filename,
        lineno: event.lineno,
        error: event.error?.stack
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      addLog('error', `Unhandled Promise Rejection: ${event.reason}`, event.reason);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    // Monitorear estado de red
    const handleOnline = () => {
      setNetworkStatus(true);
      addLog('success', 'Connection restored');
    };
    const handleOffline = () => {
      setNetworkStatus(false);
      addLog('error', 'Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Verificar estado de Firebase periódicamente
  useEffect(() => {
    const checkFirebaseStatus = () => {
      try {
        // Check Firebase config
        const hasConfig = !!(
          import.meta.env.VITE_FIREBASE_API_KEY && 
          import.meta.env.VITE_FIREBASE_PROJECT_ID
        );

        // Check Firebase services (si están disponibles globalmente)
        const firebaseApp = (window as any).firebaseApp;
        const firebaseAuth = (window as any).firebaseAuth;
        const firebaseDb = (window as any).firebaseDb;

        setFirebaseStatus({
          config: hasConfig,
          auth: !!firebaseAuth,
          firestore: !!firebaseDb,
          initialized: !!firebaseApp,
          user: !!firebaseAuth?.currentUser,
        });
      } catch (error) {
        console.warn('Error checking Firebase status:', error);
      }
    };

    // Check immediately and then every 2 seconds
    checkFirebaseStatus();
    const interval = setInterval(checkFirebaseStatus, 2000);

    return () => clearInterval(interval);
  }, []);

  // Auto-show on errors OR if screen appears blank
  useEffect(() => {
    const hasErrors = logs.some(log => log.level === 'error');
    const hasFirebaseErrors = !firebaseStatus.config || !firebaseStatus.initialized;
    
    // Auto-open if there are errors and we haven't auto-opened yet
    if ((hasErrors || hasFirebaseErrors) && !autoOpened) {
      setIsVisible(true);
      setAutoOpened(true);
    }
  }, [logs, firebaseStatus, autoOpened]);

  // Auto-open after 3 seconds if app seems stuck
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!firebaseStatus.initialized && !autoOpened) {
        console.warn('🚨 App appears stuck, auto-opening debug panel');
        setIsVisible(true);
        setAutoOpened(true);
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [firebaseStatus.initialized, autoOpened]);

  const getLogIcon = (level: DebugLog['level']) => {
    switch (level) {
      case 'error': return '🔴';
      case 'warn': return '🟡';
      case 'success': return '✅';
      default: return 'ℹ️';
    }
  };

  const getLogColor = (level: DebugLog['level']) => {
    switch (level) {
      case 'error': return 'text-red-500';
      case 'warn': return 'text-yellow-500';
      case 'success': return 'text-green-500';
      default: return 'text-blue-500';
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const exportLogs = () => {
    const logsText = logs.map(log => 
      `[${log.timestamp.toISOString()}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n');
    
    navigator.clipboard?.writeText(logsText).then(() => {
      console.log('📋 Logs copied to clipboard');
    }).catch(() => {
      console.warn('📋 Could not copy logs to clipboard');
    });
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-50 bg-red-500 text-white rounded-full p-3 shadow-lg"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        style={{ 
          background: logs.some(l => l.level === 'error') ? '#ef4444' : '#6b7280',
        }}
      >
        <Bug size={20} />
      </motion.button>

      {/* Debug Panel */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="fixed inset-0 z-40 bg-black/90 backdrop-blur-sm"
          >
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bug size={20} />
                  <span className="font-semibold">Debug Panel</span>
                  {networkStatus ? (
                    <Wifi size={16} className="text-green-400" />
                  ) : (
                    <WifiOff size={16} className="text-red-400" />
                  )}
                </div>
                <button
                  onClick={() => setIsVisible(false)}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Firebase Status */}
              <div className="bg-gray-800 text-white p-3 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1">
                    {firebaseStatus.config ? <CheckCircle size={12} className="text-green-400" /> : <AlertCircle size={12} className="text-red-400" />}
                    <span>Config</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {firebaseStatus.auth ? <CheckCircle size={12} className="text-green-400" /> : <AlertCircle size={12} className="text-red-400" />}
                    <span>Auth</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {firebaseStatus.firestore ? <CheckCircle size={12} className="text-green-400" /> : <AlertCircle size={12} className="text-red-400" />}
                    <span>Firestore</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {firebaseStatus.user ? <CheckCircle size={12} className="text-green-400" /> : <AlertCircle size={12} className="text-gray-400" />}
                    <span>User</span>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="bg-gray-700 text-white p-2 flex gap-2 text-xs">
                <button
                  onClick={clearLogs}
                  className="px-2 py-1 bg-gray-600 rounded hover:bg-gray-500"
                >
                  Clear
                </button>
                <button
                  onClick={exportLogs}
                  className="px-2 py-1 bg-blue-600 rounded hover:bg-blue-500"
                >
                  Copy
                </button>
                <div className="flex-1 text-center text-gray-300">
                  {logs.length} logs
                </div>
              </div>

              {/* Logs */}
              <div className="flex-1 overflow-y-auto bg-black text-white">
                {logs.length === 0 ? (
                  <div className="p-4 text-center text-gray-400">
                    No logs yet. Errors will appear here automatically.
                  </div>
                ) : (
                  <div className="p-2 space-y-1">
                    {logs.map(log => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-xs border-l-2 border-gray-600 pl-2 py-1"
                        style={{
                          borderLeftColor: log.level === 'error' ? '#ef4444' : 
                                         log.level === 'warn' ? '#f59e0b' :
                                         log.level === 'success' ? '#10b981' : '#3b82f6'
                        }}
                      >
                        <div className="flex items-start gap-1">
                          <span className="shrink-0">{getLogIcon(log.level)}</span>
                          <div className="flex-1">
                            <div className={`font-mono ${getLogColor(log.level)}`}>
                              {log.message}
                            </div>
                            <div className="text-gray-400 text-[10px]">
                              {log.timestamp.toLocaleTimeString()}
                            </div>
                            {log.details && (
                              <details className="mt-1">
                                <summary className="text-gray-300 cursor-pointer">Details</summary>
                                <pre className="text-[10px] text-gray-400 mt-1 whitespace-pre-wrap">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};