import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Settings, Bot, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';
import { routes, isActiveRoute } from '../lib/navigation';
import { usePlantsQuery } from '../hooks/usePlantsQuery';

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

  // Detectar si estamos en Dashboard y el jardín está vacío
  const { data: plants = [] } = usePlantsQuery ? usePlantsQuery() : { data: [] };
  const isDashboard = location.pathname === '/';
  const isGardenEmpty = isDashboard && plants.length === 0;

  return (
    <>
      {/* Bottom Navigation */}
      <nav className="safe-bottom fixed bottom-0 left-0 right-0 z-50 glass-enhanced border-t border-contrast">
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

<<<<<<< HEAD
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
=======
                  {/* Label + underline */}
                  <span className="relative z-10 flex flex-col items-center">
                    <motion.span 
                      animate={{ 
                        scale: isActive ? 1.05 : 1,
                        fontWeight: isActive ? 600 : 500
                      }}
                      transition={{ duration: 0.2 }}
                      className="text-xs mt-0.5 sm:mt-1"
                    >
                      {item.label}
                    </motion.span>
                    {/* Minimal underline for active tab */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          key="underline"
                          initial={{ scaleX: 0, opacity: 0 }}
                          animate={{ scaleX: 1, opacity: 1 }}
                          exit={{ scaleX: 0, opacity: 0 }}
                          transition={{ duration: 0.18 }}
                          className="w-4 h-0.5 mt-0.5 rounded-full bg-primary-500 dark:bg-primary-400"
                          style={{ originX: 0.5 }}
                        />
                      )}
                    </AnimatePresence>
                  </span>
>>>>>>> 6e07996 (✅ Tests unitarios robustos: creación de plantita y subida de imagen 100% funcionales. Validación de tamaño y mocks alineados a lógica real.)

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

<<<<<<< HEAD
      {/* Floating Action Button */}
      <motion.div
        className="fixed bottom-24 right-6 z-40"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
      >
        <Link
          to={routes.camera}
          className="touch-target flex items-center justify-center w-14 h-14 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 group"
          aria-label="Agregar nueva planta"
=======
      {/* Floating Action Button: solo mostrar si no es detalle de planta */}
      {!isPlantDetail && (
        <motion.div
          className="fixed bottom-20 sm:bottom-24 right-4 sm:right-6 z-40"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
>>>>>>> 6e07996 (✅ Tests unitarios robustos: creación de plantita y subida de imagen 100% funcionales. Validación de tamaño y mocks alineados a lógica real.)
        >
          <Link
            to={routes.camera}
            className={cn(
              "touch-target flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-primary-500 hover:bg-primary-600 text-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 group",
              isGardenEmpty && "animate-glow"
            )}
            aria-label="Agregar nueva planta"
          >
<<<<<<< HEAD
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
=======
            <motion.div
              whileHover={{ rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <Plus size={24} className="sm:w-7 sm:h-7" strokeWidth={2.5} />
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
>>>>>>> 6e07996 (✅ Tests unitarios robustos: creación de plantita y subida de imagen 100% funcionales. Validación de tamaño y mocks alineados a lógica real.)
          </div>
        </motion.div>
      )}
    </>
  );
};

export default BottomNavigation;