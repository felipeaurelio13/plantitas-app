import { Suspense, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { usePlantDetail } from '@/hooks/usePlantDetail';
import { useInsightStore } from '@/stores/useInsightStore';
import {
  InsightCard,
  PlantDetailHeader,
  PlantProgressChart,
  ImageGallery,
  PlantCharacteristics,
} from '@/components/PlantDetail';
import Layout from '@/components/Layout';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Button } from '@/components/ui/Button';
import { AlertCircle, BookOpen, Zap } from 'lucide-react';

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

  const insights = useInsightStore(useCallback(state => plantId ? state.insights[plantId] : [], [plantId]));
  const isLoading = useInsightStore(useCallback(state => plantId ? state.isLoading[plantId] : false, [plantId]));
  const insightError = useInsightStore(useCallback(state => plantId ? state.error[plantId] : null, [plantId]));
  const fetchInsights = useInsightStore(state => state.fetchInsights);

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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="progress">Progreso</TabsTrigger>
              <TabsTrigger value="characteristics">Características</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="description">Descripción</TabsTrigger>
            </TabsList>
            
            <TabsContent value="progress" className="mt-4">
              <PlantProgressChart plant={plant} />
            </TabsContent>
            
            <TabsContent value="characteristics" className="mt-4">
              <PlantCharacteristics plant={plant} />
            </TabsContent>

            <TabsContent value="insights" className="mt-4">
              {isLoading && <p>Generando insights...</p>}
              {insightError && <p className="text-destructive">{insightError}</p>}
              {insights && insights.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {insights.map((insight, index) => (
                    <InsightCard key={index} type={insight.type} title={insight.title} message={insight.message} />
                  ))}
                </div>
              ) : (
                <div className="mt-8 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted p-8 text-center">
                  <h3 className="text-lg font-semibold text-foreground">No hay insights aún</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Genera insights basados en los datos de tu planta.
                  </p>
                  <Button onClick={() => plant && fetchInsights(plant)} disabled={isLoading}>
                    <Zap className="mr-2 h-4 w-4" />
                    {isLoading ? 'Generando...' : 'Generar Insights'}
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="description" className="mt-4">
              <div className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
                <h3 className="flex items-center text-lg font-semibold mb-4">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Acerca de {plant.species}
                </h3>
                <p className="text-muted-foreground whitespace-pre-wrap">
                  {plant.description || 'No hay una descripción disponible para esta planta.'}
                </p>
              </div>
            </TabsContent>
          </Tabs>
          
          <ImageGallery images={plant.images} />

        </main>
      </Suspense>
    </Layout>
  );
};

export default PlantDetail;