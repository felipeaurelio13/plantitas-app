import React from 'react';
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
import { Line } from 'react-chartjs-2';
import { Plant } from '../schemas';
import { format } from 'date-fns';

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
  className?: string;
}

const PlantProgressChart: React.FC<PlantProgressChartProps> = ({ plant, className = '' }) => {
  // Generate health data from actual plant images with health analysis
  const generateHealthData = () => {
    // Get images with health analysis, sorted by date
    const imagesWithHealth = plant.images
      .filter(img => img.healthAnalysis)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    if (imagesWithHealth.length === 0) {
      // If no health data, show current health score as a single point
      return {
        labels: [format(new Date(), 'MMM dd')],
        data: [plant.healthScore],
      };
    }

    // If we have health data, use it
    const labels = imagesWithHealth.map(img => format(img.timestamp, 'MMM dd'));
    const data = imagesWithHealth.map(img => {
      if (!img.healthAnalysis) return plant.healthScore;
      
      // Convert health analysis to a score
      const healthMap = {
        'excellent': 95,
        'good': 80,
        'fair': 60,
        'poor': 30
      };
      
      return healthMap[img.healthAnalysis.overallHealth] || plant.healthScore;
    });

    // If we have less than 3 data points, add the current health score
    if (data.length < 3) {
      labels.push(format(new Date(), 'MMM dd'));
      data.push(plant.healthScore);
    }

    return { labels, data };
  };

  const { labels, data } = generateHealthData();

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Salud de la Planta',
        data,
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        fill: true,
        tension: 0.4,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: 'rgb(255, 255, 255)',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6,
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
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          label: (context: any) => `Salud: ${context.parsed.y}%`,
        },
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
        ticks: {
          maxTicksLimit: 6,
          color: 'rgb(156, 163, 175)',
          font: {
            size: 12,
          },
        },
      },
      y: {
        display: true,
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(156, 163, 175, 0.2)',
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          font: {
            size: 12,
          },
          callback: (value: any) => `${value}%`,
        },
      },
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
  };

  const hasHealthData = plant.images.some(img => img.healthAnalysis);

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Progreso de Salud
        </h3>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {hasHealthData ? 'Basado en fotos' : 'Datos actuales'}
          </span>
        </div>
      </div>
      
      {!hasHealthData && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            📸 Toma fotos de tu planta para ver el progreso de salud real basado en análisis de IA
          </p>
        </div>
      )}
      
      <div className="h-48">
        <Line data={chartData} options={options} />
      </div>
      
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-green-500">{plant.healthScore}%</p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Actual</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-blue-500">
            {Math.max(...data).toFixed(0)}%
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Máximo</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-orange-500">
            {(data.reduce((a, b) => a + b, 0) / data.length).toFixed(0)}%
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400">Promedio</p>
        </div>
      </div>
    </div>
  );
};

export default PlantProgressChart;