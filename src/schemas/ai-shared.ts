import { z } from 'zod';

// This file is the single source of truth for the AI analysis response schema.
// It is imported by both the frontend and the backend Supabase function.

export const HealthIssueSchema = z.object({
  type: z.enum(['overwatering', 'underwatering', 'pest', 'disease', 'nutrient', 'light', 'other']),
  severity: z.enum(['low', 'medium', 'high']),
  description: z.string().min(1),
  treatment: z.string().min(1),
});

export const HealthAnalysisSchema = z.object({
  overallHealth: z.enum(['excellent', 'good', 'fair', 'poor']),
  issues: z.array(HealthIssueSchema),
  recommendations: z.array(z.string()),
  moistureLevel: z.coerce.number().min(0).max(100),
  growthStage: z.enum(['seedling', 'juvenile', 'mature', 'flowering', 'dormant']),
  confidence: z.coerce.number().min(0).max(100),
});

export const CareProfileSchema = z.object({
  wateringFrequency: z.coerce.number().positive(),
  sunlightRequirement: z.enum(['low', 'medium', 'high']),
  humidityPreference: z.enum(['low', 'medium', 'high']),
  temperatureRange: z.object({
    min: z.coerce.number(),
    max: z.coerce.number(),
  }),
  fertilizingFrequency: z.coerce.number().positive(),
  soilType: z.string().min(1),
  specialCare: z.array(z.string()).optional(),
});

export const PlantPersonalitySchema = z.object({
  traits: z.array(z.string()).min(1),
  communicationStyle: z.enum(['cheerful', 'wise', 'dramatic', 'calm', 'playful']),
  catchphrases: z.array(z.string()),
  moodFactors: z.object({
    health: z.coerce.number().min(0).max(1),
    care: z.coerce.number().min(0).max(1),
    attention: z.coerce.number().min(0).max(1),
  }),
});

export const AIAnalysisResponseSchema = z.object({
  species: z.string(),
  commonName: z.string(),
  variety: z.string().nullable().optional(),
  confidence: z.coerce.number().min(0).max(100),
  generalDescription: z.string().min(20),
  funFacts: z.array(z.string()).min(5).max(5),
  health: HealthAnalysisSchema,
  careProfile: CareProfileSchema,
  personality: PlantPersonalitySchema,
});

export const InsightSchema = z.object({
  type: z.enum(['info', 'warning', 'tip', 'alert']),
  title: z.string(),
  message: z.string(),
});

export const InsightResponseSchema = z.array(InsightSchema); 