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
      {/* Bottom Navigation moderna y limpia */}
      <nav 
        className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/50 shadow-lg pb-safe-bottom"
        data-tour="bottom-navigation"
      >
        <div className="flex justify-around items-center h-16 max-w-lg mx-auto px-safe">
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
                    'touch-target relative flex flex-col items-center justify-center w-full h-full rounded-xl transition-all duration-200 group',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                    isActive 
                      ? 'text-primary' 
                      : 'text-muted-foreground hover:text-foreground active:text-primary'
                  )}
                  aria-label={`${item.label} - ${item.description}`}
                  {...(isActive ? { 'aria-current': 'page' } : {})}
                  {...(item.path === routes.gardenChat ? { 'data-tour': 'chat-tab' } : {})}
                >
                  {/* Background indicator con mejor animación */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        layoutId="nav-active-bg"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ 
                          type: 'spring', 
                          stiffness: 500, 
                          damping: 30,
                          duration: 0.3
                        }}
                        className="absolute inset-2 bg-primary/10 rounded-lg"
                      />
                    )}
                  </AnimatePresence>

                  {/* Icon con mejor feedback visual */}
                  <motion.div
                    animate={{ 
                      scale: isActive ? 1.1 : 1,
                      y: isActive ? -1 : 0
                    }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="relative z-10 mb-1"
                  >
                    <item.icon 
                      size={22} 
                      strokeWidth={isActive ? 2.5 : 2}
                      className={cn(
                        "transition-all duration-200",
                        isActive ? "drop-shadow-sm" : "group-hover:scale-105"
                      )}
                    />
                  </motion.div>

                  {/* Label con tipografía optimizada */}
                  <motion.span 
                    animate={{ 
                      scale: isActive ? 1.05 : 1,
                      fontWeight: isActive ? 600 : 500
                    }}
                    transition={{ duration: 0.2 }}
                    className="text-xs relative z-10 leading-none"
                  >
                    {item.label}
                  </motion.span>

                  {/* Active indicator dot más sutil */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ delay: 0.1, duration: 0.2 }}
                        className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full"
                      />
                    )}
                  </AnimatePresence>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </nav>

      {/* Floating Action Button mejorado */}
      {!isPlantDetail && (
        <motion.div 
          className="fixed bottom-20 right-4 z-40"
          data-tour="add-plant-fab"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: 'spring',
            stiffness: 400,
            damping: 25,
            delay: 0.2
          }}
        >
          <AddPlantMenu />
        </motion.div>
      )}
    </>
  );
};

export default BottomNavigation;