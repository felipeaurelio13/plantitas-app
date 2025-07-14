import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, Wifi } from 'lucide-react';
import { useOfflineStatus } from '../hooks/useOfflineStatus';

const OfflineIndicator: React.FC = () => {
  const isOnline = useOfflineStatus();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 safe-area-top"
        >
          <div className="bg-red-500 text-white px-4 py-2 text-center text-sm font-medium">
            <div className="flex items-center justify-center space-x-2">
              <WifiOff size={16} />
              <span>Sin conexión - Modo offline</span>
            </div>
          </div>
        </motion.div>
      )}
      
      {isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-50 safe-area-top"
          onAnimationComplete={() => {
            // Auto-hide after 2 seconds
            setTimeout(() => {
              const element = document.querySelector('[data-online-indicator]');
              if (element) {
                element.remove();
              }
            }, 2000);
          }}
        >
          <div className="bg-green-500 text-white px-4 py-2 text-center text-sm font-medium" data-online-indicator>
            <div className="flex items-center justify-center space-x-2">
              <Wifi size={16} />
              <span>Conexión restaurada</span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;