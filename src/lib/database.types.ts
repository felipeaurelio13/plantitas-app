export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
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
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      plant_images: {
        Row: {
          created_at: string | null
          health_analysis: Json
          id: string
          is_profile_image: boolean | null
          plant_id: string
          storage_path: string
          url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          health_analysis?: Json
          id?: string
          is_profile_image?: boolean | null
          plant_id: string
          storage_path: string
          url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          health_analysis?: Json
          id?: string
          is_profile_image?: boolean | null
          plant_id?: string
          storage_path?: string
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plant_images_plant_id_fkey"
            columns: ["plant_id"]
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_images_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
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
            referencedRelation: "plants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plant_notifications_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
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
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
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
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] &
      Database["public"]["Views"])
  ? (Database["public"]["Tables"] &
      Database["public"]["Views"])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never
