import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Calendar, Camera } from "lucide-react";
import { PlantImage } from "@/schemas";
import { Card, CardContent } from "../ui/Card";
import LazyImage from "../LazyImage";
import { motion, AnimatePresence } from "framer-motion";

interface ImageGalleryProps {
  images: PlantImage[];
}

export function ImageGallery({ images }: ImageGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  if (!images || images.length === 0) {
    return (
      <Card className="mt-4">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Camera className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay imágenes para esta planta todavía.</p>
            <p className="text-sm text-muted-foreground/70 mt-2">
              ¡Agrega algunas fotos para seguir su progreso!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const sortedImages = [...images].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const openModal = (index: number) => {
    setSelectedImageIndex(index);
  };

  const closeModal = () => {
    setSelectedImageIndex(null);
  };

  const navigateImage = (direction: 'prev' | 'next') => {
    if (selectedImageIndex === null) return;
    
    const newIndex = direction === 'prev' 
      ? (selectedImageIndex - 1 + sortedImages.length) % sortedImages.length
      : (selectedImageIndex + 1) % sortedImages.length;
    
    setSelectedImageIndex(newIndex);
  };

  const formatDate = (timestamp: Date | string) => {
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold tracking-tight flex items-center">
          <Camera className="w-5 h-5 mr-2 text-primary" />
          Galería de Imágenes
        </h2>
        <span className="text-sm text-muted-foreground">
          {sortedImages.length} foto{sortedImages.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {sortedImages.map((image, index) => (
          <motion.div 
            key={image.id} 
            className="aspect-square relative rounded-[8px] overflow-hidden cursor-pointer group w-[80px] h-[80px]"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => openModal(index)}
          >
            <LazyImage
              src={image.url}
              alt={`Imagen de planta del ${formatDate(image.timestamp)}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 rounded-[8px]"
            />
            
            {/* Overlay con información */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="absolute bottom-0 left-0 right-0 p-3">
                <div className="flex items-center text-white text-xs gap-2">
                  <span className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {formatDate(image.timestamp)}
                  </span>
                  {/* Aquí puedes agregar el overlay de icono de chat si es necesario */}
                </div>
              </div>
            </div>

            {/* Indicador de imagen de perfil */}
            {image.isProfileImage && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                Principal
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Modal de imagen */}
      <AnimatePresence>
        {selectedImageIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative max-w-4xl max-h-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Botón cerrar */}
              <button
                onClick={closeModal}
                className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Navegación */}
              {sortedImages.length > 1 && (
                <>
                  <button
                    onClick={() => navigateImage('prev')}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button
                    onClick={() => navigateImage('next')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Imagen principal */}
              <img
                src={sortedImages[selectedImageIndex].url}
                alt={`Imagen de planta del ${formatDate(sortedImages[selectedImageIndex].timestamp)}`}
                className="max-w-full max-h-full object-contain rounded-lg"
              />

              {/* Información de la imagen */}
              <div className="absolute bottom-4 left-4 right-4 bg-black/50 text-white p-4 rounded-lg backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="text-sm">
                      {formatDate(sortedImages[selectedImageIndex].timestamp)}
                    </span>
                  </div>
                  <span className="text-sm text-white/70">
                    {selectedImageIndex + 1} de {sortedImages.length}
                  </span>
                </div>
                {/* Health status summary */}
                <div className="mt-2 text-sm flex items-center gap-2">
                  {(() => {
                    const analysis = sortedImages[selectedImageIndex].healthAnalysis;
                    if (!analysis) return <span className="italic text-white/60">Sin análisis</span>;
                    let emoji = '🌱', label = 'Excelente';
                    switch (analysis.overallHealth) {
                      case 'excellent': emoji = '🌱'; label = 'Excelente'; break;
                      case 'good': emoji = '🌿'; label = 'Buena'; break;
                      case 'fair': emoji = '🍃'; label = 'Regular'; break;
                      case 'poor': emoji = '🥀'; label = 'Baja'; break;
                      case 'critical': emoji = '💀'; label = 'Crítica'; break;
                      default: emoji = '🌱'; label = analysis.overallHealth;
                    }
                    let score = undefined;
                    const healthScoreMap = {
                      'excellent': 95,
                      'good': 80,
                      'fair': 60,
                      'poor': 30,
                      'critical': 20
                    };
                    if (analysis.overallHealth && healthScoreMap[analysis.overallHealth]) {
                      score = healthScoreMap[analysis.overallHealth];
                    } else if (typeof analysis.confidence === 'number') {
                      score = analysis.confidence <= 1 ? analysis.confidence * 100 : analysis.confidence;
                    }
                    return <span>Salud: <span className="font-semibold">{label}</span> <span>{emoji}</span>{score !== undefined && <span className="ml-2">({Math.round(score)}%)</span>}</span>;
                  })()}
                </div>
                {sortedImages[selectedImageIndex].isProfileImage && (
                  <div className="mt-2">
                    <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full">
                      Imagen Principal
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 