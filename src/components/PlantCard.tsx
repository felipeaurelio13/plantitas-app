import React, { memo, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Heart, Sparkles, AlertTriangle, Droplets } from 'lucide-react';
import { PlantSummary } from '../schemas';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import LazyImage from './LazyImage';
import { navigation } from '../lib/navigation';
import plantService from '@/services/plantService'; // Import plantService

interface PlantCardProps {
  plant: PlantSummary;
  index: number;
}

const PlantHealthIndicator: React.FC<{ score: number }> = memo(({ score }) => {
  const healthStatus = useMemo(() => {
    if (score >= 80) return {
      color: 'bg-green-400', // color acento más suave
      textColor: 'text-green-600 dark:text-green-400',
      icon: <Sparkles className="w-4 h-4 mr-1 text-green-400" />, // icono minimalista
      status: 'Excelente'
    };
    if (score >= 60) return {
      color: 'bg-yellow-300',
      textColor: 'text-yellow-600 dark:text-yellow-400',
      icon: <Sun className="w-4 h-4 mr-1 text-yellow-400" />, // icono minimalista
      status: 'Buena'
    };
    return {
      color: 'bg-red-300',
      textColor: 'text-red-600 dark:text-red-400',
      icon: <AlertTriangle className="w-4 h-4 mr-1 text-red-400" />, // icono minimalista
      status: 'Atención'
    };
  }, [score]);

  return (
    <div className="flex items-center gap-3 w-full">
      {/* Barra de progreso alineada con etiqueta */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className="relative w-24 h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
          <motion.div
            className={`absolute top-0 left-0 h-full rounded-full ${healthStatus.color}`}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">{score}%</span>
      </div>
      {/* Etiqueta de estado */}
      <div className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
        {healthStatus.icon}
        <span className={healthStatus.textColor}>{healthStatus.status}</span>
      </div>
    </div>
  );
});

PlantHealthIndicator.displayName = 'PlantHealthIndicator';

const PlantCard: React.FC<PlantCardProps> = memo(({ plant, index }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Memoize expensive calculations
  const { needsWatering, isFavorite } = useMemo(() => {
    const needsWatering = plant.lastWatered && plant.wateringFrequency
      ? new Date().getTime() - new Date(plant.lastWatered).getTime() > plant.wateringFrequency * 24 * 60 * 60 * 1000
      : !plant.lastWatered;

    const isFavorite = plant.healthScore >= 80;

    return { needsWatering, isFavorite };
  }, [plant.lastWatered, plant.wateringFrequency, plant.healthScore]);

  // Prefetch plant detail on hover for instant navigation
  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: ['plant', plant.id],
      queryFn: async () => {
        // Use plantService to fetch plant data from Firebase
        const fetchedPlant = await plantService.getPlantById(plant.id);
        if (!fetchedPlant) {
          throw new Error('Error al pre-cargar la información de la planta.');
        }
        return fetchedPlant;
      },
      staleTime: 1000 * 60 * 5, // 5 minutos de cache para prefetch
    });
  };

  const handleCardClick = () => navigate(navigation.toPlantDetail(plant.id));

  // Optimized animation - reduced complexity and delays
  const animationIndex = Math.min(index, 4); // Reducido cap a 4
  const shouldAnimate = index < 8; // Solo animar los primeros 8 elementos

  return (
    <motion.div
      initial={shouldAnimate ? { opacity: 0, y: 10 } : { opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={shouldAnimate ? {
        delay: animationIndex * 0.02, // Reducido de 0.03 a 0.02
        duration: 0.2,                // Reducido de 0.3 a 0.2
        ease: 'easeOut'
      } : { duration: 0 }}
      whileHover={{ y: -1 }}          // Reducido de -2 a -1
      className="group"
    >
      <Card
        variant="glass"
        size="sm"
        radius="lg"
        interactive
        hover
        onClick={handleCardClick}
        onMouseEnter={handleMouseEnter}
        className="overflow-hidden border border-green-200/60 hover:border-green-300/80 dark:hover:border-green-600 transition-all duration-300 p-4 mb-4 shadow-sm hover:shadow-lg hover:shadow-green-100/30 bg-white/80 backdrop-blur-sm"
      >
        {/* Header con imagen y nombre */}
        <CardHeader className="pb-2 flex-shrink-0 space-y-0">
          <div className="flex items-start gap-4">
            {/* Imagen */}
            <div className="relative w-20 h-20 rounded-[8px] overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950 dark:to-primary-900 flex-shrink-0 border border-primary-200 dark:border-primary-800">
              {plant.profileImageUrl ? (
                <LazyImage
                  src={plant.profileImageUrl}
                  alt={plant.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  priority={index < 4} // Priority para las primeras 4 plantas visibles
                  sizes="(max-width: 768px) 20vw, 10vw" // Tamaño pequeño para thumbnails
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
        {/* Indicador de salud alineado con etiqueta */}
        <CardContent className="pt-2 pb-0">
          <div className="flex items-center gap-2 w-full">
            {/* Barra de salud */}
            <div className="relative w-24 h-[6px] bg-[#EEE] rounded-full overflow-hidden flex-shrink-0">
              <motion.div
                className={`absolute top-0 left-0 h-full rounded-full ${plant.healthScore >= 80 ? 'bg-green-400' : plant.healthScore >= 60 ? 'bg-yellow-300' : 'bg-red-300'}`}
                initial={{ width: 0 }}
                animate={{ width: `${plant.healthScore}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            {/* Porcentaje alineado al final */}
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 ml-1 min-w-[32px] text-right">{plant.healthScore}%</span>
            {/* Etiqueta de estado como tag */}
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ml-auto ${plant.healthScore >= 80 ? 'bg-green-500/10 text-green-700' : plant.healthScore >= 60 ? 'bg-yellow-400/10 text-yellow-700' : 'bg-red-400/10 text-red-700'}`}
              style={{ padding: '4px 8px' }}
            >
              {plant.healthScore >= 80 ? <Sparkles className="w-4 h-4 mr-1 text-green-400" /> : plant.healthScore >= 60 ? <Sun className="w-4 h-4 mr-1 text-yellow-400" /> : <AlertTriangle className="w-4 h-4 mr-1 text-red-400" />}
              <span>{plant.healthScore >= 80 ? 'Excelente' : plant.healthScore >= 60 ? 'Buena' : 'Atención'}</span>
            </span>
          </div>
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