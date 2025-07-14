import React, { useState, useMemo } from 'react';
import { usePlantStore } from '../stores';
import PlantCard from '../components/PlantCard';
import AddPlantMenu from '../components/AddPlantMenu';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Plus, Search, Wind, Leaf, Droplets } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

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
        <Leaf className="w-24 h-24 text-primary-400" />
        <Droplets className="absolute bottom-0 right-0 w-10 h-10 text-blue-400 opacity-70" />
      </motion.div>
      <h2 className="text-2xl font-bold text-text-primary mb-2">Tu jardín está vacío</h2>
      <p className="text-text-secondary max-w-sm mb-6">
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
  const plants = usePlantStore((state) => state.plants);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortByType>('name');

  const filteredAndSortedPlants = useMemo(() => {
    return plants
      .filter(plant =>
        (plant.nickname || plant.name).toLowerCase().includes(searchQuery.toLowerCase()) ||
        plant.species.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        switch (sortBy) {
          case 'health':
            return b.healthScore - a.healthScore;
          case 'lastWatered':
            const aTime = a.lastWatered ? new Date(a.lastWatered).getTime() : 0;
            const bTime = b.lastWatered ? new Date(b.lastWatered).getTime() : 0;
            return aTime - bTime;
          default:
            return (a.nickname || a.name).localeCompare(b.nickname || b.name);
        }
      });
  }, [plants, searchQuery, sortBy]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-text-primary">Mis Plantas</h1>
          <p className="text-text-secondary">{plants.length} en tu colección</p>
        </div>
        <AddPlantMenu />
      </header>

      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          type="text"
          placeholder="Buscar por nombre o especie..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          icon={<Search size={18} />}
          className="flex-grow"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortByType)}
          className="bg-surface border border-default rounded-lg px-4 py-2 h-10 text-text-primary focus-ring"
        >
          <option value="name">Ordenar por Nombre</option>
          <option value="health">Ordenar por Salud</option>
          <option value="lastWatered">Ordenar por Riego</option>
        </select>
      </div>

      <AnimatePresence>
        {filteredAndSortedPlants.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            animate="visible"
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
          >
            {filteredAndSortedPlants.map((plant, index) => (
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