import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, Sprout, Activity, RefreshCw, Wrench } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SystemDiagnostics } from './SystemDiagnostics';
import { navigation } from '../../lib/navigation';

interface GardenChatHeaderProps {
  gardenSummary: {
    totalPlants: number;
    averageHealth: number;
    urgentActions: number;
    healthyPlants: number;
  } | null;
  onClearChat?: () => void;
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
}

const GardenChatHeader: React.FC<GardenChatHeaderProps> = ({ 
  gardenSummary, 
  onClearChat,
  onRefresh,
  isRefreshing = false
}) => {
  const navigate = useNavigate();
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthStatus = (score: number) => {
    if (score >= 80) return 'Excelente';
    if (score >= 60) return 'Buena';
    return 'Necesita atención';
  };

  return (
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm border-b border-muted">
      <div className="flex items-center gap-3 p-4 pt-safe-top">
        {/* Back button */}
        <button
          onClick={() => navigate(navigation.toDashboard())}
          className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          aria-label="Volver al dashboard"
        >
          <ArrowLeft size={20} />
        </button>

        {/* Chat info */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
              <Sprout className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h1 className="font-bold text-foreground">
                Asistente de Jardín
              </h1>
              {gardenSummary && (
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Activity size={12} />
                    {gardenSummary.totalPlants} plantas
                  </span>
                  <span className={`font-medium ${getHealthColor(gardenSummary.averageHealth)}`}>
                    {getHealthStatus(gardenSummary.averageHealth)}
                  </span>
                  {gardenSummary.urgentActions > 0 && (
                    <motion.span 
                      className="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {gardenSummary.urgentActions} acciones
                    </motion.span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1">
          {/* Diagnostics button */}
          <button
            onClick={() => setShowDiagnostics(true)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Diagnóstico del sistema"
          >
            <Wrench size={18} />
          </button>

          {/* Refresh button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-full hover:bg-muted transition-colors disabled:opacity-50"
              aria-label="Actualizar datos del jardín"
            >
              <motion.div
                animate={isRefreshing ? { rotate: 360 } : {}}
                transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
              >
                <RefreshCw size={18} />
              </motion.div>
            </button>
          )}

          {/* Menu button */}
          <button
            onClick={onClearChat}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Opciones del chat"
          >
            <MoreVertical size={20} />
          </button>
        </div>
      </div>

      {/* System Diagnostics Modal */}
      <AnimatePresence>
        {showDiagnostics && (
          <SystemDiagnostics onClose={() => setShowDiagnostics(false)} />
        )}
      </AnimatePresence>
    </header>
  );
};

export default GardenChatHeader; 