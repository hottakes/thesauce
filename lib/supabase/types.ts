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
      admin_notes: {
        Row: {
          admin_id: string | null
          applicant_id: string
          content: string
          created_at: string
          id: string
        }
        Insert: {
          admin_id?: string | null
          applicant_id: string
          content: string
          created_at?: string
          id?: string
        }
        Update: {
          admin_id?: string | null
          applicant_id?: string
          content?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notes_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "applicants"
            referencedColumns: ["id"]
          },
        ]
      }
      ambassador_types: {
        Row: {
          assignment_weight: number
          created_at: string
          description: string
          id: string
          is_active: boolean
          name: string
        }
        Insert: {
          assignment_weight?: number
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          name: string
        }
        Update: {
          assignment_weight?: number
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      applicants: {
        Row: {
          ambassador_type: string
          approved_at: string | null
          content_uploaded: boolean
          content_urls: Json | null
          created_at: string
          email: string | null
          first_name: string | null
          household_size: number
          id: string
          instagram_followers: number | null
          instagram_handle: string
          instagram_profile_pic: string | null
          instagram_verified: boolean | null
          interests: string[]
          is_19_plus: boolean
          last_name: string | null
          personality_traits: string[]
          pitch_type: string | null
          pitch_url: string | null
          points: number
          referral_code: string
          rejected_at: string | null
          scene_custom: string | null
          scene_types: string[]
          school: string
          status: string
          user_id: string | null
          waitlist_position: number
        }
        Insert: {
          ambassador_type: string
          approved_at?: string | null
          content_uploaded?: boolean
          content_urls?: Json | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          household_size?: number
          id?: string
          instagram_followers?: number | null
          instagram_handle: string
          instagram_profile_pic?: string | null
          instagram_verified?: boolean | null
          interests?: string[]
          is_19_plus?: boolean
          last_name?: string | null
          personality_traits?: string[]
          pitch_type?: string | null
          pitch_url?: string | null
          points?: number
          referral_code: string
          rejected_at?: string | null
          scene_custom?: string | null
          scene_types?: string[]
          school: string
          status?: string
          user_id?: string | null
          waitlist_position: number
        }
        Update: {
          ambassador_type?: string
          approved_at?: string | null
          content_uploaded?: boolean
          content_urls?: Json | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          household_size?: number
          id?: string
          instagram_followers?: number | null
          instagram_handle?: string
          instagram_profile_pic?: string | null
          instagram_verified?: boolean | null
          interests?: string[]
          is_19_plus?: boolean
          last_name?: string | null
          personality_traits?: string[]
          pitch_type?: string | null
          pitch_url?: string | null
          points?: number
          referral_code?: string
          rejected_at?: string | null
          scene_custom?: string | null
          scene_types?: string[]
          school?: string
          status?: string
          user_id?: string | null
          waitlist_position?: number
        }
        Relationships: []
      }
      challenge_completions: {
        Row: {
          applicant_id: string
          challenge_id: string
          completed_at: string
          id: string
          proof_url: string | null
          verified: boolean
        }
        Insert: {
          applicant_id: string
          challenge_id: string
          completed_at?: string
          id?: string
          proof_url?: string | null
          verified?: boolean
        }
        Update: {
          applicant_id?: string
          challenge_id?: string
          completed_at?: string
          id?: string
          proof_url?: string | null
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "challenge_completions_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "applicants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_completions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string
          description: string | null
          external_url: string | null
          icon: string | null
          id: string
          is_active: boolean
          points: number
          sort_order: number
          title: string
          verification_type: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          external_url?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          points?: number
          sort_order?: number
          title: string
          verification_type?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          external_url?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          points?: number
          sort_order?: number
          title?: string
          verification_type?: string
        }
        Relationships: []
      }
      interests: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          is_active: boolean
          label: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          brand_logo_url: string | null
          brand_name: string
          compensation: string | null
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_featured: boolean | null
          location: string | null
          opportunity_type: string
          requirements: string[] | null
          schools: string[] | null
          short_description: string | null
          spots_filled: number | null
          spots_total: number | null
          start_date: string | null
          status: string | null
          title: string
          updated_at: string
        }
        Insert: {
          brand_logo_url?: string | null
          brand_name: string
          compensation?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_featured?: boolean | null
          location?: string | null
          opportunity_type: string
          requirements?: string[] | null
          schools?: string[] | null
          short_description?: string | null
          spots_filled?: number | null
          spots_total?: number | null
          start_date?: string | null
          status?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          brand_logo_url?: string | null
          brand_name?: string
          compensation?: string | null
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_featured?: boolean | null
          location?: string | null
          opportunity_type?: string
          requirements?: string[] | null
          schools?: string[] | null
          short_description?: string | null
          spots_filled?: number | null
          spots_total?: number | null
          start_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      opportunity_applications: {
        Row: {
          applicant_id: string
          applied_at: string
          approved_at: string | null
          id: string
          notes: string | null
          opportunity_id: string
          status: string | null
        }
        Insert: {
          applicant_id: string
          applied_at?: string
          approved_at?: string | null
          id?: string
          notes?: string | null
          opportunity_id: string
          status?: string | null
        }
        Update: {
          applicant_id?: string
          applied_at?: string
          approved_at?: string | null
          id?: string
          notes?: string | null
          opportunity_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_applications_applicant_id_fkey"
            columns: ["applicant_id"]
            isOneToOne: false
            referencedRelation: "applicants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_applications_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      personality_traits: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          is_active: boolean
          label: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
      schools: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          sort_order: number
          spots_remaining: number
          spots_total: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          sort_order?: number
          spots_remaining?: number
          spots_total?: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          spots_remaining?: number
          spots_total?: number
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      venue_types: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          is_active: boolean
          label: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          is_active?: boolean
          label: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          is_active?: boolean
          label?: string
          sort_order?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_email: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database["public"]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof Database
}
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof Database
}
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
