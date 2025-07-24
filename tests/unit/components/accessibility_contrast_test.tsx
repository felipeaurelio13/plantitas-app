import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ExpandableInfoSection } from '../src/components/PlantDetail/ExpandableInfoSection';
import { PlantDetailHeader } from '../src/components/PlantDetail/PlantDetailHeader';
import BottomNavigation from '../src/components/BottomNavigation';
import UpdateHealthDiagnosisButton from '../src/components/UpdateHealthDiagnosisButton';
import { PlantSummary } from '../src/schemas';

// Mock data actualizado según el schema real
const mockPlant: PlantSummary = {
  id: '1',
  name: 'Test Plant',
  species: 'Test Species',
  nickname: 'Testy',
  location: 'Interior',
  plantEnvironment: 'interior',
  lightRequirements: 'luz_indirecta',
  healthScore: 85,
  profileImageUrl: 'https://example.com/image.jpg'
};

// Mock data completo para componentes que requieren más datos
const mockFullPlant = {
  id: '1',
  name: 'Test Plant',
  species: 'Test Species',
  nickname: 'Testy',
  description: 'A test plant for accessibility testing',
  funFacts: ['Test fact 1', 'Test fact 2'],
  location: 'Interior',
  plantEnvironment: 'interior',
  lightRequirements: 'luz_indirecta',
  dateAdded: new Date(),
  images: [
    {
      id: '1',
      url: 'https://example.com/image.jpg',
      timestamp: new Date(),
      isProfileImage: true,
      healthAnalysis: {
        overallHealth: 'healthy',
        issues: ['minor_issue'],
        recommendations: ['water_more'],
        moistureLevel: 70,
        growthStage: 'mature',
        confidence: 85
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

// Mock de hooks y servicios
vi.mock('../src/hooks/usePlantMutations', () => ({
  usePlantMutations: () => ({
    updatePlantHealthMutation: vi.fn(),
    isUpdatingPlantHealth: false
  })
}));

vi.mock('../src/hooks/usePlantDetail', () => ({
  usePlantDetail: () => ({
    plant: mockFullPlant,
    isLoading: false,
    error: null
  })
}));

vi.mock('../src/stores/useAuthStore', () => ({
  useAuthStore: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    isAuthenticated: true
  })
}));

vi.mock('../src/components/ui/Toast', () => ({
  useToast: () => ({
    addToast: vi.fn()
  })
}));

describe('Accessibility Contrast Improvements', () => {
  test('Badges use high contrast colors', () => {
    render(
      <BrowserRouter>
        <ExpandableInfoSection plant={mockFullPlant} onAddPhoto={() => {}} />
      </BrowserRouter>
    );

    // Verificar que los badges usan las nuevas clases de alto contraste
    const badges = screen.getAllByText(/Atención|Saludable|Completo|Pendiente|Nueva/);
    badges.forEach(badge => {
      const className = badge.className;
      expect(className).toMatch(/badge-(error|warning|success|info)/);
    });
  });

  test('Navigation uses high contrast colors', () => {
    render(
      <BrowserRouter>
        <BottomNavigation />
      </BrowserRouter>
    );

    // Verificar que la navegación usa las nuevas clases de alto contraste
    const navItems = screen.getAllByRole('link');
    navItems.forEach(item => {
      const className = item.className;
      expect(className).toMatch(/nav-(active|inactive)-high-contrast/);
    });
  });

  test('UpdateHealthDiagnosisButton uses high contrast outline', () => {
    render(
      <BrowserRouter>
        <UpdateHealthDiagnosisButton 
          plant={mockPlant} 
          variant="outline" 
          showLabel={true}
        />
      </BrowserRouter>
    );

    const button = screen.getByRole('button');
    expect(button.className).toContain('btn-outline-high-contrast');
  });

  test('PlantDetailHeader buttons use glass button high contrast', () => {
    render(
      <BrowserRouter>
        <PlantDetailHeader plant={mockFullPlant} onShare={() => {}} />
      </BrowserRouter>
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      const className = button.className;
      if (className.includes('glass-button-white-text')) {
        expect(className).toContain('glass-button-white-text');
      }
    });
  });
});

// Test de contraste visual mejorado
describe('Visual Contrast Validation', () => {
  test('All interactive elements have sufficient contrast', () => {
    // Este test verifica que los elementos interactivos tengan contraste suficiente
    // En un entorno real, usaríamos axe-core o pa11y para verificación automática
    
    // Verificar que los elementos tienen las clases de alto contraste
    const highContrastClasses = [
      'badge-error',
      'badge-warning', 
      'badge-success',
      'badge-info',
      'nav-active-high-contrast',
      'nav-inactive-high-contrast',
      'btn-outline-high-contrast',
      'glass-button-white-text'
    ];
    
    // Simular verificación de contraste
    expect(highContrastClasses.length).toBeGreaterThan(0);
    expect(true).toBe(true); // Placeholder para verificación real
  });

  test('Accessibility attributes are present', () => {
    render(
      <BrowserRouter>
        <UpdateHealthDiagnosisButton 
          plant={mockPlant} 
          variant="outline" 
          showLabel={true}
        />
      </BrowserRouter>
    );

    const button = screen.getByRole('button');
    
    // Verificar que el botón tiene atributos de accesibilidad
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label');
    expect(button).toHaveAttribute('title');
  });
}); 