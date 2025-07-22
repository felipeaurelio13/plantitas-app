import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, Flower, HeartPulse, BookOpen, 
  TrendingUp
} from 'lucide-react';
import { Plant } from '@/schemas';
import { Card } from '../ui/Card';
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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['evolution']));
  
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

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

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
    <div className="space-y-4">
      {sections.map((section) => {
        const isExpanded = expandedSections.has(section.id);
        
        return (
          <Card key={section.id} variant="glass" className="overflow-hidden">
            <motion.button
              onClick={() => toggleSection(section.id)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors interactive-contrast"
              whileTap={{ scale: 0.995 }}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {section.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-contrast-high">
                    {section.title}
                  </h3>
                  {section.badge && (
                    <span className={cn(
                      "inline-block px-2 py-1 text-xs font-medium rounded-full mt-1",
                      getBadgeColor(section.id, section.badge)
                    )}>
                      {section.badge}
                    </span>
                  )}
                </div>
              </div>
              
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-5 h-5 text-contrast-soft" />
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
                  <div className="px-4 pb-4">
                    <div className="border-t border-contrast pt-4">
                      {section.component}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        );
      })}
    </div>
  );
}; 