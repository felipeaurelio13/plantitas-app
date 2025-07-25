import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Wind, Leaf, Droplets, MessageCircle } from 'lucide-react';

import { usePlantsQuery } from '@/hooks/usePlantsQuery'; // Import the new hook
import { PlantSummary } from '@/schemas';
import { navigation } from '@/lib/navigation';

import PlantCard from '@/components/PlantCard';
import PlantCardSkeleton from '@/components/PlantCardSkeleton';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/skeleton';
import { LoadingStates } from '@/components/ui/LoadingState';
import { Tooltip } from '@/components/ui/Tooltip';
import { ErrorMessages } from '@/components/ui/ErrorMessage';
import { OnboardingTour } from '@/components/Onboarding/OnboardingTour';
import { useOnboarding } from '@/hooks/useOnboarding';
import { AIFeatureHighlight, useAIHighlights } from '@/components/ai/AIFeatureHighlight';

type SortByType = 'name' | 'health' | 'lastWatered';

const EmptyState: React.FC = () => {
  const navigate = useNavigate();
  return (
    <motion.div 
      className="flex flex-col items-center justify-center text-center py-16 px-6 max-w-lg mx-auto"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <motion.div 
        className="relative w-32 h-32 mb-8"
        initial={{ rotate: -15 }}
        animate={{ rotate: [15, -10, 10, -5, 5, 0] }}
        transition={{ duration: 1, ease: 'easeInOut' }}
      >
        <Wind className="absolute top-2 left-2 w-10 h-10 text-sky-400 opacity-60" />
        <Leaf className="w-32 h-32 text-green-500" />
        <Droplets className="absolute bottom-2 right-2 w-12 h-12 text-blue-400 opacity-70" />
      </motion.div>
      
      <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-3">
        ¡Comienza tu jardín digital!
      </h2>
      <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg leading-relaxed">
        Añade tu primera planta tomando una foto y deja que nuestra IA la identifique y te ayude a cuidarla.
      </p>
      
      {/* Features list */}
      <div className="mb-8 space-y-3 text-left">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
          <span>Identificación automática con IA</span>
        </div>
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
          <span>Recordatorios de riego personalizados</span>
        </div>
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
          <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
          <span>Chat con asistente experto en plantas</span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        <Button 
          size="lg" 
          onClick={() => navigate(navigation.toCamera())}
          className="flex-1"
        >
          <Plus className="mr-2" />
          Tomar Foto
        </Button>
        <Tooltip content="Explora las funciones de chat IA para aprender sobre plantas">
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => navigate(navigation.toGardenChat())}
            className="flex-1"
          >
            <MessageCircle className="mr-2" />
            Explorar Chat IA
          </Button>
        </Tooltip>
      </div>

      {/* Help text */}
      <p className="text-sm text-gray-500 dark:text-gray-500 mt-6">
        💡 Tip: Toma fotos con buena iluminación para mejores resultados
      </p>
    </motion.div>
  );
};

const Dashboard: React.FC = () => {
  const { data: plants = [], isLoading, error: plantError } = usePlantsQuery(); // Use the new hook
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortByType>('name');
  const { shouldShowTour, completeTour, getTourSteps } = useOnboarding();
  const { shouldShowHighlight, dismissHighlight } = useAIHighlights();

  const filteredAndSortedPlants = useMemo(() => {
    return [...plants]
      .filter((plant: PlantSummary) =>
        plant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plant.species.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a: PlantSummary, b: PlantSummary) => {
        switch (sortBy) {
          case 'health':
            return (b.healthScore || 0) - (a.healthScore || 0);
          case 'lastWatered':
            return (b.lastWatered?.getTime() || 0) - (a.lastWatered?.getTime() || 0);
          default:
            return a.name.localeCompare(b.name);
        }
      });
  }, [plants, searchQuery, sortBy]);

  if (isLoading) { // Simplified loading state
    return (
      <div className="p-4 sm:p-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">Mi Jardín</h1>
            <LoadingStates.LoadingPlants size="sm" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, index) => (
            <PlantCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (plantError) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] p-4">
        <ErrorMessages.LoadingPlantsError 
          onRetry={() => window.location.reload()}
          className="max-w-md"
        />
      </div>
    );
  }

  return (
    <div className="container-spacing element-spacing bg-white" style={{ paddingBottom: 'calc(88px + env(safe-area-inset-bottom))' }}>
        <header className="flex items-center justify-between border-b-2 border-[#E0F2E9] bg-white pb-2 mb-4">
            <div className="flex items-center gap-3">
                {/* Icono hoja minimal */}
                <Tooltip content="Tu jardín personal de plantas">
                  <Leaf size={20} strokeWidth={2} className="text-[#2A7F3E] flex-shrink-0" />
                </Tooltip>
                <h1 className="font-semibold text-[28px] leading-[1.2] text-[#222]">Mi Jardín</h1>
                {/* Contador como pill */}
                <Tooltip content={`Tienes ${plants.length} ${plants.length === 1 ? 'planta registrada' : 'plantas registradas'} en tu jardín`}>
                  <span className="ml-2 bg-[#E0F2E9]/50 text-[#2A7F3E] text-sm font-medium rounded-full px-[6px] py-[2px] cursor-help">
                    {plants.length} {plants.length === 1 ? 'planta' : 'plantas'}
                  </span>
                </Tooltip>
            </div>
        </header>

        {/* AI Feature Highlights */}
        {plants.length > 0 && shouldShowHighlight('dashboard-ai-welcome') && (
          <div className="mb-4">
            <AIFeatureHighlight
              type="welcome"
              title="¡Tu asistente IA está disponible!"
              message="Haz preguntas sobre el cuidado de tus plantas, identifica problemas o descubre nuevos consejos."
              onDismiss={() => dismissHighlight('dashboard-ai-welcome')}
              autoHide
              duration={10000}
            />
          </div>
        )}

        {plants.length >= 3 && shouldShowHighlight('dashboard-ai-tips') && (
          <div className="mb-4">
            <AIFeatureHighlight
              type="tip"
              title="Consejo del jardinero experto"
              message="Con varias plantas, puedes preguntarme sobre rutinas de cuidado personalizadas para optimizar tu tiempo."
              onDismiss={() => dismissHighlight('dashboard-ai-tips')}
              autoHide
              duration={12000}
            />
          </div>
        )}

        {/* Buscador y orden: centrados y con margen superior */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6 mb-6">
            <Input
                type="text"
                placeholder="Buscar por nombre o especie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="max-w-md w-full mx-auto"
                data-tour="search-input"
            />
            <div className="relative w-full max-w-xs">
              <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortByType)}
                  className="appearance-none bg-white border border-green-300 rounded-[8px] px-4 py-2 h-10 text-green-700 font-medium shadow-sm focus:ring-2 focus:ring-green-400 focus:border-green-400 transition-colors duration-150 w-full pr-8"
                  style={{ borderWidth: '1px' }}
              >
                  <option value="name">Ordenar por Nombre</option>
                  <option value="health">Ordenar por Salud</option>
                  <option value="lastWatered">Ordenar por Riego</option>
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-green-400 text-base">
                ▼
              </span>
            </div>
        </div>

        <AnimatePresence>
            {filteredAndSortedPlants.length > 0 ? (
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 element-spacing"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        visible: {
                            transition: {
                                staggerChildren: 0.01, // Reducido aún más para mejor rendimiento
                                delayChildren: 0,       // Sin delay inicial
                            },
                        },
                    }}
                >
                    {filteredAndSortedPlants.map((plant: PlantSummary, index: number) => (
                        <PlantCard key={plant.id} plant={plant} index={Math.min(index, 8)} />
                    ))}
                </motion.div>
            ) : (
                <EmptyState />
            )}
        </AnimatePresence>

        {/* Onboarding Tour */}
        <OnboardingTour
          isOpen={shouldShowTour() && plants.length === 0}
          onComplete={completeTour}
          onSkip={completeTour}
          steps={getTourSteps()}
        />
    </div>
  );
};

export default Dashboard;