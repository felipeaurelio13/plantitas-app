import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Droplets, Sun, Heart, Sparkles } from 'lucide-react';
import { PlantSummary } from '../schemas';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/Card';
import LazyImage from './LazyImage';
import { Button } from './ui/Button';
import UpdateHealthDiagnosisButton from './UpdateHealthDiagnosisButton';
import { cn } from '../lib/utils';

interface PlantCardProps {
  plant: PlantSummary;
  index: number;
}

const PlantHealthIndicator: React.FC<{ score: number }> = ({ score }) => {
  const getHealthStatus = (score: number) => {
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
  };

  const healthStatus = getHealthStatus(score);

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 flex-1">
        <div className="relative w-20 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
          <motion.div
            className={`absolute top-0 left-0 h-full rounded-full ${healthStatus.color}`}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          />
          {/* Sparkle effect for excellent health */}
          {score >= 80 && (
            <motion.div
              className="absolute inset-0 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
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
};

const PlantCard: React.FC<PlantCardProps> = ({ plant, index }) => {
  const navigate = useNavigate();
  
  const needsWatering = plant.lastWatered && plant.wateringFrequency
    ? new Date().getTime() - new Date(plant.lastWatered).getTime() > plant.wateringFrequency * 24 * 60 * 60 * 1000
    : !plant.lastWatered;

  const handleCardClick = () => navigate(`/plant/${plant.id}`);
  const handleChatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/plant/${plant.id}/chat`);
  };

  // Determinar si es una planta "favorita" basado en health score alto
  const isFavorite = plant.healthScore >= 80;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        delay: index * 0.1, 
        duration: 0.5, 
        ease: [0.4, 0, 0.2, 1],
        type: 'spring',
        stiffness: 300,
        damping: 30
      }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <Card
        variant="glass"
        size="default"
        radius="lg"
        interactive
        hover
        onClick={handleCardClick}
        className="overflow-hidden border-2 hover:border-primary-300 dark:hover:border-primary-600 transition-all duration-300"
      >
        {/* Header con imagen y info básica */}
        <CardHeader className="p-4 pb-2">
          <div className="flex items-start space-x-4">
            {/* Imagen de la planta */}
            <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-950 dark:to-primary-900 flex-shrink-0 border border-primary-200 dark:border-primary-800">
              {plant.profileImageUrl ? (
                <LazyImage
                  src={plant.profileImageUrl}
                  alt={plant.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary-400 dark:text-primary-600">
                  <Sun size={24} />
                </div>
              )}
              
              {/* Indicador de favorito */}
              <AnimatePresence>
                {isFavorite && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-error-500 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <Heart size={12} className="text-white fill-current" />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Alerta de riego */}
              <AnimatePresence>
                {needsWatering && (
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-warning-500 rounded-full flex items-center justify-center shadow-lg"
                  >
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      <Droplets size={12} className="text-white" />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Info de la planta */}
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 truncate mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                {plant.nickname || plant.name}
              </CardTitle>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate mb-2">
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
        
        {/* Indicador de salud */}
        <CardContent className="px-4 pb-2">
          <PlantHealthIndicator score={plant.healthScore} />
        </CardContent>

        {/* Footer con acciones */}
        <CardFooter className="px-4 py-3 bg-neutral-50/80 dark:bg-neutral-900/50 backdrop-blur-sm border-t border-neutral-200/50 dark:border-neutral-700/50">
          <div className="flex justify-between items-center w-full">
            {/* Info de último riego */}
            <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400">
              {plant.lastWatered ? (
                <>
                  <Droplets size={12} className="text-primary-500" />
                  <span>
                    {formatDistanceToNow(new Date(plant.lastWatered), { addSuffix: true, locale: es })}
                  </span>
                </>
              ) : (
                <>
                  <Droplets size={12} className="text-neutral-400" />
                  <span>Sin registro de riego</span>
                </>
              )}
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

        {/* Hover overlay effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-t from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          initial={false}
        />
      </Card>
    </motion.div>
  );
};

export default PlantCard;