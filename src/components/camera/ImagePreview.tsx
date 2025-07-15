import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../ui/Button';

interface ImagePreviewProps {
  image: string;
  isAnalyzing: boolean;
  onRetake: () => void;
  onAnalyze: () => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ image, isAnalyzing, onRetake, onAnalyze }) => {
  return (
    <>
      <motion.img
        src={image}
        alt="Captured plant"
        className="absolute inset-0 w-full h-full object-cover z-10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />
      
      <div className="absolute bottom-0 left-0 right-0 p-8 safe-area-bottom z-20">
        <div className="flex items-center justify-center space-x-6">
          <Button
            onClick={onRetake}
            variant="secondary"
            disabled={isAnalyzing}
          >
            Retake
          </Button>
          
          <Button
            onClick={onAnalyze}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Analyzing...</span>
              </div>
            ) : (
              'Add Plant'
            )}
          </Button>
        </div>
        
        {isAnalyzing && (
          <p className="text-center text-white mt-4 text-sm">
            AI is identifying your plant and creating a care profile...
          </p>
        )}
      </div>
    </>
  );
}; 