import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
  preview?: React.ReactNode;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'warning',
  isLoading = false,
  preview
}) => {
  const variantStyles = {
    danger: {
      iconColor: 'text-red-500',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      confirmColor: 'destructive'
    },
    warning: {
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      confirmColor: 'warning'
    },
    info: {
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      confirmColor: 'primary'
    }
  };

  const styles = variantStyles[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          >
            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden"
            >
              {/* Header */}
              <div className="p-6 pb-4">
                <div className="flex items-start gap-4">
                  <div className={`${styles.bgColor} p-3 rounded-full flex-shrink-0`}>
                    <AlertTriangle className={`w-6 h-6 ${styles.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                      {title}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                      {description}
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                    aria-label="Cerrar diálogo"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Preview Content */}
              {preview && (
                <div className="px-6 pb-4">
                  <div className="border dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900/50">
                    {preview}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="px-6 pb-6 flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                  className="min-w-[80px]"
                >
                  {cancelText}
                </Button>
                <Button
                  variant={styles.confirmColor as any}
                  onClick={onConfirm}
                  disabled={isLoading}
                  loading={isLoading}
                  className="min-w-[80px]"
                >
                  {confirmText}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};