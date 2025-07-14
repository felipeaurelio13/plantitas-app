import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, Droplets, Sun, AlertTriangle } from 'lucide-react';
import { Plant } from '../schemas';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from './ui/Card';
import LazyImage from './LazyImage';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

interface PlantCardProps {
  plant: Plant;
  index: number;
}

const PlantHealthIndicator: React.FC<{ score: number }> = ({ score }) => {
  const healthStatus = 
    score >= 80 ? 'bg-green-500' :
    score >= 60 ? 'bg-yellow-500' :
    'bg-red-500';

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-16 h-1.5 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
        <motion.div
          className={`absolute top-0 left-0 h-full rounded-full ${healthStatus}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <span className="text-xs font-semibold text-text-secondary">{score}%</span>
    </div>
  );
};


const PlantCard: React.FC<PlantCardProps> = ({ plant, index }) => {
  const navigate = useNavigate();
  const profileImage = plant.images?.find(img => img.isProfileImage) || plant.images?.[0];
  
  const needsWatering = plant.lastWatered && plant.careProfile
    ? new Date().getTime() - new Date(plant.lastWatered).getTime() > plant.careProfile.wateringFrequency * 24 * 60 * 60 * 1000
    : true;

  const handleCardClick = () => navigate(`/plant/${plant.id}`);
  const handleChatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/chat/${plant.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
    >
      <Card
        variant="elevated"
        padding="none"
        interactive
        onClick={handleCardClick}
        className="overflow-hidden"
      >
        <div className="flex items-start p-4 space-x-4">
          <div className="w-20 h-20 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800 flex-shrink-0">
            {profileImage ? (
              <LazyImage
                src={profileImage.url}
                alt={plant.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-text-muted">
                <Sun size={32} />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <CardHeader className="p-0">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="truncate text-lg">
                    {plant.nickname || plant.name}
                  </CardTitle>
                  <p className="text-sm text-text-muted truncate">
                    {plant.species} • {plant.location}
                  </p>
                </div>
                {needsWatering && (
                  <div className="flex-shrink-0 ml-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 animate-pulse" />
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-0 mt-3">
              <PlantHealthIndicator score={plant.healthScore} />
            </CardContent>
          </div>
        </div>

        <CardFooter className="bg-neutral-50 dark:bg-neutral-800/50 p-2 border-t border-subtle">
          <div className="flex justify-between items-center w-full">
            <div className="flex items-center gap-1 text-xs text-text-muted">
              <Droplets size={12} />
              <span>
                {plant.lastWatered
                  ? `Regada ${formatDistanceToNow(new Date(plant.lastWatered), { addSuffix: true, locale: es })}`
                  : 'Sin regar'}
              </span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleChatClick}
              icon={<MessageCircle size={14} />}
            >
              Chatear
            </Button>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default PlantCard;