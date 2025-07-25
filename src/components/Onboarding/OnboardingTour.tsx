import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '../ui/Button';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface OnboardingTourProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
  steps: TourStep[];
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  isOpen,
  onComplete,
  onSkip,
  steps
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightElement, setHighlightElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  useEffect(() => {
    if (!isOpen || !step?.target) return;

    const element = document.querySelector(step.target) as HTMLElement;
    if (element) {
      setHighlightElement(element);
      
      // Calculate tooltip position
      const rect = element.getBoundingClientRect();
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
      
      let x, y;
      
      switch (step.position) {
        case 'top':
          x = rect.left + scrollLeft + rect.width / 2;
          y = rect.top + scrollTop - 20;
          break;
        case 'bottom':
          x = rect.left + scrollLeft + rect.width / 2;
          y = rect.bottom + scrollTop + 20;
          break;
        case 'left':
          x = rect.left + scrollLeft - 20;
          y = rect.top + scrollTop + rect.height / 2;
          break;
        case 'right':
          x = rect.right + scrollLeft + 20;
          y = rect.top + scrollTop + rect.height / 2;
          break;
        default:
          x = window.innerWidth / 2;
          y = window.innerHeight / 2;
      }
      
      setTooltipPosition({ x, y });
      
      // Scroll element into view
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      setHighlightElement(null);
      setTooltipPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    }
  }, [isOpen, step, currentStep]);

  const nextStep = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const getTooltipClasses = () => {
    if (!step?.position || step.position === 'center') {
      return '-translate-x-1/2 -translate-y-1/2';
    }
    
    switch (step.position) {
      case 'top':
        return '-translate-x-1/2 -translate-y-full';
      case 'bottom':
        return '-translate-x-1/2';
      case 'left':
        return '-translate-x-full -translate-y-1/2';
      case 'right':
        return '-translate-y-1/2';
      default:
        return '-translate-x-1/2 -translate-y-1/2';
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999]">
        {/* Overlay with highlight */}
        <div className="absolute inset-0 bg-black/60" />
        
        {/* Highlight spotlight */}
        {highlightElement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute pointer-events-none"
            style={{
              left: highlightElement.getBoundingClientRect().left + window.pageXOffset,
              top: highlightElement.getBoundingClientRect().top + window.pageYOffset,
              width: highlightElement.getBoundingClientRect().width,
              height: highlightElement.getBoundingClientRect().height,
              boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.6), 0 0 20px rgba(34, 197, 94, 0.5)',
              borderRadius: '8px'
            }}
          />
        )}

        {/* Tooltip */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={`absolute bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-w-sm ${getTooltipClasses()}`}
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                Paso {currentStep + 1} de {steps.length}
              </span>
            </div>
            <button
              onClick={onSkip}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Omitir tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              {step.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
              {step.description}
            </p>
          </div>

          {/* Custom action */}
          {step.action && (
            <div className="mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={step.action.onClick}
                className="w-full"
              >
                {step.action.label}
              </Button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={prevStep}
              disabled={isFirstStep}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>

            <div className="flex gap-1">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep 
                      ? 'bg-green-500' 
                      : index < currentStep 
                        ? 'bg-green-300' 
                        : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>

            <Button
              size="sm"
              onClick={nextStep}
              className="flex items-center gap-1"
            >
              {isLastStep ? 'Finalizar' : 'Siguiente'}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </Button>
          </div>

          {/* Skip option */}
          <div className="mt-4 text-center">
            <button
              onClick={onSkip}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Omitir tour
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};