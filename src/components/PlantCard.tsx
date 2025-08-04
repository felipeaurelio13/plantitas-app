import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Droplets, Sun, Sparkles, AlertTriangle } from 'lucide-react';
import { PlantSummary } from '../schemas';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import LazyImage from './LazyImage';
import PlantHealthIndicator from './PlantCard/PlantHealthIndicator';
import { 
  usePlantCardLogic, 
  getPlantCardImageProps, 
  getPlantCardAnimationProps 
} from '../hooks/usePlantCardLogic';

interface PlantCardProps {
  plant: PlantSummary;
  index: number;
}

// PlantHealthIndicator moved to separate file

const PlantCard: React.FC<PlantCardProps> = memo(({ plant, index }) => {
  // Use custom hook for logic
  const { state, actions } = usePlantCardLogic(plant, index);
  const { needsWatering, isFavorite, healthStatus } = state;
  const { handleClick, handleMouseEnter } = actions;

  // Get image and animation props
  const imageProps = getPlantCardImageProps(plant);
  const animationProps = getPlantCardAnimationProps(index);

  return (
    <motion.div
      {...animationProps}
      className="group"
    >
      <Card
        variant="glass"
        size="sm"
        radius="lg"
        interactive
        hover
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        className="overflow-hidden border border-green-200/60 hover:border-green-300/80 dark:hover:border-green-600 transition-all duration-300 p-4 mb-4 shadow-sm hover:shadow-lg hover:shadow-green-100/30 bg-white/80 backdrop-blur-sm"
      >
        {/* Header con imagen y nombre */}
        <CardHeader className="pb-2 flex-shrink-0 space-y-0">
          <div className="flex items-start gap-4">
            {/* Imagen */}
            <div className="relative w-20 h-20 rounded-[8px] overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950 dark:to-primary-900 flex-shrink-0 border border-primary-200 dark:border-primary-800">
              <LazyImage
                {...imageProps}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                priority={index < 4}
                sizes="(max-width: 768px) 20vw, 10vw"
                fallback={
                  <div className="w-full h-full flex items-center justify-center text-primary-400 dark:text-primary-600">
                    <Sun size={24} />
                  </div>
                }
              />
              
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
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <CardTitle
                className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 truncate mb-0 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
                title={plant.nickname || plant.name}
              >
                {plant.nickname || plant.name}
              </CardTitle>
              <p className="text-xs text-[#555] truncate mb-[6px]" title={plant.species}>
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
        {/* Health Indicator */}
        <CardContent className="pt-2 pb-0">
          <PlantHealthIndicator
            score={plant.healthScore}
            healthStatus={healthStatus}
            size="medium"
            animated={true}
          />
          {/* Badge de alerta si salud < 40 igual que antes */}
          {plant.healthScore < 40 && (
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2 py-0.5 bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-300 rounded-full text-xs font-semibold">
                <AlertTriangle className="w-3 h-3 mr-1" aria-label="Atención" />¡Atención!
              </span>
              <span className="text-xs text-error-600 dark:text-error-300">Salud muy baja</span>
            </div>
          )}
        </CardContent>
        {/* Overlay igual que antes */}
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