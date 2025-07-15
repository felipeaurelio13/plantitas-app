import React from 'react';
import { motion } from 'framer-motion';
import { X, Camera as CameraIcon, RotateCcw, Image, Sparkles, Slash } from 'lucide-react';
import { Button } from '../ui/Button';
import { useNavigate } from 'react-router-dom';

interface CameraCaptureViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  flashEnabled: boolean;
  onCapture: () => void;
  onSwitchCamera: () => void;
  onToggleFlash: () => void;
  onSelectFromGallery: () => void;
}

export const CameraCaptureView: React.FC<CameraCaptureViewProps> = ({
  videoRef,
  canvasRef,
  flashEnabled,
  onCapture,
  onSwitchCamera,
  onToggleFlash,
  onSelectFromGallery
}) => {
  const navigate = useNavigate();

  return (
    <>
      <motion.video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Camera Controls */}
      <div className="absolute top-0 left-0 right-0 p-4 safe-area-top z-20">
        <div className="flex items-center justify-between">
          <Button onClick={() => navigate('/')} variant="ghost" size="icon" className="rounded-full bg-black/50">
            <X size={20} />
          </Button>
          
          <div className="flex items-center space-x-4">
            <Button
              onClick={onToggleFlash}
              variant="ghost"
              size="icon"
              className={`rounded-full ${flashEnabled ? 'bg-yellow-500 text-black hover:bg-yellow-600' : 'bg-black/50'}`}
            >
              {flashEnabled ? <Sparkles size={20} /> : <Slash size={20} />}
            </Button>
            
            <Button
              onClick={onSwitchCamera}
              variant="ghost"
              size="icon"
              className="rounded-full bg-black/50"
            >
              <RotateCcw size={20} />
            </Button>
          </div>
        </div>
      </div>

      {/* Capture Button */}
      <div className="absolute bottom-0 left-0 right-0 p-8 safe-area-bottom z-20">
        <div className="flex items-center justify-center space-x-8">
          <Button
            onClick={onSelectFromGallery}
            size="icon"
            variant="ghost"
            className="w-14 h-14 rounded-full bg-black/50"
          >
            <Image size={24} />
          </Button>
          
          <motion.button
            onClick={onCapture}
            className="w-20 h-20 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center ios-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center">
              <CameraIcon size={24} className="text-gray-600" />
            </div>
          </motion.button>
          
          <div className="w-14 h-14" />
        </div>
        
        <p className="text-center text-white mt-4 text-sm">
          Position your plant in the frame and tap to capture, or select from gallery
        </p>
      </div>

      {/* Camera Guidelines */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-64 h-64 border-2 border-white/50 rounded-2xl" />
      </div>
    </>
  );
}; 