import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Camera, Image } from 'lucide-react';
import { usePlantStore, useAuthStore } from '../stores';
import { analyzeImage } from '../services/aiService';

const AddPlantMenu: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { createPlant, refreshPlants } = usePlantStore();
  const user = useAuthStore((state) => state.user);

  const menuItems = [
    {
      id: 'camera',
      icon: Camera,
      label: 'Tomar Foto',
      color: 'bg-blue-500',
      action: () => {
        setIsOpen(false);
        navigate('/camera');
      }
    },
    {
      id: 'gallery',
      icon: Image,
      label: 'Galería',
      color: 'bg-purple-500',
      action: () => handleGalleryPicker()
    }
  ];

  const handleGalleryPicker = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          setIsOpen(false);
          
          // Convert file to data URL
          const reader = new FileReader();
          reader.onload = async (event) => {
            try {
              const dataUrl = event.target?.result as string;
              
              // Analyze image with AI
              const analysis = await analyzeImage(dataUrl);
              
                             // Create new plant
               const newPlant = {
                 name: analysis.species || 'Nueva Planta',
                 species: analysis.species,
                 variety: analysis.variety,
                 location: 'Por definir',
                 dateAdded: new Date(),
                 images: [{
                   id: `img-${Date.now()}`,
                   url: dataUrl,
                   timestamp: new Date(),
                   healthAnalysis: analysis.health,
                   isProfileImage: true
                 }],
                healthScore: analysis.health.confidence || 85,
                careProfile: analysis.careProfile,
                personality: analysis.personality,
                chatHistory: [],
                notifications: []
              };
              
              if (user) {
                await createPlant(newPlant, user.id);
                await refreshPlants(user.id);
              }
              
              // Navigate to new plant detail
              // Note: We'll need to get the ID from the added plant
              navigate('/');
              
            } catch (error) {
              console.error('Error analyzing image:', error);
              alert('Error al analizar la imagen. Intenta de nuevo.');
            }
          };
          
          reader.readAsDataURL(file);
        } catch (error) {
          console.error('Error processing file:', error);
          alert('Error al procesar el archivo.');
        }
      }
    };
    input.click();
  }, [createPlant, navigate, refreshPlants, user]);

  return (
    <div className="fixed bottom-4 right-4 z-50">
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
                  transition: { delay: index * 0.1 } 
                }}
                exit={{ 
                  scale: 0, 
                  opacity: 0, 
                  transition: { delay: (menuItems.length - index) * 0.05 } 
                }}
                onClick={item.action}
                disabled={false}
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
                  cursor: 'pointer',
                  minWidth: '140px'
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
        onClick={() => setIsOpen(!isOpen)}
        disabled={false}
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
          cursor: 'pointer'
        }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
      >
        <Plus size={24} />
      </motion.button>

      {/* Desktop Helper */}
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
                  Agregar Nueva Planta
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Toma una foto o selecciona desde galería para identificar automáticamente tu planta
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