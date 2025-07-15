import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface CameraErrorStateProps {
  error: string;
  onRetry: () => void;
}

export const CameraErrorState: React.FC<CameraErrorStateProps> = ({ error, onRetry }) => {
  const navigate = useNavigate();

  return (
    <div className="absolute inset-0 bg-black flex items-center justify-center p-6">
      <div className="bg-gray-900 rounded-2xl p-6 max-w-sm w-full mx-4">
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <AlertCircle size={32} className="text-red-400" />
          </div>
          
          <h3 className="text-white text-lg font-semibold mb-2">
            Camera Access Required
          </h3>
          
          <p className="text-gray-300 text-sm mb-6 leading-relaxed">
            {error}
          </p>
          
          <div className="space-y-3 w-full">
            <Button onClick={onRetry}>
              <RefreshCw size={18} className="mr-2" />
              <span>Try Again</span>
            </Button>
            
            <Button
              onClick={() => navigate('/')}
              variant="secondary"
            >
              Go Back
            </Button>
          </div>
          
          <div className="mt-4 p-3 bg-gray-800 rounded-lg">
            <p className="text-gray-400 text-xs">
              <strong>How to enable camera:</strong><br />
              1. Click the camera icon in your browser's address bar<br />
              2. Select "Allow" for camera access<br />
              3. Refresh the page or tap "Try Again"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 