import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Settings, Bot } from 'lucide-react';

import { routes, isActiveRoute } from '../lib/navigation';
import AddPlantMenu from './AddPlantMenu';

const navItems = [
  {
    icon: Home,
    path: routes.dashboard,
    label: 'Inicio',
    description: 'Tu jardín personal',
  },
  {
    icon: Bot,
    path: routes.gardenChat,
    label: 'Chat IA',
    description: 'Asistente de plantas',
  },
  {
    icon: Settings,
    path: routes.settings,
    label: 'Ajustes',
    description: 'Configuración',
  },
];

const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const isPlantDetail = location.pathname.startsWith('/plant/');

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-emerald-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-xl items-center justify-around px-4">
          {navItems.map((item) => {
            const active = isActiveRoute(location.pathname, item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex h-12 w-full flex-col items-center justify-center rounded-full text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${active ? 'text-emerald-700' : 'text-emerald-500 hover:text-emerald-700'}`}
                aria-label={`${item.label} - ${item.description}`}
                {...(active ? { 'aria-current': 'page' } : {})}
              >
                <item.icon className={`mb-1 h-5 w-5 ${active ? 'text-emerald-600' : 'text-emerald-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {!isPlantDetail && (
        <div className="fixed bottom-24 right-5 z-50">
          <AddPlantMenu />
        </div>
      )}
    </>
  );
};

export default BottomNavigation;
