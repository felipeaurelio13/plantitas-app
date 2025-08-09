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
    <div className="min-h-screen bg-gradient-to-br from-green-50/20 via-background to-primary-50/10 pb-safe-bottom">
      {/* Header optimizado mobile-first */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-lg border-b border-border/50 shadow-sm">
        <div className="px-4 py-3 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Leaf size={22} strokeWidth={2.5} className="text-primary-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h1 className="font-bold text-2xl text-foreground truncate">Mi Jardín</h1>
                {plants.length > 0 && (
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-sm text-muted-foreground">
                      {plants.length} {plants.length === 1 ? 'planta' : 'plantas'}
                    </span>
                    {plants.some(p => p.healthScore < 40) && (
                      <span className="text-xs bg-warning-100 text-warning-700 px-2 py-0.5 rounded-full font-medium">
                        Necesita atención
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* AI Feature Highlights */}
        {plants.length > 0 && shouldShowHighlight('dashboard-ai-welcome') && (
          <AIFeatureHighlight
            type="welcome"
            title="¡Tu asistente IA está disponible!"
            message="Haz preguntas sobre el cuidado de tus plantas, identifica problemas o descubre nuevos consejos."
            onDismiss={() => dismissHighlight('dashboard-ai-welcome')}
            autoHide
            duration={10000}
          />
        )}

        {plants.length >= 3 && shouldShowHighlight('dashboard-ai-tips') && (
          <AIFeatureHighlight
            type="tip"
            title="Consejo del jardinero experto"
            message="Con varias plantas, puedes preguntarme sobre rutinas de cuidado personalizadas para optimizar tu tiempo."
            onDismiss={() => dismissHighlight('dashboard-ai-tips')}
            autoHide
            duration={12000}
          />
        )}

        {/* Controles de búsqueda y filtros mejorados */}
        {plants.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Buscar plantas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                  size="default"
                  variant="default"
                  data-tour="search-input"
                />
              </div>
              <div className="sm:w-48">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortByType)}
                  className="w-full h-12 px-4 bg-background border border-border rounded-xl text-foreground font-medium shadow-sm focus:ring-2 focus:ring-ring focus:border-ring transition-all duration-200 appearance-none cursor-pointer"
                >
                  <option value="name">Por Nombre</option>
                  <option value="health">Por Salud</option>
                  <option value="lastWatered">Por Riego</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Grid de plantas con mejor responsividad */}
        <AnimatePresence mode="wait">
          {filteredAndSortedPlants.length > 0 ? (
            <motion.div
              key="plants-grid"
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {filteredAndSortedPlants.map((plant: PlantSummary, index: number) => (
                <motion.div
                  key={plant.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ 
                    duration: 0.3,
                    delay: Math.min(index * 0.05, 0.3)
                  }}
                >
                  <PlantCard plant={plant} index={index} />
                </motion.div>
              ))}
            </motion.div>
          ) : plants.length === 0 ? (
            <motion.div
              key="empty-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
            >
              <EmptyState />
            </motion.div>
          ) : (
            <motion.div
              key="no-results"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-12"
            >
              <div className="text-muted-foreground">
                <p className="text-lg font-medium mb-2">No se encontraron plantas</p>
                <p className="text-sm">Intenta con otros términos de búsqueda</p>
              </div>
            </motion.div>
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
    </div>
  );
};

export default Dashboard;