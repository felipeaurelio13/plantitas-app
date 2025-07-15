import React from 'react';
import { Leaf, Droplets, Sun, Thermometer } from 'lucide-react';
import { Plant } from '@/schemas';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import differenceInDays from 'date-fns/differenceInDays';
import { es } from 'date-fns/locale';

interface PlantStatsCardProps {
  plant: Plant;
}

export const PlantStatsCard: React.FC<PlantStatsCardProps> = ({ plant }) => {
  const lastWateredDays = plant.lastWatered
    ? differenceInDays(new Date(), new Date(plant.lastWatered))
    : null;

  const getWateringStatus = () => {
    if (lastWateredDays === null) return { text: 'Nunca regada', color: 'text-muted-foreground' };
    if (lastWateredDays <= 2) return { text: 'Regada recientemente', color: 'text-green-500' };
    if (plant.careProfile?.wateringFrequency && lastWateredDays <= plant.careProfile.wateringFrequency) {
      return { text: 'Hidratación óptima', color: 'text-blue-500' };
    }
    return { text: `Necesita riego (hace ${lastWateredDays} días)`, color: 'text-yellow-500' };
  };

  const wateringStatus = getWateringStatus();

  return (
    <div className="bg-background p-6 rounded-lg shadow-lg w-full">
      <h3 className="text-2xl font-bold text-foreground mb-6">Estadísticas y Cuidados</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card de Salud */}
        <div className="bg-muted/50 p-4 rounded-lg flex items-start space-x-4">
          <div className="bg-green-100 dark:bg-green-900/50 p-3 rounded-full">
            <Leaf className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Salud General</p>
            <p className="text-lg font-semibold text-foreground">{plant.healthScore ?? 'N/A'}%</p>
          </div>
        </div>

        {/* Card de Riego */}
        <div className="bg-muted/50 p-4 rounded-lg flex items-start space-x-4">
          <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full">
            <Droplets className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Riego</p>
            <p className={`text-lg font-semibold ${wateringStatus.color}`}>{wateringStatus.text}</p>
            {plant.lastWatered && (
              <p className="text-xs text-muted-foreground">
                Última vez: {formatDistanceToNow(new Date(plant.lastWatered), { addSuffix: true, locale: es })}
              </p>
            )}
          </div>
        </div>

        {/* Card de Luz */}
        {plant.careProfile?.sunlightRequirement && (
          <div className="bg-muted/50 p-4 rounded-lg flex items-start space-x-4">
            <div className="bg-yellow-100 dark:bg-yellow-900/50 p-3 rounded-full">
              <Sun className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Luz Solar</p>
              <p className="text-lg font-semibold text-foreground capitalize">
                {plant.careProfile.sunlightRequirement}
              </p>
            </div>
          </div>
        )}

        {/* Card de Temperatura */}
        {plant.careProfile?.temperatureRange && (
          <div className="bg-muted/50 p-4 rounded-lg flex items-start space-x-4">
            <div className="bg-red-100 dark:bg-red-900/50 p-3 rounded-full">
              <Thermometer className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Temperatura Ideal</p>
              <p className="text-lg font-semibold text-foreground">
                {plant.careProfile.temperatureRange.min}°C - {plant.careProfile.temperatureRange.max}°C
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};