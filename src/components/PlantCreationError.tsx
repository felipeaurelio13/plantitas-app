import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Camera, Image } from 'lucide-react';

interface PlantCreationErrorProps {
  error: string;
  onRetry: () => void;
  onTryDifferentImage: () => void;
  onManualEntry: () => void;
}

const PlantCreationError: React.FC<PlantCreationErrorProps> = ({
  error,
  onRetry,
  onTryDifferentImage,
  onManualEntry,
}) => {
  const getErrorIcon = () => {
    if (error.includes('conexión') || error.includes('internet')) {
      return <RefreshCw size={24} className="text-blue-500" />;
    } else if (error.includes('análisis') || error.includes('imagen')) {
      return <Camera size={24} className="text-yellow-500" />;
    } else {
      return <AlertTriangle size={24} className="text-red-500" />;
    }
  };

  const getErrorColor = () => {
    if (error.includes('conexión') || error.includes('internet')) {
      return 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800';
    } else if (error.includes('análisis') || error.includes('imagen')) {
      return 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800';
    } else {
      return 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`rounded-lg border p-4 shadow-lg ${getErrorColor()}`}
    >
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0 mt-0.5">
          {getErrorIcon()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Error al crear la planta
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {error}
          </p>
          
          <div className="space-y-2">
            <button
              onClick={onRetry}
              className="w-full px-3 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw size={16} />
              <span>Intentar de nuevo</span>
            </button>
            
            <button
              onClick={onTryDifferentImage}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors flex items-center justify-center space-x-2"
            >
              <Image size={16} />
              <span>Usar otra imagen</span>
            </button>
            
            <button
              onClick={onManualEntry}
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              Agregar manualmente
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default PlantCreationError;