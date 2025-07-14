import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  MessageCircle, 
  Camera, 
  Droplets, 
  Sun, 
  Thermometer,
  AlertTriangle,
  Heart,
  Share2,
  MoreVertical,
  Edit3,
  Trash2
} from 'lucide-react';
import { usePlantStore, useAuthStore } from '../stores';
import { formatDistanceToNow, format } from 'date-fns';
import { es } from 'date-fns/locale';
import LazyImage from '../components/LazyImage';
import PlantProgressChart from '../components/PlantProgressChart';
import PlantStatsCard from '../components/PlantStatsCard';
import { notificationService } from '../services/notificationService';

const PlantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getPlantById, updatePlantAsync, deletePlantAsync } = usePlantStore();
  const user = useAuthStore((state) => state.user);
  const [activeTab, setActiveTab] = useState<'overview' | 'care' | 'history' | 'stats'>('overview');
  const [showActions, setShowActions] = useState(false);
  
  const plant = id ? getPlantById(id) : null;

  if (!plant) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-600 dark:text-gray-400">Planta no encontrada</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg"
        >
          Volver
        </button>
      </div>
    );
  }

  const profileImage = plant.images.find(img => img.isProfileImage) || plant.images[0];
  const needsWater = plant.lastWatered 
    ? Date.now() - plant.lastWatered.getTime() > plant.careProfile.wateringFrequency * 24 * 60 * 60 * 1000
    : true;

  const markAsWatered = async () => {
    const updatedPlant = {
      ...plant,
      lastWatered: new Date(),
    };
    
    if (user) {
      await updatePlantAsync(updatedPlant, user.id);
    }
    
    // Schedule next watering reminder
    await notificationService.scheduleWateringReminder(updatedPlant);
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(100);
    }
  };

  const sharePlant = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Mi ${plant.species}`,
          text: `¡Mira mi hermosa ${plant.species}! Tiene una salud del ${plant.healthScore}%.`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Enlace copiado al portapapeles');
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getHealthBg = (score: number) => {
    if (score >= 80) return 'bg-green-100 dark:bg-green-900';
    if (score >= 60) return 'bg-yellow-100 dark:bg-yellow-900';
    return 'bg-red-100 dark:bg-red-900';
  };

  const handleDeletePlant = async () => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar "${plant.nickname || plant.name}"? Esta acción no se puede deshacer.`)) {
      try {
        if (user) {
          await deletePlantAsync(plant.id, user.id);
        }
        navigate('/');
      } catch (error) {
        console.error('Error deleting plant:', error);
        alert('Error al eliminar la planta. Por favor, inténtalo de nuevo.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="relative">
        <div className="h-80 overflow-hidden">
          {profileImage ? (
            <LazyImage
              src={profileImage.url}
              alt={plant.name}
              className="w-full h-full"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <Sun className="w-16 h-16 text-white" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
        
        <div className="absolute top-0 left-0 right-0 p-4 safe-area-top">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white ios-button"
            >
              <ArrowLeft size={20} />
            </button>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={sharePlant}
                className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white ios-button"
              >
                <Share2 size={20} />
              </button>
              <Link
                to={`/chat/${plant.id}`}
                className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white ios-button"
              >
                <MessageCircle size={20} />
              </Link>
              <button 
                onClick={() => setShowActions(!showActions)}
                className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white ios-button"
              >
                <MoreVertical size={20} />
              </button>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-2xl font-bold text-white mb-1">
            {plant.nickname || plant.name}
          </h1>
          <p className="text-white/80">
            {plant.species} • {plant.location}
          </p>
        </div>
      </div>

      {/* Quick Actions Menu */}
      {showActions && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-end"
          onClick={() => setShowActions(false)}
        >
          <div className="w-full bg-white dark:bg-gray-800 rounded-t-2xl p-4 safe-area-bottom">
            <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4"></div>
            <div className="space-y-2">
              {[
                { id: 'edit', icon: Edit3, label: 'Editar información', action: () => {} },
                { id: 'photo', icon: Camera, label: 'Tomar nueva foto', action: () => navigate('/camera') },
                { id: 'delete', icon: Trash2, label: 'Eliminar planta', action: () => handleDeletePlant(), danger: true },
              ].map(({ id, icon: Icon, label, action, danger }) => (
                <button 
                  key={id}
                  onClick={action}
                  className={`w-full flex items-center space-x-3 p-3 rounded-xl ios-button ${
                    danger 
                      ? 'hover:bg-red-50 dark:hover:bg-red-900/20' 
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon size={20} className={danger ? "text-red-500" : "text-gray-600 dark:text-gray-400"} />
                  <span className={danger ? "text-red-500" : "text-gray-900 dark:text-white"}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Health Status */}
      <div className="p-4">
        <motion.div 
          className={`rounded-2xl p-4 ${getHealthBg(plant.healthScore)}`}
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Puntuación de Salud
              </h3>
              <p className={`text-2xl font-bold ${getHealthColor(plant.healthScore)}`}>
                {plant.healthScore}%
              </p>
            </div>
            <div className="text-right">
              <Heart className={`w-8 h-8 ${getHealthColor(plant.healthScore)}`} />
            </div>
          </div>
          
          {needsWater && (
            <motion.div 
              className="mt-3 flex items-center space-x-2 text-orange-600 dark:text-orange-400"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <AlertTriangle size={16} />
              <span className="text-sm font-medium">Necesita riego</span>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
          {[
            { key: 'overview', label: 'Resumen' },
            { key: 'stats', label: 'Estadísticas' },
            { key: 'care', label: 'Cuidados' },
            { key: 'history', label: 'Historial' },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as any)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                activeTab === key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4 space-y-4">
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                onClick={markAsWatered}
                className="glass-effect rounded-xl p-4 text-left ios-button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Droplets className="w-6 h-6 text-blue-500 mb-2" />
                <p className="font-medium text-gray-900 dark:text-white">Regar Planta</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {plant.lastWatered 
                    ? `Último: ${formatDistanceToNow(plant.lastWatered, { addSuffix: true, locale: es })}`
                    : 'Nunca regada'
                  }
                </p>
              </motion.button>
              
              <Link
                to={`/chat/${plant.id}`}
                className="glass-effect rounded-xl p-4 text-left ios-button block"
              >
                <MessageCircle className="w-6 h-6 text-primary-500 mb-2" />
                <p className="font-medium text-gray-900 dark:text-white">Chat</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Habla con tu planta
                </p>
              </Link>
            </div>

            {/* Care Requirements */}
            <div className="glass-effect rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Requisitos de Cuidado
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Droplets className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-900 dark:text-white">Riego</span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-400">
                    Cada {plant.careProfile.wateringFrequency} días
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Sun className="w-5 h-5 text-yellow-500" />
                    <span className="text-gray-900 dark:text-white">Luz solar</span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-400 capitalize">
                    {plant.careProfile.sunlightRequirement === 'low' ? 'Baja' :
                     plant.careProfile.sunlightRequirement === 'medium' ? 'Media' : 'Alta'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Thermometer className="w-5 h-5 text-red-500" />
                    <span className="text-gray-900 dark:text-white">Temperatura</span>
                  </div>
                  <span className="text-gray-600 dark:text-gray-400">
                    {plant.careProfile.temperatureRange.min}°-{plant.careProfile.temperatureRange.max}°C
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'stats' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <PlantStatsCard plant={plant} />
            <PlantProgressChart plant={plant} />
          </motion.div>
        )}

        {activeTab === 'care' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="glass-effect rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Guía Detallada de Cuidados
              </h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Suelo</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {plant.careProfile.soilType}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Humedad</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm capitalize">
                    Prefiere humedad {plant.careProfile.humidityPreference === 'low' ? 'baja' :
                                     plant.careProfile.humidityPreference === 'medium' ? 'media' : 'alta'}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Fertilización</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Cada {plant.careProfile.fertilizingFrequency} días durante la temporada de crecimiento
                  </p>
                </div>
                
                {plant.careProfile.specialCare && plant.careProfile.specialCare.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">Cuidados Especiales</h4>
                    <ul className="space-y-1">
                      {plant.careProfile.specialCare.map((care, index) => (
                        <li key={index} className="text-gray-600 dark:text-gray-400 text-sm">
                          • {care}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="glass-effect rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Línea de Tiempo de la Planta
              </h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Planta agregada
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {format(plant.dateAdded, 'dd MMM yyyy', { locale: es })}
                    </p>
                  </div>
                </div>
                
                {plant.lastWatered && (
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Último riego
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {format(plant.lastWatered, 'dd MMM yyyy', { locale: es })}
                      </p>
                    </div>
                  </div>
                )}
                
                {plant.images.length > 1 && (
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {plant.images.length} fotos tomadas
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        Seguimiento del progreso de crecimiento
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Photo Gallery */}
            {plant.images.length > 0 && (
              <div className="glass-effect rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Galería de Fotos
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {plant.images.map((image) => (
                    <div key={image.id} className="aspect-square rounded-lg overflow-hidden">
                      <LazyImage
                        src={image.url}
                        alt="Foto de la planta"
                        className="w-full h-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default PlantDetail;