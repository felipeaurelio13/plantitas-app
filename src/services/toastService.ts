export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastData {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

type ToastCallback = (toast: ToastData) => void;

class ToastService {
  private listeners: Set<ToastCallback> = new Set();

  subscribe(callback: ToastCallback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private emit(toast: ToastData) {
    this.listeners.forEach(callback => callback(toast));
  }

  success(title: string, message?: string, duration?: number) {
    this.emit({ type: 'success', title, message, duration });
  }

  error(title: string, message?: string, duration?: number) {
    this.emit({ type: 'error', title, message, duration });
  }

  warning(title: string, message?: string, duration?: number) {
    this.emit({ type: 'warning', title, message, duration });
  }

  info(title: string, message?: string, duration?: number) {
    this.emit({ type: 'info', title, message, duration });
  }
}

export const toastService = new ToastService(); 