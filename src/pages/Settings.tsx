import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Moon, 
  Sun, 
  Smartphone, 
  Info, 
  Shield, 
  HelpCircle,
  ChevronRight,
  Camera,
  Mic,
  Download,
  Upload,
  Trash2,
  Database,
  LogOut
} from 'lucide-react';
import { useThemeStore, usePlantStore, useAuthStore } from '../stores';
import { storageService } from '../services/storageService';
import { notificationService } from '../services/notificationService';

const Settings: React.FC = () => {
  const { isDark, toggleTheme } = useThemeStore();
  const plants = usePlantStore((state) => state.plants);
  const { signOut, profile } = useAuthStore();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [hapticEnabled, setHapticEnabled] = useState(true);
  const [showDataManagement, setShowDataManagement] = useState(false);

  const handleSignOut = async () => {
    if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
      try {
        await signOut();
      } catch (error) {
        alert('Error al cerrar sesión');
      }
    }
  };

  const handleNotificationToggle = async () => {
    if (!notificationsEnabled) {
      const granted = await notificationService.requestPermission();
      setNotificationsEnabled(granted);
    } else {
      setNotificationsEnabled(false);
    }
  };

  const handleHapticToggle = () => {
    setHapticEnabled(!hapticEnabled);
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
  };

  const exportData = async () => {
    try {
      const data = await storageService.exportData();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `plantcare-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      alert('Datos exportados exitosamente');
    } catch (error) {
      alert('Error al exportar datos');
    }
  };

  const importData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          await storageService.importData(text);
          alert('Datos importados exitosamente. Recarga la página para ver los cambios.');
        } catch (error) {
          alert('Error al importar datos. Verifica que el archivo sea válido.');
        }
      }
    };
    input.click();
  };

  const clearAllData = async () => {
    if (confirm('¿Estás seguro de que quieres eliminar todos los datos? Esta acción no se puede deshacer.')) {
      try {
        await storageService.clearAllData();
        alert('Todos los datos han sido eliminados. Recarga la página.');
      } catch (error) {
        alert('Error al eliminar datos');
      }
    }
  };

  const settingsSections = [
    {
      title: 'Cuenta',
      items: [
        {
          icon: LogOut,
          label: 'Cerrar Sesión',
          value: profile?.email || '',
          action: handleSignOut,
        },
      ],
    },
    {
      title: 'Preferencias',
      items: [
        {
          icon: isDark ? Sun : Moon,
          label: 'Tema',
          value: isDark ? 'Oscuro' : 'Claro',
          action: toggleTheme,
        },
        {
          icon: Bell,
          label: 'Notificaciones',
          value: notificationsEnabled ? 'Activadas' : 'Desactivadas',
          action: handleNotificationToggle,
        },
        {
          icon: Smartphone,
          label: 'Vibración',
          value: hapticEnabled ? 'Activada' : 'Desactivada',
          action: handleHapticToggle,
        },
      ],
    },
    {
      title: 'Permisos',
      items: [
        {
          icon: Camera,
          label: 'Acceso a Cámara',
          value: 'Concedido',
          action: () => {},
        },
        {
          icon: Mic,
          label: 'Micrófono',
          value: 'No usado',
          action: () => {},
        },
      ],
    },
    {
      title: 'Datos',
      items: [
        {
          icon: Database,
          label: 'Gestión de Datos',
          value: `${plants.length} plantas`,
          action: () => setShowDataManagement(true),
        },
      ],
    },
    {
      title: 'Soporte',
      items: [
        {
          icon: HelpCircle,
          label: 'Ayuda y FAQ',
          action: () => {},
        },
        {
          icon: Shield,
          label: 'Política de Privacidad',
          action: () => {},
        },
        {
          icon: Info,
          label: 'Acerca de PlantCare',
          action: () => {},
        },
      ],
    },
  ];

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Configuración
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Personaliza tu experiencia de cuidado de plantas
        </p>
      </div>

      {/* Settings Sections */}
      {settingsSections.map((section, sectionIndex) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: sectionIndex * 0.1 }}
          className="space-y-3"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {section.title}
          </h2>
          
          <div className="glass-effect rounded-2xl overflow-hidden">
            {section.items.map((item, index) => (
              <button
                key={item.label}
                onClick={item.action}
                className={`w-full flex items-center justify-between p-4 ios-button ${
                  index !== section.items.length - 1 
                    ? 'border-b border-gray-200 dark:border-gray-700' 
                    : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <item.icon size={18} className="text-gray-600 dark:text-gray-400" />
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {item.label}
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  {'value' in item && item.value && (
                    <span className="text-gray-600 dark:text-gray-400 text-sm">
                      {item.value}
                    </span>
                  )}
                  <ChevronRight size={16} className="text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Data Management Modal */}
      {showDataManagement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowDataManagement(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Gestión de Datos
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={exportData}
                className="w-full flex items-center space-x-3 p-3 rounded-xl bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 ios-button"
              >
                <Download size={20} />
                <span>Exportar Datos</span>
              </button>
              
              <button
                onClick={importData}
                className="w-full flex items-center space-x-3 p-3 rounded-xl bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 ios-button"
              >
                <Upload size={20} />
                <span>Importar Datos</span>
              </button>
              
              <button
                onClick={clearAllData}
                className="w-full flex items-center space-x-3 p-3 rounded-xl bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 ios-button"
              >
                <Trash2 size={20} />
                <span>Eliminar Todos los Datos</span>
              </button>
            </div>
            
            <button
              onClick={() => setShowDataManagement(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl ios-button"
            >
              Cancelar
            </button>
          </motion.div>
        </motion.div>
      )}

      {/* App Info */}
      <div className="glass-effect rounded-2xl p-4 text-center">
        <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
          <Sun className="w-8 h-8 text-white" />
        </div>
        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
          PlantCare
        </h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
          Versión 1.0.0
        </p>
        <p className="text-gray-500 dark:text-gray-500 text-xs">
          Tu compañero de plantas con IA
        </p>
      </div>

      {/* Footer */}
      <div className="text-center py-4">
        <p className="text-gray-500 dark:text-gray-500 text-xs">
          Hecho con ❤️ para amantes de las plantas en todas partes
        </p>
      </div>
    </div>
  );
};

export default Settings;