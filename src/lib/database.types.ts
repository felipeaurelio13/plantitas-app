export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          emotion: string | null
          id: string
          plant_id: string
          sender: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          emotion?: string | null
          id?: string
          plant_id: string
          sender: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          emotion?: string | null
          id?: string
          plant_id?: string
          sender?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plant_images: {
        Row: {
          created_at: string | null
          health_analysis: Json | null
          id: string
          is_profile_image: boolean | null
          plant_id: string
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          health_analysis?: Json | null
          id?: string
          is_profile_image?: boolean | null
          plant_id: string
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          health_analysis?: Json | null
          id?: string
          is_profile_image?: boolean | null
          plant_id?: string
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plant_images_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_images_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plant_notifications: {
        Row: {
          completed: boolean | null
          created_at: string | null
          id: string
          message: string
          plant_id: string
          priority: string | null
          scheduled_for: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          message: string
          plant_id: string
          priority?: string | null
          scheduled_for: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          created_at?: string | null
          id?: string
          message?: string
          plant_id?: string
          priority?: string | null
          scheduled_for?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plant_notifications_plant_id_fkey"
            columns: ["plant_id"]
            isOneToOne: false
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plants: {
        Row: {
          care_profile: Json
          created_at: string | null
          date_added: string | null
          health_score: number | null
          id: string
          last_fertilized: string | null
          last_watered: string | null
          location: string
          name: string
          nickname: string | null
          personality: Json
          species: string
          updated_at: string | null
          user_id: string
          variety: string | null
        }
        Insert: {
          care_profile?: Json
          created_at?: string | null
          date_added?: string | null
          health_score?: number | null
          id?: string
          last_fertilized?: string | null
          last_watered?: string | null
          location: string
          name: string
          nickname?: string | null
          personality?: Json
          species: string
          updated_at?: string | null
          user_id: string
          variety?: string | null
        }
        Update: {
          care_profile?: Json
          created_at?: string | null
          date_added?: string | null
          health_score?: number | null
          id?: string
          last_fertilized?: string | null
          last_watered?: string | null
          location?: string
          name?: string
          nickname?: string | null
          personality?: Json
          species?: string
          updated_at?: string | null
          user_id?: string
          variety?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          preferences: Json | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          preferences?: Json | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          preferences?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_plants_with_stats: {
        Args: { user_uuid: string }
        Returns: {
          plant_data: Json
          total_images: number
          total_messages: number
          days_since_watered: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'] 