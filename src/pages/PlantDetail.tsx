import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePlantDetail } from '../hooks/usePlantDetail';

const PlantDetail: React.FC = () => {
  const { plantId } = useParams<{ plantId: string }>();
  const navigate = useNavigate();
  const { plant, isLoading } = usePlantDetail(plantId);

  if (isLoading) {
    return <div className="p-4">Cargando...</div>;
  }

  if (!plant) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600 mb-4">Planta no encontrada</p>
        <button
          onClick={() => navigate('/dashboard')}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Volver al Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <button 
        onClick={() => navigate('/dashboard')}
        className="text-blue-500 hover:underline mb-4"
      >
        ← Volver al Dashboard
      </button>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-2">{plant.name}</h1>
        <p className="text-gray-600 mb-4">{plant.species}</p>
        <p className="text-sm text-gray-500 mb-2">Ubicación: {plant.location}</p>
        <p className="text-sm">
          Salud: <span className="font-medium">{plant.healthScore}%</span>
        </p>
        
        <div className="mt-6 flex gap-2">
          <button
            onClick={() => navigate(`/chat/${plant.id}`)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Chat
          </button>
          <button
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            disabled
          >
            Galería (deshabilitada)
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlantDetail;
