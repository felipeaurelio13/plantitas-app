import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean; // Para imágenes críticas que necesitan carga inmediata
  sizes?: string;     // Para responsive images
}

// Simple in-memory cache para imágenes ya cargadas
const imageCache = new Set<string>();
const preloadedImages = new Map<string, HTMLImageElement>();

const LazyImage: React.FC<LazyImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  fallback,
  onLoad,
  onError,
  priority = false,
  sizes = "(max-width: 768px) 100vw, 50vw"
}) => {
  const [imageLoaded, setImageLoaded] = useState(() => imageCache.has(src));
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  // Preload critical images
  useEffect(() => {
    if (priority && !imageCache.has(src) && !preloadedImages.has(src)) {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        imageCache.add(src);
        preloadedImages.set(src, img);
      };
      img.onerror = () => {
        preloadedImages.delete(src);
      };
      preloadedImages.set(src, img);
    }
  }, [src, priority]);

  const handleLoad = useCallback(() => {
    imageCache.add(src); // Agregar al cache cuando se carga exitosamente
    setImageLoaded(true);
    onLoad?.();
  }, [onLoad, src]);

  const handleError = useCallback(() => {
    imageCache.delete(src); // Remover del cache si falla
    setImageError(true);
    onError?.();
  }, [onError, src]);

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
        ref={imgRef}
        src={src}
        alt={alt}
        className={`w-full h-full object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
        loading={priority ? "eager" : "lazy"} // Eager para priority, lazy para el resto
        decoding="async" // Async decoding for smoother loading
        fetchPriority={priority ? "high" : "low"} // Hint al navegador sobre prioridad
        sizes={sizes} // Responsive image sizing
        onLoad={handleLoad}
        onError={handleError}
        initial={{ opacity: 0 }}
        animate={{ opacity: imageLoaded ? 1 : 0 }}
        transition={{ duration: 0.15 }} // Reducido de 0.2 a 0.15 para más velocidad
      />
    </div>
  );
};

export default LazyImage;