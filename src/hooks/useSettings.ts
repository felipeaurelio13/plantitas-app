import { useMemo, useState } from 'react';
import { useThemeStore, useAuthStore } from '../stores';
import { storageService } from '../services/storageService';
import { useNavigate } from 'react-router-dom';

export const useSettings = () => {
  const { isDark, toggleTheme } = useThemeStore();
  const { signOut, profile } = useAuthStore();
  const navigate = useNavigate();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Local state for settings that don't have a store
  // TODO: Reemplazar por lógica real si se requiere
  const hasDataToExport = true;
  const hasDataToDelete = true;

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

  
  const handleExportData = () => {
    setIsExportModalOpen(true);
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
          id: 'signout',
          icon: 'LogOut',
          label: 'Cerrar sesión',
          type: 'button',
          onClick: handleSignOut,
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
      ],
    },
    {
        title: 'Datos',
        items: [
            {
                id: 'export',
                icon: 'Download',
                label: 'Exportar mis datos',
                type: 'button',
                onClick: handleExportData,
                disabled: !profile || !hasDataToExport,
            },
            {
                id: 'delete',
                icon: 'Trash2',
                label: 'Eliminar mis datos',
                type: 'button',
                onClick: handleClearData,
                disabled: !profile || !hasDataToDelete,
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
  ], [isDark, profile, handleSignOut, toggleTheme]);

  return {
    settingsSections,
    isExportModalOpen,
    setIsExportModalOpen,
  };
}; 