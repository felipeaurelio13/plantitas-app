import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Camera, Settings, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../lib/utils';

const navItems = [
  { icon: Home, path: '/', label: 'Inicio' },
  { icon: MessageSquare, path: '/chat', label: 'Chat' },
  { icon: Camera, path: '/camera', label: 'Cámara' },
  { icon: Settings, path: '/settings', label: 'Ajustes' },
];

const BottomNavigation: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-sticky bg-background/70 backdrop-blur-lg border-t border-default pb-safe">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'relative flex flex-col items-center justify-center w-full h-full text-sm font-medium transition-colors focus-ring rounded-lg',
                isActive ? 'text-primary-500' : 'text-text-muted hover:text-text-secondary'
              )}
            >
              <item.icon size={24} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-xs mt-1">{item.label}</span>
              
              {isActive && (
                <motion.div
                  layoutId="active-nav-indicator"
                  className="absolute bottom-0 h-1 w-8 bg-primary-500 rounded-full"
                  initial={false}
                  animate={{ opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;