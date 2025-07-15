import React from 'react';
import { Plant } from '@/schemas';
import { Droplets, Sun, Wind, Thermometer, Flower, Sprout, Sparkles, Bot, MessageSquare, Mic } from 'lucide-react';

interface PlantCharacteristicsProps {
  plant: Plant;
}

const CharacteristicItem: React.FC<{ icon: React.ReactNode; label: string; value: React.ReactNode }> = ({ icon, label, value }) => (
  <div className="flex items-start space-x-4 p-4 bg-muted/50 rounded-lg">
    <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center text-primary">
      {icon}
    </div>
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold text-foreground capitalize">{value}</p>
    </div>
  </div>
);

export const PlantCharacteristics: React.FC<PlantCharacteristicsProps> = ({ plant }) => {
  const { careProfile, personality } = plant;

  if (!careProfile) {
    return (
      <div className="bg-background p-6 rounded-lg shadow-lg w-full text-center">
        <p className="text-muted-foreground">No hay perfil de cuidados disponible para esta planta.</p>
      </div>
    );
  }

  return (
    <div className="bg-background p-6 rounded-lg shadow-lg w-full space-y-8">
      <div>
        <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center">
          <Flower className="mr-3 text-primary"/> Perfil de Cuidados
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <CharacteristicItem 
            icon={<Droplets size={24} />} 
            label="Riego" 
            value={`Cada ${careProfile.wateringFrequency} días`} 
          />
          <CharacteristicItem 
            icon={<Sun size={24} />} 
            label="Luz Solar" 
            value={careProfile.sunlightRequirement} 
          />
          <CharacteristicItem 
            icon={<Wind size={24} />} 
            label="Humedad" 
            value={careProfile.humidityPreference} 
          />
          <CharacteristicItem 
            icon={<Thermometer size={24} />} 
            label="Temperatura Ideal" 
            value={`${careProfile.temperatureRange.min}°C - ${careProfile.temperatureRange.max}°C`}
          />
          <CharacteristicItem 
            icon={<Sparkles size={24} />} 
            label="Fertilización" 
            value={`Cada ${careProfile.fertilizingFrequency} días`} 
          />
           <CharacteristicItem 
            icon={<Sprout size={24} />} 
            label="Tipo de Suelo" 
            value={careProfile.soilType} 
          />
        </div>
        {careProfile.specialCare && careProfile.specialCare.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold text-lg mb-2">Cuidados Especiales:</h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              {careProfile.specialCare.map((tip, index) => <li key={index}>{tip}</li>)}
            </ul>
          </div>
        )}
      </div>

      {personality && (
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-4 flex items-center">
            <Bot className="mr-3 text-primary"/> Personalidad de la Planta
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CharacteristicItem 
              icon={<MessageSquare size={24} />} 
              label="Estilo de Comunicación" 
              value={personality.communicationStyle} 
            />
            <div className="md:col-span-2 lg:col-span-3 bg-muted/50 p-4 rounded-lg">
                <h4 className="font-semibold text-lg mb-2 flex items-center">
                    <Mic className="mr-2"/> Frases Típicas
                </h4>
                <div className="flex flex-wrap gap-2">
                    {personality.catchphrases.map((phrase, index) => (
                        <span key={index} className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm">
                            "{phrase}"
                        </span>
                    ))}
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 