import React from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, AlertTriangle, Droplets } from 'lucide-react';
import { cn } from '@/lib/utils';

type InsightType = 'tip' | 'warning' | 'info';

interface InsightCardProps {
  type: InsightType;
  title: string;
  message: string;
  className?: string;
}

const iconMap: Record<InsightType, React.ElementType> = {
  tip: Lightbulb,
  warning: AlertTriangle,
  info: Droplets,
};

const colorMap: Record<InsightType, { bg: string; text: string; icon: string }> = {
  tip: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-800 dark:text-blue-200',
    icon: 'text-blue-500',
  },
  warning: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-800 dark:text-yellow-200',
    icon: 'text-yellow-500',
  },
  info: {
    bg: 'bg-gray-50 dark:bg-gray-700/50',
    text: 'text-gray-800 dark:text-gray-200',
    icon: 'text-gray-500',
  },
};

export const InsightCard: React.FC<InsightCardProps> = ({ type, title, message, className }) => {
  const Icon = iconMap[type];
  const colors = colorMap[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn('p-4 rounded-lg flex items-start space-x-4', colors.bg, className)}
    >
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${colors.bg}`}>
        <Icon className={cn('h-5 w-5', colors.icon)} />
      </div>
      <div>
        <h4 className={`font-bold ${colors.text}`}>{title}</h4>
        <p className={`text-sm ${colors.text}/80`}>{message}</p>
      </div>
    </motion.div>
  );
}; 