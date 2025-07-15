import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Camera, Image, LoaderCircle } from 'lucide-react';
import { usePlantMutations } from '../hooks/usePlantMutations';
import { toast } from 'sonner';

const AddPlantMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { createPlant, isCreatingPlant } = usePlantMutations();

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const menuItems = [
    {
      id: 'camera',
      icon: Camera,
      label: 'Tomar Foto',
      color: 'bg-blue-500',
      action: () => {
        setIsOpen(false);
        navigate('/camera');
      },
    },
    {
      id: 'gallery',
      icon: Image,
      label: 'Galería',
      color: 'bg-purple-500',
      action: () => handleGalleryPicker(),
    },
    {
      id: 'manual',
      icon: Plus,
      label: 'Añadir Manualmente',
      color: 'bg-green-500',
      action: () => {
        setIsOpen(false);
        navigate('/add-plant/manual'); // Navigate to a future form
      },
    },
  ];

  const handleFileSelect = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        
        const location = window.prompt("¿Dónde está ubicada tu planta? (Ej: Interior, Balcón, Oficina)", "Interior");
        if (!location) {
          toast.error("La ubicación es necesaria para continuar.");
          setIsOpen(false);
          return;
        }

        const promise = new Promise((resolve, reject) => {
          createPlant({ imageDataUrl, location }, {
            onSuccess: (newPlant) => {
              if (newPlant?.id) {
                navigate(`/plant/${newPlant.id}`);
              }
              resolve(newPlant);
            },
            onError: (error) => reject(error),
          });
        });

        toast.promise(promise, {
          loading: 'Analizando imagen...',
          success: (data: any) => `¡Planta "${data.name}" creada con éxito!`,
          error: (err) => `Error: ${err.message}`,
        });

        setIsOpen(false);
      };
      reader.readAsDataURL(file);
    },
    [createPlant, navigate]
  );

  const handleGalleryPicker = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        handleFileSelect(target.files[0]);
      }
    };
    input.click();
  };

  const IconComponent = isCreatingPlant ? LoaderCircle : Plus;

  return (
    <div className="fixed bottom-20 right-4 z-50">
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              zIndex: 40
            }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Menu Items */}
      <AnimatePresence>
        {isOpen && (
          <div className="absolute bottom-16 right-0 space-y-3">
            {menuItems.map((item, index) => (
              <motion.button
                key={item.id}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  transition: { delay: index * 0.1 },
                }}
                exit={{
                  scale: 0,
                  opacity: 0,
                  transition: { delay: (menuItems.length - index) * 0.05 },
                }}
                onClick={item.action}
                disabled={isCreatingPlant}
                style={{
                  backgroundColor: item.color.includes('blue') ? '#3b82f6' : '#8b5cf6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  cursor: isCreatingPlant ? 'not-allowed' : 'pointer',
                  minWidth: '140px',
                }}
              >
                <item.icon size={20} />
                <span className="text-sm font-medium">{item.label}</span>
              </motion.button>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main Button */}
      <motion.button
        aria-label={
          isCreatingPlant
            ? 'Agregando planta'
            : isOpen
            ? 'Cerrar menú'
            : 'Agregar planta'
        }
        onClick={() => !isCreatingPlant && setIsOpen(!isOpen)}
        disabled={isCreatingPlant}
        style={{
          backgroundColor: '#22c55e',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '56px',
          height: '56px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 25px -3px rgba(0, 0, 0, 0.1)',
          cursor: isCreatingPlant ? 'not-allowed' : 'pointer',
        }}
        whileHover={{ scale: isCreatingPlant ? 1 : 1.05 }}
        whileTap={{ scale: isCreatingPlant ? 1 : 0.95 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
      >
        <IconComponent
          size={24}
          className={isCreatingPlant ? 'animate-spin' : ''}
        />
      </motion.button>

      {/* Desktop Helper / Loading Indicator */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            style={{
              position: 'fixed',
              bottom: '160px',
              right: '16px',
              left: '16px',
              zIndex: 50
            }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-xl border border-gray-200 dark:border-gray-700 mx-auto max-w-sm">
              <div className="text-center">
                <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {isCreatingPlant ? 'Analizando tu planta...' : 'Agregar Nueva Planta'}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {isCreatingPlant
                    ? 'Estamos identificando la especie y su estado de salud. ¡Un momento!'
                    : 'Toma una foto o selecciona desde galería para identificar automáticamente tu planta'}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AddPlantMenu; 