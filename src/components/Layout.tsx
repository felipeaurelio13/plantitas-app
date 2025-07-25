import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BottomNavigation from './BottomNavigation';
import OfflineIndicator from './OfflineIndicator';
import { useThemeStore } from '../stores';

const Layout: React.FC = () => {
  const location = useLocation();
  const { isDark } = useThemeStore();

  // Detectar si estamos en la cámara
  const isCamera = location.pathname === '/camera';

  // Announce route changes to screen readers
  const announceRouteChange = () => {
    const routeNames: Record<string, string> = {
      '/': 'Página de inicio - Tu jardín personal',
      '/camera': 'Cámara - Agregar nueva planta',
      '/chat': 'Chat con IA - Asistente de plantas',
      '/garden-chat': 'Chat del jardín - Consultas generales',
      '/settings': 'Configuración - Ajustes de la aplicación'
    };

    // Extract base route for dynamic routes like /plant/:id
    const baseRoute = location.pathname.includes('/plant/') ? '/plant' : location.pathname;
    const routeName = routeNames[baseRoute] || routeNames[location.pathname] || 'Página';
    
    // Create a temporary announcement element
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.setAttribute('class', 'sr-only');
    announcement.textContent = `Navegando a ${routeName}`;
    
    document.body.appendChild(announcement);
    
    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  };

  useEffect(() => {
    announceRouteChange();
  }, [location.pathname]);

  // Set theme class on document for consistent theming
  useEffect(() => {
    const theme = isDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
  }, [isDark]);

  // Skip link component
  const SkipLink = () => (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only fixed top-4 left-4 z-50 bg-primary-600 text-white px-4 py-2 rounded-md font-medium transition-all duration-200 focus:shadow-lg"
      onFocus={(e) => {
        e.currentTarget.scrollIntoView({ behavior: 'smooth' });
      }}
    >
      Saltar al contenido principal
    </a>
  );

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Skip Link for accessibility */}
      <SkipLink />
      
      {/* Screen reader only title */}
      <h1 className="sr-only">Plantitas - Aplicación de cuidado de plantas</h1>

      {/* Main content area */}
      <main 
        id="main-content"
        role="main"
        aria-label="Contenido principal"
        className="pb-28 min-h-screen focus:outline-none"
        tabIndex={-1}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ 
              duration: 0.15, // Reducido de 0.3 a 0.15 para transiciones más rápidas
              ease: 'easeOut' // Simplificado 
            }}
            className="w-full h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Complementary content */}
      <aside role="complementary" aria-label="Información de estado">
        <OfflineIndicator />
      </aside>

      {/* Navigation landmark */}
      {!isCamera && (
        <nav role="navigation" aria-label="Navegación inferior">
          <BottomNavigation />
        </nav>
      )}

      {/* High contrast mode detection and styles */}
      <style>{`
        @media (prefers-contrast: high) {
          :root {
            --color-background: #000000;
            --color-surface: #111111;
            --color-text-primary: #ffffff;
            --color-text-secondary: #ffffff;
            --color-border: #ffffff;
            --color-accent: #00ff00;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* Screen reader only utility */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }

        .sr-only.focus\\:not-sr-only:focus {
          position: static;
          width: auto;
          height: auto;
          padding: inherit;
          margin: inherit;
          overflow: visible;
          clip: auto;
          white-space: normal;
        }

        /* Enhanced focus indicators */
        *:focus-visible {
          outline: 3px solid var(--color-accent) !important;
          outline-offset: 2px !important;
          border-radius: 4px;
        }

        /* High contrast focus ring */
        @media (prefers-contrast: high) {
          *:focus-visible {
            outline: 4px solid #00ff00 !important;
            outline-offset: 3px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;