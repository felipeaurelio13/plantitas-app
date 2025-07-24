import React from 'react';
import { ShieldCheck, Leaf } from 'lucide-react';
import { HealthAnalysis } from '@/schemas';

interface HealthAnalysisCardProps {
  analysis?: HealthAnalysis;
}

const getIssueIcon = () => (
  <Leaf className="w-5 h-5 text-[#EF9A9A]" aria-label="Problema de hoja seca" />
);

export const HealthAnalysisCard: React.FC<HealthAnalysisCardProps> = ({ analysis }) => {
  if (!analysis) {
    return null;
  }
  const hasIssues = analysis.issues && analysis.issues.length > 0;
  return (
    <div
      className="w-full"
      role="region"
      aria-label="Análisis de salud de la planta"
      style={{lineHeight:'1.4'}}
    >
      {!hasIssues ? (
        <div className="flex flex-col items-center justify-center text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <span className="text-4xl mb-2" role="img" aria-label="Planta saludable">🌱</span>
          <ShieldCheck className="w-12 h-12 text-green-500 mb-3" aria-label="Todo en orden" />
          <h4 className="font-semibold text-lg text-green-700 dark:text-green-300 flex items-center gap-2">¡Todo en orden!<span className="text-base" aria-hidden="true">🌱</span></h4>
          <p className="text-muted-foreground">El análisis inicial no detectó problemas de salud significativos.</p>
        </div>
      ) : (
        <div>
          <h4 className="font-semibold text-[16px] text-[#333] mt-3">Problemas Detectados</h4>
          <p className="mb-2 text-[14px] text-[#D32F2F] font-medium" style={{marginTop:12,marginBottom:8}}>
            {analysis.issues.length} problema{analysis.issues.length !== 1 ? 's' : ''} detectado{analysis.issues.length !== 1 ? 's' : ''}
          </p>
          <ul className="">
            {analysis.issues.map((issue, index) => (
              <li key={index} className="flex items-start" style={{marginBottom:index < analysis.issues.length-1?16:0,paddingBottom:index < analysis.issues.length-1?16:0,borderBottom:index < analysis.issues.length-1?'1px solid #EEE':'none'}}>
                <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center mt-1">
                  {getIssueIcon()}
                </div>
                <div className="ml-4">
                  <p className="font-semibold text-[15px] text-[#333]">{issue.type}</p>
                  <p className="text-[14px] text-[#555] mt-1">{issue.description}</p>
                </div>
              </li>
            ))}
          </ul>
          {/* Tratamientos Sugeridos */}
          <div className="mt-4">
            <h4 className="font-semibold text-[14px] text-[#333] mt-4 mb-2">Tratamientos Sugeridos</h4>
            <ul className="list-none pl-0 ml-3" style={{lineHeight:'1.5'}}>
              {analysis.issues.map((issue, index) => (
                <li key={index} className="flex items-start mb-1">
                  <span className="mr-2 text-[#2A7F3E] font-bold" style={{fontSize:18,lineHeight:'1'}}>&bull;</span>
                  <span className="text-[14px] text-[#444]">{issue.treatment}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {/* Recomendaciones Adicionales */}
      {analysis.recommendations && analysis.recommendations.length > 0 && (
        <div className="mt-4">
          <h4 className="font-semibold text-[14px] text-[#333] mt-4 mb-2">Recomendaciones Adicionales</h4>
          <ul className="list-none pl-0 ml-3" style={{lineHeight:'1.5'}}>
            {analysis.recommendations.map((rec, index) => (
              <li key={index} className="flex items-start mb-1">
                <span className="mr-2 text-[#2A7F3E] font-bold" style={{fontSize:18,lineHeight:'1'}}>&bull;</span>
                <span className="text-[14px] text-[#444]">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}; 