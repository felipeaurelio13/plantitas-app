import React, { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Sun, Heart, Sparkles, AlertTriangle } from 'lucide-react';
import { PlantSummary } from '../schemas';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/Card';
import LazyImage from './LazyImage';
import { Button } from './ui/Button';
import UpdateHealthDiagnosisButton from './UpdateHealthDiagnosisButton';
import { cn } from '../lib/utils';
import { navigation } from '../lib/navigation';

interface PlantCardProps {
  plant: PlantSummary;
  index: number;
}

const PlantHealthIndicator: React.FC<{ score: number }> = memo(({ score }) => {
  const healthStatus = useMemo(() => {
    if (score >= 80) return { 
      color: 'bg-success-500', 
      textColor: 'text-success-600 dark:text-success-400',
      emoji: '🌱',
      status: 'Excelente'
    };
    if (score >= 60) return { 
      color: 'bg-warning-500', 
      textColor: 'text-warning-600 dark:text-warning-400',
      emoji: '🌿',
      status: 'Bien'
    };
    return { 
      color: 'bg-error-500', 
      textColor: 'text-error-600 dark:text-error-400',
      emoji: '🥺',
      status: 'Necesita cuidados'
    };
  }, [score]);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 flex-1">
        <div className="relative w-20 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
          <motion.div
            className={`absolute top-0 left-0 h-full rounded-full ${healthStatus.color}`}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }} // Reduced from 0.8
          />
          {/* Simplified sparkle effect - only show for excellent health */}
          {score >= 90 && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 3, repeat: Infinity }} // Slower, less resource intensive
            >
              <Sparkles size={8} className="text-white" />
            </motion.div>
          )}
        </div>
        <span className={cn("text-xs font-semibold", healthStatus.textColor)}>
          {score}%
        </span>
      </div>
      <div className="flex items-center gap-1 text-xs">
        <span>{healthStatus.emoji}</span>
        <span className={healthStatus.textColor}>{healthStatus.status}</span>
      </div>
    </div>
  );
});

PlantHealthIndicator.displayName = 'PlantHealthIndicator';

const PlantCard: React.FC<PlantCardProps> = memo(({ plant, index }) => {
  const navigate = useNavigate();
  
  // Memoize expensive calculations
  const { needsWatering, isFavorite, lastWateredText } = useMemo(() => {
    const needsWatering = plant.lastWatered && plant.wateringFrequency
      ? new Date().getTime() - new Date(plant.lastWatered).getTime() > plant.wateringFrequency * 24 * 60 * 60 * 1000
      : !plant.lastWatered;

    const isFavorite = plant.healthScore >= 80;

    const lastWateredText = plant.lastWatered 
      ? formatDistanceToNow(new Date(plant.lastWatered), { addSuffix: true, locale: es })
      : 'Sin registro de riego';

    return { needsWatering, isFavorite, lastWateredText };
  }, [plant.lastWatered, plant.wateringFrequency, plant.healthScore]);

  const handleCardClick = () => navigate(navigation.toPlantDetail(plant.id));
  const handleChatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(navigation.toPlantChat(plant.id));
  };

  // Reduced animation complexity and capped index
  const animationIndex = Math.min(index, 6); // Cap animation delay

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: animationIndex * 0.03, // Reduced from 0.1
        duration: 0.3, // Reduced from 0.5
        ease: 'easeOut' // Simplified from spring
      }}
      whileHover={{ y: -2 }} // Reduced from -4
      className="group"
    >
      <Card
        variant="glass"
        size="default"
        radius="lg"
        interactive
        hover
        onClick={handleCardClick}
        className="overflow-hidden border-2 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-200" // Reduced from 300ms
      >
        {/* Header con imagen y info básica */}
        <CardHeader className="content-spacing-sm pb-2 flex-shrink-0">
          <div className="flex items-start space-x-3 sm:space-x-4">
            {/* Imagen de la planta */}
            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950 dark:to-primary-900 flex-shrink-0 border border-primary-200 dark:border-primary-800">
              {plant.profileImageUrl ? (
                <LazyImage
                  src={plant.profileImageUrl}
                  alt={plant.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" // Reduced scale and duration
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary-400 dark:text-primary-600">
                  <Sun size={24} />
                </div>
              )}
              
              {/* Indicador de favorito - simplified animation */}
              <AnimatePresence>
                {isFavorite && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ duration: 0.2 }} // Reduced from default
                    className="absolute -top-1 -right-1 w-6 h-6 bg-error-500 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Heart size={12} className="text-white fill-current" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Alerta de riego - simplified animation */}
              <AnimatePresence>
                {needsWatering && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-warning-500 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }} // Slower pulse
                    >
                      <Droplets size={12} className="text-white" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Info de la planta */}
            <div className="flex-1 min-w-0">
              <CardTitle
                className="text-heading-4 text-neutral-900 dark:text-neutral-100 truncate mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
                title={plant.nickname || plant.name}
              >
                {plant.nickname || plant.name}
              </CardTitle>
              {/* Si hay nickname, muestra el nombre real debajo */}
              {plant.nickname && (
                <p className="text-xs text-neutral-500 dark:text-neutral-400 truncate mb-1" title={plant.name}>
                  {plant.name}
                </p>
              )}
              <p
                className="text-body-small text-neutral-600 dark:text-neutral-400 truncate mb-2"
                title={plant.species}
              >
                {plant.species}
              </p>
              <div className="flex items-center text-xs text-neutral-500 dark:text-neutral-500">
                <span className="px-2 py-1 bg-neutral-100 dark:bg-neutral-800 rounded-md">
                  📍 {plant.location}
                </span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        {/* Indicador de salud - Mejorado */}
        <CardContent className="content-spacing-sm flex-1">
          <div className="element-spacing-sm">
            <div className="mb-2">
              <PlantHealthIndicator score={plant.healthScore} />
            </div>
            {/* Badge de alerta si salud < 40 */}
            {plant.healthScore < 40 && (
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center px-2 py-0.5 bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300 rounded-full text-xs font-semibold">
                  <AlertTriangle className="w-3 h-3 mr-1" aria-label="Atención" />¡Atención!
                </span>
                <span className="text-xs text-error-600 dark:text-error-300">Salud muy baja</span>
              </div>
            )}
            {/* Información adicional de salud */}
            <div className="flex items-center justify-between text-caption text-neutral-500 dark:text-neutral-400 mt-2 mb-2">
              <span>Salud general</span>
              <span className="font-medium">
                {plant.healthScore >= 80 ? 'Excelente' : 
                 plant.healthScore >= 60 ? 'Buena' : 
                 plant.healthScore >= 40 ? 'Regular' : 'Necesita atención'}
              </span>
            </div>
          </div>
        </CardContent>

        {/* Footer con acciones - Mejorado */}
        <CardFooter className="content-spacing-sm bg-neutral-50/80 dark:bg-neutral-900/50 backdrop-blur-sm border-t border-neutral-200/50 dark:border-neutral-700/50 flex-shrink-0 mt-2">
          <div className="flex justify-between items-center w-full">
            {/* Info de último riego */}
            <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
              <Droplets size={12} className="text-primary-500" />
              <span>{lastWateredText}</span>
            </div>

            {/* Botones de acción */}
            <div className="flex items-center gap-2">
              <UpdateHealthDiagnosisButton
                plant={plant}
                variant="ghost"
                size="icon-sm"
                showLabel={false}
                className="opacity-70 hover:opacity-100 transition-opacity"
              />
              <Button
                size="sm"
                variant="ghost"
                onClick={handleChatClick}
                className="opacity-70 hover:opacity-100 transition-opacity"
                aria-label={`Chatear con ${plant.nickname || plant.name}`}
              >
                <MessageCircle size={16} />
              </Button>
            </div>
          </div>
        </CardFooter>

        {/* Simplified hover overlay effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" // Reduced duration
          initial={false}
        />
      </Card>
    </motion.div>
  );
});

PlantCard.displayName = 'PlantCard';

export default PlantCard;