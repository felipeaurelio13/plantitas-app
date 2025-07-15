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
      plants: {
        Row: {
          id: string
          user_id: string
          name: string
          species: string
          variety: string | null
          nickname: string | null
          description: string | null
          fun_facts: string[] | null
          location: string
          plant_environment: string | null
          light_requirements: string | null
          health_score: number | null
          care_profile: Json
          personality: Json
          date_added: string | null
          last_watered: string | null
          last_fertilized: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          species: string
          variety?: string | null
          nickname?: string | null
          description?: string | null
          fun_facts?: string[] | null
          location: string
          plant_environment?: string | null
          light_requirements?: string | null
          health_score?: number | null
          care_profile?: Json
          personality?: Json
          date_added?: string | null
          last_watered?: string | null
          last_fertilized?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          species?: string
          variety?: string | null
          nickname?: string | null
          description?: string | null
          fun_facts?: string[] | null
          location?: string
          plant_environment?: string | null
          light_requirements?: string | null
          health_score?: number | null
          care_profile?: Json
          personality?: Json
          date_added?: string | null
          last_watered?: string | null
          last_fertilized?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      plant_images: {
        Row: {
          id: string
          plant_id: string
          user_id: string
          storage_path: string
          url: string | null
          health_analysis: Json
          is_profile_image: boolean
          created_at: string
        }
        Insert: {
          id?: string
          plant_id: string
          user_id: string
          storage_path: string
          url?: string | null
          health_analysis?: Json
          is_profile_image?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          plant_id?: string
          user_id?: string
          storage_path?: string
          url?: string | null
          health_analysis?: Json
          is_profile_image?: boolean
          created_at?: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
