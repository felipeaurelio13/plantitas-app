import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, Flower, HeartPulse, 
  TrendingUp, Sparkles
} from 'lucide-react';
import { Plant } from '@/schemas';
import { cn } from '@/lib/utils';
import { PlantCharacteristics } from './PlantCharacteristics';
import { HealthAnalysisCard } from './HealthAnalysisCard';
import { DescriptionCard } from './DescriptionCard';
import { PlantEvolutionTracker } from './PlantEvolutionTracker';
import { Card } from '../ui/Card';

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
    // Eliminar sección 'Información General', agregar solo si hay funFacts
    ...(plant.funFacts && plant.funFacts.length > 0 ? [{
      id: 'funfacts',
      title: 'Datos Curiosos',
      icon: <Sparkles className="w-5 h-5" />, // Usa el icono de Sparkles
      component: (
        <DescriptionCard
          species={plant.species}
          funFacts={plant.funFacts}
        />
      ),
      priority: 4
    }] : [])
  ].filter(section => {
    // Only show health section if there's analysis
    if (section.id === 'health') return !!firstImageAnalysis;
    return true;
  }).sort((a, b) => a.priority - b.priority);

  return (
    <div className="flex flex-col gap-y-1">
      {sections.map((section) => {
        const isExpanded = expandedSection === section.id;
        const isHealthSection = section.id === 'health';
        const isCareSection = section.id === 'care';
        // Frame y header especial para Perfil de Cuidados
        if (isCareSection) {
          return (
            <Card
              key={section.id}
              variant="default"
              radius="default"
              className={
                cn(
                  'border border-[#E5E5E5] rounded-[8px] transition-all duration-200',
                  'bg-white',
                  'p-0 mb-4'
                )
              }
            >
              <motion.button
                onClick={() => setExpandedSection(isExpanded ? '' : section.id)}
                className={
                  cn(
                    'w-full flex items-center justify-between px-4 py-3 min-h-12 text-left focus:outline-none',
                    'bg-white',
                    'rounded-t-[8px]'
                  )
                }
                style={{ position: isExpanded ? 'sticky' : 'static', top: 0, zIndex: 2 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center min-w-0 flex-1">
                  <span className="flex items-center justify-center mr-2" style={{width:20,height:20}}>
                    {section.icon}
                  </span>
                  <span className="font-semibold text-[16px] truncate text-neutral-900 dark:text-neutral-100">
                    {section.title}
                  </span>
                </div>
                {/* Sin badge de estado aquí */}
                <motion.div
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex-shrink-0 ml-2 align-middle"
                  style={{display:'flex',alignItems:'center',marginRight:16,transition:'transform .2s'}}
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
                    <div className="px-4 pb-3 pt-1 max-h-[60vh] overflow-y-auto" style={{lineHeight:'1.4'}}>
                      {section.component}
                      <div style={{paddingBottom:8}} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        }
        return (
          <Card
            key={section.id}
            variant="default"
            radius="default"
            className={
              cn(
                'border border-[#E0E0E0] rounded-[8px] transition-all duration-200',
                isExpanded && isHealthSection ? 'bg-[#FAFAFA]' : 'bg-white',
                'p-0 mb-4'
              )
            }
          >
            <motion.button
              onClick={() => setExpandedSection(isExpanded ? '' : section.id)}
              className={
                cn(
                  'w-full flex items-center justify-between px-4 py-3 min-h-12 text-left focus:outline-none',
                  isExpanded && isHealthSection ? 'bg-[#FAFAFA]' : 'bg-white',
                  'rounded-t-[8px]'
                )
              }
              style={{ position: isExpanded ? 'sticky' : 'static', top: 0, zIndex: 2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center min-w-0 flex-1">
                <span className="flex items-center justify-center mr-2" style={{width:20,height:20}}>
                  {section.icon}
                </span>
                <span className="font-semibold text-[16px] truncate text-neutral-900 dark:text-neutral-100">
                  {section.title}
                </span>
              </div>
              {/* Badge solo para salud */}
              {isHealthSection && (
                <span className="ml-2 px-[6px] py-[2px] text-xs font-medium rounded-[4px] bg-[#E0F2E9] text-[#2A7F3E] align-middle" style={{lineHeight:'1.2'}}>
                  {section.badge}
                </span>
              )}
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
                className="flex-shrink-0 ml-2 align-middle"
                style={{display:'flex',alignItems:'center',marginRight:16}}
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
                  <div className="px-4 pb-3 pt-1 max-h-[60vh] overflow-y-auto" style={{lineHeight:'1.4'}}>
                    {section.component}
                    {/* Padding bottom extra al final */}
                    {isHealthSection && <div style={{paddingBottom:8}} />}
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