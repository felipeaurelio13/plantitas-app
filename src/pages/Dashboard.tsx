import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Plus, Wind, Leaf, Droplets } from 'lucide-react';

import { usePlantsQuery } from '@/hooks/usePlantsQuery'; // Import the new hook
import { PlantSummary } from '@/schemas';

import PlantCard from '@/components/PlantCard';
import PlantCardSkeleton from '@/components/PlantCardSkeleton';
import AddPlantMenu from '@/components/AddPlantMenu';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/skeleton';

type SortByType = 'name' | 'health' | 'lastWatered';

const EmptyState: React.FC = () => {
  const navigate = useNavigate();
  return (
    <motion.div 
      className="flex flex-col items-center justify-center text-center py-16 px-6"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <motion.div 
        className="relative w-24 h-24 mb-6"
        initial={{ rotate: -15 }}
        animate={{ rotate: [15, -10, 10, -5, 5, 0] }}
        transition={{ duration: 1, ease: 'easeInOut' }}
      >
        <Wind className="absolute top-0 left-0 w-8 h-8 text-sky-400 opacity-60" />
        <Leaf className="w-24 h-24 text-green-500" />
        <Droplets className="absolute bottom-0 right-0 w-10 h-10 text-blue-400 opacity-70" />
      </motion.div>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Tu jardín está vacío</h2>
      <p className="text-gray-600 dark:text-gray-400 max-w-sm mb-6">
        Añade tu primera planta para empezar a monitorizar su salud y cuidados.
      </p>
      <Button size="lg" onClick={() => navigate('/camera')}>
        <Plus className="mr-2" />
        Añadir Planta
      </Button>
    </motion.div>
  );
};

const Dashboard: React.FC = () => {
  const { data: plants = [], isLoading, error: plantError } = usePlantsQuery(); // Use the new hook
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortByType>('name');

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
            <p className="text-gray-600 dark:text-gray-400">Buscando tus plantas...</p>
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
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl text-red-500 text-center">
          <p>Ocurrió un error al cargar tus plantas:</p>
          <p className="text-sm mt-2">{plantError.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
        <header className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold text-contrast-high">Mi Jardín</h1>
                <p className="text-contrast-medium">{plants.length} {plants.length === 1 ? 'planta' : 'plantas'} en tu colección</p>
            </div>
            <AddPlantMenu />
        </header>

        <div className="flex flex-col sm:flex-row gap-4">
            <Input
                type="text"
                placeholder="Buscar por nombre o especie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-grow"
            />
            <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortByType)}
                className="bg-contrast-surface border border-contrast rounded-lg px-4 py-2 h-10 text-contrast-medium focus-contrast"
            >
                <option value="name">Ordenar por Nombre</option>
                <option value="health">Ordenar por Salud</option>
                <option value="lastWatered">Ordenar por Riego</option>
            </select>
        </div>

        <AnimatePresence>
            {filteredAndSortedPlants.length > 0 ? (
                <motion.div
                    className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
                    initial="hidden"
                    animate="visible"
                    variants={{
                        visible: {
                            transition: {
                                staggerChildren: 0.05,
                            },
                        },
                    }}
                >
                    {filteredAndSortedPlants.map((plant: PlantSummary, index: number) => (
                        <PlantCard key={plant.id} plant={plant} index={index} />
                    ))}
                </motion.div>
            ) : (
                <EmptyState />
            )}
        </AnimatePresence>
    </div>
  );
};

export default Dashboard;