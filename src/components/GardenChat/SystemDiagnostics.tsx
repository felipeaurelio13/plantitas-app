import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, RefreshCw, Wrench } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { gardenChatService } from '../../services/gardenChatService';

interface SystemDiagnosticsProps {
  onClose: () => void;
}

interface FunctionStatus {
  name: string;
  available: boolean;
  error?: string;
  lastChecked?: Date;
}

export const SystemDiagnostics: React.FC<SystemDiagnosticsProps> = ({ onClose }) => {
  const [functions, setFunctions] = useState<FunctionStatus[]>([
    { name: 'garden-ai-chat', available: false }
  ]);
  const [isChecking, setIsChecking] = useState(false);

  const checkFunctions = async () => {
    setIsChecking(true);
    
    const updatedFunctions: FunctionStatus[] = [];
    
    // Check garden-ai-chat function
    const gardenChatStatus = await gardenChatService.verifyFunctionAvailability();
    updatedFunctions.push({
      name: 'garden-ai-chat',
      available: gardenChatStatus.available,
      error: gardenChatStatus.error,
      lastChecked: new Date(),
    });

    setFunctions(updatedFunctions);
    setIsChecking(false);
  };

  useEffect(() => {
    checkFunctions();
  }, []);

  const getStatusIcon = (func: FunctionStatus) => {
    if (func.available) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    return <AlertCircle className="w-5 h-5 text-red-500" />;
  };

  const getStatusText = (func: FunctionStatus) => {
    if (func.available) {
      return 'Disponible';
    }
    return 'No disponible';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md"
      >
        <Card className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Wrench className="w-6 h-6 text-blue-500" />
            <h3 className="text-lg font-semibold">Diagnóstico del Sistema</h3>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-3">
                Estado de Funciones Edge
              </h4>
              
              <div className="space-y-3">
                {functions.map((func) => (
                  <div
                    key={func.name}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(func)}
                      <div>
                        <p className="font-medium text-sm">{func.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {getStatusText(func)}
                        </p>
                      </div>
                    </div>
                    
                    {func.error && (
                      <div className="text-xs text-red-500 max-w-32 text-right">
                        {func.error.substring(0, 50)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {functions.some(f => !f.available) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800"
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      Servicios no disponibles
                    </p>
                    <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                      Algunos servicios del chat de jardín no están funcionando. 
                      Verifica que las funciones Edge estén desplegadas en Supabase.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex gap-3 pt-3">
              <Button
                onClick={checkFunctions}
                disabled={isChecking}
                variant="outline"
                size="sm"
                className="flex-1 gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
                Verificar Nuevamente
              </Button>
              
              <Button
                onClick={onClose}
                variant="default"
                size="sm"
                className="flex-1"
              >
                Cerrar
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}; 