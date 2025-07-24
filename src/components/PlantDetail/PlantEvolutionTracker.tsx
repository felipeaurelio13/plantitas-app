import React, { useMemo } from 'react';
import { 
  Camera, 
  BarChart3,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Plant, PlantImage } from '../../schemas';
import { PlantHealthEvolutionChart } from './PlantHealthEvolutionChart';

interface PlantEvolutionTrackerProps {
  plant: Plant;
  onAddPhoto: () => void;
}

interface EvolutionPeriod {
  id: string;
  images: PlantImage[];
  startDate: Date;
  endDate: Date;
  avgHealthScore: number;
  trend: 'improving' | 'declining' | 'stable';
  photoCount: number;
}

export const PlantEvolutionTracker: React.FC<PlantEvolutionTrackerProps> = ({
  plant,
  onAddPhoto
}) => {
  
  // Agrupa las imágenes por períodos de tiempo (30 días)
  const evolutionPeriods = useMemo(() => {
    if (!plant.images || plant.images.length === 0) return [];
    
    const sortedImages = [...plant.images].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    
    const periods: EvolutionPeriod[] = [];
    const periodDuration = 30 * 24 * 60 * 60 * 1000; // 30 días en ms
    
    let currentPeriodStart = new Date(sortedImages[0].timestamp);
    let periodImages: PlantImage[] = [];
    
    sortedImages.forEach((image, index) => {
      const imageDate = new Date(image.timestamp);
      
      // Si la imagen está dentro del período actual, añádela
      if (imageDate.getTime() - currentPeriodStart.getTime() <= periodDuration) {
        periodImages.push(image);
      } else {
        // Crear período anterior y comenzar nuevo período
        if (periodImages.length > 0) {
          const healthScores = periodImages
            .map(img => {
              const analysis = img.healthAnalysis;
              if (!analysis) return undefined;
              // Usa el mismo mapeo que healthScore general
              const healthScoreMap = {
                'excellent': 95,
                'good': 80,
                'fair': 60,
                'poor': 30
              };
              if (analysis.overallHealth && healthScoreMap[analysis.overallHealth]) {
                return healthScoreMap[analysis.overallHealth];
              }
              if (typeof analysis.confidence === 'number') {
                // Si viene en 0-1, pásalo a 0-100
                return analysis.confidence <= 1 ? analysis.confidence * 100 : analysis.confidence;
              }
              return undefined;
            })
            .filter(score => score !== undefined) as number[];
          
          const avgHealth = healthScores.length > 0 
            ? healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length
            : 0;
          
          periods.push({
            id: `period-${periods.length}`,
            images: [...periodImages],
            startDate: new Date(periodImages[0].timestamp),
            endDate: new Date(periodImages[periodImages.length - 1].timestamp),
            avgHealthScore: avgHealth,
            trend: periods.length > 0 
              ? avgHealth > periods[periods.length - 1].avgHealthScore ? 'improving' : 'declining'
              : 'stable',
            photoCount: periodImages.length
          });
        }
        
        // Reiniciar para el nuevo período
        currentPeriodStart = imageDate;
        periodImages = [image];
      }
      
      // Último período
      if (index === sortedImages.length - 1 && periodImages.length > 0) {
        const healthScores = periodImages
          .map(img => {
            const analysis = img.healthAnalysis;
            if (!analysis) return undefined;
            // Usa el mismo mapeo que healthScore general
            const healthScoreMap = {
              'excellent': 95,
              'good': 80,
              'fair': 60,
              'poor': 30
            };
            if (analysis.overallHealth && healthScoreMap[analysis.overallHealth]) {
              return healthScoreMap[analysis.overallHealth];
            }
            if (typeof analysis.confidence === 'number') {
              // Si viene en 0-1, pásalo a 0-100
              return analysis.confidence <= 1 ? analysis.confidence * 100 : analysis.confidence;
            }
            return undefined;
          })
          .filter(score => score !== undefined) as number[];
        
        const avgHealth = healthScores.length > 0 
          ? healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length
          : 0;
        
        periods.push({
          id: `period-${periods.length}`,
          images: [...periodImages],
          startDate: new Date(periodImages[0].timestamp),
          endDate: new Date(periodImages[periodImages.length - 1].timestamp),
          avgHealthScore: avgHealth,
          trend: periods.length > 0 
            ? avgHealth > periods[periods.length - 1].avgHealthScore ? 'improving' : 'declining'
            : 'stable',
          photoCount: periodImages.length
        });
      }
    });
    
    return periods;
  }, [plant.images]);
  
  // Calcula la tendencia global de salud
  function getTrend(healthScores: number[]) {
    if (healthScores.length < 2) return null;
    const diff = healthScores[healthScores.length - 1] - healthScores[0];
    if (diff > 5) return { icon: '⬆️', label: 'Mejorando', color: 'text-green-600 bg-green-50' };
    if (diff < -5) return { icon: '⬇️', label: 'Declive', color: 'text-red-600 bg-red-50' };
    return { icon: '➡️', label: 'Estable', color: 'text-gray-600 bg-gray-50' };
  }

  if (evolutionPeriods.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-primary" />
            Evolución de tu Planta
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Camera className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">¡Comienza a documentar la evolución!</h3>
            <p className="text-muted-foreground mb-4">
              Agrega más fotos a lo largo del tiempo para ver cómo progresa tu planta.
            </p>
            <Button onClick={onAddPhoto} className="gap-2">
              <Plus className="w-4 h-4" />
              Agregar Primera Foto
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const healthScores = evolutionPeriods.map(p => p.avgHealthScore ?? 0);
  const trend = getTrend(healthScores);

  // Logs temporales para depuración
  if (import.meta.env.DEV) {
    console.log('[PlantEvolutionTracker] evolutionPeriods:', evolutionPeriods);
    console.log('[PlantEvolutionTracker] trend:', trend);
    if (trend) {
      console.log('[PlantEvolutionTracker] trend.icon:', trend.icon);
      console.log('[PlantEvolutionTracker] trend.label:', trend.label);
    }
  }

  return (
    <Card className="mt-6">
      <CardContent className="mt-4 space-y-6">
        {/* Gráfico y tabla de evolución de salud */}
        <PlantHealthEvolutionChart images={plant.images || []} />
      </CardContent>
    </Card>
  );
}; 