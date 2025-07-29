// Configuración de versión de la aplicación
// Este archivo se actualiza automáticamente en cada build

export const APP_VERSION = '1.0.3';
export const BUILD_TIMESTAMP = '2025-07-29T23:11:58.067Z';
export const BUILD_DATE = '29 de julio de 2025, 23:11';

// Información adicional de la aplicación
export const APP_INFO = {
  name: 'Plantitas',
  version: APP_VERSION,
  buildDate: BUILD_DATE,
  buildTimestamp: BUILD_TIMESTAMP,
  description: 'Aplicación de cuidado de plantas',
  author: 'Felipe Aurelio',
  repository: 'https://github.com/felipeaurelio13/plantitas-app'
};

// Función para obtener la versión completa
export const getFullVersion = () => {
  return `${APP_INFO.name} v${APP_INFO.version} (${APP_INFO.buildDate})`;
};

// Función para obtener información de versión para debugging
export const getVersionInfo = () => {
  return {
    ...APP_INFO,
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    online: navigator.onLine,
    timestamp: new Date().toISOString()
  };
};