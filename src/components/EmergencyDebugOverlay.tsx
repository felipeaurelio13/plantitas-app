import React, { useEffect, useState } from 'react';

interface EmergencyInfo {
  timestamp: string;
  url: string;
  userAgent: string;
  screenSize: string;
  firebaseEnv: {
    apiKey: string;
    projectId: string;
    authDomain: string;
  };
  errors: string[];
}

export const EmergencyDebugOverlay: React.FC = () => {
  const [showEmergency, setShowEmergency] = useState(false);
  const [info, setInfo] = useState<EmergencyInfo | null>(null);

  useEffect(() => {
    // Si después de 2 segundos no se ve nada, mostrar info de emergencia
    const emergencyTimer = setTimeout(() => {
      console.log('🆘 EMERGENCY: Showing debug overlay');
      
      const emergencyInfo: EmergencyInfo = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
        screenSize: `${window.screen.width}x${window.screen.height}`,
        firebaseEnv: {
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY ? 'SET' : 'MISSING',
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'MISSING',
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'MISSING',
        },
        errors: []
      };
      
      // Capturar errores de la consola
      try {
        // Revisar si hay errores en window.console
        if ((window as any).__consoleErrors) {
          emergencyInfo.errors = (window as any).__consoleErrors;
        }
      } catch (e) {
        emergencyInfo.errors.push(`Error getting console errors: ${e}`);
      }
      
      setInfo(emergencyInfo);
      setShowEmergency(true);
    }, 2000);

    return () => clearTimeout(emergencyTimer);
  }, []);

  if (!showEmergency || !info) return null;

  const copyInfo = () => {
    const textInfo = `
🆘 EMERGENCY DEBUG INFO
Time: ${info.timestamp}
URL: ${info.url}
User Agent: ${info.userAgent}
Screen: ${info.screenSize}

🔥 Firebase Config:
- API Key: ${info.firebaseEnv.apiKey}
- Project ID: ${info.firebaseEnv.projectId}
- Auth Domain: ${info.firebaseEnv.authDomain}

❌ Errors: ${info.errors.length > 0 ? info.errors.join('\n') : 'None captured'}
    `;
    
    navigator.clipboard?.writeText(textInfo).then(() => {
      alert('📋 Debug info copied to clipboard!');
    }).catch(() => {
      console.log('📋 Could not copy to clipboard');
    });
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/95 text-white p-4 overflow-y-auto text-xs">
      <div className="max-w-full">
        <div className="bg-red-600 text-white p-3 rounded mb-4 text-center">
          <h1 className="text-lg font-bold">🆘 EMERGENCY DEBUG</h1>
          <p>App appears to be stuck. Here's the debug info:</p>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-800 p-3 rounded">
            <h3 className="font-bold text-yellow-400 mb-2">📱 Device Info</h3>
            <div>Time: {info.timestamp}</div>
            <div>URL: {info.url}</div>
            <div>Screen: {info.screenSize}</div>
            <div className="mt-2 text-[10px] break-all">
              User Agent: {info.userAgent}
            </div>
          </div>

          <div className="bg-gray-800 p-3 rounded">
            <h3 className="font-bold text-blue-400 mb-2">🔥 Firebase Config</h3>
            <div className="space-y-1">
              <div className={info.firebaseEnv.apiKey === 'SET' ? 'text-green-400' : 'text-red-400'}>
                API Key: {info.firebaseEnv.apiKey}
              </div>
              <div className={info.firebaseEnv.projectId !== 'MISSING' ? 'text-green-400' : 'text-red-400'}>
                Project ID: {info.firebaseEnv.projectId}
              </div>
              <div className={info.firebaseEnv.authDomain !== 'MISSING' ? 'text-green-400' : 'text-red-400'}>
                Auth Domain: {info.firebaseEnv.authDomain}
              </div>
            </div>
          </div>

          {info.errors.length > 0 && (
            <div className="bg-red-900 p-3 rounded">
              <h3 className="font-bold text-red-400 mb-2">❌ Errors</h3>
              {info.errors.map((error, index) => (
                <div key={index} className="mb-1 text-red-200">
                  {error}
                </div>
              ))}
            </div>
          )}

          <div className="bg-yellow-900 p-3 rounded">
            <h3 className="font-bold text-yellow-400 mb-2">💡 Next Steps</h3>
            <ol className="list-decimal list-inside space-y-1 text-yellow-200">
              <li>Copy this info using the button below</li>
              <li>Share it with the developer</li>
              <li>Try refreshing the page</li>
              <li>Check your internet connection</li>
            </ol>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            onClick={copyInfo}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded font-bold"
          >
            📋 Copy Debug Info
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded font-bold"
          >
            🔄 Refresh Page
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            onClick={() => setShowEmergency(false)}
            className="text-gray-400 hover:text-white underline"
          >
            Close Emergency Panel
          </button>
        </div>
      </div>
    </div>
  );
};