import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { navigation } from '../lib/navigation';

interface OnboardingState {
  hasCompletedTour: boolean;
  hasAddedFirstPlant: boolean;
  hasUsedChat: boolean;
  currentVersion: string;
}

const ONBOARDING_VERSION = '1.0.0';
const STORAGE_KEY = 'plantitas-onboarding-state';

export const useOnboarding = () => {
  const navigate = useNavigate();
  const [state, setState] = useState<OnboardingState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Reset onboarding if version changed
        if (parsed.currentVersion !== ONBOARDING_VERSION) {
          return {
            hasCompletedTour: false,
            hasAddedFirstPlant: false,
            hasUsedChat: false,
            currentVersion: ONBOARDING_VERSION,
          };
        }
        return parsed;
      }
    } catch (error) {
      console.warn('Error loading onboarding state:', error);
    }
    
    return {
      hasCompletedTour: false,
      hasAddedFirstPlant: false,
      hasUsedChat: false,
      currentVersion: ONBOARDING_VERSION,
    };
  });

  // Save to localStorage whenever state changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.warn('Error saving onboarding state:', error);
    }
  }, [state]);

  const updateState = (updates: Partial<OnboardingState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const shouldShowTour = () => {
    return !state.hasCompletedTour;
  };

  const completeTour = () => {
    updateState({ hasCompletedTour: true });
  };

  const markFirstPlantAdded = () => {
    updateState({ hasAddedFirstPlant: true });
  };

  const markChatUsed = () => {
    updateState({ hasUsedChat: true });
  };

  const resetOnboarding = () => {
    setState({
      hasCompletedTour: false,
      hasAddedFirstPlant: false,
      hasUsedChat: false,
      currentVersion: ONBOARDING_VERSION,
    });
  };

  // Tour steps configuration
  const getTourSteps = () => [
    {
      id: 'welcome',
      title: '¡Bienvenido a Plantitas! 🌱',
      description: 'Tu asistente personal para el cuidado de plantas. Te ayudaremos a mantener tus plantas saludables y felices.',
      position: 'center' as const,
    },
    {
      id: 'add-plant',
      title: 'Agrega tu primera planta',
      description: 'Usa el botón flotante para tomar una foto de tu planta. Nuestra IA la identificará automáticamente.',
      target: '[data-tour="add-plant-fab"]',
      position: 'left' as const,
      action: {
        label: 'Ir a cámara',
        onClick: () => navigate(navigation.toCamera()),
      }
    },
    {
      id: 'navigation',
      title: 'Navegación principal',
      description: 'Usa la navegación inferior para moverte entre el jardín, chat IA y configuraciones.',
      target: '[data-tour="bottom-navigation"]',
      position: 'top' as const,
    },
    {
      id: 'chat-ai',
      title: 'Chat con IA experta',
      description: 'Haz preguntas sobre cuidado de plantas, identificación o cualquier duda que tengas.',
      target: '[data-tour="chat-tab"]',
      position: 'top' as const,
      action: {
        label: 'Probar chat',
        onClick: () => navigate(navigation.toGardenChat()),
      }
    },
    {
      id: 'search-filter',
      title: 'Busca y organiza',
      description: 'Usa la búsqueda y filtros para encontrar rápidamente tus plantas cuando tengas muchas.',
      target: '[data-tour="search-input"]',
      position: 'bottom' as const,
    },
    {
      id: 'complete',
      title: '¡Listo para empezar! 🎉',
      description: 'Ya conoces lo básico. ¡Comienza agregando tu primera planta y explorando todas las funciones!',
      position: 'center' as const,
    }
  ];

  return {
    state,
    shouldShowTour,
    completeTour,
    markFirstPlantAdded,
    markChatUsed,
    resetOnboarding,
    getTourSteps,
  };
};