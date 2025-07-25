import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  X, 
  FileText, 
  Database, 
  Image, 
  MessageCircle,
  Info,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useDataExport } from '../../hooks/useDataExport';
import { useToast } from '../ui/Toast/ToastProvider';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const [format, setFormat] = useState<'json' | 'csv'>('json');
  const [includeImages, setIncludeImages] = useState(true);
  const [includeChats, setIncludeChats] = useState(false);
  
  const { exportData, isExporting, getExportSize } = useDataExport();
  const { showSuccess, showError } = useToast();
  const { plantCount, estimatedSize } = getExportSize();

  const handleExport = async () => {
    try {
      await exportData({
        format,
        includeImages,
        includeChats
      });
      
      showSuccess(
        'Exportación completada',
        `Se descargaron los datos de ${plantCount} plantas en formato ${format.toUpperCase()}.`
      );
      
      onClose();
    } catch (error) {
      showError(
        'Error en la exportación',
        error instanceof Error ? error.message : 'No se pudo completar la exportación.'
      );
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Download className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Exportar Datos
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Descarga una copia de tus datos de plantas
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isExporting}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1"
                aria-label="Cerrar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Stats */}
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Plantas a exportar:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{plantCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-2">
                <span className="text-gray-600 dark:text-gray-400">Tamaño estimado:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{estimatedSize}</span>
              </div>
            </div>

            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Formato de archivo
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setFormat('json')}
                  disabled={isExporting}
                  className={`
                    p-4 rounded-lg border-2 transition-all text-left
                    ${format === 'json'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Database className={`w-5 h-5 ${format === 'json' ? 'text-blue-600' : 'text-gray-500'}`} />
                    <div>
                      <div className={`font-medium ${format === 'json' ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>
                        JSON
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Completo, reimportable
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setFormat('csv')}
                  disabled={isExporting}
                  className={`
                    p-4 rounded-lg border-2 transition-all text-left
                    ${format === 'csv'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <FileText className={`w-5 h-5 ${format === 'csv' ? 'text-blue-600' : 'text-gray-500'}`} />
                    <div>
                      <div className={`font-medium ${format === 'csv' ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-gray-100'}`}>
                        CSV
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Para Excel/Sheets
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Options */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Incluir en la exportación
              </label>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeImages}
                    onChange={(e) => setIncludeImages(e.target.checked)}
                    disabled={isExporting}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <Image className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Metadatos de imágenes
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer opacity-50">
                  <input
                    type="checkbox"
                    checked={includeChats}
                    onChange={(e) => setIncludeChats(e.target.checked)}
                    disabled={true} // Disabled until chat history is implemented
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <MessageCircle className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-500">
                    Historial de chat (próximamente)
                  </span>
                </label>
              </div>
            </div>

            {/* Info */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex gap-3">
                <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-blue-800 dark:text-blue-200 font-medium mb-1">
                    Sobre la exportación
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 leading-relaxed">
                    Los datos exportados incluyen toda la información de tus plantas: nombres, especies, 
                    cuidados, fechas de riego y ubicaciones. Las imágenes se incluyen como referencias URL.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isExporting}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || plantCount === 0}
              loading={isExporting}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Exportando...' : 'Exportar Datos'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};