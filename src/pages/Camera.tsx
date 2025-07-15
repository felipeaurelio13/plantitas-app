import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { usePlantMutations } from '@/hooks/usePlantMutations';
import { useCamera } from '@/hooks/useCamera';

import { CameraErrorState } from '../components/camera/CameraErrorState';
import { ImagePreview } from '../components/camera/ImagePreview';
import { CameraCaptureView } from '../components/camera/CameraCaptureView';

const CameraPage: React.FC = () => {
  const navigate = useNavigate();
  const { createPlant, isCreatingPlant } = usePlantMutations();

  const videoRef = useRef<HTMLVideoElement>(null);
  const photoRef = useRef<HTMLCanvasElement>(null);

  const {
    isCapturing,
    capturedImage,
    cameraError,
    captureImage,
    retakePhoto,
    switchCamera,
    startCamera,
    selectFromGallery,
  } = useCamera({ videoRef, canvasRef: photoRef });

  const [flashEnabled, setFlashEnabled] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const analyzeAndSave = () => {
    if (!capturedImage) return;

    const promise = new Promise((resolve, reject) => {
      createPlant(capturedImage, {
        onSuccess: (newPlant) => {
          // We navigate to the new plant's detail page on success.
          if (newPlant?.id) {
            navigate(`/plant/${newPlant.id}`);
          } else {
            // Fallback to the dashboard if for some reason the new plant has no ID.
            navigate('/');
          }
          resolve(newPlant);
        },
        onError: (error) => {
          reject(error);
        },
      });
    });

    toast.promise(promise, {
      loading: 'Analizando imagen... La IA está trabajando.',
      success: (data: any) => `¡Planta "${data.name}" creada con éxito!`,
      error: (err) => `Error: ${err.message}`,
    });
  };

  const toggleFlash = () => setFlashEnabled((prev) => !prev);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      selectFromGallery(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black z-50">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        id="gallery-input"
      />
      <AnimatePresence mode="wait">
        {cameraError ? (
          <CameraErrorState key="error" error={cameraError} onRetry={startCamera} />
        ) : !isCapturing ? (
          <CameraCaptureView
            key="capture"
            videoRef={videoRef}
            canvasRef={photoRef}
            flashEnabled={flashEnabled}
            onCapture={captureImage}
            onSwitchCamera={switchCamera}
            onToggleFlash={toggleFlash}
            onSelectFromGallery={() => fileInputRef.current?.click()}
          />
        ) : (
          <ImagePreview
            key="preview"
            image={capturedImage!}
            isAnalyzing={isCreatingPlant} // Use the mutation's loading state
            onRetake={retakePhoto}
            onAnalyze={analyzeAndSave}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default CameraPage;