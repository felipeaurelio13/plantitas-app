import React from 'react';
import { PlantSummary } from '../schemas';
import { useNavigate } from 'react-router-dom';

interface PlantCardProps {
  plant: PlantSummary;
  index: number;
}

const PlantCard: React.FC<PlantCardProps> = ({ plant }) => {
  const navigate = useNavigate();

  const healthColor = plant.healthScore >= 80 ? 'text-green-600' : 
                     plant.healthScore >= 60 ? 'text-yellow-600' : 'text-red-600';

  return (
    <div 
      className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => navigate(`/plant/${plant.id}`)}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-lg">{plant.name}</h3>
        <span className={`text-sm font-medium ${healthColor}`}>
          {plant.healthScore}%
        </span>
      </div>
      
      <p className="text-gray-600 text-sm mb-2">{plant.species}</p>
      <p className="text-gray-500 text-xs">{plant.location}</p>
      
      {plant.imageCount > 0 && (
        <div className="mt-2 text-xs text-gray-400">
          {plant.imageCount} imagen{plant.imageCount !== 1 ? 'es' : ''}
        </div>
      )}
    </div>
  );
};

export default PlantCard;
