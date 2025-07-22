import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  fallback,
  onLoad,
  onError 
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleLoad = useCallback(() => {
    setImageLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setImageError(true);
    onError?.();
  }, [onError]);

  if (imageError && fallback) {
    return <>{fallback}</>;
  }

  if (imageError) {
    return (
      <div className={`bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}>
        <span className="text-gray-400 text-sm">No image</span>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Loading skeleton */}
      <AnimatePresence>
        {!imageLoaded && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }} // Reduced from 0.3
            className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse"
          />
        )}
      </AnimatePresence>

      {/* Actual image */}
      <motion.img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        loading="lazy" // Native lazy loading for better performance
        decoding="async" // Async decoding for smoother loading
        onLoad={handleLoad}
        onError={handleError}
        initial={{ opacity: 0 }}
        animate={{ opacity: imageLoaded ? 1 : 0 }}
        transition={{ duration: 0.2 }} // Reduced from 0.3
      />
    </div>
  );
};

export default LazyImage;