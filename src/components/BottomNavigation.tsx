import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Settings, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { routes, isActiveRoute } from '../lib/navigation';
import AddPlantMenu from './AddPlantMenu';

// Simplified navigation - 3 main tabs + FAB
const navItems = [
  { 
    icon: Home, 
    path: routes.dashboard, 
    label: 'Inicio',
    description: 'Tu jardín personal'
  },
  { 
    icon: Bot, 
    path: routes.gardenChat, 
    label: 'Chat IA',
    description: 'Asistente de plantas'
  },
  { 
    icon: Settings, 
    path: routes.settings, 
    label: 'Ajustes',
    description: 'Configuración'
  },
];

const BottomNavigation: React.FC = () => {
  const location = useLocation();

  // Ocultar FAB en rutas de detalle de planta para evitar solapamientos
  const isPlantDetail = location.pathname.startsWith('/plant/');

  return (
    <>
      {/* Bottom Navigation */}
      <nav 
        className="safe-bottom fixed bottom-0 left-0 right-0 z-50 glass-enhanced border-t border-contrast"
        data-tour="bottom-navigation"
      >
        <div className="flex justify-around items-center h-20 max-w-lg mx-auto px-2">
          {navItems.map((item) => {
            const isActive = isActiveRoute(location.pathname, item.path);

            return (
              <motion.div
                key={item.path}
                className="relative flex-1 h-full"
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.02 }}
              >
                <Link
                  to={item.path}
                  className={cn(
                    'touch-target relative flex flex-col items-center justify-center w-full h-full rounded-2xl transition-all duration-200',
                    'focus-contrast',
                    isActive 
                      ? 'text-primary-700 dark:text-primary-400' 
                      : 'text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400'
                  )}
                  aria-label={`${item.label} - ${item.description}`}
                  {...(isActive ? { 'aria-current': 'page' } : {})}
                  {...(item.path === routes.gardenChat ? { 'data-tour': 'chat-tab' } : {})}
                >
                  {/* Background indicator */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="nav-background"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ 
                          type: 'spring', 
                          stiffness: 400, 
                          damping: 30 
                        }}
                        className="absolute inset-1 bg-primary-500/10 dark:bg-primary-400/10 rounded-xl"
                      />
                    )}
                  </AnimatePresence>

                  {/* Icon */}
                  <motion.div
                    animate={{ 
                      scale: isActive ? 1.1 : 1,
                      y: isActive ? -2 : 0
                    }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "relative z-10",
                      isActive
                        ? "text-[#2A7F3E]"
                        : "text-[#888]"
                    )}
                  >
                    <item.icon 
                      size={24} 
                      strokeWidth={isActive ? 2.5 : 2}
                      className="drop-shadow-sm"
                    />
                  </motion.div>

                  {/* Label */}
                  <motion.span 
                    animate={{ 
                      scale: isActive ? 1.05 : 1,
                      fontWeight: isActive ? 600 : 500
                    }}
                    transition={{ duration: 0.2 }}
                    className="text-xs mt-1 relative z-10"
                  >
                    {item.label}
                  </motion.span>

                  {/* Active dot indicator */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ delay: 0.1 }}
                        className="absolute left-1/2 -translate-x-1/2 w-1 h-1 bg-primary-500 dark:bg-primary-400 rounded-full mt-1.5" // 4px debajo del icono
                      />
                    )}
                  </AnimatePresence>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </nav>

      {/* Floating Action Button: solo mostrar si no es detalle de planta */}
      {!isPlantDetail && (
        <div 
          className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-40"
          data-tour="add-plant-fab"
        >
          <AddPlantMenu />
        </div>
      )}
    </>
  );
};

export default BottomNavigation;