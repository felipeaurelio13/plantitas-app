import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Settings, Bot, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { usePlantStore } from '../stores';

// Navegación optimizada a 3 tabs + FAB
const navItems = [
  { 
    icon: Home, 
    path: '/', 
    label: 'Inicio',
    description: 'Tu jardín personal'
  },
  { 
    icon: Bot, 
    path: '/chat', 
    label: 'Chat IA',
    description: 'Asistente de plantas'
  },
  { 
    icon: Settings, 
    path: '/settings', 
    label: 'Ajustes',
    description: 'Configuración'
  },
];

const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const selectedPlantId = usePlantStore((state) => state.selectedPlantId);
  const plants = usePlantStore((state) => state.plants);

  // Determinar la ruta activa de manera más inteligente
  const getActivePath = () => {
    const path = location.pathname;
    
    // Unificar todas las rutas de chat bajo /chat
    if (path.includes('/chat') || path.includes('/garden-chat') || 
        (path.includes('/plant/') && path.includes('/chat'))) {
      return '/chat';
    }
    
    // Dashboard y rutas de plantas van a inicio
    if (path === '/' || path.includes('/plant/') || path === '/dashboard') {
      return '/';
    }
    
    // Settings y subrutas
    if (path.includes('/settings')) {
      return '/settings';
    }
    
    return path;
  };

  const activePath = getActivePath();

  const handleChatNavigation = () => {
    // Si hay una planta seleccionada, ir a su chat
    if (selectedPlantId) {
      return `/plant/${selectedPlantId}/chat`;
    }
    
    // Si hay plantas, ir al chat del jardín
    if (plants.length > 0) {
      return '/garden-chat';
    }
    
    // Si no hay plantas, ir al chat general
    return '/chat';
  };

  return (
    <>
      {/* Bottom Navigation */}
      <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-neutral-200/50 dark:border-neutral-700/50">
        <div className="flex justify-around items-center h-20 max-w-lg mx-auto px-2">
          {navItems.map((item) => {
            const isActive = activePath === item.path;
            const navPath = item.path === '/chat' ? handleChatNavigation() : item.path;

            return (
              <motion.div
                key={item.path}
                className="relative flex-1 h-full"
                whileTap={{ scale: 0.92 }}
                whileHover={{ scale: 1.02 }}
              >
                <Link
                  to={navPath}
                  className={cn(
                    'touch-target relative flex flex-col items-center justify-center w-full h-full rounded-2xl transition-all duration-200',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:ring-offset-2',
                    isActive 
                      ? 'text-primary-600 dark:text-primary-400' 
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
                  )}
                  aria-label={`${item.label} - ${item.description}`}
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
                    className="relative z-10"
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
                        className="absolute -bottom-1 w-1 h-1 bg-primary-500 dark:bg-primary-400 rounded-full"
                      />
                    )}
                  </AnimatePresence>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </nav>

      {/* Floating Action Button */}
      <motion.div
        className="fixed bottom-24 right-6 z-40"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
      >
        <Link
          to="/camera"
          className="touch-target flex items-center justify-center w-14 h-14 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 group"
          aria-label="Agregar nueva planta"
        >
          <motion.div
            whileHover={{ rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ duration: 0.2 }}
          >
            <Plus size={28} strokeWidth={2.5} />
          </motion.div>
          
          {/* Ripple effect */}
          <motion.div
            className="absolute inset-0 rounded-2xl bg-white/20"
            initial={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 1.2, opacity: 1 }}
            transition={{ duration: 0.15 }}
          />
        </Link>

        {/* Tooltip */}
        <div className="absolute bottom-full mb-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
          <div className="bg-neutral-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap dark:bg-neutral-100 dark:text-neutral-900">
            Agregar planta
            <div className="absolute top-full right-2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-neutral-900 dark:border-t-neutral-100"></div>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default BottomNavigation;