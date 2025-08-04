import { z } from 'zod';

// Helper schemas
export const DateSchema = z.union([z.date(), z.string().transform(str => new Date(str))]);

// Basic schemas
export const HealthIssueSchema = z.object({
  type: z.enum(['disease', 'pest', 'nutrient_deficiency', 'environmental_stress', 'physical_damage']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  description: z.string(),
  recommendations: z.array(z.string()),
  identifiedAt: DateSchema,
});

export const HealthAnalysisSchema = z.object({
  overallHealth: z.enum(['excellent', 'good', 'fair', 'poor', 'critical']),
  healthScore: z.number().min(0).max(100),
  issues: z.array(HealthIssueSchema).optional(),
  strengths: z.array(z.string()).optional(),
  recommendations: z.array(z.string()).optional(),
  lastAnalyzed: DateSchema,
  confidence: z.number().min(0).max(1).optional(),
});

export const CareProfileSchema = z.object({
  wateringFrequency: z.number().positive(),
  sunlightRequirement: z.enum(['low', 'medium', 'high']),
  humidityPreference: z.enum(['low', 'medium', 'high']),
  temperatureRange: z.object({
    min: z.number(),
    max: z.number(),
  }),
  fertilizingFrequency: z.number().positive(),
  soilType: z.string(),
  specialCare: z.array(z.string()).optional(),
});

export const PlantPersonalitySchema = z.object({
  traits: z.array(z.string()),
  communicationStyle: z.enum(['cheerful', 'wise', 'dramatic', 'calm', 'playful']),
  catchphrases: z.array(z.string()),
  moodFactors: z.object({
    health: z.number().min(0).max(1),
    care: z.number().min(0).max(1),
    attention: z.number().min(0).max(1),
  }),
});

export const InsightSchema = z.object({
  type: z.enum(['tip', 'warning', 'observation', 'recommendation']),
  title: z.string(),
  description: z.string(),
  affectedPlants: z.array(z.string()).optional(),
});

export const AIAnalysisResponseSchema = z.object({
  species: z.string(),
  commonName: z.string(),
  confidence: z.number().min(0).max(1),
  generalDescription: z.string(),
  funFacts: z.array(z.string()),
  plantEnvironment: z.enum(['interior', 'exterior', 'ambos']),
  lightRequirements: z.enum(['poca_luz', 'luz_indirecta', 'luz_directa_parcial', 'pleno_sol']),
  health: HealthAnalysisSchema,
  careProfile: CareProfileSchema,
  personality: PlantPersonalitySchema,
  variety: z.string().optional(),
});

// Plant related schemas
export const PlantImageSchema = z.object({
  id: z.string().min(1, 'Image ID is required'),
  plantId: z.string().min(1, 'Plant ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  storagePath: z.string().min(1, 'Storage path is required'),
  healthAnalysis: HealthAnalysisSchema.optional(),
  isProfileImage: z.boolean().default(false),
  createdAt: DateSchema,
  timestamp: DateSchema, // Add timestamp for backward compatibility
  url: z.string().url(),
});

export const ChatMessageSchema = z.object({
  id: z.string().min(1, 'Message ID is required'),
  plantId: z.string().min(1, 'Plant ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  sender: z.enum(['user', 'plant']),
  content: z.string().min(1, 'Message content cannot be empty'),
  emotion: z.enum(['alegre', 'triste', 'enojado', 'preocupado', 'emocionado', 'relajado', 'curioso', 'orgulloso', 'tímido', 'juguetón', 'sabio']).optional(),
  timestamp: DateSchema,
  createdAt: DateSchema,
  context: z.object({
    healthStatus: z.string().optional(),
    recentCare: z.array(z.string()).optional(),
    mood: z.string().optional(),
  }).optional(),
});

export const PlantNotificationSchema = z.object({
  id: z.string().min(1, 'Notification ID is required'),
  type: z.enum(['watering', 'fertilizing', 'health_check', 'general']),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  priority: z.enum(['low', 'medium', 'high']),
  isRead: z.boolean().default(false),
  createdAt: DateSchema,
  scheduledFor: DateSchema.optional(), // Add scheduledFor field
});

export const PlantSchema = z.object({
  id: z.string().min(1, 'Plant ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  name: z.string().min(1, 'Plant name is required'),
  species: z.string().min(1, 'Species is required'),
  variety: z.string().optional(),
  nickname: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  healthScore: z.number().min(0).max(100).default(85),
  careProfile: CareProfileSchema,
  personality: PlantPersonalitySchema.optional(),
  dateAdded: DateSchema,
  lastWatered: DateSchema.optional(),
  lastFertilized: DateSchema.optional(),
  createdAt: DateSchema,
  updatedAt: DateSchema.optional(),
  description: z.string().optional(),
  funFacts: z.array(z.string()).optional(),
  plantEnvironment: z.enum(['interior', 'exterior', 'ambos']).optional(),
  lightRequirements: z.enum(['poca_luz', 'luz_indirecta', 'luz_directa_parcial', 'pleno_sol']).optional(),
  profileImageId: z.string().optional(),
  images: z.array(PlantImageSchema).optional(),
  chatMessages: z.array(ChatMessageSchema).optional(),
  notifications: z.array(PlantNotificationSchema).optional(),
});

export const PlantResponseSchema = z.object({
  plant: PlantSchema,
  analysis: AIAnalysisResponseSchema.optional(),
});

export const DataExportSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  plants: z.array(PlantSchema),
  exportedAt: z.string(),
  format: z.enum(['json', 'csv']),
});

export const PlantSummarySchema = z.object({
  id: z.string().min(1, 'Plant ID is required'),
  name: z.string().min(1, 'Plant name is required'),
  nickname: z.string().optional(),
  species: z.string().min(1, 'Species is required'),
  location: z.string().min(1, 'Location is required'),
  plantEnvironment: z.enum(['interior', 'exterior', 'ambos']).optional(),
  lightRequirements: z.enum(['poca_luz', 'luz_indirecta', 'luz_directa_parcial', 'pleno_sol']).optional(),
  healthScore: z.number().min(0).max(100).default(85),
  lastWatered: DateSchema.optional(),
  dateAdded: DateSchema,
  profileImageUrl: z.string().url().optional(),
  imageCount: z.number().min(0).default(0),
  lastChatMessage: z.string().optional(),
  notificationCount: z.number().min(0).default(0),
});

export const PlantFormSchema = z.object({
  name: z.string().min(1, 'Plant name is required'),
  species: z.string().min(1, 'Species is required'),
  nickname: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
  description: z.string().optional(),
});

export const SignUpSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().optional(),
  fullName: z.string().optional(),
}).refine((data) => !data.confirmPassword || data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const SignInSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// Garden Chat schemas
export const GardenChatMessageSchema = z.object({
  id: z.string().min(1, 'Message ID is required'),
  sender: z.enum(['user', 'ai']),
  content: z.string().min(1, 'Message content cannot be empty'),
  timestamp: z.date(),
  context: z.object({
    plantsAnalyzed: z.array(z.string()).optional(),
    queryType: z.enum(['general', 'health_analysis', 'care_comparison', 'disease_prevention', 'growth_tracking']).optional(),
    insights: z.array(z.object({
      type: z.enum(['tip', 'warning', 'observation', 'recommendation']),
      title: z.string(),
      description: z.string(),
      affectedPlants: z.array(z.string()).optional(),
    })).optional(),
    suggestedActions: z.array(z.object({
      action: z.string(),
      priority: z.enum(['low', 'medium', 'high']),
      plantIds: z.array(z.string()).optional(),
    })).optional(),
  }).optional(),
});

export const GardenHealthSummarySchema = z.object({
  totalPlants: z.number().min(0),
  healthyPlants: z.number().min(0),
  plantsNeedingAttention: z.number().min(0),
  criticalIssues: z.number().min(0),
  overallGardenHealth: z.enum(['excellent', 'good', 'fair', 'poor']),
  lastUpdated: z.date(),
  insights: z.array(InsightSchema),
  upcomingTasks: z.array(z.object({
    plantId: z.string(),
    plantName: z.string(),
    task: z.string(),
    dueDate: z.date(),
    priority: z.enum(['low', 'medium', 'high']),
  })),
});

export const GardenAIResponseSchema = z.object({
  content: z.string(),
  insights: z.array(InsightSchema).optional(),
  suggestedActions: z.array(z.object({
    title: z.string(),
    description: z.string(),
    plantIds: z.array(z.string()).optional(),
  })).optional(),
  plantsAnalyzed: z.array(z.string()).optional(),
});

// Type exports - Single source of truth
export type HealthIssue = z.infer<typeof HealthIssueSchema>;
export type HealthAnalysis = z.infer<typeof HealthAnalysisSchema>;
export type CareProfile = z.infer<typeof CareProfileSchema>;
export type PlantPersonality = z.infer<typeof PlantPersonalitySchema>;
export type Insight = z.infer<typeof InsightSchema>;
export type AIAnalysisResponse = z.infer<typeof AIAnalysisResponseSchema>;
export type PlantImage = z.infer<typeof PlantImageSchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type PlantNotification = z.infer<typeof PlantNotificationSchema>;
export type Plant = z.infer<typeof PlantSchema>;
export type PlantResponse = z.infer<typeof PlantResponseSchema>;
export type DataExport = z.infer<typeof DataExportSchema>;
export type PlantSummary = z.infer<typeof PlantSummarySchema>;
export type PlantFormData = z.infer<typeof PlantFormSchema>;
export type SignUpData = z.infer<typeof SignUpSchema>;
export type SignInData = z.infer<typeof SignInSchema>;
export type GardenChatMessage = z.infer<typeof GardenChatMessageSchema>;
export type GardenHealthSummary = z.infer<typeof GardenHealthSummarySchema>;
export type GardenAIResponse = z.infer<typeof GardenAIResponseSchema>; 