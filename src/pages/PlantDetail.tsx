import { Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { usePlantDetail } from '@/hooks/usePlantDetail';
import {
  InsightCard,
  PlantDetailHeader,
  PlantProgressChart,
  PlantStatsCard,
  ImageGallery,
} from '@/components/PlantDetail';
import Layout from '@/components/Layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
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
  const { plant, insights, loading, error } = usePlantDetail(plantId);

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

  return (
    <Layout>
      <Suspense fallback={<PlantDetailFallback />}>
        <PlantDetailHeader
          plant={plant}
          onShare={() => alert('Compartir funcionalidad no implementada.')}
          // onShowActions is no longer needed
        />
        <main className="p-4">
          <Tabs defaultValue="progress" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="progress">Progreso</TabsTrigger>
              <TabsTrigger value="stats">Estadísticas</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
            </TabsList>
            
            <TabsContent value="progress" className="mt-4">
              <PlantProgressChart plant={plant} />
            </TabsContent>
            
            <TabsContent value="stats" className="mt-4">
              <PlantStatsCard plant={plant} />
            </TabsContent>

            <TabsContent value="insights" className="mt-4">
              {insights.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {insights.map((insight, index) => (
                    <InsightCard key={index} {...insight} />
                  ))}
                </div>
              ) : (
                <div className="mt-8 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted p-8 text-center">
                  <h3 className="text-lg font-semibold text-foreground">No hay insights aún</h3>
                  <p className="text-sm text-muted-foreground">
                    Sigue cuidando de tu planta para generar nuevos análisis.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <ImageGallery images={plant.images} />

        </main>
      </Suspense>
    </Layout>
  );
};

export default PlantDetail;