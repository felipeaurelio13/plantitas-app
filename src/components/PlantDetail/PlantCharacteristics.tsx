import React from 'react';
import { Plant } from '@/schemas';
import { Droplets, Sun, Wind, Thermometer, Sparkles, Sprout, Bot } from 'lucide-react';

interface PlantCharacteristicsProps {
  plant: Plant;
}

export const PlantCharacteristics: React.FC<PlantCharacteristicsProps> = ({ plant }) => {
  const { careProfile, personality } = plant;

  if (!careProfile) {
    return (
      <div className="bg-background p-6 rounded-lg shadow-lg w-full text-center">
        <p className="text-muted-foreground">No hay perfil de cuidados disponible para esta planta.</p>
      </div>
    );
  }

  // Helpers para grid y chips
  const careItems = [
    { icon: <Droplets size={20} strokeWidth={2} color="#555" />, label: 'RIEGO', value: `Cada ${careProfile.wateringFrequency} días` },
    { icon: <Sun size={20} strokeWidth={2} color="#555" />, label: 'LUZ SOLAR', value: careProfile.sunlightRequirement },
    { icon: <Wind size={20} strokeWidth={2} color="#555" />, label: 'HUMEDAD', value: careProfile.humidityPreference },
    { icon: <Thermometer size={20} strokeWidth={2} color="#555" />, label: 'TEMPERATURA IDEAL', value: `${careProfile.temperatureRange.min}°C - ${careProfile.temperatureRange.max}°C` },
    { icon: <Sparkles size={20} strokeWidth={2} color="#555" />, label: 'FERTILIZACIÓN', value: `Cada ${careProfile.fertilizingFrequency} días` },
    { icon: <Sprout size={20} strokeWidth={2} color="#555" />, label: 'TIPO DE SUELO', value: careProfile.soilType },
  ];

  return (
    <div className="w-full" style={{lineHeight:'1.4'}}>
      {/* Grid de iconos y valores */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-6 mb-4" style={{gap:'24px 16px'}}>
        {careItems.map((item, idx) => (
          <div key={idx} className="flex flex-col items-start">
            <div className="flex items-center mb-1">
              {item.icon}
              <span className="ml-2 text-[12px] uppercase tracking-[0.4px] text-[#777] font-medium">{item.label}</span>
            </div>
            <span className="text-[15px] font-semibold text-[#333] mt-1">{item.value}</span>
          </div>
        ))}
      </div>

      {/* Cuidados Especiales */}
      {careProfile.specialCare && careProfile.specialCare.length > 0 && (
        <div className="mb-4">
          <h4 className="font-semibold text-[14px] text-[#333] mt-4 mb-2">Cuidados Especiales</h4>
          <ul className="list-none pl-0 ml-4" style={{lineHeight:'1.5'}}>
            {careProfile.specialCare.map((care, idx) => (
              <li key={idx} className="flex items-start mb-1">
                <span className="mr-2 text-[#2A7F3E] font-bold" style={{fontSize:18,lineHeight:'1'}}>&bull;</span>
                <span className="text-[14px] text-[#444]">{care}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Separador suave */}
      <hr className="my-6" style={{border:'none',borderTop:'1px solid #EEE',margin:'24px 0'}} />

      {/* Personalidad de la Planta */}
      {personality && (
        <div className="mb-4">
          <div className="flex items-center mb-3">
            <Bot size={20} strokeWidth={2} color="#555" className="mr-2" />
            <span className="text-[18px] font-semibold text-[#333]">Personalidad de la Planta</span>
          </div>
          {/* Estilo de comunicación */}
          {personality.communicationStyle && (
            <div className={Array.isArray(personality.communicationStyle) && personality.communicationStyle.length > 1 ? 'grid grid-cols-2 gap-x-4 mb-3' : 'flex justify-center mb-3'}>
              {(Array.isArray(personality.communicationStyle) ? personality.communicationStyle : [personality.communicationStyle]).map((style, idx) => (
                <div key={idx} className="flex flex-col items-start mb-2">
                  <span className="text-[12px] uppercase tracking-[0.4px] text-[#777] font-medium">ESTILO</span>
                  <span className="text-[15px] font-semibold text-[#333] mt-1">{style}</span>
                </div>
              ))}
            </div>
          )}
          {/* Frases típicas */}
          {personality.catchphrases && personality.catchphrases.length > 0 && (
            <div>
              <h4 className="font-semibold text-[14px] text-[#333] mb-2">Frases Típicas</h4>
              <div className="flex flex-wrap gap-2">
                {personality.catchphrases.map((phrase, idx) => (
                  <span key={idx} className="inline-block bg-[#F0FDF6] text-[#046A38] text-[14px] px-2 py-1 rounded-[4px] font-medium" style={{padding:'4px 8px',marginRight:8,marginBottom:8}}>{phrase}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 