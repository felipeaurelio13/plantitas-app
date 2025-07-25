/**
 * iOS Safari Viewport Height Fix
 * Handles the dynamic viewport height issue in iOS Safari
 */

export const initViewportFix = (): (() => void) => {
  const setViewportHeight = () => {
    // Get the actual viewport height
    const vh = window.innerHeight * 0.01;
    
    // Set the custom CSS property to the root element
    document.documentElement.style.setProperty('--vh', `${vh}px`);
    
    // Also set safe area variables for better mobile support
    if (typeof CSS !== 'undefined' && CSS.supports && CSS.supports('padding', 'env(safe-area-inset-top)')) {
      document.documentElement.style.setProperty('--safe-area-top', 'env(safe-area-inset-top)');
      document.documentElement.style.setProperty('--safe-area-bottom', 'env(safe-area-inset-bottom)');
      document.documentElement.style.setProperty('--safe-area-left', 'env(safe-area-inset-left)');
      document.documentElement.style.setProperty('--safe-area-right', 'env(safe-area-inset-right)');
    } else {
      // Fallback for older browsers
      document.documentElement.style.setProperty('--safe-area-top', '0px');
      document.documentElement.style.setProperty('--safe-area-bottom', '0px');
      document.documentElement.style.setProperty('--safe-area-left', '0px');
      document.documentElement.style.setProperty('--safe-area-right', '0px');
    }
  };

  // Set initial height
  setViewportHeight();

  // Listen for resize events (handles orientation changes)
  window.addEventListener('resize', setViewportHeight);
  
  // Listen for orientation changes specifically
  window.addEventListener('orientationchange', () => {
    // Small delay to ensure the new dimensions are available
    setTimeout(setViewportHeight, 100);
  });

  // iOS Safari specific: Listen for visual viewport changes
  if ('visualViewport' in window) {
    window.visualViewport?.addEventListener('resize', setViewportHeight);
  }

  // Cleanup function
  return () => {
    window.removeEventListener('resize', setViewportHeight);
    window.removeEventListener('orientationchange', setViewportHeight);
    if ('visualViewport' in window) {
      window.visualViewport?.removeEventListener('resize', setViewportHeight);
    }
  };
};

/**
 * Check if the device is iOS
 */
export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

/**
 * Check if the browser is Safari
 */
export const isSafari = (): boolean => {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
};

/**
 * Check if we're on iOS Safari
 */
export const isIOSSafari = (): boolean => {
  return isIOS() && isSafari();
};

/**
 * Get mobile device info for debugging
 */
export const getMobileDeviceInfo = () => {
  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    isIOS: isIOS(),
    isSafari: isSafari(),
    isIOSSafari: isIOSSafari(),
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
      availHeight: window.screen.availHeight,
      availWidth: window.screen.availWidth,
    },
    safeArea: {
      top: getComputedStyle(document.documentElement).getPropertyValue('--safe-area-top'),
      bottom: getComputedStyle(document.documentElement).getPropertyValue('--safe-area-bottom'),
      left: getComputedStyle(document.documentElement).getPropertyValue('--safe-area-left'),
      right: getComputedStyle(document.documentElement).getPropertyValue('--safe-area-right'),
    }
  };
};