import { z } from 'zod';

// Health Issue Schema
export const HealthIssueSchema = z.object({
  type: z.enum(['overwatering', 'underwatering', 'pest', 'disease', 'nutrient', 'light', 'other']),
  severity: z.enum(['low', 'medium', 'high']),
  description: z.string().min(1, 'Description is required'),
  treatment: z.string().min(1, 'Treatment is required'),
});

// Health Analysis Schema
export const HealthAnalysisSchema = z.object({
  overallHealth: z.enum(['excellent', 'good', 'fair', 'poor']),
  issues: z.array(HealthIssueSchema),
  recommendations: z.array(z.string()),
  moistureLevel: z.number().min(0).max(100),
  growthStage: z.enum(['seedling', 'juvenile', 'mature', 'flowering', 'dormant']),
  confidence: z.number().min(0).max(100),
});

// Plant Image Schema
export const PlantImageSchema = z.object({
  id: z.string().min(1, 'Image ID is required'),
  url: z.string().url('Must be a valid URL'),
  timestamp: z.date(),
  healthAnalysis: HealthAnalysisSchema.optional(),
  isProfileImage: z.boolean(),
});

// Care Profile Schema
export const CareProfileSchema = z.object({
  wateringFrequency: z.number().positive('Watering frequency must be positive'),
  sunlightRequirement: z.enum(['low', 'medium', 'high']),
  humidityPreference: z.enum(['low', 'medium', 'high']),
  temperatureRange: z.object({
    min: z.number(),
    max: z.number(),
  }).refine(data => data.max > data.min, {
    message: 'Maximum temperature must be greater than minimum',
  }),
  fertilizingFrequency: z.number().positive('Fertilizing frequency must be positive'),
  soilType: z.string().min(1, 'Soil type is required'),
  specialCare: z.array(z.string()).optional(),
});

// Plant Personality Schema
export const PlantPersonalitySchema = z.object({
  traits: z.array(z.string()).min(1, 'At least one trait is required'),
  communicationStyle: z.enum(['cheerful', 'wise', 'dramatic', 'calm', 'playful']),
  catchphrases: z.array(z.string()),
  moodFactors: z.object({
    health: z.number().min(0).max(1),
    care: z.number().min(0).max(1),
    attention: z.number().min(0).max(1),
  }),
});

// Chat Message Schema
export const ChatMessageSchema = z.object({
  id: z.string().min(1, 'Message ID is required'),
  sender: z.enum(['user', 'plant']),
  content: z.string().min(1, 'Message content cannot be empty'),
  timestamp: z.date(),
  emotion: z.enum(['happy', 'sad', 'excited', 'worried', 'grateful', 'neutral']).optional(),
});

// Plant Notification Schema
export const PlantNotificationSchema = z.object({
  id: z.string().min(1, 'Notification ID is required'),
  type: z.enum(['watering', 'fertilizing', 'health_check', 'general']),
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  priority: z.enum(['low', 'medium', 'high']),
  scheduledFor: z.date(),
  completed: z.boolean(),
});

// Plant Schema
export const PlantSchema = z.object({
  id: z.string().min(1, 'Plant ID is required'),
  name: z.string().min(1, 'Plant name is required'),
  species: z.string().min(1, 'Species is required'),
  variety: z.string().optional(),
  nickname: z.string().optional(),
  location: z.string().min(1, 'Location is required'),
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

// Room Schema
export const RoomSchema = z.object({
  id: z.string().min(1, 'Room ID is required'),
  name: z.string().min(1, 'Room name is required'),
  lightLevel: z.enum(['low', 'medium', 'high']),
  humidity: z.number().min(0).max(100),
  temperature: z.number(),
});

// Auth Schemas
export const SignUpSchema = z.object({
  email: z.string().email('Must be a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(1, 'Full name is required').optional(),
});

export const SignInSchema = z.object({
  email: z.string().email('Must be a valid email'),
  password: z.string().min(1, 'Password is required'),
});

// API Response Schemas
export const AIAnalysisResponseSchema = z.object({
  species: z.string(),
  variety: z.string().optional(),
  health: HealthAnalysisSchema,
  careProfile: CareProfileSchema,
  personality: PlantPersonalitySchema,
});

export const PlantResponseSchema = z.object({
  content: z.string(),
  emotion: z.enum(['happy', 'sad', 'excited', 'worried', 'grateful', 'neutral']),
  mood: z.string().optional(),
});

// Form Validation Schemas
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

export const ChatMessageFormSchema = ChatMessageSchema.omit({ 
  id: true, 
  timestamp: true 
});

export const PlantImageFormSchema = PlantImageSchema.omit({ 
  id: true, 
  timestamp: true 
});

// Type inference from schemas
export type HealthIssue = z.infer<typeof HealthIssueSchema>;
export type HealthAnalysis = z.infer<typeof HealthAnalysisSchema>;
export type PlantImage = z.infer<typeof PlantImageSchema>;
export type CareProfile = z.infer<typeof CareProfileSchema>;
export type PlantPersonality = z.infer<typeof PlantPersonalitySchema>;
export type ChatMessage = z.infer<typeof ChatMessageSchema>;
export type PlantNotification = z.infer<typeof PlantNotificationSchema>;
export type Plant = z.infer<typeof PlantSchema>;
export type Room = z.infer<typeof RoomSchema>;
export type SignUpData = z.infer<typeof SignUpSchema>;
export type SignInData = z.infer<typeof SignInSchema>;
export type AIAnalysisResponse = z.infer<typeof AIAnalysisResponseSchema>;
export type PlantResponse = z.infer<typeof PlantResponseSchema>;
export type PlantFormData = z.infer<typeof PlantFormSchema>;
export type ChatMessageFormData = z.infer<typeof ChatMessageFormSchema>;
export type PlantImageFormData = z.infer<typeof PlantImageFormSchema>; 