import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart } from 'lucide-react';
import { Plant } from '../../schemas';

interface ChatHeaderProps {
  plant: Plant;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ plant }) => {
  const navigate = useNavigate();

  const getPlantMood = () => {
    const healthFactor = plant.healthScore / 100;
    const lastWateredTime = plant.lastWatered ? new Date(plant.lastWatered).getTime() : 0;
    const careFactor = lastWateredTime
      ? Math.max(0, 1 - (Date.now() - lastWateredTime) / (plant.careProfile.wateringFrequency * 24 * 60 * 60 * 1000))
      : 0;
    
    const mood = (healthFactor * 0.6) + (careFactor * 0.4);
    
    if (mood > 0.8) return 'radiante';
    if (mood > 0.6) return 'feliz';
    if (mood > 0.4) return 'estable';
    return 'necesitada de atención';
  };

  return (
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-muted">
      <div className="flex items-center gap-2 p-4 pt-safe-top">
        <button
          onClick={() => navigate(`/plant/${plant.id}`)}
          className="btn btn-ghost btn-circle"
        >
          <ArrowLeft size={20} />
        </button>
        
        <div className="flex-1">
          <h1 className="font-bold text-foreground truncate">
            {plant.nickname || plant.name}
          </h1>
          <p className="text-xs text-muted-foreground capitalize">
            Se siente {getPlantMood()}
          </p>
        </div>
        
        <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
          <Heart className="w-4 h-4" />
          <span>{plant.healthScore}%</span>
        </div>
      </div>
    </header>
  );
};

export default ChatHeader; 