import React from 'react';
import { useSettings } from '../hooks/useSettings';

const Settings: React.FC = () => {
  const { user, isExporting, exportData, deleteAccount, signOut } = useSettings();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Configuración</h1>
      
      <div className="space-y-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">Usuario</h2>
          <p className="text-gray-600">{user?.email}</p>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-4">Datos</h2>
          <button
            onClick={exportData}
            disabled={isExporting}
            className="mr-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {isExporting ? 'Exportando...' : 'Exportar Datos'}
          </button>
          <button
            onClick={deleteAccount}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Eliminar Cuenta
          </button>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <button
            onClick={signOut}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
