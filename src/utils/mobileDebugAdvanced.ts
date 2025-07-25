/**
 * Advanced Mobile Debug System
 * Creates visible console overlay for mobile debugging
 */

let logContainer: HTMLDivElement | null = null;
let isDebugActive = false;

export const initAdvancedMobileDebug = () => {
  // Solo en desarrollo Y si no está ya activo
  if (!import.meta.env.DEV || isDebugActive) return;
  
  isDebugActive = true;
  
  // Crear overlay de logs
  logContainer = document.createElement('div');
  logContainer.id = 'mobile-debug-overlay';
  logContainer.style.cssText = `
    position: fixed; 
    top: 0; left: 0; right: 0; 
    height: 40vh; 
    background: rgba(0,0,0,0.95); 
    color: #00ff00; 
    padding: 8px; 
    font-size: 10px; 
    z-index: 999999; 
    overflow-y: auto; 
    font-family: 'Courier New', monospace; 
    white-space: pre-wrap;
    border-bottom: 2px solid #00ff00;
    box-shadow: 0 2px 10px rgba(0,0,0,0.5);
  `;
  
  // Agregar botón de toggle
  const toggleButton = document.createElement('button');
  toggleButton.textContent = '📱';
  toggleButton.style.cssText = `
    position: fixed;
    top: 40vh;
    right: 10px;
    z-index: 9999999;
    background: #ff0000;
    color: white;
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    font-size: 20px;
    cursor: pointer;
  `;
  
  toggleButton.onclick = () => {
    if (logContainer) {
      logContainer.style.display = logContainer.style.display === 'none' ? 'block' : 'none';
    }
  };
  
  document.body.appendChild(logContainer);
  document.body.appendChild(toggleButton);
  
  // Interceptar console methods
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  
  const safeStringify = (obj: any) => {
    const seen = new WeakSet();
    return JSON.stringify(obj, function(key, value) {
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) return "[Circular]";
        seen.add(value);
      }
      // Evita serializar React elements y nodos del DOM
      if (
        (typeof value === "object" && value !== null && value.$$typeof && value.type) || // React element
        (typeof window !== "undefined" && value instanceof HTMLElement)
      ) {
        return `[Non-serializable: ${value.constructor?.name || "object"}]`;
      }
      return value;
    });
  };
  
  const addLog = (type: string, color: string, ...args: any[]) => {
    if (!logContainer) return;
    
    const timestamp = new Date().toISOString().split('T')[1].slice(0, -5);
    const message = args.map(arg => 
      typeof arg === 'object' ? safeStringify(arg) : String(arg)
    ).join(' ');
    
    logContainer.innerHTML += `<span style="color: ${color}">[${timestamp}][${type}] ${message}</span>\n`;
    logContainer.scrollTop = logContainer.scrollHeight;
    
    // Mantener solo últimos 50 logs
    const lines = logContainer.innerHTML.split('\n');
    if (lines.length > 50) {
      logContainer.innerHTML = lines.slice(-50).join('\n');
    }
  };
  
  // Override console methods
  console.log = (...args) => { 
    originalLog(...args); 
    addLog('LOG', '#00ff00', ...args); 
  };
  
  console.error = (...args) => { 
    originalError(...args); 
    addLog('ERR', '#ff0000', ...args); 
  };
  
  console.warn = (...args) => { 
    originalWarn(...args); 
    addLog('WARN', '#ffff00', ...args); 
  };
  
  // Log información crítica inicial
  addLog('INIT', '#00ffff', '🚨 MOBILE DEBUG STARTED');
  addLog('INFO', '#ffffff', 'User Agent:', navigator.userAgent);
  addLog('INFO', '#ffffff', 'Location:', window.location.href);
  addLog('INFO', '#ffffff', 'Pathname:', window.location.pathname);
  addLog('INFO', '#ffffff', 'Search:', window.location.search);
  addLog('INFO', '#ffffff', 'Hash:', window.location.hash);
  addLog('INFO', '#ffffff', 'Viewport:', `${window.innerWidth}x${window.innerHeight}`);
  addLog('INFO', '#ffffff', 'Platform:', navigator.platform);
  addLog('INFO', '#ffffff', 'Online:', navigator.onLine);
  
  // Detectar iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  addLog('INFO', '#00ffff', 'iOS:', isIOS);
  addLog('INFO', '#00ffff', 'Safari:', isSafari);
  addLog('INFO', '#00ffff', 'iOS Safari:', isIOS && isSafari);
  
  // Log routing info
  addLog('ROUTER', '#ff00ff', 'Expected basename: /plantitas-app/');
  addLog('ROUTER', '#ff00ff', 'Current pathname:', window.location.pathname);
  addLog('ROUTER', '#ff00ff', 'Basename match:', window.location.pathname.startsWith('/plantitas-app') ? '✅' : '❌');
  
  return () => {
    // Cleanup function
    if (logContainer) {
      document.body.removeChild(logContainer);
      logContainer = null;
    }
    if (toggleButton.parentNode) {
      document.body.removeChild(toggleButton);
    }
    
    // Restore original console
    console.log = originalLog;
    console.error = originalError;
    console.warn = originalWarn;
    
    isDebugActive = false;
  };
};

// Error monitoring específico
export const logCriticalError = (context: string, error: any) => {
  console.error(`[CRITICAL][${context}]`, error);
  
  // También enviar a un endpoint de monitoring si es necesario
  if (!import.meta.env.DEV) {
    // Aquí iría el envío a Sentry, LogRocket, etc.
    console.warn('Production error detected:', { context, error });
  }
};

// Test de compatibilidad
export const runCompatibilityTests = () => {
  console.log('[COMPAT] Running compatibility tests...');
  
  // Test ES Modules
  console.log('[COMPAT] ES Modules support:', 'noModule' in HTMLScriptElement.prototype ? '✅' : '❌');
  
  // Test async/await
  try {
    const testAsync = async () => {};
    testAsync();
    console.log('[COMPAT] Async/await support: ✅');
  } catch (e) {
    console.log('[COMPAT] Async/await support: ❌');
  }
  
  // Test fetch
  console.log('[COMPAT] Fetch API:', typeof fetch !== 'undefined' ? '✅' : '❌');
  
  // Test CSS custom properties
  console.log('[COMPAT] CSS custom properties:', CSS && CSS.supports && CSS.supports('--test', 'value') ? '✅' : '❌');
  
  // Test IntersectionObserver
  console.log('[COMPAT] IntersectionObserver:', typeof IntersectionObserver !== 'undefined' ? '✅' : '❌');
  
  console.log('[COMPAT] Compatibility tests completed');
};