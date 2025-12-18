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
      comments: {
        Row: {
          body: string
          created_at: string
          dump_pack_id: string
          id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          dump_pack_id: string
          id?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          dump_pack_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_dump_pack_id_fkey"
            columns: ["dump_pack_id"]
            isOneToOne: false
            referencedRelation: "dump_packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creators: {
        Row: {
          back_catalog_access: boolean | null
          banner_url: string | null
          bio: string | null
          created_at: string
          handle: string
          id: string
          instagram_url: string | null
          is_active: boolean | null
          license_type: Database["public"]["Enums"]["license_type"] | null
          payout_email: string | null
          price_usd: number | null
          soundcloud_url: string | null
          spotify_url: string | null
          stripe_account_id: string | null
          stripe_price_id: string | null
          stripe_product_id: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
          website_url: string | null
          youtube_url: string | null
        }
        Insert: {
          back_catalog_access?: boolean | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          handle: string
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          license_type?: Database["public"]["Enums"]["license_type"] | null
          payout_email?: string | null
          price_usd?: number | null
          soundcloud_url?: string | null
          spotify_url?: string | null
          stripe_account_id?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Update: {
          back_catalog_access?: boolean | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          handle?: string
          id?: string
          instagram_url?: string | null
          is_active?: boolean | null
          license_type?: Database["public"]["Enums"]["license_type"] | null
          payout_email?: string | null
          price_usd?: number | null
          soundcloud_url?: string | null
          spotify_url?: string | null
          stripe_account_id?: string | null
          stripe_price_id?: string | null
          stripe_product_id?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          website_url?: string | null
          youtube_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      dump_packs: {
        Row: {
          bpm: number | null
          created_at: string
          creator_id: string
          description: string | null
          dump_zip_path: string | null
          flp_path: string | null
          id: string
          is_deleted: boolean | null
          key: string | null
          midi_zip_path: string | null
          pack_type: Database["public"]["Enums"]["pack_type"]
          preview_path: string
          project_zip_path: string | null
          stems_zip_path: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          bpm?: number | null
          created_at?: string
          creator_id: string
          description?: string | null
          dump_zip_path?: string | null
          flp_path?: string | null
          id?: string
          is_deleted?: boolean | null
          key?: string | null
          midi_zip_path?: string | null
          pack_type: Database["public"]["Enums"]["pack_type"]
          preview_path: string
          project_zip_path?: string | null
          stems_zip_path?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          bpm?: number | null
          created_at?: string
          creator_id?: string
          description?: string | null
          dump_zip_path?: string | null
          flp_path?: string | null
          id?: string
          is_deleted?: boolean | null
          key?: string | null
          midi_zip_path?: string | null
          pack_type?: Database["public"]["Enums"]["pack_type"]
          preview_path?: string
          project_zip_path?: string | null
          stems_zip_path?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dump_packs_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string
          id: string
          is_admin: boolean | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          is_admin?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          is_admin?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          created_at: string
          dump_pack_id: string
          id: string
          reason: string
          reporter_id: string
          status: Database["public"]["Enums"]["report_status"] | null
        }
        Insert: {
          created_at?: string
          dump_pack_id: string
          id?: string
          reason: string
          reporter_id: string
          status?: Database["public"]["Enums"]["report_status"] | null
        }
        Update: {
          created_at?: string
          dump_pack_id?: string
          id?: string
          reason?: string
          reporter_id?: string
          status?: Database["public"]["Enums"]["report_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_dump_pack_id_fkey"
            columns: ["dump_pack_id"]
            isOneToOne: false
            referencedRelation: "dump_packs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          creator_id: string
          current_period_end: string | null
          id: string
          status: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscriber_id: string
        }
        Insert: {
          created_at?: string
          creator_id: string
          current_period_end?: string | null
          id?: string
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscriber_id: string
        }
        Update: {
          created_at?: string
          creator_id?: string
          current_period_end?: string | null
          id?: string
          status?: Database["public"]["Enums"]["subscription_status"] | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscriber_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_subscriber_id_fkey"
            columns: ["subscriber_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
      license_type: "personal_only" | "commercial_with_credit"
      pack_type: "flp_only" | "zipped_project" | "compatible_pack"
      report_status: "open" | "resolved"
      subscription_status: "active" | "canceled" | "past_due"
      user_role: "subscriber" | "creator" | "both"
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
      license_type: ["personal_only", "commercial_with_credit"],
      pack_type: ["flp_only", "zipped_project", "compatible_pack"],
      report_status: ["open", "resolved"],
      subscription_status: ["active", "canceled", "past_due"],
      user_role: ["subscriber", "creator", "both"],
    },
  },
} as const
