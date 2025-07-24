import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import PlantDetail from '../../../src/pages/PlantDetail';
import { Plant } from '../../../src/schemas';

// Mock de hooks y servicios
const mockPlant: Plant = {
  id: 'test-plant-1',
  name: 'Monstera Deliciosa',
  species: 'Monstera deliciosa',
  nickname: 'Monstera',
  description: 'Una hermosa planta tropical con hojas características',
  funFacts: ['Es nativa de México', 'Puede crecer hasta 20 metros'],
  location: 'Interior',
  plantEnvironment: 'interior',
  lightRequirements: 'luz_indirecta',
  dateAdded: new Date('2024-01-01'),
  images: [
    {
      id: 'img-1',
      url: 'https://example.com/monstera.jpg',
      timestamp: new Date('2024-01-01'),
      isProfileImage: true,
      healthAnalysis: {
        overallHealth: 'good',
        confidence: 85,
        issues: [],
        recommendations: ['Keep up the good care!'],
        moistureLevel: 70,
        growthStage: 'mature'
      }
    }
  ],
  healthScore: 85,
  careProfile: {
    wateringFrequency: 7,
    sunlightRequirement: 'medium',
    humidityPreference: 'high',
    temperatureRange: { min: 18, max: 25 },
    fertilizingFrequency: 30,
    soilType: 'Well-draining potting mix'
  },
  personality: {
    traits: ['friendly', 'resilient'],
    communicationStyle: 'cheerful',
    catchphrases: ['¡Hola!', '¡Gracias por cuidarme!'],
    moodFactors: { health: 0.8, care: 0.9, attention: 0.7 }
  },
  chatHistory: [],
  notifications: []
};

vi.mock('../../../src/hooks/usePlantDetail', () => ({
  usePlantDetail: vi.fn(() => ({
    plant: mockPlant,
    isLoading: false,
    error: null
  }))
}));

vi.mock('../../../src/hooks/usePlantMutations', () => ({
  usePlantMutations: () => ({
    updatePlantHealthMutation: vi.fn(),
    isUpdatingPlantHealth: false
  })
}));

vi.mock('../../../src/stores/useAuthStore', () => ({
  useAuthStore: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    isAuthenticated: true
  })
}));

vi.mock('../../../src/components/ui/Toast', () => ({
  useToast: () => ({
    addToast: vi.fn()
  })
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('PlantDetail Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render plant information correctly', () => {
    render(
      <TestWrapper>
        <PlantDetail />
      </TestWrapper>
    );
    expect(screen.getByText('Monstera Deliciosa')).toBeInTheDocument();
    expect(screen.getByText('Monstera')).toBeInTheDocument();
    expect(screen.getByText('Interior')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
  });

  it('should display plant description and fun facts', () => {
    render(
      <TestWrapper>
        <PlantDetail />
      </TestWrapper>
    );
    expect(screen.getByText('Una hermosa planta tropical con hojas características')).toBeInTheDocument();
    expect(screen.getByText('Es nativa de México')).toBeInTheDocument();
    expect(screen.getByText('Puede crecer hasta 20 metros')).toBeInTheDocument();
  });

  it('should display care profile information', () => {
    render(
      <TestWrapper>
        <PlantDetail />
      </TestWrapper>
    );
    expect(screen.getByText(/7 días/i)).toBeInTheDocument();
    expect(screen.getByText(/luz indirecta/i)).toBeInTheDocument();
    expect(screen.getByText(/alta/i)).toBeInTheDocument();
  });

  it('should display health analysis information', () => {
    render(
      <TestWrapper>
        <PlantDetail />
      </TestWrapper>
    );
    expect(screen.getByText(/saludable/i)).toBeInTheDocument();
    expect(screen.getByText(/85%/i)).toBeInTheDocument();
    expect(screen.getByText(/Keep up the good care!/i)).toBeInTheDocument();
  });

  it('should display plant images', () => {
    render(
      <TestWrapper>
        <PlantDetail />
      </TestWrapper>
    );
    const image = screen.getByAltText('Monstera Deliciosa');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', 'https://example.com/monstera.jpg');
  });

  it('should have navigation buttons', () => {
    render(
      <TestWrapper>
        <PlantDetail />
      </TestWrapper>
    );
    expect(screen.getByRole('button', { name: /agregar foto/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /chat/i })).toBeInTheDocument();
  });

  it('should display environment and light requirements', () => {
    render(
      <TestWrapper>
        <PlantDetail />
      </TestWrapper>
    );
    expect(screen.getByText(/interior/i)).toBeInTheDocument();
    expect(screen.getByText(/luz indirecta/i)).toBeInTheDocument();
  });

  it('should handle missing optional fields gracefully', () => {
    const { usePlantDetail } = require('../../../src/hooks/usePlantDetail');
    const plantWithoutOptionalFields: Plant = {
      ...mockPlant,
      description: undefined,
      funFacts: undefined,
      plantEnvironment: undefined,
      lightRequirements: undefined
    };
    usePlantDetail.mockReturnValue({
      plant: plantWithoutOptionalFields,
      isLoading: false,
      error: null
    });
    render(
      <TestWrapper>
        <PlantDetail />
      </TestWrapper>
    );
    expect(screen.getByText('Monstera Deliciosa')).toBeInTheDocument();
    expect(screen.getByText('Monstera')).toBeInTheDocument();
  });

  it('should display loading state', () => {
    const { usePlantDetail } = require('../../../src/hooks/usePlantDetail');
    usePlantDetail.mockReturnValue({
      plant: null,
      isLoading: true,
      error: null
    });
    render(
      <TestWrapper>
        <PlantDetail />
      </TestWrapper>
    );
    expect(screen.getByText(/cargando/i)).toBeInTheDocument();
  });

  it('should display error state', () => {
    const { usePlantDetail } = require('../../../src/hooks/usePlantDetail');
    usePlantDetail.mockReturnValue({
      plant: null,
      isLoading: false,
      error: new Error('Failed to load plant')
    });
    render(
      <TestWrapper>
        <PlantDetail />
      </TestWrapper>
    );
    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });
}); 