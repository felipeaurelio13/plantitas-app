import { Suspense, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlantDetail } from '@/hooks/usePlantDetail';
import { usePlantImageMutations } from '../hooks/usePlantImageMutations';
import {
  PlantDetailHeader,
  PlantOverviewCard,
  ExpandableInfoSection,
  AddPhotoModal,
  ImageGallery,
} from '@/components/PlantDetail';

import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Camera, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { navigation } from '../lib/navigation';

const PlantDetailFallback = () => (
  <div className="relative">
      {/* Header Skeleton */}
      <div className="relative h-96 w-full overflow-hidden bg-gradient-to-br from-muted/50 to-muted">
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
        
        {/* Navigation skeleton */}
        <div className="absolute top-0 left-0 right-0 p-4 pt-safe-top">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex items-center space-x-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
            </div>
          </div>
        </div>
        
        {/* Plant info skeleton */}
        <div className="absolute bottom-0 left-0 right-0 p-6 pb-safe-bottom">
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-6 w-48" />
            </div>
            <div className="flex flex-wrap gap-3">
              <Skeleton className="h-8 w-24 rounded-full" />
              <Skeleton className="h-8 w-32 rounded-full" />
              <Skeleton className="h-8 w-20 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Content Skeletons */}
      <div className="p-4 space-y-6 pb-20">
        {/* Description Card Skeleton */}
        <div className="bg-background p-6 rounded-2xl shadow-lg border border-border/50">
          <div className="mb-6 flex items-center">
            <Skeleton className="h-12 w-12 rounded-full mr-4" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="mt-8 space-y-4">
            <div className="flex items-center mb-4">
              <Skeleton className="h-12 w-12 rounded-full mr-4" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-56" />
              </div>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-start bg-muted/20 rounded-xl p-4">
                <Skeleton className="h-5 w-5 rounded-full mr-4 mt-1" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </div>
        </div>

        {/* Health Analysis Skeleton */}
        <div className="bg-background p-6 rounded-2xl shadow-lg border border-border/50">
          <div className="mb-4 flex items-center">
            <Skeleton className="h-6 w-6 mr-3" />
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
            <Skeleton className="h-12 w-12 mx-auto mb-3" />
            <Skeleton className="h-6 w-32 mx-auto mb-2" />
            <Skeleton className="h-4 w-48 mx-auto" />
          </div>
        </div>

        {/* Plant Characteristics Skeleton */}
        <div className="bg-background p-6 rounded-2xl shadow-lg border border-border/50">
          <div className="mb-4 flex items-center">
            <Skeleton className="h-6 w-6 mr-3" />
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-muted/50 rounded-lg p-4">
                <Skeleton className="h-8 w-8 mb-2" />
                <Skeleton className="h-4 w-16 mb-1" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        </div>

        {/* Image Gallery Skeleton */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Skeleton className="h-5 w-5 mr-2" />
              <Skeleton className="h-6 w-32" />
            </div>
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Floating Action Buttons Skeleton */}
      <div className="fixed bottom-4 right-4 z-40 flex flex-col-reverse gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-14 rounded-full" />
        ))}
        <Skeleton className="h-16 w-16 rounded-full" />
      </div>
    </div>
);



const PlantDetail = () => {
  const { plantId } = useParams<{ plantId: string }>();
  const navigate = useNavigate();
  const { plant, loading, error } = usePlantDetail(plantId);
  const { addPlantImage } = usePlantImageMutations();
  const [isAddPhotoModalOpen, setIsAddPhotoModalOpen] = useState(false);

  const handleAddPhoto = async (imageDataUrl: string, note?: string) => {
    if (!plantId) throw new Error('Plant ID is required');
    
    return new Promise<void>((resolve, reject) => {
      addPlantImage({ plantId, imageDataUrl, note }, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error),
      });
    });
  };

  if (loading) {
    return <PlantDetailFallback />;
  }

  if (error) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-4 text-center h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold text-destructive">Ocurrió un Error</h1>
          <p className="text-muted-foreground max-w-md">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Intentar de nuevo
          </Button>
        </motion.div>
      </main>
    );
  }

  if (!plant) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center p-4 text-center h-screen">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-bold">Planta no encontrada</h1>
          <p className="text-muted-foreground max-w-md">
            No se pudo encontrar la información de la planta solicitada.
          </p>
          <Button onClick={() => navigate(navigation.toDashboard())} className="mt-4">
              Volver al inicio
            </Button>
          </motion.div>
        </main>
    );
  }

  return (
    <Suspense fallback={<PlantDetailFallback />}>
      <div className="min-h-screen bg-background">
        {/* Header con imagen de fondo */}
        <PlantDetailHeader plant={plant} />
        
        {/* Contenido principal con mejor spacing mobile-first */}
        <main className="relative -mt-16 z-10">
          {/* Contenedor con borde redondeado superior */}
          <div className="bg-background rounded-t-3xl min-h-[calc(100vh-16rem)] pb-safe-bottom">
            <div className="px-4 py-6 space-y-6 max-w-4xl mx-auto">
              
              {/* Sección de información principal */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <PlantOverviewCard plant={plant} />
              </motion.div>

              {/* Tabs de contenido organizados */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                  <ExpandableInfoSection 
                    plant={plant} 
                    onAddPhoto={() => setIsAddPhotoModalOpen(true)}
                  />
                </div>
              </motion.div>

              {/* Galería de imágenes */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">
                      Galería de Fotos
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddPhotoModalOpen(true)}
                      className="flex items-center gap-2"
                    >
                      <Camera size={16} />
                      Agregar
                    </Button>
                  </div>
                  <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                    <ImageGallery images={plant.images} />
                  </div>
                </div>
              </motion.div>

              {/* Acciones principales */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4"
              >
                <Button
                  onClick={() => navigate(navigation.toPlantChat(plant.id))}
                  className="flex items-center justify-center gap-3 h-14 bg-primary text-primary-foreground hover:bg-primary/90"
                  size="lg"
                >
                  <MessageCircle size={20} />
                  <span className="font-medium">Chatear con {plant.nickname || plant.name}</span>
                </Button>
                
                <Button
                  onClick={() => setIsAddPhotoModalOpen(true)}
                  variant="outline"
                  className="flex items-center justify-center gap-3 h-14"
                  size="lg"
                >
                  <Camera size={20} />
                  <span className="font-medium">Documenta Progreso</span>
                </Button>
              </motion.div>

            </div>
          </div>
        </main>
        
        {/* Modal para agregar fotos */}
        <AddPhotoModal
          isOpen={isAddPhotoModalOpen}
          onClose={() => setIsAddPhotoModalOpen(false)}
          onPhotoAdded={handleAddPhoto}
          plantName={plant.nickname || plant.name}
        />
      </div>
    </Suspense>
  );
};

export default PlantDetail;