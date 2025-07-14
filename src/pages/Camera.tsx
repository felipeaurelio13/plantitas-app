import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera as CameraIcon, RotateCcw, AlertCircle, RefreshCw, Image as ImageIcon, Sparkles } from 'lucide-react';
import { usePlantStore, useAuthStore } from '../stores';
import { analyzeImage } from '../services/aiService';
import { useCamera } from '../hooks/useCamera';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

const CameraError: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <motion.div
    className="absolute inset-0 bg-black/80 flex items-center justify-center p-4 z-20"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
  >
    <Card className="max-w-sm w-full text-center p-6">
      <div className="mx-auto w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <AlertCircle size={28} className="text-red-600" />
      </div>
      <h3 className="text-lg font-bold text-text-primary">Error de Cámara</h3>
      <p className="text-text-secondary mt-2 mb-6">{message}</p>
      <Button onClick={onRetry} fullWidth>
        <RefreshCw className="mr-2" size={16} />
        Reintentar
      </Button>
    </Card>
  </motion.div>
);

const AnalysisLoader: React.FC = () => (
  <motion.div
    className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 z-30"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
  >
    <Sparkles size={48} className="text-primary-400 animate-pulse" />
    <p className="text-white font-medium text-lg mt-4">Analizando imagen...</p>
    <p className="text-neutral-300 text-sm">Identificando especie y salud de la planta.</p>
  </motion.div>
);


const Camera: React.FC = () => {
  const navigate = useNavigate();
  const { createPlant } = usePlantStore();
  const user = useAuthStore((state) => state.user);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    capturedImage,
    cameraError,
    captureImage,
    retakePhoto,
    switchCamera,
    startCamera,
    selectFromGallery
  } = useCamera({ videoRef, canvasRef });

  const analyzeAndSave = async () => {
    if (!capturedImage) return;
    setIsAnalyzing(true);
    try {
      const analysis = await analyzeImage(capturedImage);
      const newPlant = {
        name: analysis.species || 'Unknown Plant',
        species: analysis.species || 'Unknown',
        variety: analysis.variety,
        location: 'Living Room', // Default location
        dateAdded: new Date(),
        images: [{
          id: `temp-${Date.now()}`,
          url: capturedImage,
          timestamp: new Date(),
          healthAnalysis: analysis.health,
          isProfileImage: true,
        }],
        healthScore: analysis.health?.overallHealth === 'excellent' ? 90 :
                    analysis.health?.overallHealth === 'good' ? 75 :
                    analysis.health?.overallHealth === 'fair' ? 60 : 40,
        careProfile: analysis.careProfile || {
          wateringFrequency: 7,
          sunlightRequirement: 'medium',
          humidityPreference: 'medium',
          temperatureRange: { min: 18, max: 24 },
          fertilizingFrequency: 30,
          soilType: 'Well-draining potting mix',
        },
        personality: analysis.personality || {
          traits: ['friendly', 'optimistic'],
          communicationStyle: 'cheerful',
          catchphrases: ['Hello there!', 'Thanks for taking care of me!'],
          moodFactors: { health: 0.4, care: 0.4, attention: 0.2 },
        },
        chatHistory: [],
        notifications: [],
      };
      if (user) {
        await createPlant(newPlant, user.id);
      }
      navigate('/');
    } catch (error) {
      console.error('Error analyzing image:', error);
      alert('Fallo al analizar la imagen. Por favor, inténtalo de nuevo.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) selectFromGallery(file);
  };

  return (
    <div className="fixed inset-0 bg-black z-40 flex items-center justify-center">
      <AnimatePresence>
        {isAnalyzing && <AnalysisLoader />}
      </AnimatePresence>

      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="relative w-full h-full">
        <AnimatePresence>
          {cameraError && <CameraError message={cameraError} onRetry={startCamera} />}
        </AnimatePresence>

        <motion.video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />

        <AnimatePresence>
          {capturedImage && (
            <motion.img
              src={capturedImage}
              className="absolute inset-0 w-full h-full object-cover z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>
        
        <div className="absolute top-0 left-0 right-0 p-4 z-20">
          <Button
            size="icon"
            variant="ghost"
            className="text-white bg-black/30 hover:bg-black/50"
            onClick={() => navigate('/')}
            aria-label="Cerrar cámara"
          >
            <X size={24} />
          </Button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
          {capturedImage ? (
            <div className="flex justify-center items-center gap-4">
              <Button size="lg" variant="outline" onClick={retakePhoto} className="bg-white/90 backdrop-blur-sm">
                <RotateCcw className="mr-2" size={18} /> Reintentar
              </Button>
              <Button size="lg" variant="primary" onClick={analyzeAndSave}>
                Analizar Planta <Sparkles className="ml-2" size={18} />
              </Button>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <Button size="icon" variant="ghost" className="text-white bg-black/30 hover:bg-black/50" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon size={24} />
              </Button>
              <button
                onClick={captureImage}
                className="w-20 h-20 rounded-full bg-white ring-4 ring-white/30 focus-ring"
                aria-label="Capturar foto"
              />
              <Button size="icon" variant="ghost" className="text-white bg-black/30 hover:bg-black/50" onClick={switchCamera}>
                <RotateCcw size={24} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Camera;