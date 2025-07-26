import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BottomNavigation from './BottomNavigation';
import OfflineIndicator from './OfflineIndicator';
import { useTheme } from '../contexts/ThemeContext';

const Layout: React.FC = () => {
  const location = useLocation();
  const { isDark } = useTheme();

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

  // Skip link component
  const SkipLink = () => (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only fixed top-4 left-4 z-50 bg-nature-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 focus:shadow-lg focus-ring"
      onFocus={(e) => {
        e.currentTarget.scrollIntoView({ behavior: 'smooth' });
      }}
    >
      Saltar al contenido principal
    </a>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-50 via-nature-50/30 to-stone-100 dark:from-stone-950 dark:via-stone-900 dark:to-stone-950 text-stone-900 dark:text-stone-100">
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
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ 
              duration: 0.2,
              ease: [0.16, 1, 0.3, 1]
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

      {/* Enhanced accessibility and theme styles */}
      <style>{`
        /* High contrast mode support */
        @media (prefers-contrast: high) {
          :root {
            --color-background: ${isDark ? '#000000' : '#ffffff'};
            --color-surface: ${isDark ? '#111111' : '#fafafa'};
            --color-text-primary: ${isDark ? '#ffffff' : '#000000'};
            --color-text-secondary: ${isDark ? '#ffffff' : '#000000'};
            --color-border: ${isDark ? '#ffffff' : '#000000'};
            --color-accent: ${isDark ? '#00ff00' : '#008000'};
          }
        }

        /* Reduce motion for accessibility */
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }

        /* Enhanced focus indicators for keyboard navigation */
        *:focus-visible {
          outline: 2px solid var(--color-accent) !important;
          outline-offset: 2px !important;
          border-radius: 4px;
        }

        /* High contrast focus ring */
        @media (prefers-contrast: high) {
          *:focus-visible {
            outline: 3px solid ${isDark ? '#00ff00' : '#008000'} !important;
            outline-offset: 3px !important;
          }
        }

        /* Smooth scrolling for better UX */
        @media (prefers-reduced-motion: no-preference) {
          html {
            scroll-behavior: smooth;
          }
        }
      `}</style>
    </div>
  );
};

export default Layout;