import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, DotProps } from 'recharts';
import { PlantImage } from '@/schemas';
import { Button } from '../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

interface PlantHealthEvolutionChartProps {
  images: PlantImage[];
}

function formatDate(date: Date | string) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: '2-digit' });
}

export const PlantHealthEvolutionChart: React.FC<PlantHealthEvolutionChartProps> = ({ images }) => {
  const [showModal, setShowModal] = useState(false);

  // Prepara los datos para el gráfico y la tabla
  const data = images
    .filter(img => img.healthAnalysis && (typeof img.healthAnalysis.confidence === 'number' || img.healthAnalysis.overallHealth))
    .map(img => {
      let score: number | undefined = undefined;
      const healthScoreMap: Record<string, number> = {
        'excellent': 95,
        'good': 80,
        'fair': 60,
        'poor': 30
      };
      if (img.healthAnalysis?.overallHealth && healthScoreMap[img.healthAnalysis.overallHealth]) {
        score = healthScoreMap[img.healthAnalysis.overallHealth];
      } else if (typeof img.healthAnalysis?.confidence === 'number') {
        score = img.healthAnalysis.confidence <= 1 ? img.healthAnalysis.confidence * 100 : img.healthAnalysis.confidence;
      }
      return {
        id: img.id,
        date: formatDate(img.timestamp),
        rawDate: img.timestamp,
        score: score ?? null,
        url: img.url
      };
    })
    .filter(d => d.score !== null)
    .sort((a, b) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime());

  // Custom dot for chart
  const renderDot = (props: DotProps) => {
    const { key, ...rest } = props;
    return <circle key={key} {...rest} r={4} stroke="#2A7F3E" strokeWidth={2} fill="#fff" />;
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-[#2A7F3E]">Evolución de Salud</h3>
        <Button size="sm" variant="outline" onClick={() => setShowModal(true)}>
          Ampliar
        </Button>
      </div>
      <div className="w-full h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F8F5" />
            <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#888' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#888' }} width={32} />
            <Tooltip contentStyle={{ fontSize: 13, borderRadius: 8 }} formatter={(v: any) => `${v}%`} />
            <Line type="monotone" dataKey="score" stroke="#2A7F3E" strokeWidth={2} dot={renderDot} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm border-separate border-spacing-y-1">
          <thead>
            <tr className="text-[#666]">
              <th className="text-left font-medium px-2 py-1">Fecha</th>
              <th className="text-left font-medium px-2 py-1">Imagen</th>
              <th className="text-left font-medium px-2 py-1">Salud</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="bg-[#F9F9F9] hover:bg-[#F0F8F5] transition-colors">
                <td className="px-2 py-1 whitespace-nowrap">{row.date}</td>
                <td className="px-2 py-1">
                  <img src={row.url} alt="miniatura" className="w-10 h-10 object-cover rounded-md border" />
                </td>
                <td className="px-2 py-1 font-medium text-[#2A7F3E]">{row.score?.toFixed(0)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Popup modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto p-6 relative"
              onClick={e => e.stopPropagation()}
            >
              <Button size="icon-sm" variant="ghost" className="absolute top-2 right-2" onClick={() => setShowModal(false)}>
                ×
              </Button>
              <h3 className="text-lg font-semibold mb-4 text-[#2A7F3E]">Evolución de Salud (Ampliado)</h3>
              <div className="w-full h-72 mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F8F5" />
                    <XAxis dataKey="date" tick={{ fontSize: 13, fill: '#888' }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 13, fill: '#888' }} width={36} />
                    <Tooltip contentStyle={{ fontSize: 14, borderRadius: 8 }} formatter={(v: any) => `${v}%`} />
                    <Line type="monotone" dataKey="score" stroke="#2A7F3E" strokeWidth={2} dot={renderDot} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm border-separate border-spacing-y-1">
                  <thead>
                    <tr className="text-[#666]">
                      <th className="text-left font-medium px-2 py-1">Fecha</th>
                      <th className="text-left font-medium px-2 py-1">Imagen</th>
                      <th className="text-left font-medium px-2 py-1">Salud</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((row) => (
                      <tr key={row.id} className="bg-[#F9F9F9] hover:bg-[#F0F8F5] transition-colors">
                        <td className="px-2 py-1 whitespace-nowrap">{row.date}</td>
                        <td className="px-2 py-1">
                          <img src={row.url} alt="miniatura" className="w-12 h-12 object-cover rounded-md border" />
                        </td>
                        <td className="px-2 py-1 font-medium text-[#2A7F3E]">{row.score?.toFixed(0)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 