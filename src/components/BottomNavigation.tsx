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
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border-t border-stone-200 dark:border-stone-700 pb-safe"
        data-tour="bottom-navigation"
      >
        <div className="flex justify-around items-center h-20 max-w-lg mx-auto px-2">
          {navItems.map((item) => {
            const isActive = isActiveRoute(location.pathname, item.path);

            return (
              <motion.div
                key={item.path}
                className="relative flex-1 h-full"
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.1 }}
              >
                <Link
                  to={item.path}
                  className={cn(
                    'touch-target relative flex flex-col items-center justify-center w-full h-full rounded-2xl transition-all duration-200 focus-ring group',
                    isActive 
                      ? 'text-nature-600 dark:text-nature-400' 
                      : 'text-stone-500 dark:text-stone-400 hover:text-nature-600 dark:hover:text-nature-400'
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
                          stiffness: 500, 
                          damping: 30,
                          duration: 0.2
                        }}
                        className="absolute inset-2 bg-nature-50 dark:bg-nature-900/30 rounded-xl"
                      />
                    )}
                  </AnimatePresence>

                  {/* Icon */}
                  <motion.div
                    animate={{ 
                      scale: isActive ? 1.1 : 1,
                      y: isActive ? -1 : 0
                    }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="relative z-10 mb-1"
                  >
                    <item.icon 
                      size={22} 
                      strokeWidth={isActive ? 2.5 : 2}
                      className={cn(
                        "transition-all duration-200",
                        isActive
                          ? "drop-shadow-sm"
                          : "group-hover:scale-105"
                      )}
                    />
                  </motion.div>

                  {/* Label */}
                  <motion.span 
                    animate={{ 
                      scale: isActive ? 1.02 : 1,
                      fontWeight: isActive ? 600 : 500
                    }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                      "text-xs relative z-10 transition-all duration-200",
                      isActive ? "text-nature-700 dark:text-nature-300" : ""
                    )}
                  >
                    {item.label}
                  </motion.span>

                  {/* Active indicator dot */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ delay: 0.1, duration: 0.2 }}
                        className="absolute bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 bg-nature-500 dark:bg-nature-400 rounded-full"
                      />
                    )}
                  </AnimatePresence>

                  {/* Hover effect */}
                  <motion.div
                    className="absolute inset-2 bg-stone-100 dark:bg-stone-800 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    style={{ zIndex: isActive ? -1 : 1 }}
                  />
                </Link>
              </motion.div>
            );
          })}
        </div>
      </nav>

      {/* Floating Action Button: solo mostrar si no es detalle de planta */}
      {!isPlantDetail && (
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="fixed bottom-24 right-4 sm:right-6 z-40"
          data-tour="add-plant-fab"
        >
          <AddPlantMenu />
        </motion.div>
      )}
    </>
  );
};

export default BottomNavigation;