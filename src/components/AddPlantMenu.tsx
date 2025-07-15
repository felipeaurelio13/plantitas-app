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
    // Función de añadir manualmente temporalmente oculta - ver ROADMAP.md
    /* {
      id: 'manual',
      icon: Plus,
      label: 'Añadir Manualmente',
      color: 'bg-green-500',
      action: () => {
        setIsOpen(false);
        navigate('/add-plant/manual'); // Navigate to a future form
      },
    }, */
  ];

  const handleFileSelect = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        
        // Use default location "Interior" - user can edit it later if needed
        const location = "Interior";

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
            className="fixed inset-0 bg-black/20 z-30"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Menu Items */}
      <AnimatePresence>
        {isOpen && (
          <div className="absolute bottom-16 right-0 space-y-3 z-40">
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


    </div>
  );
};

export default AddPlantMenu; 