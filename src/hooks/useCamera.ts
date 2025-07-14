import { useState, useRef, useCallback, useEffect } from 'react';

type FacingMode = 'user' | 'environment';

interface UseCameraProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

export const useCamera = ({ videoRef, canvasRef }: UseCameraProps) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<FacingMode>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          aspectRatio: 16 / 9
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError' || error.message.includes('Permission dismissed')) {
          setCameraError('Permiso de cámara denegado. Por favor, actívalo en los ajustes de tu navegador.');
        } else {
          setCameraError('No se pudo acceder a la cámara. Revisa los permisos y el dispositivo.');
        }
      } else {
        setCameraError('Ocurrió un error inesperado al acceder a la cámara.');
      }
    }
  }, [facingMode, videoRef]);

  useEffect(() => {
    startCamera();
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
    
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageDataUrl);
    setIsCapturing(true);

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    if ('vibrate' in navigator) navigator.vibrate(50);
  }, [videoRef, canvasRef]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    setIsCapturing(false);
    startCamera();
  }, [startCamera]);

  const switchCamera = () => {
    setFacingMode(prev => (prev === 'user' ? 'environment' : 'user'));
  };

  const selectFromGallery = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCapturedImage(result);
        setIsCapturing(true);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return {
    isCapturing,
    capturedImage,
    cameraError,
    captureImage,
    retakePhoto,
    switchCamera,
    startCamera,
    selectFromGallery
  };
}; 