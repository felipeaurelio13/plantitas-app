import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, RefreshCcw, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import ConfirmDialog from './ui/ConfirmDialog';
import Toast from './ui/Toast';
import { healthDiagnosisService } from '@/services/healthDiagnosisService';
import useAuthStore from '../stores/useAuthStore';
import { usePlantDetail } from '@/hooks/usePlantDetail';
import { PlantSummary } from '../schemas';
import { motion } from 'framer-motion';
import { Activity, RefreshCw } from 'lucide-react';
import { usePlantMutations } from '../hooks/usePlantMutations';
import { useToast } from './ui/Toast';

interface UpdateHealthDiagnosisButtonProps {
  plant: PlantSummary;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg' | 'icon' | 'icon-sm';
  showLabel?: boolean;
  className?: string;
}

const UpdateHealthDiagnosisButton: React.FC<UpdateHealthDiagnosisButtonProps> = ({
  plant,
  variant = 'primary',
  size = 'sm',
  showLabel = true,
  className = ''
}) => {
  const { updatePlantHealthMutation, isUpdatingPlantHealth } = usePlantMutations();
  const user = useAuthStore((state) => state.user);
  const { addToast } = useToast();

  // Obtener los datos completos de la planta
  const { plant: fullPlantData } = usePlantDetail(plant.id);

  const handleUpdateDiagnosis = async () => {
    if (!user?.id) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'Debes estar logueado para actualizar el diagnóstico'
      });
      return;
    }

    if (!fullPlantData) {
      addToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los datos de la planta'
      });
      return;
    }

    console.log('🩺 [Button] Actualizando diagnóstico para:', plant.name);
    updatePlantHealthMutation({ 
      plant: fullPlantData, 
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
          <RefreshCw size={size.includes('icon') ? 16 : 14} />
        </motion.div>
      ) : (
        <Activity size={size.includes('icon') ? 16 : 14} />
      )}
      {showLabel && !size.includes('icon') && (
        <span className="ml-2 text-xs">
          {isUpdatingPlantHealth ? 'Analizando...' : 'Analizar'}
        </span>
      )}
    </>
  );

  const shouldRenderIconOnly = size.includes('icon');

  return (
    <Button
      onClick={handleUpdateDiagnosis}
      disabled={isUpdatingPlantHealth || !fullPlantData}
      size={size}
      variant={variant}
      className={className}
      aria-label={shouldRenderIconOnly ? `Actualizar diagnóstico de salud para ${plant.name}` : undefined}
      title={shouldRenderIconOnly ? `Actualizar diagnóstico de salud para ${plant.name}` : undefined}
    >
      {buttonContent}
    </Button>
  );
};

export default UpdateHealthDiagnosisButton; 