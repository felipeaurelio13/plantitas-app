import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Upload, 
  X, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Image as ImageIcon,
  Sparkles
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import { useToast } from '../ui/Toast';

interface AddPhotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoAdded: (imageDataUrl: string, note?: string) => Promise<void>;
  plantName: string;
}

type UploadStep = 'choose' | 'preview' | 'uploading' | 'success' | 'error';

export const AddPhotoModal: React.FC<AddPhotoModalProps> = ({
  isOpen,
  onClose,
  onPhotoAdded,
  plantName
}) => {
  const [step, setStep] = useState<UploadStep>('choose');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  const handleReset = useCallback(() => {
    setStep('choose');
    setSelectedImage(null);
    setNote('');
    setError(null);
    setIsAnalyzing(false);
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  const handleFileSelect = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageDataUrl = e.target?.result as string;
      setSelectedImage(imageDataUrl);
      setStep('preview');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleGallerySelect = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleCameraCapture = useCallback(() => {
    // En un entorno real, esto abriría la cámara
    // Por ahora, simularemos seleccionando desde galería
    handleGallerySelect();
  }, [handleGallerySelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        setError('Por favor selecciona un archivo de imagen válido.');
        return;
      }
      
      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        setError('La imagen es demasiado grande. Máximo 5MB.');
        return;
      }
      
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleUpload = useCallback(async () => {
    if (!selectedImage) return;

    try {
      setStep('uploading');
      setIsAnalyzing(true);

      await onPhotoAdded(selectedImage, note.trim() || undefined);
      
      setStep('success');
      setIsAnalyzing(false);
      
      addToast({
        type: 'success',
        title: 'Foto agregada exitosamente',
        message: `Nueva imagen añadida a ${plantName}`
      });

      // Cerrar modal después de un breve delay
      setTimeout(() => {
        handleClose();
      }, 1500);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir la imagen');
      setStep('error');
      setIsAnalyzing(false);
    }
  }, [selectedImage, note, onPhotoAdded, plantName, addToast, handleClose]);

  const renderChooseStep = () => {
    console.log('[AddPhotoModal] Renderizando botón Tomar Foto:', <Camera className="w-6 h-6" />, 'Tomar Foto');
    console.log('[AddPhotoModal] Renderizando botón Elegir de Galería:', <Upload className="w-6 h-6" />, 'Elegir de Galería');
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6"
      >
        <div>
          <Camera className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Agregar Nueva Foto</h2>
          <p className="text-muted-foreground">
            Documenta el progreso de <span className="font-medium">{plantName}</span>
          </p>
        </div>

        <div className="grid gap-4">
          <Button
            variant="primary"
            size="lg"
            onClick={handleCameraCapture}
            className="h-16 gap-3 text-primary-foreground"
          >
            <Camera className="w-6 h-6" />
            Tomar Foto
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={handleGallerySelect}
            className="h-16 gap-3 text-primary-foreground"
          >
            <Upload className="w-6 h-6" />
            Elegir de Galería
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          data-testid="file-input"
        />
      </motion.div>
    );
  };

  const renderPreviewStep = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Vista Previa</h2>
        <p className="text-muted-foreground">
          Revisa la imagen antes de agregar a {plantName}
        </p>
      </div>

      {selectedImage && (
        <div className="space-y-4">
          <div className="aspect-video max-h-80 mx-auto rounded-lg overflow-hidden border">
            <img
              src={selectedImage}
              alt="Vista previa"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium">
              Nota (opcional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Agrega una nota sobre esta foto..."
              className="w-full p-3 border border-neutral-200 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={3}
              maxLength={200}
            />
            <div className="text-xs text-muted-foreground text-right">
              {note.length}/200
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setStep('choose')}
              className="flex-1"
            >
              Cambiar Imagen
            </Button>
            <Button
              variant="primary"
              onClick={handleUpload}
              className="flex-1 gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Analizar y Guardar
            </Button>
          </div>
        </div>
      )}
    </motion.div>
  );

  const renderUploadingStep = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center space-y-6 py-8"
    >
      <div className="space-y-4">
        <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin" />
        <div>
          <h2 className="text-xl font-semibold mb-2">
            {isAnalyzing ? 'Analizando imagen...' : 'Subiendo foto...'}
          </h2>
          <p className="text-muted-foreground">
            {isAnalyzing 
              ? 'La IA está evaluando la salud de tu planta' 
              : 'Guardando la nueva imagen en tu jardín'
            }
          </p>
        </div>
      </div>

      <div className="w-full bg-neutral-200 rounded-full h-2">
        <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: '70%' }}></div>
      </div>
    </motion.div>
  );

  const renderSuccessStep = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6 py-8"
    >
      <CheckCircle className="w-16 h-16 text-success-500 mx-auto" />
      <div>
        <h2 className="text-xl font-semibold mb-2">¡Foto agregada!</h2>
        <p className="text-muted-foreground">
          La nueva imagen ha sido añadida al progreso de {plantName}
        </p>
      </div>
    </motion.div>
  );

  const renderErrorStep = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center space-y-6 py-8"
    >
      <AlertCircle className="w-16 h-16 text-error-500 mx-auto" />
      <div>
        <h2 className="text-xl font-semibold mb-2">Error al subir</h2>
        <p className="text-muted-foreground mb-4">
          {error || 'Hubo un problema al procesar la imagen'}
        </p>
        <div className="flex gap-3 justify-center">
          <Button variant="secondary" onClick={() => setStep('choose')}>
            Intentar de Nuevo
          </Button>
          <Button variant="primary" onClick={handleClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </motion.div>
  );

  const renderCurrentStep = () => {
    switch (step) {
      case 'choose':
        return renderChooseStep();
      case 'preview':
        return renderPreviewStep();
      case 'uploading':
        return renderUploadingStep();
      case 'success':
        return renderSuccessStep();
      case 'error':
        return renderErrorStep();
      default:
        return renderChooseStep();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget && step !== 'uploading') {
              handleClose();
            }
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-md"
          >
            <Card>
              <CardContent className="p-6">
                {/* Header con botón cerrar */}
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-primary" />
                    <span className="font-medium text-sm text-muted-foreground">
                      NUEVA FOTO
                    </span>
                  </div>
                  {step !== 'uploading' && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={handleClose}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Contenido del paso actual */}
                {renderCurrentStep()}
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 