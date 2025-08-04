import React from 'react';
import { useNavigate } from 'react-router-dom';

const Camera: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      <h1 className="text-2xl font-bold mb-4">Cámara</h1>
      <p className="text-gray-600 text-center mb-6">
        Funcionalidad de cámara temporalmente deshabilitada
      </p>
      <button
        onClick={() => navigate('/dashboard')}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Volver al Dashboard
      </button>
    </div>
  );
};

export default Camera;
