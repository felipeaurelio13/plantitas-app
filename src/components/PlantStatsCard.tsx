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

  // const getHealthTrend = () => {
  //   // Calculate real trend based on health analysis from plant images
  //   if (!plant.images || plant.images.length < 2) {
  //     return null; // No trend data available
  //   }

  //   const imagesWithHealth = plant.images
  //     .filter(img => img.healthAnalysis)
  //     .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  //   if (imagesWithHealth.length < 2) {
  //     return null;
  //   }

  //   // Compare the last two health analyses
  //   const latest = imagesWithHealth[imagesWithHealth.length - 1];
  //   const previous = imagesWithHealth[imagesWithHealth.length - 2];

  //   const latestScore = getHealthScore(latest.healthAnalysis?.overallHealth);
  //   const previousScore = getHealthScore(previous.healthAnalysis?.overallHealth);
    
  //   const change = Math.abs(latestScore - previousScore);
  //   const trend = latestScore > previousScore ? 'up' : latestScore < previousScore ? 'down' : 'stable';
    
  //   return { trend, change };
  // };

  // const getHealthScore = (health: string | undefined): number => {
  //   const healthMap = {
  //     'excellent': 95,
  //     'good': 80,
  //     'fair': 60,
  //     'poor': 30
  //   };
  //   return healthMap[health as keyof typeof healthMap] || plant.healthScore;
  // };

  // const healthTrend = getHealthTrend();

  const stats = [
    {
      icon: Heart,
      label: 'Salud General',
      value: `${plant.healthScore}%`,
      color: plant.healthScore >= 80 ? 'text-green-500' : 
             plant.healthScore >= 60 ? 'text-yellow-500' : 'text-red-500',
      bgColor: plant.healthScore >= 80 ? 'bg-green-100 dark:bg-green-900' : 
               plant.healthScore >= 60 ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-red-100 dark:bg-red-900',
      trend: undefined,
      trendColor: undefined,
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
    <div className={`glass-enhanced rounded-2xl p-6 shadow-adaptive ${className}`}>
      <h3 className="text-lg font-semibold text-contrast-high mb-4">
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
              <div className={`w-8 h-8 rounded-lg bg-contrast-surface border border-contrast flex items-center justify-center`}>
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
              <p className="text-xs text-contrast-soft">
                {stat.label}
              </p>
              {stat.subtitle && (
                <p className="text-xs text-contrast-soft mt-1">
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