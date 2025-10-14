import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import BottomNavigation from './BottomNavigation';
import OfflineIndicator from './OfflineIndicator';
import Footer from './Footer';
import { useThemeStore } from '../stores';

const Layout: React.FC = () => {
  const location = useLocation();
  const { isDark } = useThemeStore();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  const isCamera = location.pathname === '/camera';

  return (
    <div className="min-h-screen bg-emerald-50 text-emerald-900 flex flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only fixed top-4 left-4 z-50 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-md transition"
      >
        Saltar al contenido principal
      </a>

      <main
        id="main-content"
        role="main"
        tabIndex={-1}
        className="flex-1 px-4 pb-28 pt-6 sm:px-6 sm:pt-8"
      >
        <Outlet />
      </main>

      <aside className="px-4 pb-4 text-sm text-emerald-700 sm:px-6">
        <OfflineIndicator />
      </aside>

      {!isCamera && <Footer className="px-4 pb-24 sm:px-6" />}
      {!isCamera && <BottomNavigation />}
    </div>
  );
};

export default Layout;
