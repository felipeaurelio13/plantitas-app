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
  funFacts: z.array(z.string()).optional(),
  location: z.string(),
  // Nuevos campos para ambiente y luz
  plantEnvironment: z.enum(['interior', 'exterior', 'ambos']).optional(),
  lightRequirements: z.enum(['poca_luz', 'luz_indirecta', 'luz_directa_parcial', 'pleno_sol']).optional(),
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
  // Nuevos campos para ambiente y luz
  plantEnvironment: z.enum(['interior', 'exterior', 'ambos']).optional(),
  lightRequirements: z.enum(['poca_luz', 'luz_indirecta', 'luz_directa_parcial', 'pleno_sol']).optional(),
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

// Garden Chat schemas - For AI conversations about the entire garden
export const GardenChatMessageSchema = z.object({
  id: z.string().min(1, 'Message ID is required'),
  sender: z.enum(['user', 'ai']),
  content: z.string().min(1, 'Message content cannot be empty'),
  timestamp: z.date(),
  context: z.object({
    plantsAnalyzed: z.array(z.string()).optional(), // Plant IDs referenced in this conversation
    queryType: z.enum(['general', 'health_analysis', 'care_comparison', 'disease_prevention', 'growth_tracking']).optional(),
  }).optional(),
});

export const GardenAnalysisContextSchema = z.object({
  totalPlants: z.number(),
  plantsData: z.array(PlantSummarySchema),
  averageHealthScore: z.number(),
  commonIssues: z.array(z.string()),
  careScheduleSummary: z.object({
    needsWatering: z.array(z.string()), // Plant IDs
    needsFertilizing: z.array(z.string()), // Plant IDs
    healthConcerns: z.array(z.string()), // Plant IDs
  }),
  environmentalFactors: z.object({
    locations: z.array(z.string()), // Unique locations where plants are placed
    lightConditions: z.array(z.string()), // Summary of light requirements
    humidityNeeds: z.array(z.string()), // Humidity requirements summary
  }),
});

export const GardenChatSessionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  messages: z.array(GardenChatMessageSchema),
  createdAt: z.date(),
  updatedAt: z.date(),
  context: GardenAnalysisContextSchema.optional(), // Current garden state when session started
});

// Type exports for Garden Chat
export type GardenChatMessage = z.infer<typeof GardenChatMessageSchema>;
export type GardenAnalysisContext = z.infer<typeof GardenAnalysisContextSchema>;
export type GardenChatSession = z.infer<typeof GardenChatSessionSchema>;

// AI Response schema for garden conversations
export const GardenAIResponseSchema = z.object({
  content: z.string().min(1),
  insights: z.array(z.object({
    type: z.enum(['tip', 'warning', 'observation', 'recommendation']),
    title: z.string(),
    description: z.string(),
    affectedPlants: z.array(z.string()).optional(), // Plant IDs
  })).optional(),
  suggestedActions: z.array(z.object({
    action: z.string(),
    priority: z.enum(['low', 'medium', 'high']),
    plantIds: z.array(z.string()).optional(),
  })).optional(),
});

export type GardenAIResponse = z.infer<typeof GardenAIResponseSchema>; 