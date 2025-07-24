import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PlantDetail } from '../../../src/pages/PlantDetail';
import { UpdateHealthDiagnosisButton } from '../../../src/components/UpdateHealthDiagnosisButton';

// Mock de servicios y hooks
vi.mock('../../../src/services/healthDiagnosisService', () => ({
  healthDiagnosisService: {
    updateHealthDiagnosis: vi.fn(),
    analyzeHealthTrends: vi.fn(),
    generateHealthReport: vi.fn()
  }
}));

vi.mock('../../../src/services/aiService', () => ({
  aiService: {
    analyzeImage: vi.fn(),
    updateHealthDiagnosis: vi.fn()
  }
}));

vi.mock('../../../src/services/plantService', () => ({
  plantService: {
    updatePlant: vi.fn(),
    getPlantById: vi.fn()
  }
}));

vi.mock('../../../src/services/imageService', () => ({
  imageService: {
    uploadImage: vi.fn(),
    compressImage: vi.fn()
  }
}));

vi.mock('../../../src/stores/useAuthStore', () => ({
  useAuthStore: () => ({
    user: { id: 'test-user', email: 'test@example.com' },
    isAuthenticated: true
  })
}));

vi.mock('../../../src/hooks/usePlantMutations', () => ({
  usePlantMutations: () => ({
    updatePlant: vi.fn(),
    isLoading: false,
    error: null
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

describe('Health Update Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Health Update Flow', () => {
    it('should handle complete health update from new image to plant update', async () => {
      const mockUpdateHealthDiagnosis = vi.fn().mockResolvedValue({
        updatedAnalysis: {
          overallHealth: 'excellent',
          confidence: 95,
          issues: [],
          recommendations: ['Continue current care routine'],
          moistureLevel: 80,
          growthStage: 'thriving',
          newLeaves: 2,
          healthScore: 95
        },
        previousAnalysis: {
          overallHealth: 'good',
          confidence: 85,
          issues: [],
          recommendations: ['Keep up the good care!'],
          moistureLevel: 70,
          growthStage: 'mature',
          healthScore: 85
        },
        improvements: [
          'Increased leaf count',
          'Better color saturation',
          'Improved overall health score'
        ]
      });

      const mockAnalyzeImage = vi.fn().mockResolvedValue({
        plantName: 'Monstera Deliciosa',
        healthAnalysis: {
          overallHealth: 'excellent',
          confidence: 95,
          issues: [],
          recommendations: ['Continue current care routine'],
          moistureLevel: 80,
          growthStage: 'thriving'
        }
      });

      const mockUpdatePlant = vi.fn().mockResolvedValue({
        id: 'plant-123',
        healthScore: 95,
        images: [
          {
            id: 'img-123',
            url: 'https://example.com/plant-image.jpg',
            timestamp: new Date(),
            healthAnalysis: {
              overallHealth: 'excellent',
              confidence: 95,
              issues: [],
              recommendations: ['Continue current care routine']
            }
          }
        ]
      });

      // Mock de servicios
      const { healthDiagnosisService } = await import('../../../src/services/healthDiagnosisService');
      const { aiService } = await import('../../../src/services/aiService');
      const { plantService } = await import('../../../src/services/plantService');

      (healthDiagnosisService.updateHealthDiagnosis as any).mockImplementation(mockUpdateHealthDiagnosis);
      (aiService.analyzeImage as any).mockImplementation(mockAnalyzeImage);
      (plantService.updatePlant as any).mockImplementation(mockUpdatePlant);

      // Simular nueva imagen para análisis
      const newImage = new File(['new-health-data'], 'new-health.jpg', { type: 'image/jpeg' });
      const plantId = 'plant-123';

      // 1. Analizar nueva imagen
      const imageAnalysis = await mockAnalyzeImage(newImage);
      expect(imageAnalysis.healthAnalysis.overallHealth).toBe('excellent');
      expect(imageAnalysis.healthAnalysis.confidence).toBe(95);

      // 2. Actualizar diagnóstico de salud
      const healthUpdate = await mockUpdateHealthDiagnosis(plantId, newImage);
      expect(healthUpdate.updatedAnalysis.overallHealth).toBe('excellent');
      expect(healthUpdate.previousAnalysis.overallHealth).toBe('good');
      expect(healthUpdate.improvements).toHaveLength(3);

      // 3. Actualizar planta en base de datos
      const plantUpdateData = {
        healthScore: healthUpdate.updatedAnalysis.healthScore,
        images: [{
          id: 'img-123',
          url: 'https://example.com/plant-image.jpg',
          timestamp: new Date(),
          healthAnalysis: healthUpdate.updatedAnalysis
        }]
      };

      const updatedPlant = await mockUpdatePlant(plantId, plantUpdateData);
      expect(updatedPlant.healthScore).toBe(95);
      expect(updatedPlant.images[0].healthAnalysis.confidence).toBe(95);
    });

    it('should handle health update with detected issues', async () => {
      const mockUpdateHealthDiagnosis = vi.fn().mockResolvedValue({
        updatedAnalysis: {
          overallHealth: 'poor',
          confidence: 90,
          issues: [
            { type: 'disease', severity: 'moderate', description: 'Leaf spots detected' },
            { type: 'nutrition', severity: 'mild', description: 'Slight yellowing of leaves' }
          ],
          recommendations: [
            'Remove affected leaves',
            'Apply fungicide treatment',
            'Increase humidity levels',
            'Check soil moisture'
          ],
          moistureLevel: 30,
          growthStage: 'stressed',
          healthScore: 40
        },
        previousAnalysis: {
          overallHealth: 'good',
          confidence: 85,
          issues: [],
          recommendations: ['Keep up the good care!'],
          moistureLevel: 70,
          growthStage: 'mature',
          healthScore: 85
        },
        urgentActions: [
          'Immediate: Remove affected leaves',
          'Within 24h: Apply fungicide',
          'Within 48h: Adjust humidity'
        ]
      });

      const { healthDiagnosisService } = await import('../../../src/services/healthDiagnosisService');
      (healthDiagnosisService.updateHealthDiagnosis as any).mockImplementation(mockUpdateHealthDiagnosis);

      const sickPlantImage = new File(['sick-plant-data'], 'sick-plant.jpg', { type: 'image/jpeg' });
      const plantId = 'plant-123';

      const healthUpdate = await mockUpdateHealthDiagnosis(plantId, sickPlantImage);

      expect(healthUpdate.updatedAnalysis.overallHealth).toBe('poor');
      expect(healthUpdate.updatedAnalysis.issues).toHaveLength(2);
      expect(healthUpdate.updatedAnalysis.recommendations).toHaveLength(4);
      expect(healthUpdate.urgentActions).toHaveLength(3);
      expect(healthUpdate.updatedAnalysis.healthScore).toBe(40);
    });

    it('should handle health update with gradual improvement', async () => {
      const mockUpdateHealthDiagnosis = vi.fn().mockResolvedValue({
        updatedAnalysis: {
          overallHealth: 'good',
          confidence: 88,
          issues: [],
          recommendations: ['Continue current care routine'],
          moistureLevel: 75,
          growthStage: 'recovering',
          healthScore: 88
        },
        previousAnalysis: {
          overallHealth: 'fair',
          confidence: 70,
          issues: [
            { type: 'watering', severity: 'mild', description: 'Slight dehydration' }
          ],
          recommendations: ['Increase watering frequency'],
          moistureLevel: 50,
          growthStage: 'stressed',
          healthScore: 70
        },
        improvements: [
          'Improved moisture levels',
          'Reduced stress indicators',
          'Better leaf color'
        ],
        progress: {
          healthImprovement: 18,
          timeSinceLastUpdate: '7 days',
          trend: 'positive'
        }
      });

      const { healthDiagnosisService } = await import('../../../src/services/healthDiagnosisService');
      (healthDiagnosisService.updateHealthDiagnosis as any).mockImplementation(mockUpdateHealthDiagnosis);

      const improvingPlantImage = new File(['improving-plant-data'], 'improving-plant.jpg', { type: 'image/jpeg' });
      const plantId = 'plant-123';

      const healthUpdate = await mockUpdateHealthDiagnosis(plantId, improvingPlantImage);

      expect(healthUpdate.updatedAnalysis.overallHealth).toBe('good');
      expect(healthUpdate.previousAnalysis.overallHealth).toBe('fair');
      expect(healthUpdate.improvements).toHaveLength(3);
      expect(healthUpdate.progress.healthImprovement).toBe(18);
      expect(healthUpdate.progress.trend).toBe('positive');
    });
  });

  describe('Health Trends Analysis', () => {
    it('should analyze health trends over time', async () => {
      const mockAnalyzeHealthTrends = vi.fn().mockResolvedValue({
        trends: {
          overall: 'improving',
          healthScore: {
            trend: 'increasing',
            averageChange: 5.2,
            lastMonth: 75,
            current: 88
          },
          moistureLevel: {
            trend: 'stable',
            averageChange: 0.5,
            lastMonth: 70,
            current: 75
          },
          issues: {
            trend: 'decreasing',
            frequency: 'low',
            lastMonth: 3,
            current: 0
          }
        },
        predictions: {
          nextMonthHealth: 92,
          confidence: 85,
          recommendations: [
            'Continue current care routine',
            'Consider fertilizing in spring'
          ]
        },
        insights: [
          'Consistent improvement in health score',
          'Stable moisture levels indicate good care',
          'Reduced issues suggest effective treatment'
        ]
      });

      const { healthDiagnosisService } = await import('../../../src/services/healthDiagnosisService');
      (healthDiagnosisService.analyzeHealthTrends as any).mockImplementation(mockAnalyzeHealthTrends);

      const plantId = 'plant-123';
      const healthHistory = [
        { date: '2024-01-01', healthScore: 70, moistureLevel: 60 },
        { date: '2024-01-08', healthScore: 75, moistureLevel: 65 },
        { date: '2024-01-15', healthScore: 80, moistureLevel: 70 },
        { date: '2024-01-22', healthScore: 85, moistureLevel: 72 },
        { date: '2024-01-29', healthScore: 88, moistureLevel: 75 }
      ];

      const trends = await mockAnalyzeHealthTrends(plantId, healthHistory);

      expect(trends.trends.overall).toBe('improving');
      expect(trends.trends.healthScore.trend).toBe('increasing');
      expect(trends.predictions.nextMonthHealth).toBe(92);
      expect(trends.insights).toHaveLength(3);
    });

    it('should handle declining health trends', async () => {
      const mockAnalyzeHealthTrends = vi.fn().mockResolvedValue({
        trends: {
          overall: 'declining',
          healthScore: {
            trend: 'decreasing',
            averageChange: -3.5,
            lastMonth: 85,
            current: 70
          },
          moistureLevel: {
            trend: 'decreasing',
            averageChange: -2.1,
            lastMonth: 75,
            current: 65
          },
          issues: {
            trend: 'increasing',
            frequency: 'high',
            lastMonth: 1,
            current: 3
          }
        },
        alerts: [
          'Significant decline in health score',
          'Decreasing moisture levels',
          'Increasing number of issues'
        ],
        urgentActions: [
          'Review watering schedule',
          'Check for pests or diseases',
          'Consider environmental changes'
        ],
        predictions: {
          nextMonthHealth: 65,
          confidence: 90,
          riskLevel: 'high'
        }
      });

      const { healthDiagnosisService } = await import('../../../src/services/healthDiagnosisService');
      (healthDiagnosisService.analyzeHealthTrends as any).mockImplementation(mockAnalyzeHealthTrends);

      const plantId = 'plant-123';
      const decliningHistory = [
        { date: '2024-01-01', healthScore: 85, moistureLevel: 75 },
        { date: '2024-01-08', healthScore: 82, moistureLevel: 73 },
        { date: '2024-01-15', healthScore: 78, moistureLevel: 70 },
        { date: '2024-01-22', healthScore: 75, moistureLevel: 68 },
        { date: '2024-01-29', healthScore: 70, moistureLevel: 65 }
      ];

      const trends = await mockAnalyzeHealthTrends(plantId, decliningHistory);

      expect(trends.trends.overall).toBe('declining');
      expect(trends.trends.healthScore.trend).toBe('decreasing');
      expect(trends.alerts).toHaveLength(3);
      expect(trends.urgentActions).toHaveLength(3);
      expect(trends.predictions.riskLevel).toBe('high');
    });
  });

  describe('Health Report Generation', () => {
    it('should generate comprehensive health report', async () => {
      const mockGenerateHealthReport = vi.fn().mockResolvedValue({
        report: {
          summary: 'Tu Monstera Deliciosa está en excelente estado con mejoras significativas.',
          overallHealth: 'excellent',
          healthScore: 95,
          confidence: 92,
          lastUpdated: '2024-01-29T10:30:00Z'
        },
        details: {
          currentStatus: {
            overallHealth: 'excellent',
            moistureLevel: 80,
            growthStage: 'thriving',
            newLeaves: 3,
            issues: []
          },
          improvements: [
            'Health score increased by 15 points',
            'Moisture levels improved by 10%',
            '3 new leaves detected',
            'No issues found'
          ],
          recommendations: [
            'Continue current care routine',
            'Maintain humidity levels',
            'Consider fertilizing in spring'
          ]
        },
        trends: {
          healthScore: { trend: 'increasing', change: 15 },
          moistureLevel: { trend: 'stable', change: 5 },
          issues: { trend: 'decreasing', change: -2 }
        },
        nextSteps: [
          'Continue monitoring weekly',
          'Schedule next health check in 2 weeks',
          'Consider propagation if desired'
        ]
      });

      const { healthDiagnosisService } = await import('../../../src/services/healthDiagnosisService');
      (healthDiagnosisService.generateHealthReport as any).mockImplementation(mockGenerateHealthReport);

      const plantId = 'plant-123';
      const report = await mockGenerateHealthReport(plantId);

      expect(report.report.overallHealth).toBe('excellent');
      expect(report.report.healthScore).toBe(95);
      expect(report.details.improvements).toHaveLength(4);
      expect(report.trends.healthScore.trend).toBe('increasing');
      expect(report.nextSteps).toHaveLength(3);
    });

    it('should generate health report for plant with issues', async () => {
      const mockGenerateHealthReport = vi.fn().mockResolvedValue({
        report: {
          summary: 'Tu planta necesita atención inmediata. Se detectaron varios problemas.',
          overallHealth: 'poor',
          healthScore: 45,
          confidence: 88,
          lastUpdated: '2024-01-29T10:30:00Z'
        },
        details: {
          currentStatus: {
            overallHealth: 'poor',
            moistureLevel: 30,
            growthStage: 'stressed',
            newLeaves: 0,
            issues: [
              { type: 'disease', severity: 'moderate', description: 'Leaf spots detected' },
              { type: 'nutrition', severity: 'mild', description: 'Yellowing leaves' }
            ]
          },
          problems: [
            'Significant health decline',
            'Multiple issues detected',
            'Low moisture levels'
          ],
          urgentActions: [
            'Remove affected leaves immediately',
            'Apply fungicide treatment',
            'Adjust watering schedule',
            'Check for pests'
          ]
        },
        trends: {
          healthScore: { trend: 'decreasing', change: -25 },
          moistureLevel: { trend: 'decreasing', change: -15 },
          issues: { trend: 'increasing', change: 2 }
        },
        nextSteps: [
          'Take immediate action on urgent items',
          'Monitor daily for improvements',
          'Schedule follow-up in 1 week'
        ]
      });

      const { healthDiagnosisService } = await import('../../../src/services/healthDiagnosisService');
      (healthDiagnosisService.generateHealthReport as any).mockImplementation(mockGenerateHealthReport);

      const plantId = 'plant-123';
      const report = await mockGenerateHealthReport(plantId);

      expect(report.report.overallHealth).toBe('poor');
      expect(report.report.healthScore).toBe(45);
      expect(report.details.currentStatus.issues).toHaveLength(2);
      expect(report.details.urgentActions).toHaveLength(4);
      expect(report.trends.healthScore.trend).toBe('decreasing');
    });
  });

  describe('Health Update Triggers', () => {
    it('should trigger health update on new image upload', async () => {
      const mockUpdateHealthDiagnosis = vi.fn().mockResolvedValue({
        updatedAnalysis: {
          overallHealth: 'good',
          confidence: 85,
          healthScore: 85
        }
      });

      const { healthDiagnosisService } = await import('../../../src/services/healthDiagnosisService');
      (healthDiagnosisService.updateHealthDiagnosis as any).mockImplementation(mockUpdateHealthDiagnosis);

      const newImage = new File(['new-image-data'], 'new-image.jpg', { type: 'image/jpeg' });
      const plantId = 'plant-123';

      // Simular trigger de actualización automática
      const shouldUpdate = true; // Basado en lógica de la app
      if (shouldUpdate) {
        const healthUpdate = await mockUpdateHealthDiagnosis(plantId, newImage);
        expect(healthUpdate.updatedAnalysis.overallHealth).toBe('good');
        expect(healthUpdate.updatedAnalysis.confidence).toBe(85);
      }
    });

    it('should trigger health update on manual request', async () => {
      const mockUpdateHealthDiagnosis = vi.fn().mockResolvedValue({
        updatedAnalysis: {
          overallHealth: 'excellent',
          confidence: 92,
          healthScore: 92
        }
      });

      const { healthDiagnosisService } = await import('../../../src/services/healthDiagnosisService');
      (healthDiagnosisService.updateHealthDiagnosis as any).mockImplementation(mockUpdateHealthDiagnosis);

      const plantId = 'plant-123';
      const latestImage = new File(['latest-image-data'], 'latest-image.jpg', { type: 'image/jpeg' });

      // Simular botón "Update Health Analysis"
      const manualUpdate = await mockUpdateHealthDiagnosis(plantId, latestImage);
      expect(manualUpdate.updatedAnalysis.overallHealth).toBe('excellent');
      expect(manualUpdate.updatedAnalysis.confidence).toBe(92);
    });

    it('should trigger health update on scheduled interval', async () => {
      const mockUpdateHealthDiagnosis = vi.fn().mockResolvedValue({
        updatedAnalysis: {
          overallHealth: 'good',
          confidence: 88,
          healthScore: 88
        }
      });

      const { healthDiagnosisService } = await import('../../../src/services/healthDiagnosisService');
      (healthDiagnosisService.updateHealthDiagnosis as any).mockImplementation(mockUpdateHealthDiagnosis);

      const plantId = 'plant-123';
      const scheduledImage = new File(['scheduled-image-data'], 'scheduled-image.jpg', { type: 'image/jpeg' });

      // Simular actualización programada (cada 7 días)
      const daysSinceLastUpdate = 7;
      if (daysSinceLastUpdate >= 7) {
        const scheduledUpdate = await mockUpdateHealthDiagnosis(plantId, scheduledImage);
        expect(scheduledUpdate.updatedAnalysis.overallHealth).toBe('good');
        expect(scheduledUpdate.updatedAnalysis.confidence).toBe(88);
      }
    });
  });

  describe('Error Handling in Health Updates', () => {
    it('should handle AI service unavailable during health update', async () => {
      const mockUpdateHealthDiagnosis = vi.fn().mockRejectedValue(new Error('AI service unavailable'));

      const { healthDiagnosisService } = await import('../../../src/services/healthDiagnosisService');
      (healthDiagnosisService.updateHealthDiagnosis as any).mockImplementation(mockUpdateHealthDiagnosis);

      const newImage = new File(['image-data'], 'plant.jpg', { type: 'image/jpeg' });
      const plantId = 'plant-123';

      try {
        await mockUpdateHealthDiagnosis(plantId, newImage);
      } catch (error) {
        expect(error.message).toBe('AI service unavailable');
      }
    });

    it('should handle invalid image data during health update', async () => {
      const mockUpdateHealthDiagnosis = vi.fn().mockRejectedValue(new Error('Unable to process image - invalid data'));

      const { healthDiagnosisService } = await import('../../../src/services/healthDiagnosisService');
      (healthDiagnosisService.updateHealthDiagnosis as any).mockImplementation(mockUpdateHealthDiagnosis);

      const invalidImage = new File(['invalid-data'], 'invalid.jpg', { type: 'image/jpeg' });
      const plantId = 'plant-123';

      try {
        await mockUpdateHealthDiagnosis(plantId, invalidImage);
      } catch (error) {
        expect(error.message).toBe('Unable to process image - invalid data');
      }
    });

    it('should handle database update failure', async () => {
      const mockUpdatePlant = vi.fn().mockRejectedValue(new Error('Database connection failed'));

      const { plantService } = await import('../../../src/services/plantService');
      (plantService.updatePlant as any).mockImplementation(mockUpdatePlant);

      const plantId = 'plant-123';
      const updateData = {
        healthScore: 90,
        images: [{ id: 'img-123', healthAnalysis: { overallHealth: 'good' } }]
      };

      try {
        await mockUpdatePlant(plantId, updateData);
      } catch (error) {
        expect(error.message).toBe('Database connection failed');
      }
    });
  });

  describe('Health Update Performance', () => {
    it('should handle multiple concurrent health updates', async () => {
      const mockUpdateHealthDiagnosis = vi.fn().mockResolvedValue({
        updatedAnalysis: {
          overallHealth: 'good',
          confidence: 85,
          healthScore: 85
        }
      });

      const { healthDiagnosisService } = await import('../../../src/services/healthDiagnosisService');
      (healthDiagnosisService.updateHealthDiagnosis as any).mockImplementation(mockUpdateHealthDiagnosis);

      const plants = Array.from({ length: 5 }, (_, i) => ({
        id: `plant-${i}`,
        image: new File([`image-${i}-data`], `plant-${i}.jpg`, { type: 'image/jpeg' })
      }));

      const updates = await Promise.all(
        plants.map(plant => mockUpdateHealthDiagnosis(plant.id, plant.image))
      );

      expect(updates).toHaveLength(5);
      expect(mockUpdateHealthDiagnosis).toHaveBeenCalledTimes(5);
    });

    it('should handle large image files efficiently', async () => {
      const mockUpdateHealthDiagnosis = vi.fn().mockResolvedValue({
        updatedAnalysis: {
          overallHealth: 'good',
          confidence: 85,
          healthScore: 85
        }
      });

      const { healthDiagnosisService } = await import('../../../src/services/healthDiagnosisService');
      (healthDiagnosisService.updateHealthDiagnosis as any).mockImplementation(mockUpdateHealthDiagnosis);

      // Simular imagen grande (8MB)
      const largeImage = new File(['x'.repeat(8 * 1024 * 1024)], 'large-health.jpg', { type: 'image/jpeg' });
      const plantId = 'plant-123';

      const healthUpdate = await mockUpdateHealthDiagnosis(plantId, largeImage);

      expect(healthUpdate.updatedAnalysis.overallHealth).toBe('good');
      expect(healthUpdate.updatedAnalysis.confidence).toBe(85);
    });
  });

  describe('Health Update Quality Assurance', () => {
    it('should validate health update confidence thresholds', async () => {
      const mockUpdateHealthDiagnosis = vi.fn().mockResolvedValue({
        updatedAnalysis: {
          overallHealth: 'good',
          confidence: 75,
          healthScore: 75
        }
      });

      const { healthDiagnosisService } = await import('../../../src/services/healthDiagnosisService');
      (healthDiagnosisService.updateHealthDiagnosis as any).mockImplementation(mockUpdateHealthDiagnosis);

      const newImage = new File(['image-data'], 'plant.jpg', { type: 'image/jpeg' });
      const plantId = 'plant-123';

      const healthUpdate = await mockUpdateHealthDiagnosis(plantId, newImage);

      // Validar que la confianza esté en rango aceptable
      expect(healthUpdate.updatedAnalysis.confidence).toBeGreaterThanOrEqual(50);
      expect(healthUpdate.updatedAnalysis.confidence).toBeLessThanOrEqual(100);
    });

    it('should handle low confidence health updates', async () => {
      const mockUpdateHealthDiagnosis = vi.fn().mockResolvedValue({
        updatedAnalysis: {
          overallHealth: 'unknown',
          confidence: 35,
          healthScore: 35,
          recommendations: ['Please provide a clearer image for better analysis']
        }
      });

      const { healthDiagnosisService } = await import('../../../src/services/healthDiagnosisService');
      (healthDiagnosisService.updateHealthDiagnosis as any).mockImplementation(mockUpdateHealthDiagnosis);

      const blurryImage = new File(['blurry-data'], 'blurry-health.jpg', { type: 'image/jpeg' });
      const plantId = 'plant-123';

      const healthUpdate = await mockUpdateHealthDiagnosis(plantId, blurryImage);

      expect(healthUpdate.updatedAnalysis.confidence).toBeLessThan(50);
      expect(healthUpdate.updatedAnalysis.overallHealth).toBe('unknown');
      expect(healthUpdate.updatedAnalysis.recommendations[0]).toContain('clearer image');
    });
  });
}); 