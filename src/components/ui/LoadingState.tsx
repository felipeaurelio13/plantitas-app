import React from 'react';
import { motion } from 'framer-motion';
import { 
  Loader2, 
  Brain, 
  Camera, 
  Upload, 
  Download, 
  RotateCw, 
  Search,
  Save,
  Trash2,
  MessageCircle
} from 'lucide-react';

interface LoadingStateProps {
  message: string;
  type?: 'default' | 'ai' | 'camera' | 'upload' | 'download' | 'sync' | 'search' | 'save' | 'delete' | 'chat';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const iconMap = {
  default: Loader2,
  ai: Brain,
  camera: Camera,
  upload: Upload,
  download: Download,
  sync: RotateCw,
  search: Search,
  save: Save,
  delete: Trash2,
  chat: MessageCircle,
};

const sizeMap = {
  sm: { icon: 'w-4 h-4', text: 'text-sm', gap: 'gap-2' },
  md: { icon: 'w-5 h-5', text: 'text-base', gap: 'gap-3' },
  lg: { icon: 'w-6 h-6', text: 'text-lg', gap: 'gap-4' },
};

export const LoadingState: React.FC<LoadingStateProps> = ({
  message,
  type = 'default',
  size = 'md',
  className = ''
}) => {
  const Icon = iconMap[type];
  const sizes = sizeMap[size];

  return (
    <div className={`flex items-center justify-center ${sizes.gap} ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className="flex-shrink-0"
      >
        <Icon className={`${sizes.icon} text-primary-500`} />
      </motion.div>
      <span className={`${sizes.text} text-gray-600 dark:text-gray-400 font-medium`}>
        {message}
      </span>
    </div>
  );
};

// Componentes específicos pre-configurados
export const LoadingStates = {
  AnalyzingImage: (props?: Partial<LoadingStateProps>) => (
    <LoadingState 
      message="Analizando imagen con IA..."
      type="ai"
      {...props}
    />
  ),
  
  SavingPlant: (props?: Partial<LoadingStateProps>) => (
    <LoadingState 
      message="Guardando datos de tu planta..."
      type="save"
      {...props}
    />
  ),
  
  DeletingPlant: (props?: Partial<LoadingStateProps>) => (
    <LoadingState 
      message="Eliminando planta..."
      type="delete"
      {...props}
    />
  ),
  
  LoadingPlants: (props?: Partial<LoadingStateProps>) => (
    <LoadingState 
      message="Cargando tu jardín..."
      type="default"
      {...props}
    />
  ),
  
  SyncingData: (props?: Partial<LoadingStateProps>) => (
    <LoadingState 
      message="Sincronizando con la nube..."
      type="sync"
      {...props}
    />
  ),
  
  ProcessingChat: (props?: Partial<LoadingStateProps>) => (
    <LoadingState 
      message="El asistente está pensando..."
      type="chat"
      {...props}
    />
  ),
  
  TakingPhoto: (props?: Partial<LoadingStateProps>) => (
    <LoadingState 
      message="Preparando cámara..."
      type="camera"
      {...props}
    />
  ),
  
  UploadingImage: (props?: Partial<LoadingStateProps>) => (
    <LoadingState 
      message="Subiendo imagen..."
      type="upload"
      {...props}
    />
  ),
};