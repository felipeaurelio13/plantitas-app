import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
  priority?: boolean;
  sizes?: string;
  srcSet?: string;      // Added for responsive images
  blurDataUrl?: string; // Added for blur placeholder
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
  sizes = "(max-width: 768px) 100vw, 50vw",
  srcSet,
  blurDataUrl
}) => {
  const [imageLoaded, setImageLoaded] = useState(() => imageCache.has(src));
  const [imageError, setImageError] = useState(false);
  const [isInView, setIsInView] = useState(priority); // Start with priority value
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver for lazy loading (unless priority)
  useEffect(() => {
    if (priority) return; // Skip intersection observer for priority images

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.1
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority]);

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
    <div 
      ref={containerRef}
      className={`relative overflow-hidden ${className}`}
      style={{ backgroundColor: '#f0f0f0' }}
    >
      {/* Blur placeholder */}
      {blurDataUrl && (
        <img
          src={blurDataUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: 'blur(10px)',
            transform: 'scale(1.1)', // Slightly larger to hide blur edges
            opacity: imageLoaded ? 0 : 1,
            transition: 'opacity 0.3s ease-in-out',
          }}
          aria-hidden="true"
        />
      )}

      {/* Loading skeleton (fallback when no blur data) */}
      <AnimatePresence>
        {!imageLoaded && !blurDataUrl && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse"
          />
        )}
      </AnimatePresence>

      {/* Actual image - only load when in viewport (or priority) */}
      {isInView && (
        <motion.img
          ref={imgRef}
          src={src}
          srcSet={srcSet}
          alt={alt}
          className={`w-full h-full object-cover ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={priority ? "high" : "low"}
          sizes={sizes}
          onLoad={handleLoad}
          onError={handleError}
          initial={{ opacity: 0 }}
          animate={{ opacity: imageLoaded ? 1 : 0 }}
          transition={{ duration: 0.15 }}
          style={{
            transition: 'opacity 0.3s ease-in-out, filter 0.3s ease-in-out',
            filter: imageLoaded ? 'blur(0)' : 'blur(2px)',
          }}
        />
      )}
    </div>
  );
};

export default LazyImage;