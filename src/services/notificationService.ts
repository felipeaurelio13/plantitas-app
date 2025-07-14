import { Plant, PlantNotification } from '../schemas';

class NotificationService {
  private registration: ServiceWorkerRegistration | null = null;

  async init() {
    if ('serviceWorker' in navigator && 'Notification' in window) {
      try {
        this.registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  async scheduleWateringReminder(plant: Plant): Promise<void> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return;

    const nextWateringDate = new Date();
    nextWateringDate.setDate(nextWateringDate.getDate() + plant.careProfile.wateringFrequency);

    const notification: PlantNotification = {
      id: `watering-${plant.id}-${Date.now()}`,
      type: 'watering',
      title: `💧 ${plant.nickname || plant.name} necesita agua`,
      message: `Es hora de regar tu ${plant.species}. ¡No olvides cuidar de tu planta!`,
      priority: 'medium',
      scheduledFor: nextWateringDate,
      completed: false,
    };

    // Store notification for tracking
    this.storeNotification(plant.id, notification);

    // Schedule browser notification
    if (this.registration) {
      await this.registration.showNotification(notification.title, {
        body: notification.message,
        icon: '/plant-icon.svg',
        badge: '/plant-icon.svg',
        tag: notification.id,
        // timestamp: nextWateringDate.getTime(),
        requireInteraction: true,
        // actions: [
        //   {
        //     action: 'water',
        //     title: '💧 Marcar como regada',
        //   },
        //   {
        //     action: 'snooze',
        //     title: '⏰ Recordar en 1 hora',
        //   },
        // ],
      });
    }
  }

  async scheduleHealthCheckReminder(plant: Plant): Promise<void> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return;

    const nextCheckDate = new Date();
    nextCheckDate.setDate(nextCheckDate.getDate() + 7); // Weekly health checks

    const notification: PlantNotification = {
      id: `health-${plant.id}-${Date.now()}`,
      type: 'health_check',
      title: `🌱 Revisión de salud para ${plant.nickname || plant.name}`,
      message: `Es hora de revisar cómo está tu ${plant.species}. ¡Toma una foto para ver su progreso!`,
      priority: 'low',
      scheduledFor: nextCheckDate,
      completed: false,
    };

    this.storeNotification(plant.id, notification);

    if (this.registration) {
      await this.registration.showNotification(notification.title, {
        body: notification.message,
        icon: '/plant-icon.svg',
        badge: '/plant-icon.svg',
        tag: notification.id,
        // timestamp: nextCheckDate.getTime(),
        // actions: [
        //   {
        //     action: 'photo',
        //     title: '📸 Tomar foto',
        //   },
        //   {
        //     action: 'dismiss',
        //     title: '✓ Está bien',
        //   },
        // ],
      });
    }
  }

  async sendUrgentAlert(plant: Plant, issue: string): Promise<void> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) return;

    const notification: PlantNotification = {
      id: `urgent-${plant.id}-${Date.now()}`,
      type: 'general',
      title: `🚨 ¡${plant.nickname || plant.name} necesita atención urgente!`,
      message: issue,
      priority: 'high',
      scheduledFor: new Date(),
      completed: false,
    };

    this.storeNotification(plant.id, notification);

    if (this.registration) {
      await this.registration.showNotification(notification.title, {
        body: notification.message,
        icon: '/plant-icon.svg',
        badge: '/plant-icon.svg',
        tag: notification.id,
        requireInteraction: true,
        // vibrate: [200, 100, 200],
        // actions: [
        //   {
        //     action: 'check',
        //     title: '👀 Revisar planta',
        //   },
        // ],
      });
    }
  }

  private storeNotification(plantId: string, notification: PlantNotification): void {
    const stored = localStorage.getItem(`notifications-${plantId}`);
    const notifications = stored ? JSON.parse(stored) : [];
    notifications.push(notification);
    localStorage.setItem(`notifications-${plantId}`, JSON.stringify(notifications));
  }

  async getNotifications(plantId: string): Promise<PlantNotification[]> {
    const stored = localStorage.getItem(`notifications-${plantId}`);
    if (!stored) return [];

    const notifications = JSON.parse(stored);
    return notifications.map((notif: any) => ({
      ...notif,
      scheduledFor: new Date(notif.scheduledFor),
    }));
  }

  async markNotificationCompleted(_notificationId: string): Promise<void> {
    // Implementation to mark notification as completed
    // This would update the stored notifications
  }
}

export const notificationService = new NotificationService();