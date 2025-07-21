import { useEffect, useRef, useCallback } from 'react';

interface UseFocusManagementOptions {
  /**
   * If true, focuses the element on mount
   */
  autoFocus?: boolean;
  
  /**
   * If true, manages focus trap within the element
   */
  trapFocus?: boolean;
  
  /**
   * Callback when escape key is pressed
   */
  onEscape?: () => void;
  
  /**
   * If true, returns focus to the previously focused element when unmounting
   */
  restoreFocus?: boolean;
}

/**
 * Hook for advanced focus management and keyboard navigation
 */
export const useFocusManagement = <T extends HTMLElement = HTMLElement>(
  options: UseFocusManagementOptions = {}
) => {
  const {
    autoFocus = false,
    trapFocus = false,
    onEscape,
    restoreFocus = false
  } = options;

  const ref = useRef<T>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  // Store the previously focused element
  useEffect(() => {
    if (restoreFocus || trapFocus) {
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
    }
  }, [restoreFocus, trapFocus]);

  // Auto focus on mount
  useEffect(() => {
    if (autoFocus && ref.current) {
      ref.current.focus();
    }
  }, [autoFocus]);

  // Get all focusable elements within the container
  const getFocusableElements = useCallback((): HTMLElement[] => {
    if (!ref.current) return [];

    const focusableSelectors = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])',
      'details',
      'summary'
    ].join(', ');

    return Array.from(ref.current.querySelectorAll(focusableSelectors));
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Handle escape key
    if (event.key === 'Escape' && onEscape) {
      onEscape();
      return;
    }

    // Handle tab key for focus trap
    if (event.key === 'Tab' && trapFocus) {
      const focusableElements = getFocusableElements();
      
      if (focusableElements.length === 0) {
        event.preventDefault();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift + Tab: focus previous element
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: focus next element
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    }
  }, [trapFocus, onEscape, getFocusableElements]);

  // Set up keyboard event listeners
  useEffect(() => {
    if (trapFocus || onEscape) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [trapFocus, onEscape, handleKeyDown]);

  // Restore focus on unmount
  useEffect(() => {
    return () => {
      if (restoreFocus && previouslyFocusedElement.current) {
        // Use setTimeout to ensure the element is still in the DOM
        setTimeout(() => {
          previouslyFocusedElement.current?.focus();
        }, 0);
      }
    };
  }, [restoreFocus]);

  // Method to focus the first focusable element
  const focusFirst = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }
  }, [getFocusableElements]);

  // Method to focus the last focusable element
  const focusLast = useCallback(() => {
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      focusableElements[focusableElements.length - 1].focus();
    }
  }, [getFocusableElements]);

  return {
    ref,
    focusFirst,
    focusLast,
    getFocusableElements
  };
};

/**
 * Hook for announcing messages to screen readers
 */
export const useAnnouncement = () => {
  const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.setAttribute('class', 'sr-only');
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }, []);

  return { announce };
};

/**
 * Hook to detect if user is using keyboard navigation
 */
export const useKeyboardNavigation = () => {
  const isKeyboardUser = useRef(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        isKeyboardUser.current = true;
        document.body.classList.add('keyboard-navigation');
      }
    };

    const handleMouseDown = () => {
      isKeyboardUser.current = false;
      document.body.classList.remove('keyboard-navigation');
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  return isKeyboardUser.current;
}; 