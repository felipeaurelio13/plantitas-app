import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Settings, MessageSquare, Sprout } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';
import { usePlantStore } from '../stores';

const navItems = [
  { icon: Home, path: '/', label: 'Inicio' },
  { icon: Sprout, path: '/garden-chat', label: 'Jardín IA' },
  { icon: MessageSquare, path: '/chat', label: 'Chat', requiresPlant: true },
  { icon: Settings, path: '/settings', label: 'Ajustes' },
];

const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const selectedPlantId = usePlantStore((state) => state.selectedPlantId);

  // Extract plantId from the URL if available, to handle direct navigation
  const urlPlantId = location.pathname.startsWith('/plant/')
    ? location.pathname.split('/')[2]
    : null;

  const plantIdForChat = selectedPlantId || urlPlantId;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-sticky bg-background/70 backdrop-blur-lg border-t border-border pb-safe">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isPlantChat = item.requiresPlant;
          const isEnabled = !isPlantChat || !!plantIdForChat;
          const path = isPlantChat && plantIdForChat ? `/plant/${plantIdForChat}/chat` : item.path;
          
          const isActive = location.pathname === path || 
            (isPlantChat && location.pathname.includes('/plant/') && location.pathname.includes('/chat')) ||
            (item.path === '/garden-chat' && location.pathname === '/garden-chat');

          return (
            <motion.div
              key={item.path}
              className="flex-1 h-full"
              whileTap={isEnabled ? { scale: 0.95 } : {}}
            >
              <Link
                to={isEnabled ? path : '#'}
                onClick={(e) => !isEnabled && e.preventDefault()}
                className={cn(
                  'relative flex flex-col items-center justify-center w-full h-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg',
                  isActive && isEnabled ? 'text-primary' : 'text-muted-foreground',
                  isEnabled ? 'hover:text-foreground' : 'cursor-not-allowed opacity-50'
                )}
              >
                <item.icon size={24} strokeWidth={isActive && isEnabled ? 2.5 : 2} />
                <span className="text-xs mt-1">{item.label}</span>

                {isActive && isEnabled && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute bottom-0 h-1 w-8 bg-primary rounded-full"
                    initial={false}
                    animate={{ opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            </motion.div>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;