export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
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
          content_uploaded: boolean
          content_urls: Json | null
          created_at: string
          email: string | null
          household_size: number
          id: string
          instagram_handle: string
          interests: string[]
          is_19_plus: boolean
          personality_traits: string[]
          pitch_type: string | null
          pitch_url: string | null
          points: number
          referral_code: string
          scene_custom: string | null
          scene_types: string[]
          school: string
          status: string
          waitlist_position: number
        }
        Insert: {
          ambassador_type: string
          content_uploaded?: boolean
          content_urls?: Json | null
          created_at?: string
          email?: string | null
          household_size?: number
          id?: string
          instagram_handle: string
          interests?: string[]
          is_19_plus?: boolean
          personality_traits?: string[]
          pitch_type?: string | null
          pitch_url?: string | null
          points?: number
          referral_code: string
          scene_custom?: string | null
          scene_types?: string[]
          school: string
          status?: string
          waitlist_position: number
        }
        Update: {
          ambassador_type?: string
          content_uploaded?: boolean
          content_urls?: Json | null
          created_at?: string
          email?: string | null
          household_size?: number
          id?: string
          instagram_handle?: string
          interests?: string[]
          is_19_plus?: boolean
          personality_traits?: string[]
          pitch_type?: string | null
          pitch_url?: string | null
          points?: number
          referral_code?: string
          scene_custom?: string | null
          scene_types?: string[]
          school?: string
          status?: string
          waitlist_position?: number
        }
        Relationships: []
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
