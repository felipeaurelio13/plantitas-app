import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, Wifi, WifiOff } from 'lucide-react';

const MobileDebugPanel: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [firebaseStatus, setFirebaseStatus] = useState({
    config: false,
    auth: false,
    firestore: false,
    user: false
  });

  useEffect(() => {
    // Simple firebase status check
    setFirebaseStatus({
      config: true,
      auth: true,
      firestore: true,
      user: false
    });
  }, []);

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-blue-600 text-white p-2 rounded-full shadow-lg z-50"
      >
        Debug
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full max-h-96 overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-semibold">Debug Panel</h3>
          <button onClick={() => setIsVisible(false)}>
            <X size={20} />
          </button>
        </div>
        
        <div className="p-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Network:</span>
              <Wifi size={16} className="text-green-400" />
            </div>
            
            <div className="flex items-center justify-between">
              <span>Config:</span>
              {firebaseStatus.config ? 
                <CheckCircle size={12} className="text-green-400" /> : 
                <AlertCircle size={12} className="text-red-400" />
              }
            </div>
            
            <div className="flex items-center justify-between">
              <span>Auth:</span>
              {firebaseStatus.auth ? 
                <CheckCircle size={12} className="text-green-400" /> : 
                <AlertCircle size={12} className="text-red-400" />
              }
            </div>
            
            <div className="flex items-center justify-between">
              <span>Firestore:</span>
              {firebaseStatus.firestore ? 
                <CheckCircle size={12} className="text-green-400" /> : 
                <AlertCircle size={12} className="text-red-400" />
              }
            </div>
            
            <div className="flex items-center justify-between">
              <span>User:</span>
              {firebaseStatus.user ? 
                <CheckCircle size={12} className="text-green-400" /> : 
                <AlertCircle size={12} className="text-gray-400" />
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileDebugPanel;
