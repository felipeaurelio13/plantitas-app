import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, X, MessageCircle, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';
import { navigation } from '../../lib/navigation';

interface AIFeatureHighlightProps {
  type: 'suggestion' | 'tip' | 'welcome';
  title: string;
  message: string;
  onDismiss?: () => void;
  autoHide?: boolean;
  duration?: number;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  }>;
}

export const AIFeatureHighlight: React.FC<AIFeatureHighlightProps> = ({
  type,
  title,
  message,
  onDismiss,
  autoHide = false,
  duration = 8000,
  actions
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (autoHide && duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onDismiss?.();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [autoHide, duration, onDismiss]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  const typeStyles = {
    suggestion: {
      bg: 'bg-purple-50 dark:bg-purple-900/20',
      border: 'border-purple-200 dark:border-purple-800',
      accent: 'text-purple-600 dark:text-purple-400',
      icon: Brain,
    },
    tip: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-200 dark:border-blue-800',
      accent: 'text-blue-600 dark:text-blue-400',
      icon: Sparkles,
    },
    welcome: {
      bg: 'bg-green-50 dark:bg-green-900/20',
      border: 'border-green-200 dark:border-green-800',
      accent: 'text-green-600 dark:text-green-400',
      icon: MessageCircle,
    },
  };

  const style = typeStyles[type];
  const Icon = style.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className={`
          ${style.bg} ${style.border}
          border rounded-lg p-4 shadow-md backdrop-blur-sm
          relative overflow-hidden
        `}
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-20 h-20 opacity-10">
          <Icon className="w-full h-full" />
        </div>

        <div className="relative flex items-start gap-3">
          {/* Icon */}
          <div className={`${style.accent} flex-shrink-0 mt-0.5`}>
            <Icon className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className={`${style.accent} text-sm font-semibold mb-1`}>
              {title}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed mb-3">
              {message}
            </p>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {actions ? (
                actions.map((action, index) => (
                  <Button
                    key={index}
                    size="sm"
                    variant={action.variant || 'outline'}
                    onClick={action.onClick}
                    className="text-xs"
                  >
                    {action.label}
                  </Button>
                ))
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(navigation.toGardenChat())}
                  className="text-xs flex items-center gap-1"
                >
                  Probar Chat IA
                  <ArrowRight className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Dismiss button */}
          {onDismiss && (
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 flex-shrink-0"
              aria-label="Cerrar sugerencia"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Progress bar for auto-hide */}
        {autoHide && duration > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/10 dark:bg-white/10">
            <motion.div
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: duration / 1000, ease: 'linear' }}
              className={`h-full ${style.accent.replace('text-', 'bg-')}`}
            />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

// Hook para gestionar sugerencias de IA contextuales
export const useAIHighlights = () => {
  const [dismissedHighlights, setDismissedHighlights] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('dismissed-ai-highlights');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const dismissHighlight = (id: string) => {
    const updated = [...dismissedHighlights, id];
    setDismissedHighlights(updated);
    try {
      localStorage.setItem('dismissed-ai-highlights', JSON.stringify(updated));
    } catch (error) {
      console.warn('Error saving dismissed highlights:', error);
    }
  };

  const shouldShowHighlight = (id: string) => {
    return !dismissedHighlights.includes(id);
  };

  const resetHighlights = () => {
    setDismissedHighlights([]);
    try {
      localStorage.removeItem('dismissed-ai-highlights');
    } catch (error) {
      console.warn('Error resetting highlights:', error);
    }
  };

  return {
    dismissHighlight,
    shouldShowHighlight,
    resetHighlights,
  };
};