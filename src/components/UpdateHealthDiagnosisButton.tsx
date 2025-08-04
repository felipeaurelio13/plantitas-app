import React from 'react';
import { PlantSummary } from '../schemas';

interface UpdateHealthDiagnosisButtonProps {
  plant: PlantSummary;
}

const UpdateHealthDiagnosisButton: React.FC<UpdateHealthDiagnosisButtonProps> = ({ plant }) => {
  return (
    <div className="text-sm text-gray-500">
      Diagnóstico de salud temporalmente deshabilitado
    </div>
  );
};

export default UpdateHealthDiagnosisButton;
