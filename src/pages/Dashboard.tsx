import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplets, Leaf, MessageCircle, Plus, Sparkles } from 'lucide-react';

import PlantCard from '@/components/PlantCard';
import { Button } from '@/components/ui/Button';
import { usePlantsQuery } from '@/hooks/usePlantsQuery';
import { PlantSummary } from '@/schemas';
import { navigation } from '@/lib/navigation';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const getDaysSinceWatered = (plant: PlantSummary): number | null => {
  if (!plant.lastWatered) {
    return null;
  }

  return Math.floor((Date.now() - new Date(plant.lastWatered).getTime()) / DAY_IN_MS);
};

const getDaysUntilNextWatering = (plant: PlantSummary): number | null => {
  if (!plant.wateringFrequency) {
    return null;
  }

  const daysSince = getDaysSinceWatered(plant) ?? plant.wateringFrequency;
  return Math.max(plant.wateringFrequency - daysSince, 0);
};

const needsWatering = (plant: PlantSummary): boolean => {
  if (!plant.wateringFrequency) {
    return !plant.lastWatered;
  }

  const daysSince = getDaysSinceWatered(plant);
  if (daysSince === null) {
    return true;
  }

  return daysSince >= plant.wateringFrequency;
};

const EmptyState: React.FC<{ onAdd: () => void; onChat: () => void }> = ({ onAdd, onChat }) => (
  <section className="rounded-3xl border border-emerald-100 bg-white/90 p-8 text-center shadow-sm">
    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
      <Leaf className="h-10 w-10 text-emerald-500" />
    </div>
    <h2 className="mt-6 text-2xl font-bold text-emerald-900">Tu jardín digital está listo</h2>
    <p className="mt-3 text-sm text-emerald-700">
      Agrega tu primera planta tomando una foto o pregunta a nuestra IA para organizar tus cuidados.
    </p>
    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
      <Button onClick={onAdd} className="sm:flex-1" leftIcon={<Plus className="h-4 w-4" />}>
        Tomar foto
      </Button>
      <Button
        variant="secondary"
        onClick={onChat}
        className="sm:flex-1"
        leftIcon={<MessageCircle className="h-4 w-4" />}
      >
        Hablar con la IA
      </Button>
    </div>
  </section>
);

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data: plants = [], isLoading, error, refetch } = usePlantsQuery();
  const [searchTerm, setSearchTerm] = useState('');

  const metrics = useMemo(() => {
    if (plants.length === 0) {
      return {
        total: 0,
        averageHealth: 0,
        watering: [] as PlantSummary[],
        needsAttention: [] as PlantSummary[],
        nextWatering: null as { plant: PlantSummary; days: number } | null,
      };
    }

    let sumHealth = 0;
    const wateringList: PlantSummary[] = [];
    const attentionList: PlantSummary[] = [];
    let nextWatering: { plant: PlantSummary; days: number } | null = null;

    plants.forEach((plant) => {
      sumHealth += plant.healthScore ?? 0;

      if (needsWatering(plant)) {
        wateringList.push(plant);
      }

      if (plant.healthScore < 50) {
        attentionList.push(plant);
      }

      const daysUntil = getDaysUntilNextWatering(plant);
      if (daysUntil !== null) {
        if (!nextWatering || daysUntil < nextWatering.days) {
          nextWatering = { plant, days: daysUntil };
        }
      }
    });

    return {
      total: plants.length,
      averageHealth: Math.round(sumHealth / plants.length),
      watering: wateringList,
      needsAttention: attentionList,
      nextWatering,
    };
  }, [plants]);

  const filteredPlants = useMemo(() => {
    if (!searchTerm) {
      return plants;
    }

    const query = searchTerm.trim().toLowerCase();
    return plants.filter((plant) =>
      [plant.name, plant.nickname, plant.species, plant.location]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query)),
    );
  }, [plants, searchTerm]);

  const orderedPlants = useMemo(() => {
    return [...filteredPlants].sort((a, b) => {
      const aNeedsWater = needsWatering(a);
      const bNeedsWater = needsWatering(b);
      if (aNeedsWater && !bNeedsWater) return -1;
      if (!aNeedsWater && bNeedsWater) return 1;

      return (getDaysUntilNextWatering(a) ?? Infinity) - (getDaysUntilNextWatering(b) ?? Infinity);
    });
  }, [filteredPlants]);

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <p className="text-sm uppercase tracking-widest text-emerald-500">Tu jardín hoy</p>
        <h1 className="text-3xl font-bold text-emerald-900">Hola, amante de las plantas 🌱</h1>
        <p className="text-sm text-emerald-700">
          {metrics.total === 0
            ? 'Empecemos creando la primera ficha de cuidado.'
            : metrics.watering.length > 0
              ? `${metrics.watering.length} ${metrics.watering.length === 1 ? 'planta necesita' : 'plantas necesitan'} un mimo de agua.`
              : 'Todas tus plantas están al día. Aprovecha para observar su crecimiento.'}
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <article className="rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-emerald-500">Plantas registradas</p>
          <p className="mt-2 text-3xl font-bold text-emerald-900">{metrics.total}</p>
          <p className="mt-1 text-xs text-emerald-700">Sigue sumando tus compañeras verdes.</p>
        </article>
        <article className="rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-emerald-500">Salud promedio</p>
          <p className="mt-2 text-3xl font-bold text-emerald-900">{metrics.averageHealth || '—'}</p>
          <p className="mt-1 text-xs text-emerald-700">{metrics.averageHealth ? 'Refuerza la constancia de riego.' : 'Registra su bienestar para obtener recomendaciones.'}</p>
        </article>
        <article className="rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-emerald-500">Próximo riego</p>
          <p className="mt-2 text-3xl font-bold text-emerald-900">
            {metrics.nextWatering
              ? metrics.nextWatering.days === 0
                ? 'Hoy'
                : `${metrics.nextWatering.days}d`
              : '—'}
          </p>
          <p className="mt-1 text-xs text-emerald-700">
            {metrics.nextWatering
              ? `Prepara agua para ${metrics.nextWatering.plant.nickname || metrics.nextWatering.plant.name}.`
              : 'Configura la frecuencia para recibir recordatorios.'}
          </p>
        </article>
      </section>

      <section className="rounded-3xl border border-emerald-100 bg-white/90 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-emerald-900">Acciones rápidas</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => navigate(navigation.toCamera())}
            className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-left text-emerald-800 transition hover:border-emerald-200 hover:bg-emerald-100"
          >
            <div>
              <p className="text-sm font-semibold">Añadir nueva planta</p>
              <p className="text-xs text-emerald-700">Captura una foto y deja que la IA reconozca su especie.</p>
            </div>
            <Plus className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => navigate(navigation.toGardenChat())}
            className="flex items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-left text-emerald-800 transition hover:border-emerald-200 hover:bg-emerald-100"
          >
            <div>
              <p className="text-sm font-semibold">Pedir consejos rápidos</p>
              <p className="text-xs text-emerald-700">Describe cómo ves a tus plantas y recibe apoyo personalizado.</p>
            </div>
            <MessageCircle className="h-5 w-5" />
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-emerald-900">Mis plantas</h2>
          <div className="flex w-full max-w-sm items-center rounded-full border border-emerald-100 bg-white px-3 py-2 text-emerald-800 shadow-sm">
            <Sparkles className="mr-2 h-4 w-4 text-emerald-500" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nombre, especie o ubicación"
              className="w-full bg-transparent text-sm outline-none placeholder:text-emerald-400"
            />
          </div>
        </div>

        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-2xl bg-emerald-100/60"
              />
            ))}
          </div>
        )}

        {error && !isLoading && (
          <div className="rounded-2xl border border-red-100 bg-white p-4 text-sm text-red-700">
            <p>Ocurrió un problema al cargar tus plantas.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
            >
              <Droplets className="h-4 w-4" />
              Intentar de nuevo
            </button>
          </div>
        )}

        {!isLoading && !error && plants.length === 0 && (
          <EmptyState
            onAdd={() => navigate(navigation.toCamera())}
            onChat={() => navigate(navigation.toGardenChat())}
          />
        )}

        {!isLoading && !error && plants.length > 0 && orderedPlants.length === 0 && (
          <p className="rounded-2xl border border-emerald-100 bg-white/90 p-4 text-sm text-emerald-700">
            No encontramos plantas con ese criterio. Prueba con otro nombre o ubicación.
          </p>
        )}

        {!isLoading && !error && orderedPlants.length > 0 && (
          <div className="space-y-4">
            {orderedPlants.map((plant) => (
              <PlantCard key={plant.id} plant={plant} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard;
