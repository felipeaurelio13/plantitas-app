import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, Flower, HeartPulse, BookOpen, 
  TrendingUp
} from 'lucide-react';
import { Plant } from '@/schemas';
import { cn } from '@/lib/utils';
import { PlantCharacteristics } from './PlantCharacteristics';
import { HealthAnalysisCard } from './HealthAnalysisCard';
import { DescriptionCard } from './DescriptionCard';
import { PlantEvolutionTracker } from './PlantEvolutionTracker';

interface ExpandableInfoSectionProps {
  plant: Plant;
  onAddPhoto: () => void;
}

interface Section {
  id: string;
  title: string;
  icon: React.ReactNode;
  badge?: string;
  component: React.ReactNode;
  priority: number; // Lower number = higher priority
}

export const ExpandableInfoSection: React.FC<ExpandableInfoSectionProps> = ({ 
  plant, 
  onAddPhoto 
}) => {
  const [expandedSection, setExpandedSection] = useState<string>('evolution');
  
  const firstImageAnalysis = plant.images?.[0]?.healthAnalysis;
  const hasHealthIssues = firstImageAnalysis?.issues && firstImageAnalysis.issues.length > 0;
  const hasMultipleImages = plant.images && plant.images.length > 1;

  const sections: Section[] = [
    {
      id: 'evolution',
      title: 'Evolución y Progreso',
      icon: <TrendingUp className="w-5 h-5" />,
      badge: hasMultipleImages ? `${plant.images?.length || 0} fotos` : 'Nueva',
      component: (
        <PlantEvolutionTracker 
          plant={plant} 
          onAddPhoto={onAddPhoto}
        />
      ),
      priority: 1
    },
    {
      id: 'health',
      title: 'Análisis de Salud',
      icon: <HeartPulse className="w-5 h-5" />,
      badge: hasHealthIssues ? 'Atención' : 'Saludable',
      component: <HealthAnalysisCard analysis={firstImageAnalysis} />,
      priority: hasHealthIssues ? 1 : 3
    },
    {
      id: 'care',
      title: 'Perfil de Cuidados',
      icon: <Flower className="w-5 h-5" />,
      badge: plant.careProfile ? 'Completo' : 'Pendiente',
      component: <PlantCharacteristics plant={plant} />,
      priority: plant.careProfile ? 2 : 1
    },
    {
      id: 'description',
      title: 'Información General',
      icon: <BookOpen className="w-5 h-5" />,
      badge: plant.funFacts?.length ? `${plant.funFacts.length} datos` : undefined,
      component: (
        <DescriptionCard
          species={plant.species}
          description={plant.description}
          funFacts={plant.funFacts}
        />
      ),
      priority: 4
    }
  ].filter(section => {
    // Only show health section if there's analysis
    if (section.id === 'health') return !!firstImageAnalysis;
    return true;
  }).sort((a, b) => a.priority - b.priority);

  const getBadgeColor = (sectionId: string, badge?: string) => {
    if (sectionId === 'health' && badge === 'Atención') {
      return 'badge-error-contrast';
    }
    if (badge === 'Pendiente') {
      return 'badge-warning-contrast';
    }
    if (badge === 'Nueva') {
      return 'bg-blue-600 text-white font-semibold border border-blue-700 dark:bg-blue-500 dark:text-black dark:border-blue-600';
    }
    if (badge === 'Saludable' || badge === 'Completo') {
      return 'badge-success-contrast';
    }
    // Default for data counts and other neutral badges
    return 'badge-neutral-contrast';
  };

  return (
    <div className="flex flex-col gap-y-1">
      {sections.map((section) => {
        const isExpanded = expandedSection === section.id;
        return (
          <div key={section.id} className="rounded-xl bg-white/70 dark:bg-neutral-900/70 backdrop-blur-md transition-shadow duration-200">
            <motion.button
              onClick={() => setExpandedSection(isExpanded ? '' : section.id)}
              className="w-full flex items-center justify-between px-3 py-2 sm:px-4 sm:py-3 min-h-12 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 active:bg-primary-50 dark:active:bg-primary-900/20"
              style={{ position: isExpanded ? 'sticky' : 'static', top: 0, zIndex: 2, background: 'inherit' }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="p-1.5 rounded-lg bg-primary/10 text-primary flex-shrink-0 flex items-center justify-center">
                  {section.icon}
                </span>
                <span className="font-semibold text-lg truncate text-neutral-900 dark:text-neutral-100">
                  {section.title}
                </span>
                {section.badge && (
                  <span className={cn(
                    "ml-auto px-2 py-0.5 text-xs font-medium rounded-full",
                    getBadgeColor(section.id, section.badge)
                  )}>
                    {section.badge}
                  </span>
                )}
              </div>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0"
              >
                <ChevronDown className="w-6 h-6 text-neutral-600 dark:text-neutral-400" />
              </motion.div>
            </motion.button>
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 sm:px-4 sm:pb-4 max-h-[60vh] overflow-y-auto">
                    {section.component}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}; 