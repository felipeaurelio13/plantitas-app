import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { Sun, Sparkles, AlertTriangle, Droplets } from 'lucide-react';

interface HealthStatus {
  color: string;
  textColor: string;
  status: string;
  priority: 'low' | 'medium' | 'high';
}

interface PlantHealthIndicatorProps {
  score: number;
  healthStatus: HealthStatus;
  showDetailedStatus?: boolean;
  size?: 'small' | 'medium' | 'large';
  animated?: boolean;
}

const PlantHealthIndicator: React.FC<PlantHealthIndicatorProps> = memo(({
  score,
  healthStatus,
  showDetailedStatus = true,
  size = 'medium',
  animated = true,
}) => {
  const sizeConfig = {
    small: {
      barWidth: 'w-16',
      barHeight: 'h-1.5',
      textSize: 'text-xs',
      iconSize: 'w-3 h-3',
      gap: 'gap-1',
    },
    medium: {
      barWidth: 'w-24',
      barHeight: 'h-2',
      textSize: 'text-xs',
      iconSize: 'w-4 h-4',
      gap: 'gap-2',
    },
    large: {
      barWidth: 'w-32',
      barHeight: 'h-3',
      textSize: 'text-sm',
      iconSize: 'w-5 h-5',
      gap: 'gap-3',
    },
  };

  const config = sizeConfig[size];

  const getHealthIcon = () => {
    const iconClass = `${config.iconSize} mr-1`;
    
    if (score >= 80) {
      return <Sparkles className={`${iconClass} text-green-400`} />;
    }
    if (score >= 60) {
      return <Sun className={`${iconClass} text-yellow-400`} />;
    }
    if (score >= 40) {
      return <Droplets className={`${iconClass} text-orange-400`} />;
    }
    return <AlertTriangle className={`${iconClass} text-red-400`} />;
  };

  const progressBarComponent = (
    <div className={`flex items-center ${config.gap} w-full`}>
      {/* Progress bar */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <div className={`relative ${config.barWidth} ${config.barHeight} bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden`}>
          {animated ? (
            <motion.div
              className={`absolute top-0 left-0 h-full rounded-full ${healthStatus.color}`}
              initial={{ width: 0 }}
              animate={{ width: `${score}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          ) : (
            <div
              className={`absolute top-0 left-0 h-full rounded-full ${healthStatus.color}`}
              style={{ width: `${score}%` }}
            />
          )}
        </div>
        <span className={`${config.textSize} font-semibold text-neutral-500 dark:text-neutral-400`}>
          {score}%
        </span>
      </div>

      {/* Status indicator */}
      {showDetailedStatus && (
        <div className={`flex items-center ${config.gap.replace('gap-', 'gap-1')} ${config.textSize} px-2 py-0.5 rounded-full bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700`}>
          {getHealthIcon()}
          <span className={healthStatus.textColor}>
            {healthStatus.status}
          </span>
        </div>
      )}
    </div>
  );

  return progressBarComponent;
});

PlantHealthIndicator.displayName = 'PlantHealthIndicator';

export default PlantHealthIndicator;

// Hook for health status calculation (can be used independently)
export const useHealthStatus = (
  score: number,
  needsWatering?: boolean,
  daysSinceWatered?: number
) => {
  return React.useMemo(() => {
    // Base status from health score
    let baseStatus: { color: string; textColor: string; status: string; priority: 'low' | 'medium' | 'high' };

    if (score < 60) {
      baseStatus = {
        color: 'bg-red-300',
        textColor: 'text-red-600 dark:text-red-400',
        status: 'Atención',
        priority: 'high',
      };
    } else if (score < 80) {
      baseStatus = {
        color: 'bg-yellow-300',
        textColor: 'text-yellow-600 dark:text-yellow-400',
        status: 'Buena',
        priority: 'medium',
      };
    } else {
      baseStatus = {
        color: 'bg-green-400',
        textColor: 'text-green-600 dark:text-green-400',
        status: 'Excelente',
        priority: 'low',
      };
    }

    // Adjust for watering needs
    if (needsWatering) {
      if (daysSinceWatered && daysSinceWatered > 7) {
        return {
          ...baseStatus,
          color: 'bg-red-400',
          textColor: 'text-red-700 dark:text-red-300',
          status: 'Necesita agua urgente',
          priority: 'high',
        };
      } else if (daysSinceWatered && daysSinceWatered > 3) {
        return {
          ...baseStatus,
          color: 'bg-orange-400',
          textColor: 'text-orange-700 dark:text-orange-300',
          status: 'Necesita agua',
          priority: 'medium',
        };
      }
    }

    return baseStatus;
  }, [score, needsWatering, daysSinceWatered]);
};