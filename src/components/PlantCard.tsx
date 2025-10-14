import React from 'react';
import { Droplets, Leaf, MapPin, Sun } from 'lucide-react';

import { PlantSummary } from '../schemas';
import { usePlantCardLogic } from '../hooks/usePlantCardLogic';

interface PlantCardProps {
  plant: PlantSummary;
  index?: number;
}

const lightLabels: Record<NonNullable<PlantSummary['lightRequirements']>, string> = {
  poca_luz: 'Poca luz',
  luz_indirecta: 'Luz indirecta',
  luz_directa_parcial: 'Sol parcial',
  pleno_sol: 'Pleno sol',
};

const formatWateringMessage = (
  plant: PlantSummary,
  daysSinceWatered: number,
  needsWatering: boolean,
): string => {
  if (!plant.wateringFrequency) {
    return 'Configura la frecuencia de riego para recibir recordatorios.';
  }

  if (!plant.lastWatered) {
    return 'Registra el primer riego para que podamos ayudarte mejor.';
  }

  if (needsWatering) {
    return daysSinceWatered === 0
      ? 'Riega hoy para mantenerla feliz.'
      : `Han pasado ${daysSinceWatered} días desde el último riego.`;
  }

  const daysUntilNext = Math.max(plant.wateringFrequency - daysSinceWatered, 0);
  if (daysUntilNext === 0) {
    return 'Atenta al riego mañana.';
  }

  return daysUntilNext === 1
    ? 'Próximo riego mañana.'
    : `Próximo riego en ${daysUntilNext} días.`;
};

const PlantCard: React.FC<PlantCardProps> = ({ plant }) => {
  const { state, actions } = usePlantCardLogic(plant);
  const { needsWatering, daysSinceWatered, healthStatus } = state;

  const wateringMessage = formatWateringMessage(plant, daysSinceWatered, needsWatering);
  const lightMessage = plant.lightRequirements
    ? lightLabels[plant.lightRequirements]
    : 'Observa su luz natural y anótala cuando puedas.';

  return (
    <button
      type="button"
      onClick={actions.handleClick}
      onMouseEnter={actions.handleMouseEnter}
      className="w-full text-left"
    >
      <article className="flex items-start gap-4 rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 focus-visible:outline-offset-2">
        <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-100">
          {plant.profileImageUrl ? (
            <img
              src={plant.profileImageUrl}
              alt={`${plant.name} - ${plant.species}`}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <Leaf className="h-8 w-8 text-emerald-500" aria-hidden="true" />
          )}
        </div>

        <div className="flex-1 space-y-3">
          <header>
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-500/80">
              {plant.nickname ? plant.name : plant.species}
            </p>
            <h3 className="text-lg font-bold text-emerald-900">
              {plant.nickname || plant.name}
            </h3>
          </header>

          <div className="flex flex-wrap items-center gap-2 text-xs text-emerald-600">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1">
              <MapPin className="h-3.5 w-3.5" />
              {plant.location}
            </span>
            {plant.plantEnvironment && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 capitalize">
                {plant.plantEnvironment}
              </span>
            )}
          </div>

          <div className="space-y-2 text-sm text-emerald-800">
            <p className="flex items-center gap-2">
              <Droplets className="h-4 w-4" />
              <span>{wateringMessage}</span>
            </p>
            <p className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <span>{lightMessage}</span>
            </p>
          </div>

          <footer className="flex items-center justify-between text-sm">
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${healthStatus.priority === 'high' ? 'bg-red-100 text-red-700' : healthStatus.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}
            >
              {healthStatus.status}
            </span>
            <span className="text-emerald-600/80">Salud: {plant.healthScore}</span>
          </footer>
        </div>
      </article>
    </button>
  );
};

export default PlantCard;
