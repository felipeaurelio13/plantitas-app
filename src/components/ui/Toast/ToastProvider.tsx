import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  AlertCircle, 
  XCircle, 
  Info, 
  X, 
  Brain,
  Camera,
  Leaf,
  RotateCw
} from 'lucide-react';

interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'ai' | 'camera' | 'plant' | 'sync';
  title: string;
  message?: string;
  duration?: number;
  actions?: ToastAction[];
  persistent?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  clearAll: () => void;
  showSuccess: (title: string, message?: string, options?: Partial<Toast>) => string;
  showError: (title: string, message?: string, options?: Partial<Toast>) => string;
  showWarning: (title: string, message?: string, options?: Partial<Toast>) => string;
  showInfo: (title: string, message?: string, options?: Partial<Toast>) => string;
  showAI: (title: string, message?: string, options?: Partial<Toast>) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
  ai: Brain,
  camera: Camera,
  plant: Leaf,
  sync: RotateCw,
};

const styleMap = {
  success: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon: 'text-green-500',
    title: 'text-green-800 dark:text-green-200',
    message: 'text-green-700 dark:text-green-300',
  },
  error: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: 'text-red-500',
    title: 'text-red-800 dark:text-red-200',
    message: 'text-red-700 dark:text-red-300',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    icon: 'text-amber-500',
    title: 'text-amber-800 dark:text-amber-200',
    message: 'text-amber-700 dark:text-amber-300',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    border: 'border-blue-200 dark:border-blue-800',
    icon: 'text-blue-500',
    title: 'text-blue-800 dark:text-blue-200',
    message: 'text-blue-700 dark:text-blue-300',
  },
  ai: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    icon: 'text-purple-500',
    title: 'text-purple-800 dark:text-purple-200',
    message: 'text-purple-700 dark:text-purple-300',
  },
  camera: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    border: 'border-indigo-200 dark:border-indigo-800',
    icon: 'text-indigo-500',
    title: 'text-indigo-800 dark:text-indigo-200',
    message: 'text-indigo-700 dark:text-indigo-300',
  },
  plant: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon: 'text-green-500',
    title: 'text-green-800 dark:text-green-200',
    message: 'text-green-700 dark:text-green-300',
  },
  sync: {
    bg: 'bg-gray-50 dark:bg-gray-900/20',
    border: 'border-gray-200 dark:border-gray-800',
    icon: 'text-gray-500',
    title: 'text-gray-800 dark:text-gray-200',
    message: 'text-gray-700 dark:text-gray-300',
  },
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = generateId();
    const newToast: Toast = {
      id,
      duration: 5000,
      ...toast,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto remove after duration (if not persistent)
    if (!newToast.persistent && newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }

    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setToasts([]);
  }, []);

  const showSuccess = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'success', title, message, ...options });
  }, [addToast]);

  const showError = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'error', title, message, duration: 8000, ...options });
  }, [addToast]);

  const showWarning = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'warning', title, message, duration: 6000, ...options });
  }, [addToast]);

  const showInfo = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'info', title, message, ...options });
  }, [addToast]);

  const showAI = useCallback((title: string, message?: string, options?: Partial<Toast>) => {
    return addToast({ type: 'ai', title, message, ...options });
  }, [addToast]);

  const value: ToastContextType = {
    toasts,
    addToast,
    removeToast,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showAI,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

const ToastContainer: React.FC = () => {
  const context = useContext(ToastContext);
  if (!context) return null;

  const { toasts, removeToast } = context;

  return (
    <div className="fixed top-4 right-4 z-[9999] space-y-2 max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const Icon = toast.icon || iconMap[toast.type];
  const styles = styleMap[toast.type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`
        ${styles.bg} ${styles.border}
        border rounded-lg p-4 shadow-lg backdrop-blur-sm
        max-w-sm w-full
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`${styles.icon} flex-shrink-0 mt-0.5`}>
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={`${styles.title} text-sm font-medium mb-1`}>
            {toast.title}
          </h4>
          {toast.message && (
            <p className={`${styles.message} text-sm leading-relaxed`}>
              {toast.message}
            </p>
          )}
          
          {toast.actions && toast.actions.length > 0 && (
            <div className="flex gap-2 mt-3">
              {toast.actions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => {
                    action.onClick();
                    onRemove(toast.id);
                  }}
                  className={`
                    text-xs font-medium px-2 py-1 rounded transition-colors
                    ${action.variant === 'primary' 
                      ? `${styles.icon} bg-white/20 hover:bg-white/30` 
                      : `${styles.message} hover:${styles.title}`
                    }
                  `}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => onRemove(toast.id)}
          className={`${styles.icon} hover:opacity-70 transition-opacity flex-shrink-0`}
          aria-label="Cerrar notificación"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastProvider;