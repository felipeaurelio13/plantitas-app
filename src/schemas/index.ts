import { z } from 'zod';
import * as AiSchemas from './ai-shared';

// Export AI-related schemas directly
export const {
  HealthIssueSchema,
  HealthAnalysisSchema,
  CareProfileSchema,
  PlantPersonalitySchema,
  AIAnalysisResponseSchema,
  InsightSchema,
  InsightResponseSchema
} = AiSchemas;

// Define other schemas
export const PlantImageSchema = z.object({
  id: z.string().min(1, 'Image ID is required'),
  url: z.string().url('Must be a valid URL'),
  timestamp: z.date(),
  healthAnalysis: HealthAnalysisSchema.optional(),
  isProfileImage: z.boolean(),
});

export const ChatMessageSchema = z.object({
  id: z.string().min(1, 'Message ID is required'),
  sender: z.enum(['user', 'plant', 'system']),
  content: z.string().min(1, 'Message content cannot be empty'),
  timestamp: z.date(),
  emotion: z.enum(['alegre', 'triste', 'enojado', 'neutral', 'juguetón', 'agradecido', 'happy', 'sad', 'excited', 'worried', 'grateful']).optional(),
});

export const PlantNotificationSchema = z.object({
  id: z.string().min(1, 'Notification ID is required'),
  type: z.enum(['watering', 'fertilizing', 'health_check', 'general']),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  priority: z.enum(['low', 'medium', 'high']),
  scheduledFor: z.date(),
  completed: z.boolean(),
});

export const PlantSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  species: z.string(),
  variety: z.string().optional(),
  nickname: z.string().optional(),
  description: z.string().optional(),
  location: z.string(),
  dateAdded: z.date(),
  lastWatered: z.date().optional(),
  lastFertilized: z.date().optional(),
  images: z.array(PlantImageSchema),
  healthScore: z.number().min(0).max(100),
  careProfile: CareProfileSchema,
  personality: PlantPersonalitySchema,
  chatHistory: z.array(ChatMessageSchema),
  notifications: z.array(PlantNotificationSchema),
});

export const PlantSummarySchema = z.object({
  id: z.string().min(1, 'Plant ID is required'),
  name: z.string().min(1, 'Plant name is required'),
  nickname: z.string().optional(),
  species: z.string().min(1, 'Species is required'),
  location: z.string().min(1, 'Location is required'),
  healthScore: z.number().min(0).max(100),
  profileImageUrl: z.string().url().optional(),
  lastWatered: z.date().optional(),
  wateringFrequency: z.number().positive().optional(),
});

export const PlantResponseSchema = z.object({
  content: z.string(),
  emotion: z.enum(['alegre', 'triste', 'enojado', 'neutral', 'juguetón', 'agradecido', 'happy', 'sad', 'excited', 'worried', 'grateful']),
  mood: z.string().optional(),
});

export const ProgressAnalysisResponseSchema = z.object({
  changes: z.array(z.string()),
  healthImprovement: z.number(),
  recommendations: z.array(z.string()),
  newHealthScore: z.number().min(0).max(100),
});

export const PlantFormSchema = PlantSchema.omit({ 
  id: true, 
  dateAdded: true, 
  chatHistory: true, 
  notifications: true 
}).partial({
  images: true,
  healthScore: true,
  careProfile: true,
  personality: true,
});

export const SignUpSchema = z
  .object({
    fullName: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

export const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required"),
});

// Export all inferred types
export type HealthIssue = z.infer<typeof HealthIssueSchema>;
export type HealthAnalysis = z.infer<typeof HealthAnalysisSchema>;
export type CareProfile = z.infer<typeof CareProfileSchema>;
export type PlantPersonality = z.infer<typeof PlantPersonalitySchema>;
export type Insight = z.infer<typeof InsightSchema>;
export type AIAnalysisResponse = z.infer<typeof AIAnalysisResponseSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type PlantNotification = z.infer<typeof PlantNotificationSchema>;
export type Plant = z.infer<typeof PlantSchema>;
export type PlantSummary = z.infer<typeof PlantSummarySchema>;
export type PlantImage = z.infer<typeof PlantImageSchema>;
export type SignUpData = z.infer<typeof SignUpSchema>;
export type SignInData = z.infer<typeof SignInSchema>;
export type PlantResponse = z.infer<typeof PlantResponseSchema>;
export type PlantFormData = z.infer<typeof PlantFormSchema>; 