import React from 'react';
import { HealthAnalysis } from '../../schemas';

interface HealthAnalysisCardProps {
  analysis: HealthAnalysis;
}

const HealthAnalysisCard: React.FC<HealthAnalysisCardProps> = ({ analysis }) => {
  const issues = analysis.issues || [];
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="font-semibold mb-2">Análisis de Salud</h3>
      <div className="space-y-2">
        <p className="text-sm">
          Estado: <span className="font-medium">{analysis.overallHealth}</span>
        </p>
        <p className="text-sm">
          Puntuación: <span className="font-medium">{analysis.healthScore}%</span>
        </p>
        {issues.length > 0 && (
          <div>
            <p className="text-sm font-medium">Problemas detectados:</p>
            <ul className="text-xs text-gray-600 list-disc list-inside">
              {issues.map((issue, index) => (
                <li key={index}>{issue.description}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default HealthAnalysisCard;
