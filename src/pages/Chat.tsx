import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';

const Chat: React.FC = () => {
  const { plantId } = useParams<{ plantId: string }>();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <button 
          onClick={() => navigate('/dashboard')}
          className="text-blue-500 hover:underline"
        >
          ← Volver
        </button>
        <h1 className="text-xl font-bold mt-2">Chat con Planta</h1>
      </div>
      
      <div className="flex-1 p-4 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Chat temporalmente deshabilitado
          </p>
          <p className="text-sm text-gray-500">
            Plant ID: {plantId}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Chat;
