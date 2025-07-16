import React from 'react';
import { motion } from 'framer-motion';
import { Activity, RefreshCw } from 'lucide-react';
import { Button } from './ui/Button';
import { usePlantMutations } from '../hooks/usePlantMutations';
import { useAuthStore } from '../stores/useAuthStore';
import { usePlantDetail } from '../hooks/usePlantDetail';
import { Plant, PlantSummary } from '../schemas';
import { useToast } from './ui/Toast';

interface UpdateHealthDiagnosisButtonProps {
  plant: Plant | PlantSummary;
  variant?: 'default' | 'icon' | 'outline';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  showLabel?: boolean;
  className?: string;
}

const UpdateHealthDiagnosisButton: React.FC<UpdateHealthDiagnosisButtonProps> = ({
  plant,
  variant = 'outline',
  size = 'sm',
  showLabel = true,
  className = ''
}) => {
  const { updatePlantHealthMutation, isUpdatingPlantHealth } = usePlantMutations();
  const user = useAuthStore((state) => state.user);
  const { addToast } = useToast();

  // Si es un PlantSummary, usamos el hook para obtener los datos completos
  const isPlantSummary = !('images' in plant);
  const { plant: fullPlantData } = usePlantDetail(isPlantSummary ? plant.id : undefined);

  const handleUpdateDiagnosis = async () => {
    if (!user?.id) {
      addToast({
        type: 'error',
        title: 'Error de Autenticación',
        message: 'Debes estar conectado para actualizar el diagnóstico.'
      });
      return;
    }

    // Determinar qué planta usar
    let plantToAnalyze: Plant | undefined;
    
    if ('images' in plant) {
      // Es una Plant completa
      plantToAnalyze = plant;
    } else {
      // Es PlantSummary, usar datos del hook
      plantToAnalyze = fullPlantData;
    }

    if (!plantToAnalyze) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los datos de la planta.'
      });
      return;
    }

    if (!plantToAnalyze.images || plantToAnalyze.images.length === 0) {
      addToast({
        type: 'warning',
        title: 'Sin Imágenes',
        message: 'Esta planta necesita al menos una foto para analizar su salud.'
      });
      return;
    }

    console.log('🩺 [Button] Actualizando diagnóstico para:', plant.name);
    updatePlantHealthMutation({ 
      plant: plantToAnalyze, 
      userId: user.id 
    });
  };

  const buttonContent = (
    <>
      {isUpdatingPlantHealth ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <RefreshCw size={size === 'icon' ? 16 : 14} />
        </motion.div>
      ) : (
        <Activity size={size === 'icon' ? 16 : 14} />
      )}
      {showLabel && size !== 'icon' && (
        <span className="ml-2">
          {isUpdatingPlantHealth ? 'Analizando...' : 'Actualizar Diagnóstico'}
        </span>
      )}
    </>
  );

  if (variant === 'icon') {
    return (
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={handleUpdateDiagnosis}
        disabled={isUpdatingPlantHealth}
        className={`
          inline-flex items-center justify-center w-8 h-8 rounded-full
          bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400
          hover:bg-blue-200 dark:hover:bg-blue-900/50
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors ${className}
        `}
        title="Actualizar diagnóstico de salud con IA"
      >
        {isUpdatingPlantHealth ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <RefreshCw size={14} />
          </motion.div>
        ) : (
          <Activity size={14} />
        )}
      </motion.button>
    );
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleUpdateDiagnosis}
      disabled={isUpdatingPlantHealth}
      className={`${className} ${isUpdatingPlantHealth ? 'animate-pulse' : ''}`}
    >
      {buttonContent}
    </Button>
  );
};

export default UpdateHealthDiagnosisButton; 