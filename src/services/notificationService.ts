import { PlantNotification } from '../schemas';

export const generateWateringReminder = (plantId: string): PlantNotification => {
  return {
    id: `water_${plantId}_${Date.now()}`,
    type: 'watering',
    title: 'Recordatorio de Riego',
    message: 'Es hora de regar tu planta',
    priority: 'medium',
    isRead: false,
    createdAt: new Date(),
  };
};

export const generateHealthCheckReminder = (plantId: string): PlantNotification => {
  return {
    id: `health_${plantId}_${Date.now()}`,
    type: 'health_check',
    title: 'Chequeo de Salud',
    message: 'Revisa el estado de tu planta',
    priority: 'low',
    isRead: false,
    createdAt: new Date(),
  };
};

export const generateHealthAlert = (plantId: string): PlantNotification => {
  return {
    id: `alert_${plantId}_${Date.now()}`,
    type: 'general',
    title: 'Alerta de Salud',
    message: 'Se detectó un problema en tu planta',
    priority: 'high',
    isRead: false,
    createdAt: new Date(),
  };
};
