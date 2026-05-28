// src/services/NotificationService.js
import { getConfig } from '../config/config';

// Tipi di notifica supportati
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
};

// Classe per gestire le notifiche
class NotificationService {
  constructor() {
    this.notifications = [];
    this.listeners = [];
  }

  // Aggiunge una notifica
  addNotification(type, message, title = null, duration = null) {
    const notification = {
      id: Date.now() + Math.random(),
      type,
      message,
      title,
      timestamp: new Date(),
      duration: duration || this.getDefaultDuration(type)
    };

    this.notifications.push(notification);
    this.notifyListeners();
    
    // Rimuove automaticamente la notifica dopo la durata specificata
    if (notification.duration > 0) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, notification.duration);
    }

    return notification.id;
  }

  // Rimuove una notifica per ID
  removeNotification(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();
  }

  // Rimuove tutte le notifiche
  clearAll() {
    this.notifications = [];
    this.notifyListeners();
  }

  // Ottiene la durata predefinita per tipo
  getDefaultDuration(type) {
    const config = getConfig('NOTIFICATION_CONFIG');
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return config.SUCCESS_DURATION;
      case NOTIFICATION_TYPES.ERROR:
        return config.ERROR_DURATION;
      case NOTIFICATION_TYPES.WARNING:
        return config.WARNING_DURATION;
      default:
        return config.SUCCESS_DURATION;
    }
  }

  // Aggiunge un listener per i cambiamenti
  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // Notifica tutti i listener
  notifyListeners() {
    this.listeners.forEach(callback => callback(this.notifications));
  }

  // Metodi di convenienza per i diversi tipi
  success(message, title = null, duration = null) {
    return this.addNotification(NOTIFICATION_TYPES.SUCCESS, message, title, duration);
  }

  error(message, title = null, duration = null) {
    return this.addNotification(NOTIFICATION_TYPES.ERROR, message, title, duration);
  }

  warning(message, title = null, duration = null) {
    return this.addNotification(NOTIFICATION_TYPES.WARNING, message, title, duration);
  }

  info(message, title = null, duration = null) {
    return this.addNotification(NOTIFICATION_TYPES.INFO, message, title, duration);
  }

  // Ottiene tutte le notifiche attuali
  getNotifications() {
    return [...this.notifications];
  }

  // Ottiene le notifiche per tipo
  getNotificationsByType(type) {
    return this.notifications.filter(n => n.type === type);
  }
}

// Istanza singleton del servizio
const notificationService = new NotificationService();

// Esporta l'istanza e la classe
export default notificationService;
export { NotificationService };

// Utility per creare notifiche rapide
export const notify = {
  success: (message, title, duration) => notificationService.success(message, title, duration),
  error: (message, title, duration) => notificationService.error(message, title, duration),
  warning: (message, title, duration) => notificationService.warning(message, title, duration),
  info: (message, title, duration) => notificationService.info(message, title, duration),
  clear: () => notificationService.clearAll(),
  remove: (id) => notificationService.removeNotification(id)
};
