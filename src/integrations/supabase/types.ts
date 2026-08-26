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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      banners: {
        Row: {
          created_at: string | null
          ends_at: string | null
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
          position: number | null
          starts_at: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          position?: number | null
          starts_at?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          position?: number | null
          starts_at?: string | null
          title?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          slug?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          product_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplaces: {
        Row: {
          api_config: Json | null
          api_status: string | null
          created_at: string | null
          id: string
          name: string
          slug: string
          status: string | null
        }
        Insert: {
          api_config?: Json | null
          api_status?: string | null
          created_at?: string | null
          id?: string
          name: string
          slug: string
          status?: string | null
        }
        Update: {
          api_config?: Json | null
          api_status?: string | null
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
          status?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string
          created_at: string | null
          id: string
          product_id: string | null
          read: boolean | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          product_id?: string | null
          read?: boolean | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          product_id?: string | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          id: string
          price: number
          product_id: string | null
          recorded_at: string | null
        }
        Insert: {
          id?: string
          price: number
          product_id?: string | null
          recorded_at?: string | null
        }
        Update: {
          id?: string
          price?: number
          product_id?: string | null
          recorded_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          affiliate_url: string | null
          category_id: string | null
          created_at: string | null
          current_price: number | null
          description: string | null
          discount: number | null
          external_product_id: string | null
          flash_deal_ends_at: string | null
          id: string
          images: string[] | null
          is_best_offer: boolean | null
          marketplace_id: string | null
          offer_group_id: string | null
          offer_score: number | null
          previous_price: number | null
          rating: number | null
          review_count: number | null
          slug: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          affiliate_url?: string | null
          category_id?: string | null
          created_at?: string | null
          current_price?: number | null
          description?: string | null
          discount?: number | null
          external_product_id?: string | null
          flash_deal_ends_at?: string | null
          id?: string
          images?: string[] | null
          is_best_offer?: boolean | null
          marketplace_id?: string | null
          offer_group_id?: string | null
          offer_score?: number | null
          previous_price?: number | null
          rating?: number | null
          review_count?: number | null
          slug?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          affiliate_url?: string | null
          category_id?: string | null
          created_at?: string | null
          current_price?: number | null
          description?: string | null
          discount?: number | null
          external_product_id?: string | null
          flash_deal_ends_at?: string | null
          id?: string
          images?: string[] | null
          is_best_offer?: boolean | null
          marketplace_id?: string | null
          offer_group_id?: string | null
          offer_score?: number | null
          previous_price?: number | null
          rating?: number | null
          review_count?: number | null
          slug?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_marketplace_id_fkey"
            columns: ["marketplace_id"]
            isOneToOne: false
            referencedRelation: "marketplaces"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: string
          location_city: string | null
          location_state: string | null
          role: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          location_city?: string | null
          location_state?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          location_city?: string | null
          location_state?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_points: {
        Row: {
          id: string
          last_activity_at: string | null
          points: number | null
          streak_count: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          last_activity_at?: string | null
          points?: number | null
          streak_count?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          last_activity_at?: string | null
          points?: number | null
          streak_count?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "owner" | "admin" | "user"
      automation_action_type:
        | "RECALCULATE_OFFER_SCORE"
        | "SEND_NOTIFICATION"
        | "CHECK_PRICE_ALERTS"
        | "UPDATE_INTEREST_SCORE"
        | "RECALCULATE_TRENDING"
        | "ADJUST_FEED_WEIGHT"
        | "QUEUE_FOR_REVIEW"
      automation_trigger_type:
        | "PRICE_CHANGED"
        | "NEW_OFFER_IN_GROUP"
        | "USER_INTEREST_THRESHOLD"
        | "SCHEDULED"
        | "EVENT_TRACKED"
      campaign_channel_type:
        | "email"
        | "push"
        | "in_app"
        | "whatsapp"
        | "telegram"
      campaign_status_type:
        | "draft"
        | "active"
        | "paused"
        | "completed"
        | "cancelled"
      notification_type:
        | "price_alert"
        | "welcome"
        | "promotion"
        | "reminder"
        | "system"
      offer_score_status: "pending" | "calculated" | "failed"
      product_status_type: "draft" | "active" | "inactive" | "out_of_stock"
      referral_status_type: "pending" | "accepted" | "completed" | "expired"
      relationship_type:
        | "CROSS_SELL"
        | "UPSELL"
        | "DOWNSELL"
        | "ACCESSORY"
        | "SUBSTITUTE"
        | "BUNDLE"
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
      app_role: ["owner", "admin", "user"],
      automation_action_type: [
        "RECALCULATE_OFFER_SCORE",
        "SEND_NOTIFICATION",
        "CHECK_PRICE_ALERTS",
        "UPDATE_INTEREST_SCORE",
        "RECALCULATE_TRENDING",
        "ADJUST_FEED_WEIGHT",
        "QUEUE_FOR_REVIEW",
      ],
      automation_trigger_type: [
        "PRICE_CHANGED",
        "NEW_OFFER_IN_GROUP",
        "USER_INTEREST_THRESHOLD",
        "SCHEDULED",
        "EVENT_TRACKED",
      ],
      campaign_channel_type: [
        "email",
        "push",
        "in_app",
        "whatsapp",
        "telegram",
      ],
      campaign_status_type: [
        "draft",
        "active",
        "paused",
        "completed",
        "cancelled",
      ],
      notification_type: [
        "price_alert",
        "welcome",
        "promotion",
        "reminder",
        "system",
      ],
      offer_score_status: ["pending", "calculated", "failed"],
      product_status_type: ["draft", "active", "inactive", "out_of_stock"],
      referral_status_type: ["pending", "accepted", "completed", "expired"],
      relationship_type: [
        "CROSS_SELL",
        "UPSELL",
        "DOWNSELL",
        "ACCESSORY",
        "SUBSTITUTE",
        "BUNDLE",
      ],
    },
  },
} as const
