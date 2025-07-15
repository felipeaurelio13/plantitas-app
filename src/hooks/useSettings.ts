import { useState, useMemo } from 'react';
import { useThemeStore, useAuthStore } from '../stores';
import { notificationService } from '../services/notificationService';
import { storageService } from '../services/storageService';
import { useNavigate } from 'react-router-dom';

export const useSettings = () => {
  const { isDark, toggleTheme } = useThemeStore();
  const { signOut, profile } = useAuthStore();
  const navigate = useNavigate();

  // Local state for settings that don't have a store
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleSignOut = async () => {
    // We should use a custom modal here in a real app
    if (window.confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      try {
        await signOut();
        navigate('/auth'); // Redirect to auth page after sign out
      } catch (error) {
        console.error('Error signing out:', error);
        // We should show a toast notification here
      }
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await notificationService.requestPermission();
      setNotificationsEnabled(granted);
    } else {
      // Logic to disable notifications if any
      setNotificationsEnabled(false);
    }
  };
  
  const handleExportData = async () => {
    try {
      const data = await storageService.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plantitas-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      // Show success toast
    } catch (error) {
      console.error('Error exporting data:', error);
      // Show error toast
    }
  };
  
  const handleClearData = async () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar todos tus datos? Esta acción es irreversible.')) {
      try {
        await storageService.clearAllData();
        // Show success toast and possibly sign out user
        await handleSignOut();
      } catch (error) {
        console.error('Error clearing data:', error);
        // Show error toast
      }
    }
  };

  const settingsSections = useMemo(() => [
    {
      title: 'Cuenta',
      items: [
        {
          id: 'profile',
          icon: 'User',
          label: 'Perfil',
          value: profile?.full_name || 'Sin nombre',
          action: () => { /* Navigate to profile page */ },
          type: 'button' as const,
        },
        {
          id: 'logout',
          icon: 'LogOut',
          label: 'Cerrar Sesión',
          value: profile?.email,
          action: handleSignOut,
          type: 'button' as const,
        },
      ],
    },
    {
      title: 'Preferencias',
      items: [
        {
          id: 'theme',
          icon: isDark ? 'Sun' : 'Moon',
          label: 'Modo Oscuro',
          type: 'toggle' as const,
          toggleState: isDark,
          onToggleChange: toggleTheme,
        },
        {
          id: 'notifications',
          icon: 'Bell',
          label: 'Notificaciones',
          type: 'toggle' as const,
          toggleState: notificationsEnabled,
          onToggleChange: handleNotificationToggle,
        },
      ],
    },
    {
        title: 'Datos',
        items: [
            {
                id: 'export',
                icon: 'Download',
                label: 'Exportar mis datos',
                action: handleExportData,
                type: 'button' as const,
            },
            {
                id: 'delete',
                icon: 'Trash2',
                label: 'Eliminar mis datos',
                action: handleClearData,
                type: 'button' as const,
            },
        ],
    },
    {
      title: 'Soporte',
      items: [
        // Funciones de soporte temporalmente ocultas - ver ROADMAP.md
        /* 
        {
          id: 'help',
          icon: 'HelpCircle',
          label: 'Ayuda y FAQ',
          action: () => { console.log('Navigate to help page'); },
          type: 'button' as const,
        },
        {
          id: 'privacy',
          icon: 'Shield',
          label: 'Política de Privacidad',
          action: () => { console.log('Navigate to privacy page'); },
          type: 'button' as const,
        },
        {
          id: 'about',
          icon: 'Info',
          label: 'Acerca de Plantitas',
          value: 'v1.0.0', // This should be dynamic
          action: () => { console.log('Show about modal'); },
          type: 'button' as const,
        }
        */
      ],
    },
  ], [isDark, notificationsEnabled, profile, handleSignOut, toggleTheme, handleNotificationToggle]);

  return {
    settingsSections,
  };
}; 