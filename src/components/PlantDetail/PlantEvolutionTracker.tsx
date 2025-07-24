import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  ImageIcon,
  Plus,
  ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { Plant, PlantImage } from '../../schemas';
import LazyImage from '../LazyImage';

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
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  
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
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };
  
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-success-500" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-error-500" />;
      default:
        return <BarChart3 className="w-4 h-4 text-warning-500" />;
    }
  };
  
  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-success-500 bg-success-50 border-success-200';
      case 'declining':
        return 'text-error-500 bg-error-50 border-error-200';
      default:
        return 'text-warning-500 bg-warning-50 border-warning-200';
    }
  };

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
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <CardTitle className="flex items-center min-w-0">
              <BarChart3 className="w-5 h-5 mr-2 text-primary shrink-0" />
              <span className="truncate">Evolución de tu Planta</span>
            </CardTitle>
            {/* Badge de tendencia global */}
            {evolutionPeriods.length > 1 && trend && trend.icon && trend.label && (
              <span
                className={`inline-flex items-center min-w-[90px] justify-center px-2 py-1 rounded-full text-xs font-medium border border-neutral-200 ${trend.color}`}
                aria-label={`Tendencia: ${trend.label}`}
              >
                <span className="mr-1" role="img" aria-label={trend.label}>{trend.icon}</span>
                {trend.label}
              </span>
            )}
          </div>
          <Button
            variant="primary"
            size="default"
            onClick={onAddPhoto}
            aria-label="Agregar nueva foto de evolución"
            className="gap-1 rounded-full px-5 shadow-lg hover:shadow-xl transition-all duration-300 active:scale-95 w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            Agregar Foto
          </Button>
        </div>
      </CardHeader>
      <CardContent className="mt-4 space-y-6">
        {/* Línea de tiempo */}
        <div className="space-y-4">
          <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
            Períodos de Evolución
          </h4>
          
          <div className="space-y-3">
            {evolutionPeriods.map((period, index) => (
              <motion.div
                key={period.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                  selectedPeriod === period.id 
                    ? 'border-primary-300 bg-primary-50 shadow-sm' 
                    : 'border-neutral-200 hover:border-neutral-300 hover:shadow-sm'
                }`}
                onClick={() => setSelectedPeriod(
                  selectedPeriod === period.id ? null : period.id
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg border ${getTrendColor(period.trend)}`}>
                      {getTrendIcon(period.trend)}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {formatDate(period.startDate)}
                        </span>
                        <ArrowRight className="w-3 h-3 text-muted-foreground" />
                        <span className="font-medium">
                          {formatDate(period.endDate)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          {period.photoCount} fotos
                        </span>
                        <span>
                          Salud promedio: {Math.max(0, Math.min(100, period.avgHealthScore)).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Miniatura de la última imagen del período */}
                  {period.images.length > 0 && (
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-neutral-200">
                      <LazyImage
                        src={period.images[period.images.length - 1].url}
                        alt={`Evolución ${formatDate(period.endDate)}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Detalles del período seleccionado */}
        <AnimatePresence>
          {selectedPeriod && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="border-t pt-6"
            >
              {(() => {
                const period = evolutionPeriods.find(p => p.id === selectedPeriod);
                if (!period) return null;
                
                return (
                  <div className="space-y-4">
                    
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {period.images.map((image, imgIndex) => (
                        <motion.div
                          key={image.id}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: imgIndex * 0.05 }}
                          className="aspect-square rounded-lg overflow-hidden border border-neutral-200 hover:border-primary-300 transition-colors cursor-pointer group"
                        >
                          <LazyImage
                            src={image.url}
                            alt={`Evolución ${formatDate(new Date(image.timestamp))}`}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}; 