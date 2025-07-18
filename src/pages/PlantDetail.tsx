import { Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlantDetail } from '@/hooks/usePlantDetail';
import {
  DescriptionCard,
  HealthAnalysisCard,
  PlantCharacteristics,
  PlantDetailHeader,
  ImageGallery,
} from '@/components/PlantDetail';
import Layout from '@/components/Layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/Button';
import { AlertCircle, Camera, MessageCircle, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const PlantDetailFallback = () => (
  <Layout>
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
  </Layout>
);

const FloatingActionButtons = ({ plantId }: { plantId: string }) => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: <Camera className="w-5 h-5" />,
      label: "Tomar foto",
      color: "bg-primary hover:bg-primary/90",
      onClick: () => navigate(`/camera?plantId=${plantId}`),
    },
    {
      icon: <MessageCircle className="w-5 h-5" />,
      label: "Chat",
      color: "bg-blue-500 hover:bg-blue-600",
      onClick: () => navigate(`/chat?plantId=${plantId}`),
    },
    // Función de recordatorios temporalmente oculta - ver ROADMAP.md
    /* {
      icon: <Calendar className="w-5 h-5" />,
      label: "Recordatorios",
      color: "bg-purple-500 hover:bg-purple-600",
      onClick: () => alert('Función de recordatorios en desarrollo'),
    }, */
  ];

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
    hidden: { scale: 0, opacity: 0 },
    visible: { 
      scale: 1, 
      opacity: 1,
      transition: {
        type: "spring" as const,
        damping: 15,
        stiffness: 300,
      }
    },
  };

  return (
    <motion.div
      className="fixed bottom-4 right-4 z-40 flex flex-col-reverse gap-3"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {actions.map((action, index) => (
        <motion.button
          key={index}
          className={`${action.color} text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group`}
          onClick={action.onClick}
          variants={itemVariants}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          title={action.label}
        >
          {action.icon}
          <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {action.label}
          </span>
        </motion.button>
      ))}
      
      {/* Main FAB */}
      <motion.button
        className="bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        variants={itemVariants}
        whileHover={{ rotate: 45 }}
        whileTap={{ scale: 0.95 }}
        title="Acciones rápidas"
      >
        <Plus className="w-6 h-6" />
      </motion.button>
    </motion.div>
  );
};

const PlantDetail = () => {
  const { plantId } = useParams<{ plantId: string }>();
  const { plant, loading, error } = usePlantDetail(plantId);

  if (loading) {
    return <PlantDetailFallback />;
  }

  if (error) {
    return (
      <Layout>
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
      </Layout>
    );
  }

  if (!plant) {
    return (
      <Layout>
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
            <Button onClick={() => window.location.assign('/')} className="mt-4">
              Volver al inicio
            </Button>
          </motion.div>
        </main>
      </Layout>
    );
  }

  const firstImageAnalysis = plant.images?.[0]?.healthAnalysis;

  return (
    <Layout>
      <Suspense fallback={<PlantDetailFallback />}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <PlantDetailHeader
            plant={plant}
            onShare={() => {
              // Fallback manual share option
              const shareText = `¡Mira mi hermosa ${plant.species}${plant.nickname ? ` "${plant.nickname}"` : ''}! 🌱\n\n${window.location.href}`;
              prompt('Copia este enlace para compartir:', shareText);
            }}
          />
          <main className="p-4 space-y-6 pb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <DescriptionCard
                species={plant.species}
                description={plant.description}
                funFacts={plant.funFacts}
              />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <HealthAnalysisCard analysis={firstImageAnalysis} />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <PlantCharacteristics plant={plant} />
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <ImageGallery images={plant.images} />
            </motion.div>
          </main>

          {/* Floating Action Buttons */}
          <FloatingActionButtons plantId={plant.id} />
        </motion.div>
      </Suspense>
    </Layout>
  );
};

export default PlantDetail;