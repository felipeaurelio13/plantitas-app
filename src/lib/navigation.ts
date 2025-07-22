/**
 * Navigation helpers for consistent routing throughout the app
 * All route paths are defined here to ensure consistency and avoid typos
 */

export const routes = {
  // Public routes
  auth: '/auth',
  
  // Main routes
  dashboard: '/',
  camera: '/camera',
  settings: '/settings',
  
  // Chat routes
  gardenChat: '/garden-chat',
  
  // Plant routes
  plantDetail: (plantId: string) => `/plant/${plantId}`,
  plantChat: (plantId: string) => `/plant/${plantId}/chat`,
} as const;

/**
 * Navigation helper functions
 * Use these instead of hardcoded strings to ensure consistency
 */
export const navigation = {
  toDashboard: () => routes.dashboard,
  toCamera: () => routes.camera,
  toSettings: () => routes.settings,
  toGardenChat: () => routes.gardenChat,
  toPlantDetail: (plantId: string) => routes.plantDetail(plantId),
  toPlantChat: (plantId: string) => routes.plantChat(plantId),
  toAuth: () => routes.auth,
} as const;

/**
 * Check if a path matches a route pattern
 */
export const isActiveRoute = (currentPath: string, targetPath: string): boolean => {
  // Exact match for simple routes
  if (currentPath === targetPath) return true;
  
  // Handle dynamic routes
  if (targetPath === routes.dashboard) {
    return currentPath === '/' || currentPath.startsWith('/plant/');
  }
  
  if (targetPath === routes.gardenChat) {
    return currentPath === routes.gardenChat || 
           currentPath.includes('/chat') || 
           currentPath.includes('/garden-chat');
  }
  
  if (targetPath === routes.settings) {
    return currentPath.startsWith('/settings');
  }
  
  return false;
};

/**
 * Breadcrumb item type
 */
export interface Breadcrumb {
  label: string;
  path: string;
}

/**
 * Get breadcrumb navigation for a given path
 */
export const getBreadcrumbs = (path: string): Breadcrumb[] => {
  const segments = path.split('/').filter(Boolean);
  const breadcrumbs: Breadcrumb[] = [{ label: 'Inicio', path: routes.dashboard }];
  
  if (segments.length === 0) return breadcrumbs;
  
  switch (segments[0]) {
    case 'camera':
      breadcrumbs.push({ label: 'Cámara', path: routes.camera });
      break;
      
    case 'settings':
      breadcrumbs.push({ label: 'Configuración', path: routes.settings });
      break;
      
    case 'garden-chat':
      breadcrumbs.push({ label: 'Chat del Jardín', path: routes.gardenChat });
      break;
      
    case 'plant':
      if (segments[1]) {
        breadcrumbs.push({ 
          label: 'Planta', 
          path: routes.plantDetail(segments[1]) 
        });
        
        if (segments[2] === 'chat') {
          breadcrumbs.push({ 
            label: 'Chat', 
            path: routes.plantChat(segments[1]) 
          });
        }
      }
      break;
      
    default:
      break;
  }
  
  return breadcrumbs;
}; 