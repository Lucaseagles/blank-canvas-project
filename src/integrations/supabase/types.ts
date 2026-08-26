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
      analytics_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_points_config: {
        Row: {
          action_key: string
          created_at: string | null
          description: string | null
          id: string
          points: number
          updated_at: string | null
        }
        Insert: {
          action_key: string
          created_at?: string | null
          description?: string | null
          id?: string
          points: number
          updated_at?: string | null
        }
        Update: {
          action_key?: string
          created_at?: string | null
          description?: string | null
          id?: string
          points?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      automation_logs: {
        Row: {
          context: Json | null
          id: string
          result: string | null
          rule_id: string
          status: string | null
          triggered_at: string | null
        }
        Insert: {
          context?: Json | null
          id?: string
          result?: string | null
          rule_id: string
          status?: string | null
          triggered_at?: string | null
        }
        Update: {
          context?: Json | null
          id?: string
          result?: string | null
          rule_id?: string
          status?: string | null
          triggered_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "automation_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      automation_rules: {
        Row: {
          action_params: Json | null
          action_type: Database["public"]["Enums"]["automation_action_type"]
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_fully_automated: boolean | null
          name: string
          trigger_condition: Json | null
          trigger_type: Database["public"]["Enums"]["automation_trigger_type"]
          updated_at: string | null
        }
        Insert: {
          action_params?: Json | null
          action_type: Database["public"]["Enums"]["automation_action_type"]
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_fully_automated?: boolean | null
          name: string
          trigger_condition?: Json | null
          trigger_type: Database["public"]["Enums"]["automation_trigger_type"]
          updated_at?: string | null
        }
        Update: {
          action_params?: Json | null
          action_type?: Database["public"]["Enums"]["automation_action_type"]
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_fully_automated?: boolean | null
          name?: string
          trigger_condition?: Json | null
          trigger_type?: Database["public"]["Enums"]["automation_trigger_type"]
          updated_at?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          created_at: string | null
          criteria: Json
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          criteria: Json
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          criteria?: Json
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
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
      bundle_products: {
        Row: {
          bundle_id: string
          created_at: string | null
          id: string
          position: number | null
          product_id: string
        }
        Insert: {
          bundle_id: string
          created_at?: string | null
          id?: string
          position?: number | null
          product_id: string
        }
        Update: {
          bundle_id?: string
          created_at?: string | null
          id?: string
          position?: number | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundle_products_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "bundles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      bundles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          slug: string
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          slug: string
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          slug?: string
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
      compliance_audit_log: {
        Row: {
          detected_at: string | null
          id: string
          marketplace_id: string | null
          product_id: string | null
          rule_key: string
          violation_detail: string | null
        }
        Insert: {
          detected_at?: string | null
          id?: string
          marketplace_id?: string | null
          product_id?: string | null
          rule_key: string
          violation_detail?: string | null
        }
        Update: {
          detected_at?: string | null
          id?: string
          marketplace_id?: string | null
          product_id?: string | null
          rule_key?: string
          violation_detail?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_audit_log_marketplace_id_fkey"
            columns: ["marketplace_id"]
            isOneToOne: false
            referencedRelation: "marketplaces"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_audit_log_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_rules: {
        Row: {
          id: string
          is_enforced: boolean
          marketplace_id: string
          notes: string | null
          reviewed_at: string | null
          rule_key: string
          rule_value: Json
          source_url: string | null
        }
        Insert: {
          id?: string
          is_enforced?: boolean
          marketplace_id: string
          notes?: string | null
          reviewed_at?: string | null
          rule_key: string
          rule_value?: Json
          source_url?: string | null
        }
        Update: {
          id?: string
          is_enforced?: boolean
          marketplace_id?: string
          notes?: string | null
          reviewed_at?: string | null
          rule_key?: string
          rule_value?: Json
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_rules_marketplace_id_fkey"
            columns: ["marketplace_id"]
            isOneToOne: false
            referencedRelation: "marketplaces"
            referencedColumns: ["id"]
          },
        ]
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
      feed_mix_config: {
        Row: {
          discovery_pct: number
          id: string
          related_pct: number
          relevant_pct: number
          updated_at: string | null
        }
        Insert: {
          discovery_pct?: number
          id?: string
          related_pct?: number
          relevant_pct?: number
          updated_at?: string | null
        }
        Update: {
          discovery_pct?: number
          id?: string
          related_pct?: number
          relevant_pct?: number
          updated_at?: string | null
        }
        Relationships: []
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
      missions: {
        Row: {
          created_at: string | null
          criteria: Json
          description: string | null
          id: string
          is_active: boolean | null
          reward_points: number | null
          title: string
        }
        Insert: {
          created_at?: string | null
          criteria: Json
          description?: string | null
          id?: string
          is_active?: boolean | null
          reward_points?: number | null
          title: string
        }
        Update: {
          created_at?: string | null
          criteria?: Json
          description?: string | null
          id?: string
          is_active?: boolean | null
          reward_points?: number | null
          title?: string
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
      personalization_weights: {
        Row: {
          id: string
          signal_key: string
          updated_at: string
          weight: number | null
        }
        Insert: {
          id?: string
          signal_key: string
          updated_at?: string
          weight?: number | null
        }
        Update: {
          id?: string
          signal_key?: string
          updated_at?: string
          weight?: number | null
        }
        Relationships: []
      }
      point_transactions: {
        Row: {
          created_at: string | null
          event_reference_id: string | null
          id: string
          points: number
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_reference_id?: string | null
          id?: string
          points: number
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_reference_id?: string | null
          id?: string
          points?: number
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      price_alerts: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          product_id: string
          target_price: number
          triggered_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          product_id: string
          target_price: number
          triggered_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          product_id?: string
          target_price?: number
          triggered_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_alerts_product_id_fkey"
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
      product_relationships: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          related_product_id: string
          type: Database["public"]["Enums"]["relationship_type"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          related_product_id: string
          type: Database["public"]["Enums"]["relationship_type"]
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          related_product_id?: string
          type?: Database["public"]["Enums"]["relationship_type"]
        }
        Relationships: [
          {
            foreignKeyName: "product_relationships_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_relationships_related_product_id_fkey"
            columns: ["related_product_id"]
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
      recently_shown: {
        Row: {
          id: string
          product_id: string
          shown_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          product_id: string
          shown_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          product_id?: string
          shown_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recently_shown_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_milestones: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          reward_type: string
          target_activations: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          reward_type: string
          target_activations: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          reward_type?: string
          target_activations?: number
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interests: {
        Row: {
          category_id: string
          id: string
          score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category_id: string
          id?: string
          score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category_id?: string
          id?: string
          score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_missions: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          mission_id: string
          progress: Json | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          mission_id: string
          progress?: Json | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          mission_id?: string
          progress?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_missions_mission_id_fkey"
            columns: ["mission_id"]
            isOneToOne: false
            referencedRelation: "missions"
            referencedColumns: ["id"]
          },
        ]
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
      user_preferences: {
        Row: {
          created_at: string
          id: string
          preferred_categories: string[] | null
          preferred_marketplaces: string[] | null
          price_range_max: number | null
          price_range_min: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          preferred_categories?: string[] | null
          preferred_marketplaces?: string[] | null
          price_range_max?: number | null
          price_range_min?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          preferred_categories?: string[] | null
          preferred_marketplaces?: string[] | null
          price_range_max?: number | null
          price_range_min?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_rewards: {
        Row: {
          granted_at: string | null
          id: string
          milestone_id: string | null
          reward_code: string | null
          user_id: string
        }
        Insert: {
          granted_at?: string | null
          id?: string
          milestone_id?: string | null
          reward_code?: string | null
          user_id: string
        }
        Update: {
          granted_at?: string | null
          id?: string
          milestone_id?: string | null
          reward_code?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_rewards_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "referral_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      video_products: {
        Row: {
          created_at: string | null
          id: string
          position: number | null
          product_id: string
          video_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          position?: number | null
          product_id: string
          video_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          position?: number | null
          product_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_products_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          category_id: string | null
          created_at: string
          duration_seconds: number | null
          external_url: string | null
          id: string
          product_id: string | null
          status: string
          storage_path: string | null
          thumbnail_url: string | null
          title: string
          video_url: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          external_url?: string | null
          id?: string
          product_id?: string | null
          status?: string
          storage_path?: string | null
          thumbnail_url?: string | null
          title: string
          video_url: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          external_url?: string | null
          id?: string
          product_id?: string | null
          status?: string
          storage_path?: string | null
          thumbnail_url?: string | null
          title?: string
          video_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "videos_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_recently_shown: { Args: never; Returns: undefined }
      get_personalized_recommendations: {
        Args: { p_limit?: number; p_offset?: number; p_user_id: string }
        Returns: {
          category_id: string
          current_price: number
          description: string
          discount: number
          id: string
          images: string[]
          marketplace_id: string
          previous_price: number
          rating: number
          recommendation_score: number
          review_count: number
          slug: string
          title: string
        }[]
      }
      grant_points: {
        Args: { _action_key: string; _ref_id?: string; _user_id: string }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      log_automation_activity: {
        Args: {
          _context: Json
          _result: string
          _rule_id: string
          _status: string
        }
        Returns: undefined
      }
      update_user_streak: { Args: { _user_id: string }; Returns: undefined }
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
