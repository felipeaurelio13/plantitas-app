import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Plant, PlantImage } from '@/schemas';
import format from 'date-fns/format';
import { es } from 'date-fns/locale';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface PlantProgressChartProps {
  plant: Plant;
}

export const PlantProgressChart: React.FC<PlantProgressChartProps> = ({ plant }) => {
  const data = {
    labels: plant.images.map((img: PlantImage) => format(new Date(img.timestamp), 'dd MMM', { locale: es })),
    datasets: [
      {
        label: 'Salud de la Planta',
        data: plant.images.map((img: PlantImage) => img.healthAnalysis?.confidence || 0),
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(134, 239, 172, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Progreso de la Salud',
        color: '#1F2937',
        font: {
          size: 16,
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#4B5563',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: '#4B5563',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md h-64">
      <Line data={data} options={options} />
    </div>
  );
};