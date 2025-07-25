import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  disabled?: boolean;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  position = 'top',
  delay = 300,
  disabled = false,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const showTooltip = () => {
    if (disabled) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        let x, y;
        
        switch (position) {
          case 'top':
            x = rect.left + scrollLeft + rect.width / 2;
            y = rect.top + scrollTop - 8;
            break;
          case 'bottom':
            x = rect.left + scrollLeft + rect.width / 2;
            y = rect.bottom + scrollTop + 8;
            break;
          case 'left':
            x = rect.left + scrollLeft - 8;
            y = rect.top + scrollTop + rect.height / 2;
            break;
          case 'right':
            x = rect.right + scrollLeft + 8;
            y = rect.top + scrollTop + rect.height / 2;
            break;
          default:
            x = rect.left + scrollLeft + rect.width / 2;
            y = rect.top + scrollTop - 8;
        }
        
        setTooltipPosition({ x, y });
        setIsVisible(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getTooltipClasses = () => {
    const baseClasses = "absolute z-[9999] px-2 py-1 text-xs font-medium text-white bg-gray-900 dark:bg-gray-700 rounded-md shadow-lg pointer-events-none max-w-xs";
    
    switch (position) {
      case 'top':
        return `${baseClasses} -translate-x-1/2 -translate-y-full`;
      case 'bottom':
        return `${baseClasses} -translate-x-1/2`;
      case 'left':
        return `${baseClasses} -translate-x-full -translate-y-1/2`;
      case 'right':
        return `${baseClasses} -translate-y-1/2`;
      default:
        return `${baseClasses} -translate-x-1/2 -translate-y-full`;
    }
  };

  const getArrowClasses = () => {
    const baseArrowClasses = "absolute w-2 h-2 bg-gray-900 dark:bg-gray-700 transform rotate-45";
    
    switch (position) {
      case 'top':
        return `${baseArrowClasses} left-1/2 -translate-x-1/2 top-full -translate-y-1/2`;
      case 'bottom':
        return `${baseArrowClasses} left-1/2 -translate-x-1/2 -top-1`;
      case 'left':
        return `${baseArrowClasses} top-1/2 -translate-y-1/2 left-full -translate-x-1/2`;
      case 'right':
        return `${baseArrowClasses} top-1/2 -translate-y-1/2 -left-1`;
      default:
        return `${baseArrowClasses} left-1/2 -translate-x-1/2 top-full -translate-y-1/2`;
    }
  };

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className={`inline-block ${className}`}
      >
        {children}
      </div>
      
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {isVisible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={getTooltipClasses()}
              style={{
                left: tooltipPosition.x,
                top: tooltipPosition.y
              }}
            >
              {content}
              <div className={getArrowClasses()} />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
};