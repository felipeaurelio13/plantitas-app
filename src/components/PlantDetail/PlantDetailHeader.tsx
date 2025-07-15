import { useState } from 'react';
import { ArrowLeft, MoreVertical, Share2, Trash2, Edit, LoaderCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plant, PlantImage } from '../../schemas';
import LazyImage from '../LazyImage';
import { usePlantMutations } from '../../hooks/usePlantMutations';
import { Button } from '../ui/Button'; // Assuming you have a Button component

interface PlantDetailHeaderProps {
  plant: Plant;
  onShare: () => void;
  // onShowActions is no longer needed
}

const PlantDetailHeader = ({ plant, onShare }: PlantDetailHeaderProps) => {
  const navigate = useNavigate();
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const { deletePlant, isDeletingPlant } = usePlantMutations();
  const profileImage =
    plant.images?.find((img: PlantImage) => img.isProfileImage) || plant.images?.[0];

  const handleDelete = () => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta planta? Esta acción es irreversible.')) {
      deletePlant(plant.id, {
        onSuccess: () => {
          navigate('/');
        },
      });
    }
  };

  const handleEdit = () => {
    alert('La funcionalidad de edición aún no está implementada.');
    setIsActionMenuOpen(false);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  return (
    <motion.div 
      className="relative h-80 w-full"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <div className="absolute inset-0">
        {profileImage ? (
          <LazyImage
            src={profileImage.url}
            alt={plant.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-green-400 to-green-600" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
      </div>

      <div className="absolute top-0 left-0 right-0 p-4 pt-safe-top">
        <motion.div className="flex items-center justify-between" variants={itemVariants}>
          <Button
            aria-label="Volver atrás"
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="bg-background/50 text-foreground/80 backdrop-blur rounded-full"
          >
            <ArrowLeft size={20} />
          </Button>

          <div className="flex items-center space-x-2">
            <Button
              aria-label="Compartir"
              variant="ghost"
              size="icon"
              onClick={onShare}
              className="bg-background/50 text-foreground/80 backdrop-blur rounded-full"
            >
              <Share2 size={20} />
            </Button>
            <div className="relative">
              <Button
                aria-label="Más opciones"
                variant="ghost"
                size="icon"
                onClick={() => setIsActionMenuOpen((prev) => !prev)}
                className="bg-background/50 text-foreground/80 backdrop-blur rounded-full"
              >
                <MoreVertical size={20} />
              </Button>
              <AnimatePresence>
                {isActionMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    transition={{ duration: 0.1 }}
                    className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-background shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                  >
                    <div className="py-1">
                      <button
                        onClick={handleEdit}
                        className="flex w-full items-center px-4 py-3 text-sm text-foreground hover:bg-muted"
                      >
                        <Edit className="mr-3 h-5 w-5" />
                        <span>Editar</span>
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={isDeletingPlant}
                        className="flex w-full items-center px-4 py-3 text-sm text-destructive hover:bg-destructive/10"
                      >
                        {isDeletingPlant ? (
                          <LoaderCircle className="mr-3 h-5 w-5 animate-spin" />
                        ) : (
                          <Trash2 className="mr-3 h-5 w-5" />
                        )}
                        <span>{isDeletingPlant ? 'Eliminando...' : 'Eliminar'}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe-bottom">
        <motion.h1 
          className="text-2xl font-bold text-foreground"
          variants={itemVariants}
        >
          {plant.nickname || plant.name}
        </motion.h1>
        <motion.p 
          className="text-sm text-foreground/70"
          variants={itemVariants}
        >
          {plant.species} • {plant.location}
        </motion.p>
      </div>
    </motion.div>
  );
};

export default PlantDetailHeader; 