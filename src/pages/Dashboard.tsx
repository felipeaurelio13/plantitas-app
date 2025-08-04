import React, { useState, useMemo } from 'react';
import { Plant } from '../schemas';
import { usePlantsQuery } from '../hooks/usePlantsQuery';
import PlantCard from '../components/PlantCard';

const Dashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const { data: plants = [], isLoading, error } = usePlantsQuery();

  // Convert Plant to PlantSummary format
  const plantSummaries = useMemo(() => {
    return plants.map((plant: Plant) => ({
      id: plant.id,
      name: plant.name,
      nickname: plant.nickname,
      species: plant.species,
      location: plant.location,
      plantEnvironment: plant.plantEnvironment,
      lightRequirements: plant.lightRequirements,
      healthScore: plant.healthScore,
      lastWatered: plant.lastWatered,
      dateAdded: plant.dateAdded,
      profileImageUrl: undefined,
      imageCount: plant.images?.length || 0,
      lastChatMessage: plant.chatMessages?.[plant.chatMessages?.length - 1]?.content,
      notificationCount: plant.notifications?.length || 0,
    }));
  }, [plants]);

  const filteredAndSortedPlants = useMemo(() => {
    return plantSummaries
      .filter((plant) =>
        plant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        plant.species.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        if (a.healthScore !== b.healthScore) {
          return b.healthScore - a.healthScore;
        }
        return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      });
  }, [plantSummaries, searchQuery]);

  if (isLoading) {
    return <div className="p-4">Cargando plantas...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">Error cargando plantas: {error.message}</div>;
  }

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Mi Jardín</h1>
            <input
              type="text"
              placeholder="Buscar plantas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-2 border rounded-lg"
            />
          </div>

          {filteredAndSortedPlants.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No se encontraron plantas</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedPlants.map((plant, index) => (
                <PlantCard key={plant.id} plant={plant} index={Math.min(index, 8)} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
