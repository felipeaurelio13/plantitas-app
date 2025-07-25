import { useState, useEffect } from 'react';
import { ArrowLeft, MoreVertical, Trash2, LoaderCircle, MapPin, Calendar, Home, TreePine, Sun, Moon, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { Plant, PlantImage } from '../../schemas';
import LazyImage from '../LazyImage';
import { usePlantMutations } from '../../hooks/usePlantMutations';
import { usePlantInfoCompletion } from '../../hooks/usePlantInfoCompletion';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import UpdateHealthDiagnosisButton from '../UpdateHealthDiagnosisButton';

interface PlantDetailHeaderProps {
  plant: Plant;
}

const PlantDetailHeader = ({ plant }: PlantDetailHeaderProps) => {
  const navigate = useNavigate();
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const { deletePlant, isDeletingPlant } = usePlantMutations();
  const { completeInfo, isCompleting } = usePlantInfoCompletion();
  const { scrollY } = useScroll();
  
  // Parallax effect
  const y = useTransform(scrollY, [0, 300], [0, 150]);
  const opacity = useTransform(scrollY, [0, 200], [1, 0.3]);
  
  const profileImage =
    plant.images?.find((img: PlantImage) => img.isProfileImage) || plant.images?.[0];

  // Verificar si la planta necesita información completa
  const needsCompletion = !plant.plantEnvironment || !plant.lightRequirements;

  const handleDelete = () => {
    setShowConfirmDialog(true);
    setIsActionMenuOpen(false);
  };

  const confirmDelete = () => {
    deletePlant(plant.id, {
      onSuccess: () => {
        navigate('/');
      },
    });
  };

  // const handleEdit = () => {
  //   alert('La funcionalidad de edición aún no está implementada.');
  //   setIsActionMenuOpen(false);
  // };

  const handleCompleteInfo = () => {
    console.log('🎯 [UI] Usuario solicitó completar información con IA');
    console.log('🌱 [UI] Datos de la planta:', {
      id: plant.id,
      nombre: plant.name,
      especie: plant.species,
      ambienteActual: plant.plantEnvironment || 'No especificado',
      luzActual: plant.lightRequirements || 'No especificado'
    });

    setIsActionMenuOpen(false);
    setShowConfirmDialog(true);
  };

  const handleConfirmComplete = () => {
    console.log('✅ [UI] Usuario confirmó el completado automático');
    setShowConfirmDialog(false);
    completeInfo(plant.id, plant.species, plant.name);
  };

  const handleCancelComplete = () => {
    console.log('❌ [UI] Usuario canceló el completado automático');
    setShowConfirmDialog(false);
  };

  const formatDate = (dateString: Date | string) => {
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getEnvironmentIcon = (environment?: string) => {
    switch (environment) {
      case 'interior': return <Home className="w-4 h-4 mr-2" />;
      case 'exterior': return <TreePine className="w-4 h-4 mr-2" />;
      case 'ambos': return <><Home className="w-3 h-3 mr-1" /><TreePine className="w-3 h-3 mr-1" /></>;
      default: return null;
    }
  };

  const getEnvironmentText = (environment?: string) => {
    switch (environment) {
      case 'interior': return 'Interior';
      case 'exterior': return 'Exterior';
      case 'ambos': return 'Interior/Exterior';
      default: return null;
    }
  };

  const getLightIcon = (lightRequirement?: string) => {
    switch (lightRequirement) {
      case 'poca_luz': return <Moon className="w-4 h-4 mr-2" />;
      case 'luz_indirecta': return <Sun className="w-4 h-4 mr-2 opacity-60" />;
      case 'luz_directa_parcial': return <Sun className="w-4 h-4 mr-2 opacity-80" />;
      case 'pleno_sol': return <Sun className="w-4 h-4 mr-2" />;
      default: return null;
    }
  };

  const getLightText = (lightRequirement?: string) => {
    switch (lightRequirement) {
      case 'poca_luz': return 'Poca luz';
      case 'luz_indirecta': return 'Luz indirecta';
      case 'luz_directa_parcial': return 'Sol parcial';
      case 'pleno_sol': return 'Pleno sol';
      default: return null;
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: {
        type: "spring" as const,
        damping: 25,
        stiffness: 120,
      }
    },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.6 }
    },
  };

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setIsActionMenuOpen(false);
    
    if (isActionMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [isActionMenuOpen]);

  return (
    <motion.div 
      className="relative h-96 w-full overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Background Image with Parallax */}
      <motion.div 
        className="absolute inset-0 scale-110"
        style={{ y, opacity }}
      >
        {profileImage ? (
          <LazyImage
            src={profileImage.url}
            alt={plant.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-green-400 via-green-500 to-green-600">
            <div className="absolute inset-0 opacity-30" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='7' cy='7' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}></div>
          </div>
        )}
      </motion.div>

      {/* Enhanced Gradient Overlays */}
      <motion.div 
        className="absolute inset-0"
        variants={overlayVariants}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[rgba(0,0,0,0.6)] to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-black/30" />
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background/60 to-transparent" />
      </motion.div>

      {/* Navigation Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 pt-safe-top z-20">
        <motion.div 
          className="flex items-center justify-between"
          variants={itemVariants}
        >
          <Button
            aria-label="Volver atrás"
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="bg-black/30 text-white backdrop-blur-lg rounded-full border border-white/20 hover:bg-black/50 transition-all duration-300"
          >
            <ArrowLeft size={20} />
          </Button>

          <div className="flex items-center space-x-2">
            <div className="relative">
              <Button
                aria-label="Más opciones"
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsActionMenuOpen((prev) => !prev);
                }}
                className="bg-neutral-800/90 text-white backdrop-blur-lg rounded-full border border-neutral-600 hover:bg-neutral-700 transition-all duration-300 dark:bg-neutral-200/90 dark:text-neutral-900 dark:border-neutral-400 dark:hover:bg-neutral-300"
              >
                <MoreVertical size={20} />
              </Button>
              <AnimatePresence>
                {isActionMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl bg-background/95 backdrop-blur-lg shadow-xl ring-1 ring-black/10 focus:outline-none z-30 border border-border/50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="py-2">
                      {needsCompletion && (
                                              <button
                        onClick={handleCompleteInfo}
                        disabled={isCompleting}
                        className="flex w-full items-center px-4 py-3 text-sm text-contrast-high hover:bg-contrast-surface transition-colors rounded-lg mx-2"
                      >
                          {isCompleting ? (
                            <LoaderCircle className="mr-3 h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="mr-3 h-4 w-4" />
                          )}
                          <span>{isCompleting ? 'Completando...' : 'Completar con IA'}</span>
                        </button>
                      )}
                      
                      <div className="flex w-full items-center px-2 py-1">
                        <UpdateHealthDiagnosisButton
                          plant={plant}
                          variant="outline"
                          size="sm"
                          showLabel={true}
                          className="w-full"
                        />
                      </div>
                      
                      <button
                        onClick={handleDelete}
                        disabled={isDeletingPlant}
                        className="flex w-full items-center px-4 py-3 text-sm text-error-600 dark:text-error-500 hover:bg-error-50 dark:hover:bg-error-900/20 transition-colors rounded-lg mx-2 font-medium"
                      >
                        {isDeletingPlant ? (
                          <LoaderCircle className="mr-3 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-3 h-4 w-4" />
                        )}
                        <span>{isDeletingPlant ? 'Eliminando...' : 'Eliminar planta'}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Plant Information */}
      <div className="absolute bottom-0 left-0 right-0 p-6 pb-safe-bottom z-10">
        <motion.div 
          className="space-y-4"
          variants={itemVariants}
        >
          {/* Main Title */}
          <div className="space-y-2">
            <motion.h1 
              className="text-[24px] font-bold text-white drop-shadow-lg"
              variants={itemVariants}
            >
              {plant.nickname || plant.name}
            </motion.h1>
            <motion.p 
              className="text-[16px] text-white/90 font-medium"
              variants={itemVariants}
            >
              {plant.species}
            </motion.p>
          </div>

          {/* Plant Details */}
          <motion.div 
            className="flex flex-wrap gap-2 pt-2 max-h-32 overflow-y-auto"
            variants={itemVariants}
          >
            {plant.location && (
              <div className="flex items-center text-white/80 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-full border border-white/20">
                <MapPin className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">{plant.location}</span>
              </div>
            )}
            
            {plant.dateAdded && (
              <div className="flex items-center text-white/80 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-full border border-white/20">
                <Calendar className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">Desde {formatDate(plant.dateAdded)}</span>
              </div>
            )}

            {plant.plantEnvironment && getEnvironmentText(plant.plantEnvironment) && (
              <div className="flex items-center text-white/80 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-full border border-white/20">
                {getEnvironmentIcon(plant.plantEnvironment)}
                <span className="text-sm font-medium">{getEnvironmentText(plant.plantEnvironment)}</span>
              </div>
            )}

            {plant.lightRequirements && getLightText(plant.lightRequirements) && (
              <div className="flex items-center text-white/80 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-full border border-white/20">
                {getLightIcon(plant.lightRequirements)}
                <span className="text-sm font-medium">{getLightText(plant.lightRequirements)}</span>
              </div>
            )}

            {plant.images && plant.images.length > 0 && (
              <div className="flex items-center text-white/80 bg-black/30 backdrop-blur-sm px-3 py-2 rounded-full border border-white/20">
                <span className="text-sm font-medium">{plant.images.length} foto{plant.images.length !== 1 ? 's' : ''}</span>
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>

      {/* Diálogo de confirmación personalizado */}
      <AnimatePresence>
        {showConfirmDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={handleCancelComplete}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 max-w-md w-full mx-4 shadow-xl"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Completar con IA
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Información automática
                  </p>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <p className="text-gray-700 dark:text-gray-300">
                  ¿Quieres que la IA complete la información faltante de esta planta?
                </p>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🌱</span>
                    <span className="font-medium text-gray-900 dark:text-white">{plant.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">🔬</span>
                    <span className="text-gray-600 dark:text-gray-400">{plant.species}</span>
                  </div>
                </div>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <p className="font-medium mb-1">La IA agregará:</p>
                  <ul className="space-y-1">
                    <li>• Ambiente recomendado (interior/exterior)</li>
                    <li>• Necesidades de luz específicas</li>
                  </ul>
                </div>
              </div>

              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={handleCancelComplete}
                  className="flex-1"
                  disabled={isCompleting}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmComplete}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  disabled={isCompleting}
                >
                  {isCompleting ? (
                    <>
                      <LoaderCircle className="w-4 h-4 mr-2 animate-spin" />
                      Completando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Completar
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmDelete}
        title="Eliminar Planta"
        description={`¿Estás seguro de que quieres eliminar "${plant.nickname || plant.name}"? Esta acción es irreversible y se perderán todos los datos, fotos y mensajes de chat asociados.`}
        confirmText="Eliminar Definitivamente"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeletingPlant}
        preview={
          <div className="flex items-center gap-3">
            {profileImage && (
              <img 
                src={profileImage.url} 
                alt={plant.name}
                className="w-12 h-12 rounded-lg object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                {plant.nickname || plant.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {plant.species} • {plant.images?.length || 0} fotos
              </p>
            </div>
          </div>
        }
      />
    </motion.div>
  );
};

export default PlantDetailHeader; 