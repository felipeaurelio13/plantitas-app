import React from 'react';
import { HeartPulse, AlertTriangle, Syringe, Sparkles, ShieldCheck } from 'lucide-react';
import { HealthAnalysis } from '@/schemas';

interface HealthAnalysisCardProps {
  analysis?: HealthAnalysis;
}

const getIssueIcon = (type: string) => {
  switch(type) {
    case 'pest': return <AlertTriangle className="text-red-500" />;
    case 'disease': return <Syringe className="text-orange-500" />;
    case 'overwatering':
    case 'underwatering':
    case 'light':
    case 'nutrient':
      return <AlertTriangle className="text-yellow-500" />;
    default: return <Sparkles className="text-blue-500" />;
  }
}

export const HealthAnalysisCard: React.FC<HealthAnalysisCardProps> = ({ analysis }) => {
  if (!analysis) {
    return null; // Don't render the card if there's no analysis
  }

  const hasIssues = analysis.issues && analysis.issues.length > 0;

  return (
    <div className="bg-background p-6 rounded-lg shadow-lg w-full">
      <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center">
        <HeartPulse className="mr-3 text-primary" />
        Análisis de Salud Inicial
      </h3>
      
      {!hasIssues ? (
         <div className="flex flex-col items-center justify-center text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <ShieldCheck className="w-12 h-12 text-green-500 mb-3" />
            <h4 className="font-semibold text-lg text-green-700 dark:text-green-300">¡Todo en orden!</h4>
            <p className="text-muted-foreground">El análisis inicial no detectó problemas de salud significativos.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h4 className="font-semibold text-lg mb-3">Problemas Detectados</h4>
            <ul className="space-y-4">
              {analysis.issues.map((issue, index) => (
                <li key={index} className="flex items-start p-4 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center">
                    {getIssueIcon(issue.type)}
                  </div>
                  <div className="ml-4">
                    <p className="font-semibold capitalize">{issue.type}</p>
                    <p className="text-sm text-muted-foreground">{issue.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-3">Tratamientos Sugeridos</h4>
             <ul className="space-y-3 list-disc list-inside text-muted-foreground">
                {analysis.issues.map((issue, index) => (
                    <li key={index}>{issue.treatment}</li>
                ))}
             </ul>
          </div>
        </div>
      )}

      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="mt-6">
            <h4 className="font-semibold text-lg mb-3">Recomendaciones Adicionales</h4>
            <ul className="space-y-3 list-disc list-inside text-muted-foreground">
                {analysis.recommendations.map((rec, index) => (
                    <li key={index}>{rec}</li>
                ))}
            </ul>
        </div>
      )}
    </div>
  );
}; 