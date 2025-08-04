import { useState } from 'react';
import { usePlantsQuery } from './usePlantsQuery';
// import { Plant } from '../schemas'; // Commented out as it's not directly used

interface ExportOptions {
  format: 'json' | 'csv';
  includeImages: boolean;
  includeChats: boolean;
}

interface ExportData {
  exportDate: string;
  plantCount: number;
  plants: any[];
  metadata: {
    version: string;
    source: 'Plant Care Companion';
  };
}

export const useDataExport = () => {
  const [isExporting, setIsExporting] = useState(false);
  const { data: plants = [] } = usePlantsQuery();

  const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const sanitizeForCSV = (value: any): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // Escape commas and quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const exportToJSON = async (options: ExportOptions): Promise<void> => {
    setIsExporting(true);
    
    try {
      const exportData: ExportData = {
        exportDate: new Date().toISOString(),
        plantCount: plants.length,
        plants: plants.map(plant => ({
          id: plant.id,
          name: plant.name,
          nickname: plant.nickname,
          species: plant.species,
          location: plant.location,
          plantEnvironment: plant.plantEnvironment,
          lightRequirements: plant.lightRequirements,
          healthScore: plant.healthScore,
          lastWatered: plant.lastWatered?.toISOString(),
          // Note: Some fields may not be available in current schema
          ...(options.includeImages && {
            profileImageUrl: plant.profileImageId
          }),
          // Placeholder for future chat integration
          ...(options.includeChats && {
            chatHistory: [] // Will be implemented when chat history is available
          })
        })),
        metadata: {
          version: '1.0.0',
          source: 'Plant Care Companion'
        }
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      
      downloadFile(blob, `plantas-backup-${formatDate(new Date())}.json`);
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      throw new Error('Failed to export data as JSON');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = async (options: ExportOptions): Promise<void> => {
    setIsExporting(true);
    
    try {
      const headers = [
        'ID',
        'Nombre',
        'Apodo',
        'Especie',
        'Ubicación',
        'Ambiente',
        'Luz Requerida',
        'Puntuación Salud',
        'Último Riego'
      ];

              if (options.includeImages) {
          headers.push('Imagen Principal');
        }

      const csvRows = [headers.join(',')];
      
      plants.forEach(plant => {
        const row = [
          sanitizeForCSV(plant.id),
          sanitizeForCSV(plant.name),
          sanitizeForCSV(plant.nickname || ''),
          sanitizeForCSV(plant.species),
          sanitizeForCSV(plant.location),
          sanitizeForCSV(plant.plantEnvironment || ''),
          sanitizeForCSV(plant.lightRequirements || ''),
          sanitizeForCSV(plant.healthScore || ''),
          sanitizeForCSV(plant.lastWatered ? formatDate(plant.lastWatered) : '')
        ];

        if (options.includeImages) {
          row.push(
            sanitizeForCSV(plant.profileImageId || '')
          );
        }

        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      downloadFile(blob, `plantas-${formatDate(new Date())}.csv`);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw new Error('Failed to export data as CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadFile = (blob: Blob, filename: string): void => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportData = async (options: ExportOptions): Promise<void> => {
    if (plants.length === 0) {
      throw new Error('No hay plantas para exportar');
    }

    switch (options.format) {
      case 'json':
        return exportToJSON(options);
      case 'csv':
        return exportToCSV(options);
      default:
        throw new Error('Formato de exportación no soportado');
    }
  };

  const getExportSize = (): { plantCount: number; estimatedSize: string } => {
    const estimatedSizeBytes = plants.length * 1024; // Rough estimate: 1KB per plant
    const estimatedSizeMB = estimatedSizeBytes / (1024 * 1024);
    
    return {
      plantCount: plants.length,
      estimatedSize: estimatedSizeMB > 1 
        ? `${estimatedSizeMB.toFixed(1)} MB` 
        : `${Math.round(estimatedSizeBytes / 1024)} KB`
    };
  };

  // Auto-backup functionality
  const createAutoBackup = async (): Promise<void> => {
    try {
      const lastBackup = localStorage.getItem('last-auto-backup');
      const now = new Date().getTime();
      const oneWeek = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

      if (!lastBackup || (now - parseInt(lastBackup)) > oneWeek) {
        await exportToJSON({
          format: 'json',
          includeImages: false, // Keep auto-backup lightweight
          includeChats: false
        });
        
        localStorage.setItem('last-auto-backup', now.toString());
      }
    } catch (error) {
      console.warn('Auto-backup failed:', error);
    }
  };

  return {
    exportData,
    isExporting,
    getExportSize,
    createAutoBackup,
    availableFormats: ['json', 'csv'] as const
  };
};