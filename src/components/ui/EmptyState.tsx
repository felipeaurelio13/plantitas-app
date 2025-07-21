import React from 'react';
import { motion } from 'framer-motion';
import { Button } from './Button';
import { cn } from '../../lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  illustration?: 'plants' | 'search' | 'chat' | 'camera' | 'settings';
  className?: string;
}

// Ilustraciones SVG minimalistas
const illustrations = {
  plants: (
    <svg viewBox="0 0 200 150" className="w-32 h-24 text-primary-300 dark:text-primary-600">
      <motion.g
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        {/* Maceta */}
        <motion.path
          d="M60 120 L140 120 L130 100 L70 100 Z"
          fill="currentColor"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        />
        
        {/* Planta 1 */}
        <motion.g
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.5, duration: 0.8, type: 'spring' }}
        >
          <path
            d="M80 100 Q85 80 90 85 Q95 75 85 70 Q75 75 80 100"
            fill="currentColor"
            opacity="0.8"
          />
        </motion.g>
        
        {/* Planta 2 */}
        <motion.g
          initial={{ scale: 0, rotate: 10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.7, duration: 0.8, type: 'spring' }}
        >
          <path
            d="M100 100 Q105 85 110 90 Q115 80 105 75 Q95 80 100 100"
            fill="currentColor"
            opacity="0.7"
          />
        </motion.g>
        
        {/* Planta 3 */}
        <motion.g
          initial={{ scale: 0, rotate: -5 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.9, duration: 0.8, type: 'spring' }}
        >
          <path
            d="M120 100 Q125 90 130 95 Q135 85 125 80 Q115 85 120 100"
            fill="currentColor"
            opacity="0.6"
          />
        </motion.g>
      </motion.g>
    </svg>
  ),
  
  search: (
    <svg viewBox="0 0 200 150" className="w-32 h-24 text-primary-300 dark:text-primary-600">
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Lupa */}
        <motion.circle
          cx="80"
          cy="70"
          r="25"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5, type: 'spring' }}
        />
        <motion.line
          x1="100"
          y1="88"
          x2="120"
          y2="108"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        />
        
        {/* Puntos decorativos */}
        <motion.circle
          cx="140"
          cy="50"
          r="2"
          fill="currentColor"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, duration: 0.3 }}
        />
        <motion.circle
          cx="150"
          cy="40"
          r="3"
          fill="currentColor"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.2, duration: 0.3 }}
        />
      </motion.g>
    </svg>
  ),
  
  chat: (
    <svg viewBox="0 0 200 150" className="w-32 h-24 text-primary-300 dark:text-primary-600">
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Globo principal */}
        <motion.rect
          x="50"
          y="40"
          width="100"
          height="60"
          rx="20"
          fill="currentColor"
          opacity="0.8"
          initial={{ scale: 0, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6, type: 'spring' }}
        />
        
        {/* Cola del globo */}
        <motion.path
          d="M80 100 L70 115 L95 105 Z"
          fill="currentColor"
          opacity="0.8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        />
        
        {/* Puntos de texto */}
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          <circle cx="75" cy="70" r="3" fill="white" />
          <circle cx="100" cy="70" r="3" fill="white" />
          <circle cx="125" cy="70" r="3" fill="white" />
        </motion.g>
      </motion.g>
    </svg>
  ),
  
  camera: (
    <svg viewBox="0 0 200 150" className="w-32 h-24 text-primary-300 dark:text-primary-600">
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Cuerpo de la cámara */}
        <motion.rect
          x="60"
          y="60"
          width="80"
          height="50"
          rx="8"
          fill="currentColor"
          opacity="0.8"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
        />
        
        {/* Visor */}
        <motion.rect
          x="85"
          y="45"
          width="30"
          height="15"
          rx="4"
          fill="currentColor"
          opacity="0.6"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.4, duration: 0.3 }}
        />
        
        {/* Lente */}
        <motion.circle
          cx="100"
          cy="85"
          r="15"
          stroke="white"
          strokeWidth="2"
          fill="none"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.6, duration: 0.4, type: 'spring' }}
        />
        
        {/* Flash */}
        <motion.circle
          cx="120"
          cy="70"
          r="3"
          fill="currentColor"
          opacity="0.9"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ delay: 0.8, duration: 0.5 }}
        />
      </motion.g>
    </svg>
  ),
  
  settings: (
    <svg viewBox="0 0 200 150" className="w-32 h-24 text-primary-300 dark:text-primary-600">
      <motion.g
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        {/* Engranaje principal */}
        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '100px', originY: '75px' }}
        >
          <path
            d="M100 50 L110 60 L120 50 L120 60 L130 70 L120 80 L120 90 L110 90 L100 100 L90 90 L80 90 L80 80 L70 70 L80 60 L80 50 Z"
            fill="currentColor"
            opacity="0.7"
          />
          <circle cx="100" cy="75" r="8" fill="white" />
        </motion.g>
        
        {/* Engranaje secundario */}
        <motion.g
          animate={{ rotate: -360 }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          style={{ originX: '140px', originY: '95px' }}
        >
          <path
            d="M140 85 L145 90 L150 85 L150 90 L155 95 L150 100 L150 105 L145 105 L140 110 L135 105 L130 105 L130 100 L125 95 L130 90 L130 85 Z"
            fill="currentColor"
            opacity="0.5"
          />
          <circle cx="140" cy="95" r="5" fill="white" />
        </motion.g>
      </motion.g>
    </svg>
  )
};

const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon, 
  title, 
  description, 
  action, 
  illustration = 'plants',
  className 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-6 max-w-md mx-auto',
        className
      )}
    >
      {/* Ilustración o ícono */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5, ease: 'easeOut' }}
        className="mb-6"
      >
        {icon || illustrations[illustration]}
      </motion.div>

      {/* Título */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-3"
      >
        {title}
      </motion.h3>

      {/* Descripción */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="text-neutral-600 dark:text-neutral-400 mb-6 leading-relaxed"
      >
        {description}
      </motion.p>

      {/* Acción */}
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Button
            onClick={action.onClick}
            variant="primary"
            size="lg"
            className="animate-glow"
          >
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export { EmptyState }; 