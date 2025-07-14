import React from 'react';
import { motion } from 'framer-motion';
import { Droplets, Sun, Thermometer, Heart, Calendar, TrendingUp } from 'lucide-react';
import { Plant } from '../schemas';
import { formatDistanceToNow, differenceInDays } from 'date-fns';

interface PlantStatsCardProps {
  plant: Plant;
  className?: string;
}

const PlantStatsCard: React.FC<PlantStatsCardProps> = ({ plant, className = '' }) => {
  const daysSinceAdded = differenceInDays(new Date(), plant.dateAdded);
  const daysSinceWatered = plant.lastWatered 
    ? differenceInDays(new Date(), plant.lastWatered)
    : null;

  const getHealthTrend = () => {
    // In production, this would compare with historical data
    const trend = Math.random() > 0.5 ? 'up' : 'down';
    const change = Math.floor(Math.random() * 10) + 1;
    return { trend, change };
  };

  const { trend, change } = getHealthTrend();

  const stats = [
    {
      icon: Heart,
      label: 'Salud General',
      value: `${plant.healthScore}%`,
      color: plant.healthScore >= 80 ? 'text-green-500' : 
             plant.healthScore >= 60 ? 'text-yellow-500' : 'text-red-500',
      bgColor: plant.healthScore >= 80 ? 'bg-green-100 dark:bg-green-900' : 
               plant.healthScore >= 60 ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-red-100 dark:bg-red-900',
      trend: trend === 'up' ? `+${change}%` : `-${change}%`,
      trendColor: trend === 'up' ? 'text-green-500' : 'text-red-500',
    },
    {
      icon: Droplets,
      label: 'Último Riego',
      value: daysSinceWatered !== null ? `${daysSinceWatered} días` : 'Nunca',
      color: daysSinceWatered === null || daysSinceWatered > plant.careProfile.wateringFrequency 
        ? 'text-red-500' : 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      subtitle: `Cada ${plant.careProfile.wateringFrequency} días`,
    },
    {
      icon: Sun,
      label: 'Luz Requerida',
      value: plant.careProfile.sunlightRequirement === 'low' ? 'Baja' :
             plant.careProfile.sunlightRequirement === 'medium' ? 'Media' : 'Alta',
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900',
      subtitle: plant.location,
    },
    {
      icon: Thermometer,
      label: 'Temperatura',
      value: `${plant.careProfile.temperatureRange.min}°-${plant.careProfile.temperatureRange.max}°C`,
      color: 'text-orange-500',
      bgColor: 'bg-orange-100 dark:bg-orange-900',
      subtitle: 'Rango ideal',
    },
    {
      icon: Calendar,
      label: 'Días Contigo',
      value: daysSinceAdded.toString(),
      color: 'text-purple-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      subtitle: formatDistanceToNow(plant.dateAdded, { addSuffix: true }),
    },
    {
      icon: TrendingUp,
      label: 'Progreso',
      value: plant.images.length.toString(),
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900',
      subtitle: 'Fotos tomadas',
    },
  ];

  return (
    <div className={`glass-effect rounded-2xl p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Estadísticas de {plant.nickname || plant.name}
      </h3>
      
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`${stat.bgColor} rounded-xl p-4`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className={`w-8 h-8 rounded-lg bg-white dark:bg-gray-800 flex items-center justify-center`}>
                <stat.icon size={16} className={stat.color} />
              </div>
              {stat.trend && (
                <span className={`text-xs font-medium ${stat.trendColor}`}>
                  {stat.trend}
                </span>
              )}
            </div>
            
            <div>
              <p className={`text-lg font-bold ${stat.color}`}>
                {stat.value}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                {stat.label}
              </p>
              {stat.subtitle && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  {stat.subtitle}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default PlantStatsCard;