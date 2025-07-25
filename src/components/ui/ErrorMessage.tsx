import React from 'react';
import { motion } from 'framer-motion';
import { 
  AlertTriangle, 
  Wifi, 
  RefreshCw, 
  HelpCircle, 
  ExternalLink,
  X
} from 'lucide-react';
import { Button } from './Button';

interface ErrorMessageProps {
  title: string;
  message: string;
  type?: 'network' | 'validation' | 'server' | 'unknown';
  onRetry?: () => void;
  onDismiss?: () => void;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'outline';
  }>;
  className?: string;
}

const errorConfig = {
  network: {
    icon: Wifi,
    color: 'text-orange-500',
    bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    borderColor: 'border-orange-200 dark:border-orange-800',
    defaultActions: [
      { label: 'Reintentar', action: 'retry' },
      { label: 'Verificar conexión', action: 'help' }
    ]
  },
  validation: {
    icon: AlertTriangle,
    color: 'text-amber-500',
    bgColor: 'bg-amber-50 dark:bg-amber-900/20',
    borderColor: 'border-amber-200 dark:border-amber-800',
    defaultActions: [
      { label: 'Corregir', action: 'retry' }
    ]
  },
  server: {
    icon: AlertTriangle,
    color: 'text-red-500',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    defaultActions: [
      { label: 'Reintentar', action: 'retry' },
      { label: 'Reportar problema', action: 'help' }
    ]
  },
  unknown: {
    icon: HelpCircle,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50 dark:bg-gray-900/20',
    borderColor: 'border-gray-200 dark:border-gray-800',
    defaultActions: [
      { label: 'Reintentar', action: 'retry' }
    ]
  }
};

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  title,
  message,
  type = 'unknown',
  onRetry,
  onDismiss,
  actions,
  className = ''
}) => {
  const config = errorConfig[type];
  const Icon = config.icon;

  const handleDefaultAction = (action: string) => {
    switch (action) {
      case 'retry':
        onRetry?.();
        break;
      case 'help':
        // En el futuro esto podría abrir un modal de ayuda o link a soporte
        console.log('Help requested for error type:', type);
        break;
    }
  };

  const renderActions = () => {
    if (actions) {
      return actions.map((action, index) => (
        <Button
          key={index}
          variant={action.variant || 'outline'}
          size="sm"
          onClick={action.onClick}
        >
          {action.label}
        </Button>
      ));
    }

    return config.defaultActions.map((action, index) => (
      <Button
        key={index}
        variant={index === 0 ? 'primary' : 'outline'}
        size="sm"
        onClick={() => handleDefaultAction(action.action)}
        disabled={action.action === 'retry' && !onRetry}
      >
        {action.action === 'retry' && <RefreshCw className="w-4 h-4 mr-1" />}
        {action.action === 'help' && <ExternalLink className="w-4 h-4 mr-1" />}
        {action.label}
      </Button>
    ));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`
        ${config.bgColor} 
        ${config.borderColor} 
        border rounded-lg p-4 
        ${className}
      `}
    >
      <div className="flex items-start gap-3">
        <div className={`${config.color} flex-shrink-0 mt-0.5`}>
          <Icon className="w-5 h-5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">
            {title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {message}
          </p>
          
          <div className="flex flex-wrap gap-2">
            {renderActions()}
          </div>
        </div>

        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 flex-shrink-0"
            aria-label="Cerrar error"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

// Componentes específicos pre-configurados
export const ErrorMessages = {
  NetworkError: (props: Omit<ErrorMessageProps, 'type' | 'title' | 'message'>) => (
    <ErrorMessage 
      type="network"
      title="Error de Conexión"
      message="No se pudo conectar con el servidor. Verifica tu conexión a internet."
      {...props}
    />
  ),
  
  LoadingPlantsError: (props: Omit<ErrorMessageProps, 'type' | 'title' | 'message'>) => (
    <ErrorMessage 
      type="server"
      title="Error al Cargar Plantas"
      message="No se pudieron cargar tus plantas. Intenta refrescar la página."
      {...props}
    />
  ),
  
  ImageAnalysisError: (props: Omit<ErrorMessageProps, 'type' | 'title' | 'message'>) => (
    <ErrorMessage 
      type="server"
      title="Error en Análisis de Imagen"
      message="La IA no pudo analizar la imagen. Asegúrate de que sea una foto clara de una planta."
      {...props}
    />
  ),
  
  ValidationError: (message: string, props?: Omit<ErrorMessageProps, 'type' | 'title' | 'message'>) => (
    <ErrorMessage 
      type="validation"
      title="Información Requerida"
      message={message}
      {...props}
    />
  ),
};