import React from 'react';
import { motion } from 'framer-motion';
import { 
  Droplets, Sun, Thermometer, Calendar, MapPin, 
  AlertTriangle, CheckCircle, Info,
  Bot
} from 'lucide-react';
import { Plant } from '@/schemas';
import { Card } from '../ui/Card';
import { cn } from '@/lib/utils';

interface PlantOverviewCardProps {
  plant: Plant;
}

export const PlantOverviewCard: React.FC<PlantOverviewCardProps> = ({ plant }) => {
  const { careProfile, healthScore, lastWatered, dateAdded } = plant;
  const firstImageAnalysis = plant.images?.[0]?.healthAnalysis;
  
  // Calculate days since last watered
  const daysSinceWatered = lastWatered 
    ? Math.floor((Date.now() - new Date(lastWatered).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Calculate days since added
  const daysSinceAdded = Math.floor((Date.now() - new Date(dateAdded).getTime()) / (1000 * 60 * 60 * 24));

  // Get health status
  const getHealthStatus = () => {
    if (healthScore >= 85) return { text: 'Excelente', color: 'text-green-500', icon: CheckCircle, emoji: '🌟' };
    if (healthScore >= 70) return { text: 'Buena', color: 'text-green-400', icon: CheckCircle, emoji: '✅' };
    if (healthScore >= 50) return { text: 'Regular', color: 'text-yellow-500', icon: Info, emoji: '⚠️' };
    return { text: 'Necesita atención', color: 'text-red-500', icon: AlertTriangle, emoji: '🆘' };
  };

  const healthStatus = getHealthStatus();

  // Get watering status
  const getWateringStatus = () => {
    if (!daysSinceWatered || !careProfile?.wateringFrequency) {
      return { text: 'Sin datos', color: 'text-gray-500', urgent: false };
    }
    
    const needsWatering = daysSinceWatered >= careProfile.wateringFrequency;
    const overdue = daysSinceWatered > careProfile.wateringFrequency + 2;
    
    if (overdue) return { text: 'Riego urgente', color: 'text-red-500', urgent: true };
    if (needsWatering) return { text: 'Necesita riego', color: 'text-yellow-500', urgent: true };
    return { text: 'Bien hidratada', color: 'text-green-500', urgent: false };
  };

  const wateringStatus = getWateringStatus();

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Card variant="glass" className="content-spacing-sm element-spacing">
        {/* Descripción general de la planta */}
        {plant.description && (
          <div className="mb-4">
            <p className="text-base text-neutral-700 dark:text-neutral-200 leading-relaxed">
              {plant.description}
            </p>
          </div>
        )}
        {/* Tag verde de estado */}
        <motion.div variants={itemVariants} className="w-full mb-3">
          <div className="w-full flex items-center justify-between bg-green-100 dark:bg-green-900/30 rounded-lg px-4 py-2 mb-2">
            <span className="flex items-center gap-2 text-green-700 text-base font-bold">
              <CheckCircle className="w-5 h-5" />
              {healthScore}% {healthStatus.text}
            </span>
            <span className="flex items-center gap-1 text-contrast-soft text-sm align-baseline">
              <Calendar className="w-4 h-4" />
              Día {daysSinceAdded}
            </span>
          </div>
        </motion.div>
        {/* Key Care Info y Environment/Temperature en grid 2 columnas */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
          <div className={cn(
            "flex items-center space-x-3 p-3 rounded-lg",
            wateringStatus.urgent ? "bg-yellow-50 dark:bg-yellow-900/20" : "bg-green-50 dark:bg-green-900/20"
          )}>
            <Droplets className={cn("w-5 h-5", wateringStatus.color)} />
            <div>
              <p className="text-xs text-contrast-soft">Riego</p>
              <p className={cn("font-semibold text-sm", wateringStatus.color)}>
                {wateringStatus.text}
              </p>
              {daysSinceWatered !== null && (
                <p className="text-xs text-contrast-soft">
                  Hace {daysSinceWatered} día{daysSinceWatered !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20">
            <Sun className="w-5 h-5 text-blue-500" />
            <div>
              <p className="text-xs text-contrast-soft">Luz</p>
              <p className="font-semibold text-sm text-blue-600 dark:text-blue-400">
                {careProfile?.sunlightRequirement || 'No especificado'}
              </p>
              {plant.lightRequirements && (
                <p className="text-xs text-contrast-soft capitalize">
                  {plant.lightRequirements.replace('_', ' ')}
                </p>
              )}
            </div>
          </div>

          {plant.plantEnvironment && (
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-900/20">
              <MapPin className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-xs text-contrast-soft">Ambiente</p>
                <p className="font-semibold text-sm text-purple-600 dark:text-purple-400 capitalize">
                  {plant.plantEnvironment === 'ambos' ? 'Interior/Exterior' : plant.plantEnvironment}
                </p>
              </div>
            </div>
          )}

          {careProfile?.temperatureRange && (
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-orange-50 dark:bg-orange-900/20">
              <Thermometer className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs text-contrast-soft">Temperatura</p>
                <p className="font-semibold text-sm text-orange-600 dark:text-orange-400">
                  {careProfile.temperatureRange.min}°-{careProfile.temperatureRange.max}°C
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Health Issues Alert */}
        {firstImageAnalysis?.issues && firstImageAnalysis.issues.length > 0 && (
          <motion.div 
            variants={itemVariants} 
            className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
          >
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <p className="font-semibold text-red-700 dark:text-red-300 text-sm mb-1">
                  {firstImageAnalysis.issues.length} problema{firstImageAnalysis.issues.length !== 1 ? 's' : ''} detectado{firstImageAnalysis.issues.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-red-600 dark:text-red-400">
                  {firstImageAnalysis.issues[0].description}
                  {firstImageAnalysis.issues.length > 1 && ` y ${firstImageAnalysis.issues.length - 1} más...`}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        
        <br/>
        {/* Personality Hint */}
        {plant.personality?.communicationStyle && (
          <motion.div 
            variants={itemVariants}
            className="p-4 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 rounded-lg border border-green-200 dark:border-green-800"
          >
            <div className="flex items-start space-x-3">
              <Bot className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-semibold text-green-700 dark:text-green-300 text-sm mb-1">
                  🤖 Personalidad: {plant.personality.communicationStyle}
                </p>
                {plant.personality.catchphrases && plant.personality.catchphrases.length > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400 italic">
                    "{plant.personality.catchphrases[0]}"
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}; 