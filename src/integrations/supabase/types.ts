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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ab_assignments: {
        Row: {
          assigned_at: string
          experiment_id: string
          id: string
          user_id: string
          variant: string
        }
        Insert: {
          assigned_at?: string
          experiment_id: string
          id?: string
          user_id: string
          variant: string
        }
        Update: {
          assigned_at?: string
          experiment_id?: string
          id?: string
          user_id?: string
          variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "ab_assignments_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "ab_experiments"
            referencedColumns: ["id"]
          },
        ]
      }
      ab_experiments: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          target: Json
          variant_a: Json
          variant_b: Json
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          target?: Json
          variant_a?: Json
          variant_b?: Json
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          target?: Json
          variant_a?: Json
          variant_b?: Json
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          anonymous_id: string | null
          campaign_id: string | null
          category_id: string | null
          created_at: string
          event_name: string | null
          event_type: string
          id: string
          metadata: Json | null
          product_id: string | null
          session_id: string | null
          source: string | null
          user_id: string | null
        }
        Insert: {
          anonymous_id?: string | null
          campaign_id?: string | null
          category_id?: string | null
          created_at?: string
          event_name?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          product_id?: string | null
          session_id?: string | null
          source?: string | null
          user_id?: string | null
        }
        Update: {
          anonymous_id?: string | null
          campaign_id?: string | null
          category_id?: string | null
          created_at?: string
          event_name?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          product_id?: string | null
          session_id?: string | null
          source?: string | null
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
          audience_segment: string | null
          campaign_id: string | null
          created_at: string | null
          ends_at: string | null
          id: string
          image_url: string
          is_active: boolean | null
          link_url: string | null
          position: number | null
          starts_at: string | null
          target_category_id: string | null
          target_device: string | null
          target_product_id: string | null
          title: string
        }
        Insert: {
          audience_segment?: string | null
          campaign_id?: string | null
          created_at?: string | null
          ends_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          link_url?: string | null
          position?: number | null
          starts_at?: string | null
          target_category_id?: string | null
          target_device?: string | null
          target_product_id?: string | null
          title: string
        }
        Update: {
          audience_segment?: string | null
          campaign_id?: string | null
          created_at?: string | null
          ends_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_url?: string | null
          position?: number | null
          starts_at?: string | null
          target_category_id?: string | null
          target_device?: string | null
          target_product_id?: string | null
          title?: string
        }
        Relationships: []
      }
      bridge_videos: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          link: string
          platform: string
          product_id: string
          subtitle: string | null
          thumbnail: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          link: string
          platform: string
          product_id: string
          subtitle?: string | null
          thumbnail?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          link?: string
          platform?: string
          product_id?: string
          subtitle?: string | null
          thumbnail?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bridge_videos_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
          bundle_discount_price: number | null
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          slug: string
          title: string
        }
        Insert: {
          bundle_discount_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          slug: string
          title: string
        }
        Update: {
          bundle_discount_price?: number | null
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
      campaign_channels: {
        Row: {
          campaign_id: string
          channel: string
          config: Json
          id: string
          is_enabled: boolean
        }
        Insert: {
          campaign_id: string
          channel: string
          config?: Json
          id?: string
          is_enabled?: boolean
        }
        Update: {
          campaign_id?: string
          channel?: string
          config?: Json
          id?: string
          is_enabled?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "campaign_channels_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_products: {
        Row: {
          campaign_id: string
          id: string
          product_id: string
        }
        Insert: {
          campaign_id: string
          id?: string
          product_id: string
        }
        Update: {
          campaign_id?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_products_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          audience_segment: string | null
          conditions: Json
          created_at: string
          description: string | null
          ends_at: string
          frequency_cap_per_day: number
          id: string
          min_interest_score: number | null
          name: string
          priority: number
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          audience_segment?: string | null
          conditions?: Json
          created_at?: string
          description?: string | null
          ends_at: string
          frequency_cap_per_day?: number
          id?: string
          min_interest_score?: number | null
          name: string
          priority?: number
          starts_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          audience_segment?: string | null
          conditions?: Json
          created_at?: string
          description?: string | null
          ends_at?: string
          frequency_cap_per_day?: number
          id?: string
          min_interest_score?: number | null
          name?: string
          priority?: number
          starts_at?: string
          status?: string
          updated_at?: string
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
      category_highlights: {
        Row: {
          calculated_at: string
          category_id: string
          created_at: string
          id: string
          is_manual_override: boolean
          offer_score: number
          product_id: string
          rank: number
          updated_at: string
        }
        Insert: {
          calculated_at?: string
          category_id: string
          created_at?: string
          id?: string
          is_manual_override?: boolean
          offer_score?: number
          product_id: string
          rank: number
          updated_at?: string
        }
        Update: {
          calculated_at?: string
          category_id?: string
          created_at?: string
          id?: string
          is_manual_override?: boolean
          offer_score?: number
          product_id?: string
          rank?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_highlights_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_highlights_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
      content_affinity_log: {
        Row: {
          affinity_score: number
          content_id: string
          created_at: string
          id: string
          notified: boolean
          user_id: string
        }
        Insert: {
          affinity_score: number
          content_id: string
          created_at?: string
          id?: string
          notified?: boolean
          user_id: string
        }
        Update: {
          affinity_score?: number
          content_id?: string
          created_at?: string
          id?: string
          notified?: boolean
          user_id?: string
        }
        Relationships: []
      }
      content_notification_queue: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          error_message: string | null
          id: string
          processed_at: string | null
          status: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          error_message?: string | null
          id?: string
          processed_at?: string | null
          status?: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          error_message?: string | null
          id?: string
          processed_at?: string | null
          status?: string
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
      feature_flags: {
        Row: {
          id: string
          is_enabled: boolean
          key: string
          updated_at: string
        }
        Insert: {
          id?: string
          is_enabled?: boolean
          key: string
          updated_at?: string
        }
        Update: {
          id?: string
          is_enabled?: boolean
          key?: string
          updated_at?: string
        }
        Relationships: []
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
      hidden_from_recently_viewed: {
        Row: {
          hidden_at: string
          id: string
          product_id: string | null
          user_id: string
          video_id: string | null
        }
        Insert: {
          hidden_at?: string
          id?: string
          product_id?: string | null
          user_id: string
          video_id?: string | null
        }
        Update: {
          hidden_at?: string
          id?: string
          product_id?: string | null
          user_id?: string
          video_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hidden_from_recently_viewed_product_id_fkey"
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
      notification_preferences: {
        Row: {
          created_at: string
          frequency_cap_days: number
          id: string
          push_enabled: boolean
          retention_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          frequency_cap_days?: number
          id?: string
          push_enabled?: boolean
          retention_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          frequency_cap_days?: number
          id?: string
          push_enabled?: boolean
          retention_enabled?: boolean
          updated_at?: string
          user_id?: string
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
      offer_groups: {
        Row: {
          canonical_title: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          canonical_title: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          canonical_title?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
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
      popup_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          popup_rule_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          popup_rule_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          popup_rule_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "popup_events_popup_rule_id_fkey"
            columns: ["popup_rule_id"]
            isOneToOne: false
            referencedRelation: "popup_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      popup_rules: {
        Row: {
          audience_segment: string | null
          conditions: Json
          content: Json
          cooldown_minutes: number
          created_at: string
          cta_label: string | null
          cta_target: string | null
          ends_at: string | null
          frequency_cap_per_day: number
          id: string
          is_active: boolean
          name: string
          priority: number
          starts_at: string | null
          trigger_type: string
        }
        Insert: {
          audience_segment?: string | null
          conditions?: Json
          content?: Json
          cooldown_minutes?: number
          created_at?: string
          cta_label?: string | null
          cta_target?: string | null
          ends_at?: string | null
          frequency_cap_per_day?: number
          id?: string
          is_active?: boolean
          name: string
          priority?: number
          starts_at?: string | null
          trigger_type: string
        }
        Update: {
          audience_segment?: string | null
          conditions?: Json
          content?: Json
          cooldown_minutes?: number
          created_at?: string
          cta_label?: string | null
          cta_target?: string | null
          ends_at?: string | null
          frequency_cap_per_day?: number
          id?: string
          is_active?: boolean
          name?: string
          priority?: number
          starts_at?: string | null
          trigger_type?: string
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
          demand_score: number
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
          search_vector: unknown
          slug: string | null
          status: string | null
          title: string
          trend_velocity: number
          updated_at: string | null
        }
        Insert: {
          affiliate_url?: string | null
          category_id?: string | null
          created_at?: string | null
          current_price?: number | null
          demand_score?: number
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
          search_vector?: unknown
          slug?: string | null
          status?: string | null
          title: string
          trend_velocity?: number
          updated_at?: string | null
        }
        Update: {
          affiliate_url?: string | null
          category_id?: string | null
          created_at?: string | null
          current_price?: number | null
          demand_score?: number
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
          search_vector?: unknown
          slug?: string | null
          status?: string | null
          title?: string
          trend_velocity?: number
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
          {
            foreignKeyName: "products_offer_group_id_fkey"
            columns: ["offer_group_id"]
            isOneToOne: false
            referencedRelation: "offer_groups"
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
          whatsapp_opt_in: boolean
          whatsapp_opt_in_at: string | null
          whatsapp_opt_in_source: string | null
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
          whatsapp_opt_in?: boolean
          whatsapp_opt_in_at?: string | null
          whatsapp_opt_in_source?: string | null
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
          whatsapp_opt_in?: boolean
          whatsapp_opt_in_at?: string | null
          whatsapp_opt_in_source?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string | null
          created_at: string
          endpoint: string
          id: string
          p256dh: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auth?: string | null
          created_at?: string
          endpoint: string
          id?: string
          p256dh?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string | null
          updated_at?: string
          user_id?: string
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
      referral_events: {
        Row: {
          campaign_id: string | null
          created_at: string
          id: string
          invited_user_id: string | null
          referral_id: string
          status: string
          updated_at: string
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string
          id?: string
          invited_user_id?: string | null
          referral_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          campaign_id?: string | null
          created_at?: string
          id?: string
          invited_user_id?: string | null
          referral_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_events_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
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
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          referrer_user_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          referrer_user_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          referrer_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      search_history: {
        Row: {
          created_at: string
          id: string
          query: string
          result_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          query: string
          result_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          query?: string
          result_count?: number
          user_id?: string
        }
        Relationships: []
      }
      social_proof_config: {
        Row: {
          adaptive_priority_enabled: boolean
          allowed_event_types: string[] | null
          content_affinity_threshold: number
          counter_window_hours: number
          created_at: string
          enabled_formats: string[] | null
          hybrid_simulation_enabled: boolean
          id: string
          is_enabled: boolean
          low_volume_threshold: number
          min_events_for_counter: number
          show_aggregated_counters: boolean
          show_location: boolean
          simulated_volume_boost: number
          updated_at: string
        }
        Insert: {
          adaptive_priority_enabled?: boolean
          allowed_event_types?: string[] | null
          content_affinity_threshold?: number
          counter_window_hours?: number
          created_at?: string
          enabled_formats?: string[] | null
          hybrid_simulation_enabled?: boolean
          id?: string
          is_enabled?: boolean
          low_volume_threshold?: number
          min_events_for_counter?: number
          show_aggregated_counters?: boolean
          show_location?: boolean
          simulated_volume_boost?: number
          updated_at?: string
        }
        Update: {
          adaptive_priority_enabled?: boolean
          allowed_event_types?: string[] | null
          content_affinity_threshold?: number
          counter_window_hours?: number
          created_at?: string
          enabled_formats?: string[] | null
          hybrid_simulation_enabled?: boolean
          id?: string
          is_enabled?: boolean
          low_volume_threshold?: number
          min_events_for_counter?: number
          show_aggregated_counters?: boolean
          show_location?: boolean
          simulated_volume_boost?: number
          updated_at?: string
        }
        Relationships: []
      }
      support_conversations: {
        Row: {
          created_at: string
          id: string
          messages: Json
          resolved: boolean
          updated_at: string
          user_id: string
          whatsapp_handoff: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          resolved?: boolean
          updated_at?: string
          user_id: string
          whatsapp_handoff?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          resolved?: boolean
          updated_at?: string
          user_id?: string
          whatsapp_handoff?: boolean
        }
        Relationships: []
      }
      support_faq: {
        Row: {
          answer: string
          created_at: string
          id: string
          is_active: boolean
          keywords: string[] | null
          priority: number
          question: string
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          is_active?: boolean
          keywords?: string[] | null
          priority?: number
          question: string
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          is_active?: boolean
          keywords?: string[] | null
          priority?: number
          question?: string
        }
        Relationships: []
      }
      telegram_config: {
        Row: {
          bot_token_secret_ref: string | null
          channel_id: string | null
          created_at: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          bot_token_secret_ref?: string | null
          channel_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          bot_token_secret_ref?: string | null
          channel_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      telegram_messages: {
        Row: {
          created_at: string
          id: string
          message_text: string
          product_id: string | null
          sent_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_text: string
          product_id?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          message_text?: string
          product_id?: string | null
          sent_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "telegram_messages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
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
      user_segments: {
        Row: {
          calculated_at: string
          id: string
          segment: string
          user_id: string
        }
        Insert: {
          calculated_at?: string
          id?: string
          segment: string
          user_id: string
        }
        Update: {
          calculated_at?: string
          id?: string
          segment?: string
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
      video_watch_progress: {
        Row: {
          id: string
          last_watched_seconds: number
          updated_at: string
          user_id: string
          video_id: string
        }
        Insert: {
          id?: string
          last_watched_seconds?: number
          updated_at?: string
          user_id: string
          video_id: string
        }
        Update: {
          id?: string
          last_watched_seconds?: number
          updated_at?: string
          user_id?: string
          video_id?: string
        }
        Relationships: []
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
      whatsapp_config: {
        Row: {
          access_token_secret_ref: string | null
          business_account_id: string | null
          id: string
          is_active: boolean
          phone_number_id: string | null
          public_phone_number: string | null
          updated_at: string
        }
        Insert: {
          access_token_secret_ref?: string | null
          business_account_id?: string | null
          id?: string
          is_active?: boolean
          phone_number_id?: string | null
          public_phone_number?: string | null
          updated_at?: string
        }
        Update: {
          access_token_secret_ref?: string | null
          business_account_id?: string | null
          id?: string
          is_active?: boolean
          phone_number_id?: string | null
          public_phone_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          created_at: string
          id: string
          message_text: string
          product_id: string | null
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_text: string
          product_id?: string | null
          sent_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message_text?: string
          product_id?: string | null
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_product_id_fkey"
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
      calculate_content_affinity: {
        Args: { p_content_id: string; p_content_type?: string }
        Returns: {
          affinity_score: number
          user_id: string
        }[]
      }
      calculate_product_demand: {
        Args: { p_product_id: string }
        Returns: number
      }
      calculate_product_trend_velocity: {
        Args: { p_product_id: string }
        Returns: number
      }
      classify_user_segment: { Args: { p_user_id: string }; Returns: string }
      cleanup_recently_shown: { Args: never; Returns: undefined }
      get_content_affinity_summary: {
        Args: { p_content_id: string }
        Returns: Json
      }
      get_eligible_popup: {
        Args: { p_user_id: string }
        Returns: {
          content: Json
          cta_label: string
          cta_target: string
          name: string
          priority: number
          rule_id: string
        }[]
      }
      get_eligible_strategic_popup: {
        Args: { p_user_id: string }
        Returns: {
          content: Json
          cooldown_minutes: number
          cta_label: string
          cta_target: string
          name: string
          priority: number
          rule_id: string
        }[]
      }
      get_personalized_recommendations:
        | {
            Args: { p_limit?: number; p_user_id: string }
            Returns: {
              category_id: string
              current_price: number
              demand_score: number
              offer_score: number
              product_id: string
              recommendation_component: string
              recommendation_reason: string
              recommendation_score: number
              slug: string
              title: string
              trend_velocity: number
            }[]
          }
        | {
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
      process_content_notification_queue: {
        Args: { p_batch_size?: number }
        Returns: Json
      }
      record_popup_event: {
        Args: { p_event_type: string; p_rule_id: string; p_user_id: string }
        Returns: string
      }
      refresh_demand_and_trend_scores: { Args: never; Returns: undefined }
      refresh_user_interest_decay: { Args: never; Returns: undefined }
      refresh_user_segments: { Args: never; Returns: undefined }
      run_retention_engine: {
        Args: { _inactive_days?: number }
        Returns: number
      }
      search_products_fuzzy: {
        Args: { search_query: string }
        Returns: {
          affiliate_url: string
          category_id: string
          current_price: number
          demand_score: number
          description: string
          discount: number
          final_score: number
          id: string
          images: string[]
          marketplace: string
          offer_score: number
          previous_price: number
          rating: number
          relevance_score: number
          review_count: number
          slug: string
          title: string
        }[]
      }
      set_whatsapp_opt_in: {
        Args: { p_enabled: boolean; p_source?: string }
        Returns: {
          created_at: string | null
          display_name: string | null
          id: string
          location_city: string | null
          location_state: string | null
          role: string | null
          updated_at: string | null
          user_id: string | null
          whatsapp_opt_in: boolean
          whatsapp_opt_in_at: string | null
          whatsapp_opt_in_source: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      touch_video_watch_progress: {
        Args: { p_seconds: number; p_video_id: string }
        Returns: undefined
      }
      track_event:
        | {
            Args: {
              p_anonymous_id?: string
              p_campaign_id?: string
              p_category_id?: string
              p_event_name: string
              p_metadata?: Json
              p_product_id?: string
              p_session_id?: string
              p_source?: string
            }
            Returns: string
          }
        | {
            Args: {
              p_anonymous_id?: string
              p_campaign_id?: string
              p_category_id?: string
              p_event_type: string
              p_metadata?: Json
              p_product_id?: string
              p_session_id?: string
              p_source?: string
            }
            Returns: string
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
        | "RECALCULATE_CATEGORY_HIGHLIGHTS"
      automation_trigger_type:
        | "PRICE_CHANGED"
        | "NEW_OFFER_IN_GROUP"
        | "USER_INTEREST_THRESHOLD"
        | "SCHEDULED"
        | "EVENT_TRACKED"
        | "USER_INACTIVE"
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
        "RECALCULATE_CATEGORY_HIGHLIGHTS",
      ],
      automation_trigger_type: [
        "PRICE_CHANGED",
        "NEW_OFFER_IN_GROUP",
        "USER_INTEREST_THRESHOLD",
        "SCHEDULED",
        "EVENT_TRACKED",
        "USER_INACTIVE",
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
