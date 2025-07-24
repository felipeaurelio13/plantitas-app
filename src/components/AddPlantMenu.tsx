import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Camera, Image, LoaderCircle } from 'lucide-react';
import { usePlantMutations } from '../hooks/usePlantMutations';
import { toast } from 'sonner';
import { navigation } from '../lib/navigation';

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
        navigate(navigation.toCamera());
      },
    },
    {
      id: 'gallery',
      icon: Image,
      label: 'Galería',
      color: 'bg-purple-500',
      action: () => handleGalleryPicker(),
    },
    // Función de añadir manualmente temporalmente oculta - ver ROADMAP.md
    /* {
      id: 'manual',
      icon: Plus,
      label: 'Añadir Manualmente',
      color: 'bg-green-500',
      action: () => {
        setIsOpen(false);
        navigate(navigation.toAddPlantManual ? navigation.toAddPlantManual() : '/add-plant/manual'); // Navigate to a future form
      },
    }, */
  ];

  const handleGalleryPicker = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
          const imageDataUrl = e.target?.result as string;
          if (imageDataUrl) {
            setIsOpen(false);
            
            const promise = new Promise((resolve, reject) => {
              createPlant({ 
                imageDataUrl, 
                location: 'Interior' 
              }, {
                onSuccess: (newPlant) => {
                  if (newPlant?.id) {
                    navigate(navigation.toPlantDetail(newPlant.id));
                  }
                  resolve(newPlant);
                },
                onError: (error) => {
                  console.error('Failed to create plant:', error);
                  reject(error);
                },
              });
            });

            // Show loading toast with promise
            toast.promise(promise, {
              loading: 'Analizando imagen... La IA está trabajando.',
              success: (data: any) => `¡Planta "${data.name}" creada con éxito!`,
              error: (err) => `Error: ${err.message}`,
            });
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }, [createPlant, navigate]);

  return (
    <>
      {/* Main button */}
      <div className="relative flex items-center">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          className="w-12 h-12 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center disabled:cursor-not-allowed"
          whileHover={{ scale: isCreatingPlant ? 1 : 1.05 }}
          whileTap={{ scale: isCreatingPlant ? 1 : 0.95 }}
          disabled={isCreatingPlant}
          aria-label={isOpen ? 'Cerrar menú' : 'Agregar planta'}
          aria-expanded={isOpen}
        >
          <AnimatePresence mode="wait">
            {isCreatingPlant ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                <LoaderCircle className="w-6 h-6 animate-spin" />
              </motion.div>
            ) : (
              <motion.div
                key="plus"
                initial={{ opacity: 0, rotate: -180 }}
                animate={{ 
                  opacity: 1, 
                  rotate: isOpen ? 45 : 0 
                }}
                exit={{ opacity: 0, rotate: 180 }}
                transition={{ duration: 0.2 }}
              >
                <Plus className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
        {/* Microetiqueta visible al expandirse */}
        {isOpen && (
          <motion.span
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 16 }}
            exit={{ opacity: 0, x: 10 }}
            transition={{ duration: 0.2 }}
            className="ml-3 px-3 py-1 rounded-full bg-primary-100 text-primary-700 text-xs font-medium shadow-md whitespace-nowrap z-50"
          >
            Agregar planta
          </motion.span>
        )}
      </div>

      {/* Menu items */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="absolute bottom-16 right-0 flex flex-col gap-3"
            initial="closed"
            animate="open"
            exit="closed"
            variants={{
              open: {
                transition: { staggerChildren: 0.1, delayChildren: 0.1 },
              },
              closed: {
                transition: { staggerChildren: 0.05, staggerDirection: -1 },
              },
            }}
          >
            {menuItems.map((item, index) => (
              <motion.button
                key={item.id}
                onClick={item.action}
                className={`w-12 h-12 ${item.color} hover:scale-105 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group relative`}
                variants={{
                  open: {
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    transition: { delay: index * 0.1 },
                  },
                  closed: {
                    opacity: 0,
                    scale: 0.3,
                    y: 20,
                    transition: { delay: (menuItems.length - index) * 0.05 },
                  },
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label={item.label}
              >
                <item.icon className="w-5 h-5" />
                
                {/* Tooltip */}
                <div className="absolute right-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded-lg whitespace-nowrap">
                    {item.label}
                    <div className="absolute left-full top-1/2 -translate-y-1/2 w-0 h-0 border-l-4 border-r-0 border-t-2 border-b-2 border-transparent border-l-gray-900"></div>
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-[-1]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default AddPlantMenu; 