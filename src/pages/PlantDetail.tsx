import { Suspense } from 'react';
import { useParams } from 'react-router-dom';
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
import { AlertCircle } from 'lucide-react';

const PlantDetailFallback = () => (
  <Layout>
    <div className="p-4 space-y-4">
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  </Layout>
);


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
          <AlertCircle className="w-12 h-12 text-destructive mb-4" />
          <h1 className="text-xl font-bold text-destructive">Ocurrió un Error</h1>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Intentar de nuevo
          </Button>
        </main>
      </Layout>
    );
  }

  if (!plant) {
    return (
      <Layout>
        <main className="flex flex-1 flex-col items-center justify-center p-4 text-center h-screen">
          <h1 className="text-xl font-bold">Planta no encontrada</h1>
          <p className="text-muted-foreground">
            No se pudo encontrar la información de la planta.
          </p>
          <Button onClick={() => window.location.assign('/')} className="mt-4">
            Volver al inicio
          </Button>
        </main>
      </Layout>
    );
  }

  const firstImageAnalysis = plant.images?.[0]?.healthAnalysis;

  return (
    <Layout>
      <Suspense fallback={<PlantDetailFallback />}>
        <PlantDetailHeader
          plant={plant}
          onShare={() => alert('Compartir funcionalidad no implementada.')}
        />
        <main className="p-4 space-y-6">
          <DescriptionCard
            species={plant.species}
            description={plant.description}
            funFacts={plant.funFacts}
          />
          <HealthAnalysisCard analysis={firstImageAnalysis} />
          <PlantCharacteristics plant={plant} />
          <ImageGallery images={plant.images} />
        </main>
      </Suspense>
    </Layout>
  );
};

export default PlantDetail;