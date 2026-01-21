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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      air_drop_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          current_claims: number | null
          id: string
          is_active: boolean | null
          max_claims: number | null
          taler_value: number
          valid_from: string | null
          valid_until: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          current_claims?: number | null
          id?: string
          is_active?: boolean | null
          max_claims?: number | null
          taler_value: number
          valid_from?: string | null
          valid_until: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          current_claims?: number | null
          id?: string
          is_active?: boolean | null
          max_claims?: number | null
          taler_value?: number
          valid_from?: string | null
          valid_until?: string
        }
        Relationships: []
      }
      audio_ad_plays: {
        Row: {
          audio_ad_id: string
          completed: boolean | null
          duration_listened_seconds: number | null
          id: string
          played_at: string
          schedule_id: string | null
          trigger_type: string
          user_id: string | null
        }
        Insert: {
          audio_ad_id: string
          completed?: boolean | null
          duration_listened_seconds?: number | null
          id?: string
          played_at?: string
          schedule_id?: string | null
          trigger_type?: string
          user_id?: string | null
        }
        Update: {
          audio_ad_id?: string
          completed?: boolean | null
          duration_listened_seconds?: number | null
          id?: string
          played_at?: string
          schedule_id?: string | null
          trigger_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audio_ad_plays_audio_ad_id_fkey"
            columns: ["audio_ad_id"]
            isOneToOne: false
            referencedRelation: "audio_ads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_ad_plays_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "audio_ad_schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      audio_ad_schedules: {
        Row: {
          audio_ad_id: string
          created_at: string
          day_end_time: string | null
          day_start_time: string | null
          id: string
          is_active: boolean | null
          last_played_at: string | null
          play_count: number | null
          repeat_interval_minutes: number | null
          scheduled_date: string
          scheduled_time: string
          weekdays: number[] | null
        }
        Insert: {
          audio_ad_id: string
          created_at?: string
          day_end_time?: string | null
          day_start_time?: string | null
          id?: string
          is_active?: boolean | null
          last_played_at?: string | null
          play_count?: number | null
          repeat_interval_minutes?: number | null
          scheduled_date: string
          scheduled_time: string
          weekdays?: number[] | null
        }
        Update: {
          audio_ad_id?: string
          created_at?: string
          day_end_time?: string | null
          day_start_time?: string | null
          id?: string
          is_active?: boolean | null
          last_played_at?: string | null
          play_count?: number | null
          repeat_interval_minutes?: number | null
          scheduled_date?: string
          scheduled_time?: string
          weekdays?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "audio_ad_schedules_audio_ad_id_fkey"
            columns: ["audio_ad_id"]
            isOneToOne: false
            referencedRelation: "audio_ads"
            referencedColumns: ["id"]
          },
        ]
      }
      audio_ads: {
        Row: {
          claim_text: string
          created_at: string
          created_by: string | null
          duration_seconds: number | null
          generated_audio_url: string | null
          generation_error: string | null
          generation_status: string
          id: string
          is_active: boolean | null
          jingle_id: string | null
          partner_id: string
          target_age_max: number | null
          target_age_min: number | null
          target_cities: string[] | null
          target_min_listen_hours: number | null
          target_min_streak: number | null
          target_postal_codes: string[] | null
          target_stations: string[] | null
          target_subscription_tiers: string[] | null
          title: string
          trigger_on_tier: boolean | null
          updated_at: string
          uploaded_claim_url: string | null
          voice_id: string
          voice_name: string | null
        }
        Insert: {
          claim_text: string
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          generated_audio_url?: string | null
          generation_error?: string | null
          generation_status?: string
          id?: string
          is_active?: boolean | null
          jingle_id?: string | null
          partner_id: string
          target_age_max?: number | null
          target_age_min?: number | null
          target_cities?: string[] | null
          target_min_listen_hours?: number | null
          target_min_streak?: number | null
          target_postal_codes?: string[] | null
          target_stations?: string[] | null
          target_subscription_tiers?: string[] | null
          title: string
          trigger_on_tier?: boolean | null
          updated_at?: string
          uploaded_claim_url?: string | null
          voice_id?: string
          voice_name?: string | null
        }
        Update: {
          claim_text?: string
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          generated_audio_url?: string | null
          generation_error?: string | null
          generation_status?: string
          id?: string
          is_active?: boolean | null
          jingle_id?: string | null
          partner_id?: string
          target_age_max?: number | null
          target_age_min?: number | null
          target_cities?: string[] | null
          target_min_listen_hours?: number | null
          target_min_streak?: number | null
          target_postal_codes?: string[] | null
          target_stations?: string[] | null
          target_subscription_tiers?: string[] | null
          title?: string
          trigger_on_tier?: boolean | null
          updated_at?: string
          uploaded_claim_url?: string | null
          voice_id?: string
          voice_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audio_ads_jingle_id_fkey"
            columns: ["jingle_id"]
            isOneToOne: false
            referencedRelation: "audio_jingles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audio_ads_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_tier_features"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "audio_ads_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      audio_credit_transactions: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          partner_id: string
          reference_id: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          partner_id: string
          reference_id?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          partner_id?: string
          reference_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audio_credit_transactions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_tier_features"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "audio_credit_transactions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      audio_jingles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          intro_url: string | null
          is_active: boolean | null
          is_default: boolean | null
          name: string
          outro_url: string | null
          partner_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          intro_url?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          outro_url?: string | null
          partner_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          intro_url?: string | null
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          outro_url?: string | null
          partner_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "audio_jingles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_tier_features"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "audio_jingles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          category: string
          color: string
          created_at: string
          criteria_type: string
          criteria_value: number
          description: string
          icon: string
          id: string
          is_active: boolean
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          category?: string
          color?: string
          created_at?: string
          criteria_type: string
          criteria_value: number
          description: string
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          category?: string
          color?: string
          created_at?: string
          criteria_type?: string
          criteria_value?: number
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      code_claims: {
        Row: {
          claimed_at: string
          code_id: string
          id: string
          taler_awarded: number
          user_id: string
        }
        Insert: {
          claimed_at?: string
          code_id: string
          id?: string
          taler_awarded: number
          user_id: string
        }
        Update: {
          claimed_at?: string
          code_id?: string
          id?: string
          taler_awarded?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_claims_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "air_drop_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string | null
          gift_type: string
          id: string
          personal_message: string | null
          purchaser_email: string
          purchaser_id: string
          recipient_email: string
          recipient_name: string | null
          redeemed_at: string | null
          redeemed_by: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          expires_at?: string | null
          gift_type: string
          id?: string
          personal_message?: string | null
          purchaser_email: string
          purchaser_id: string
          recipient_email: string
          recipient_name?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string | null
          gift_type?: string
          id?: string
          personal_message?: string | null
          purchaser_email?: string
          purchaser_id?: string
          recipient_email?: string
          recipient_name?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
        }
        Relationships: []
      }
      live_chat_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          song_identifier: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          song_identifier: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          song_identifier?: string
          user_id?: string
        }
        Relationships: []
      }
      live_events: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          ended_at: string | null
          event_type: string
          host_avatar_url: string | null
          host_name: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          is_live: boolean
          partner_id: string | null
          peak_viewers: number | null
          scheduled_end: string | null
          scheduled_start: string | null
          started_at: string | null
          stream_url: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          viewer_count: number | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ended_at?: string | null
          event_type?: string
          host_avatar_url?: string | null
          host_name?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_live?: boolean
          partner_id?: string | null
          peak_viewers?: number | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          started_at?: string | null
          stream_url: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          viewer_count?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          ended_at?: string | null
          event_type?: string
          host_avatar_url?: string | null
          host_name?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_live?: boolean
          partner_id?: string | null
          peak_viewers?: number | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          started_at?: string | null
          stream_url?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          viewer_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "live_events_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_tier_features"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "live_events_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      new_partner_alert_dismissals: {
        Row: {
          alert_id: string
          dismissed_at: string
          id: string
          user_id: string
        }
        Insert: {
          alert_id: string
          dismissed_at?: string
          id?: string
          user_id: string
        }
        Update: {
          alert_id?: string
          dismissed_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "new_partner_alert_dismissals_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "new_partner_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      new_partner_alerts: {
        Row: {
          created_at: string
          id: string
          partner_city: string | null
          partner_id: string
          partner_lat: number | null
          partner_lng: number | null
          partner_postal_code: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          partner_city?: string | null
          partner_id: string
          partner_lat?: number | null
          partner_lng?: number | null
          partner_postal_code?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          partner_city?: string | null
          partner_id?: string
          partner_lat?: number | null
          partner_lng?: number | null
          partner_postal_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "new_partner_alerts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_tier_features"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "new_partner_alerts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_admins: {
        Row: {
          can_confirm_redemptions: boolean | null
          can_manage_rewards: boolean | null
          can_view_reports: boolean | null
          created_at: string
          id: string
          invited_at: string | null
          invited_by: string | null
          partner_id: string
          role: Database["public"]["Enums"]["partner_admin_role"]
          user_id: string
        }
        Insert: {
          can_confirm_redemptions?: boolean | null
          can_manage_rewards?: boolean | null
          can_view_reports?: boolean | null
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          partner_id: string
          role?: Database["public"]["Enums"]["partner_admin_role"]
          user_id: string
        }
        Update: {
          can_confirm_redemptions?: boolean | null
          can_manage_rewards?: boolean | null
          can_view_reports?: boolean | null
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          partner_id?: string
          role?: Database["public"]["Enums"]["partner_admin_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_admins_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_tier_features"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "partner_admins_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_applications: {
        Row: {
          address_number: string
          address_street: string
          city: string
          company_name: string
          contact_email: string
          contact_name: string
          contact_phone: string
          country: string | null
          created_at: string
          goals: string[] | null
          google_business_url: string | null
          id: string
          industry: string
          notes: string | null
          opening_hours: string | null
          postal_code: string
          reviewed_at: string | null
          reviewed_by: string | null
          shipping_city: string | null
          shipping_number: string | null
          shipping_postal_code: string | null
          shipping_same_as_location: boolean | null
          shipping_street: string | null
          status: string
          updated_at: string
          user_id: string | null
          website: string | null
          whatsapp_opt_in: boolean | null
        }
        Insert: {
          address_number: string
          address_street: string
          city: string
          company_name: string
          contact_email: string
          contact_name: string
          contact_phone: string
          country?: string | null
          created_at?: string
          goals?: string[] | null
          google_business_url?: string | null
          id?: string
          industry: string
          notes?: string | null
          opening_hours?: string | null
          postal_code: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          shipping_city?: string | null
          shipping_number?: string | null
          shipping_postal_code?: string | null
          shipping_same_as_location?: boolean | null
          shipping_street?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          website?: string | null
          whatsapp_opt_in?: boolean | null
        }
        Update: {
          address_number?: string
          address_street?: string
          city?: string
          company_name?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string
          country?: string | null
          created_at?: string
          goals?: string[] | null
          google_business_url?: string | null
          id?: string
          industry?: string
          notes?: string | null
          opening_hours?: string | null
          postal_code?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          shipping_city?: string | null
          shipping_number?: string | null
          shipping_postal_code?: string | null
          shipping_same_as_location?: boolean | null
          shipping_street?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
          website?: string | null
          whatsapp_opt_in?: boolean | null
        }
        Relationships: []
      }
      partner_reviews: {
        Row: {
          author_name: string
          author_photo_url: string | null
          created_at: string
          google_review_id: string | null
          id: string
          is_featured: boolean | null
          is_visible: boolean | null
          language: string | null
          partner_id: string
          rating: number
          relative_time_description: string | null
          review_time: string | null
          synced_at: string | null
          text: string | null
        }
        Insert: {
          author_name: string
          author_photo_url?: string | null
          created_at?: string
          google_review_id?: string | null
          id?: string
          is_featured?: boolean | null
          is_visible?: boolean | null
          language?: string | null
          partner_id: string
          rating: number
          relative_time_description?: string | null
          review_time?: string | null
          synced_at?: string | null
          text?: string | null
        }
        Update: {
          author_name?: string
          author_photo_url?: string | null
          created_at?: string
          google_review_id?: string | null
          id?: string
          is_featured?: boolean | null
          is_visible?: boolean | null
          language?: string | null
          partner_id?: string
          rating?: number
          relative_time_description?: string | null
          review_time?: string | null
          synced_at?: string | null
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_reviews_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_tier_features"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "partner_reviews_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          address_number: string | null
          address_street: string | null
          audio_credits_balance: number | null
          audio_credits_monthly_quota: number | null
          billing_email: string | null
          brand_color: string | null
          category: string | null
          city: string | null
          commission_percent: number | null
          contact_email: string | null
          contact_first_name: string | null
          contact_last_name: string | null
          contact_phone: string | null
          contract_end: string | null
          contract_start: string | null
          country: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          email: string | null
          facebook: string | null
          ghl_location_id: string | null
          ghl_sync_status: string | null
          ghl_synced_at: string | null
          google_place_id: string | null
          google_rating: number | null
          google_review_count: number | null
          id: string
          instagram: string | null
          is_active: boolean | null
          is_featured: boolean | null
          lat: number | null
          legal_name: string | null
          lng: number | null
          logo_url: string | null
          name: string
          opening_hours: Json | null
          phone: string | null
          plan_tier: string | null
          postal_code: string | null
          review_request_delay_minutes: number | null
          review_request_enabled: boolean | null
          short_description: string | null
          slug: string
          special_hours: Json | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_ends_at: string | null
          tags: string[] | null
          tier: Database["public"]["Enums"]["partner_tier"]
          updated_at: string
          verified_at: string | null
          website: string | null
        }
        Insert: {
          address_number?: string | null
          address_street?: string | null
          audio_credits_balance?: number | null
          audio_credits_monthly_quota?: number | null
          billing_email?: string | null
          brand_color?: string | null
          category?: string | null
          city?: string | null
          commission_percent?: number | null
          contact_email?: string | null
          contact_first_name?: string | null
          contact_last_name?: string | null
          contact_phone?: string | null
          contract_end?: string | null
          contract_start?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          facebook?: string | null
          ghl_location_id?: string | null
          ghl_sync_status?: string | null
          ghl_synced_at?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          google_review_count?: number | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          lat?: number | null
          legal_name?: string | null
          lng?: number | null
          logo_url?: string | null
          name: string
          opening_hours?: Json | null
          phone?: string | null
          plan_tier?: string | null
          postal_code?: string | null
          review_request_delay_minutes?: number | null
          review_request_enabled?: boolean | null
          short_description?: string | null
          slug: string
          special_hours?: Json | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_ends_at?: string | null
          tags?: string[] | null
          tier?: Database["public"]["Enums"]["partner_tier"]
          updated_at?: string
          verified_at?: string | null
          website?: string | null
        }
        Update: {
          address_number?: string | null
          address_street?: string | null
          audio_credits_balance?: number | null
          audio_credits_monthly_quota?: number | null
          billing_email?: string | null
          brand_color?: string | null
          category?: string | null
          city?: string | null
          commission_percent?: number | null
          contact_email?: string | null
          contact_first_name?: string | null
          contact_last_name?: string | null
          contact_phone?: string | null
          contract_end?: string | null
          contract_start?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          facebook?: string | null
          ghl_location_id?: string | null
          ghl_sync_status?: string | null
          ghl_synced_at?: string | null
          google_place_id?: string | null
          google_rating?: number | null
          google_review_count?: number | null
          id?: string
          instagram?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          lat?: number | null
          legal_name?: string | null
          lng?: number | null
          logo_url?: string | null
          name?: string
          opening_hours?: Json | null
          phone?: string | null
          plan_tier?: string | null
          postal_code?: string | null
          review_request_delay_minutes?: number | null
          review_request_enabled?: boolean | null
          short_description?: string | null
          slug?: string
          special_hours?: Json | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_ends_at?: string | null
          tags?: string[] | null
          tier?: Database["public"]["Enums"]["partner_tier"]
          updated_at?: string
          verified_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          birth_date: string | null
          city: string | null
          created_at: string
          current_streak: number | null
          display_name: string | null
          email: string | null
          first_name: string | null
          free_trial_started_at: string | null
          id: string
          last_activity_at: string | null
          last_name: string | null
          last_streak_date: string | null
          leaderboard_nickname: string | null
          longest_streak: number | null
          marketing_consent: boolean | null
          marketing_consent_at: string | null
          phone: string | null
          postal_code: string | null
          referral_count: number | null
          referred_by: string | null
          show_on_leaderboard: boolean | null
          streak_freezes: number
          stripe_customer_id: string | null
          subscription_ends_at: string | null
          subscription_status: string | null
          subscription_tier: string | null
          terms_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          created_at?: string
          current_streak?: number | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          free_trial_started_at?: string | null
          id: string
          last_activity_at?: string | null
          last_name?: string | null
          last_streak_date?: string | null
          leaderboard_nickname?: string | null
          longest_streak?: number | null
          marketing_consent?: boolean | null
          marketing_consent_at?: string | null
          phone?: string | null
          postal_code?: string | null
          referral_count?: number | null
          referred_by?: string | null
          show_on_leaderboard?: boolean | null
          streak_freezes?: number
          stripe_customer_id?: string | null
          subscription_ends_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          birth_date?: string | null
          city?: string | null
          created_at?: string
          current_streak?: number | null
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          free_trial_started_at?: string | null
          id?: string
          last_activity_at?: string | null
          last_name?: string | null
          last_streak_date?: string | null
          leaderboard_nickname?: string | null
          longest_streak?: number | null
          marketing_consent?: boolean | null
          marketing_consent_at?: string | null
          phone?: string | null
          postal_code?: string | null
          referral_count?: number | null
          referred_by?: string | null
          show_on_leaderboard?: boolean | null
          streak_freezes?: number
          stripe_customer_id?: string | null
          subscription_ends_at?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          applies_to: string
          code: string
          created_at: string
          created_by: string | null
          current_uses: number
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          max_uses: number | null
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          applies_to?: string
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          applies_to?: string
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          max_uses?: number | null
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          is_active: boolean | null
          p256dh: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          is_active?: boolean | null
          p256dh: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          is_active?: boolean | null
          p256dh?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      qr_scans: {
        Row: {
          id: string
          ip_address: string | null
          partner_id: string
          referrer: string | null
          scanned_at: string
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          id?: string
          ip_address?: string | null
          partner_id: string
          referrer?: string | null
          scanned_at?: string
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          id?: string
          ip_address?: string | null
          partner_id?: string
          referrer?: string | null
          scanned_at?: string
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "qr_scans_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_tier_features"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "qr_scans_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      radio_listening_sessions: {
        Row: {
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          external_station_name: string | null
          external_station_uuid: string | null
          id: string
          rewarded: boolean
          started_at: string
          stream_type: string
          taler_awarded: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          external_station_name?: string | null
          external_station_uuid?: string | null
          id?: string
          rewarded?: boolean
          started_at?: string
          stream_type?: string
          taler_awarded?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          external_station_name?: string | null
          external_station_uuid?: string | null
          id?: string
          rewarded?: boolean
          started_at?: string
          stream_type?: string
          taler_awarded?: number | null
          user_id?: string
        }
        Relationships: []
      }
      radio_listening_tiers: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          min_duration_seconds: number
          name: string
          sort_order: number
          taler_reward: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          min_duration_seconds: number
          name: string
          sort_order?: number
          taler_reward: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          min_duration_seconds?: number
          name?: string
          sort_order?: number
          taler_reward?: number
        }
        Relationships: []
      }
      redemptions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          partner_id: string
          qr_payload: string | null
          redeemed_at: string | null
          redeemed_by: string | null
          redemption_code: string
          reward_id: string
          status: Database["public"]["Enums"]["redemption_status"]
          taler_spent: number
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          partner_id: string
          qr_payload?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          redemption_code: string
          reward_id: string
          status?: Database["public"]["Enums"]["redemption_status"]
          taler_spent: number
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          partner_id?: string
          qr_payload?: string | null
          redeemed_at?: string | null
          redeemed_by?: string | null
          redemption_code?: string
          reward_id?: string
          status?: Database["public"]["Enums"]["redemption_status"]
          taler_spent?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_tier_features"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "redemptions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_shares: {
        Row: {
          channel: string
          converted_referral_id: string | null
          id: string
          referral_code: string
          shared_at: string
          user_id: string
        }
        Insert: {
          channel: string
          converted_referral_id?: string | null
          id?: string
          referral_code: string
          shared_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          converted_referral_id?: string | null
          id?: string
          referral_code?: string
          shared_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_shares_converted_referral_id_fkey"
            columns: ["converted_referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referred_bonus: number
          referred_id: string
          referrer_bonus: number
          referrer_id: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          referred_bonus?: number
          referred_id: string
          referrer_bonus?: number
          referrer_id: string
          status?: string
        }
        Update: {
          created_at?: string
          id?: string
          referred_bonus?: number
          referred_id?: string
          referrer_bonus?: number
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      regions: {
        Row: {
          created_at: string
          id: string
          lat: number | null
          lng: number | null
          name: string
          radius_km: number | null
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          radius_km?: number | null
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          radius_km?: number | null
          slug?: string
        }
        Relationships: []
      }
      review_requests: {
        Row: {
          created_at: string
          feedback_submitted_at: string | null
          feedback_text: string | null
          id: string
          in_app_rating: number | null
          partner_id: string
          redemption_id: string | null
          review_clicked: boolean | null
          review_clicked_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_submitted_at?: string | null
          feedback_text?: string | null
          id?: string
          in_app_rating?: number | null
          partner_id: string
          redemption_id?: string | null
          review_clicked?: boolean | null
          review_clicked_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_submitted_at?: string | null
          feedback_text?: string | null
          id?: string
          in_app_rating?: number | null
          partner_id?: string
          redemption_id?: string | null
          review_clicked?: boolean | null
          review_clicked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_tier_features"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "review_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_requests_redemption_id_fkey"
            columns: ["redemption_id"]
            isOneToOne: false
            referencedRelation: "redemptions"
            referencedColumns: ["id"]
          },
        ]
      }
      reward_sponsors: {
        Row: {
          created_at: string
          display_text: string | null
          id: string
          reward_id: string
          sponsor_id: string
          sponsorship_type: string | null
        }
        Insert: {
          created_at?: string
          display_text?: string | null
          id?: string
          reward_id: string
          sponsor_id: string
          sponsorship_type?: string | null
        }
        Update: {
          created_at?: string
          display_text?: string | null
          id?: string
          reward_id?: string
          sponsor_id?: string
          sponsorship_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reward_sponsors_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_sponsors_sponsor_id_fkey"
            columns: ["sponsor_id"]
            isOneToOne: false
            referencedRelation: "sponsors"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          max_per_user: number | null
          partner_id: string
          reward_type: Database["public"]["Enums"]["reward_type"]
          stock_remaining: number | null
          stock_total: number | null
          taler_cost: number
          terms: string | null
          title: string
          updated_at: string
          valid_from: string | null
          valid_until: string | null
          value_amount: number | null
          value_percent: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_per_user?: number | null
          partner_id: string
          reward_type?: Database["public"]["Enums"]["reward_type"]
          stock_remaining?: number | null
          stock_total?: number | null
          taler_cost: number
          terms?: string | null
          title: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          value_amount?: number | null
          value_percent?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_per_user?: number | null
          partner_id?: string
          reward_type?: Database["public"]["Enums"]["reward_type"]
          stock_remaining?: number | null
          stock_total?: number | null
          taler_cost?: number
          terms?: string | null
          title?: string
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          value_amount?: number | null
          value_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rewards_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_tier_features"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "rewards_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      sponsoring_inquiries: {
        Row: {
          company: string
          contact_name: string
          created_at: string
          desired_level: string | null
          email: string
          engagement_area: string | null
          id: string
          message: string | null
          notes: string | null
          phone: string | null
          processed_at: string | null
          processed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company: string
          contact_name: string
          created_at?: string
          desired_level?: string | null
          email: string
          engagement_area?: string | null
          id?: string
          message?: string | null
          notes?: string | null
          phone?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company?: string
          contact_name?: string
          created_at?: string
          desired_level?: string | null
          email?: string
          engagement_area?: string | null
          id?: string
          message?: string | null
          notes?: string | null
          phone?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      sponsors: {
        Row: {
          created_at: string
          description: string | null
          engagement_area: string | null
          featured_on_home: boolean | null
          id: string
          is_active: boolean | null
          level: string | null
          logo_url: string | null
          name: string
          sort_order: number | null
          updated_at: string
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          engagement_area?: string | null
          featured_on_home?: boolean | null
          id?: string
          is_active?: boolean | null
          level?: string | null
          logo_url?: string | null
          name: string
          sort_order?: number | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          engagement_area?: string | null
          featured_on_home?: boolean | null
          id?: string
          is_active?: boolean | null
          level?: string | null
          logo_url?: string | null
          name?: string
          sort_order?: number | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          is_public: boolean | null
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          is_public?: boolean | null
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          is_public?: boolean | null
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      taler_monthly_batches: {
        Row: {
          amount_earned: number
          amount_expired: number
          amount_redeemed: number
          created_at: string | null
          earn_month: string
          expires_at: string
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_earned?: number
          amount_expired?: number
          amount_redeemed?: number
          created_at?: string | null
          earn_month: string
          expires_at: string
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_earned?: number
          amount_expired?: number
          amount_redeemed?: number
          created_at?: string | null
          earn_month?: string
          expires_at?: string
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          partner_id: string | null
          reference_id: string | null
          source: Database["public"]["Enums"]["transaction_source"]
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          partner_id?: string | null
          reference_id?: string | null
          source: Database["public"]["Enums"]["transaction_source"]
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          partner_id?: string | null
          reference_id?: string | null
          source?: Database["public"]["Enums"]["transaction_source"]
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partner_tier_features"
            referencedColumns: ["partner_id"]
          },
          {
            foreignKeyName: "transactions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          seen_at: string | null
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          seen_at?: string | null
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          seen_at?: string | null
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
      user_codes: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          permanent_code: string
          qr_payload: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          permanent_code: string
          qr_payload?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          permanent_code?: string
          qr_payload?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_listening_stats: {
        Row: {
          current_streak_days: number
          id: string
          last_session_date: string | null
          longest_streak_days: number
          total_duration_seconds: number
          total_sessions: number
          total_taler_earned: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak_days?: number
          id?: string
          last_session_date?: string | null
          longest_streak_days?: number
          total_duration_seconds?: number
          total_sessions?: number
          total_taler_earned?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak_days?: number
          id?: string
          last_session_date?: string | null
          longest_streak_days?: number
          total_duration_seconds?: number
          total_sessions?: number
          total_taler_earned?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_radio_favorites: {
        Row: {
          created_at: string
          id: string
          station_country: string | null
          station_favicon: string | null
          station_homepage: string | null
          station_name: string
          station_tags: string[] | null
          station_url: string
          station_uuid: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          station_country?: string | null
          station_favicon?: string | null
          station_homepage?: string | null
          station_name: string
          station_tags?: string[] | null
          station_url: string
          station_uuid: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          station_country?: string | null
          station_favicon?: string | null
          station_homepage?: string | null
          station_name?: string
          station_tags?: string[] | null
          station_url?: string
          station_uuid?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_passes: {
        Row: {
          apple_pass_auth_token: string | null
          apple_pass_serial: string | null
          created_at: string
          google_pass_object_id: string | null
          id: string
          last_synced_balance: number | null
          pass_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          apple_pass_auth_token?: string | null
          apple_pass_serial?: string | null
          created_at?: string
          google_pass_object_id?: string | null
          id?: string
          last_synced_balance?: number | null
          pass_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          apple_pass_auth_token?: string | null
          apple_pass_serial?: string | null
          created_at?: string
          google_pass_object_id?: string | null
          id?: string
          last_synced_balance?: number | null
          pass_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      partner_tier_features: {
        Row: {
          can_create_rewards: boolean | null
          can_export_data: boolean | null
          has_advanced_analytics: boolean | null
          has_featured_placement: boolean | null
          has_priority_support: boolean | null
          name: string | null
          partner_id: string | null
          shows_powered_by_badge: boolean | null
          tier: Database["public"]["Enums"]["partner_tier"] | null
        }
        Insert: {
          can_create_rewards?: never
          can_export_data?: never
          has_advanced_analytics?: never
          has_featured_placement?: never
          has_priority_support?: never
          name?: string | null
          partner_id?: string | null
          shows_powered_by_badge?: never
          tier?: Database["public"]["Enums"]["partner_tier"] | null
        }
        Update: {
          can_create_rewards?: never
          can_export_data?: never
          has_advanced_analytics?: never
          has_featured_placement?: never
          has_priority_support?: never
          name?: string | null
          partner_id?: string | null
          shows_powered_by_badge?: never
          tier?: Database["public"]["Enums"]["partner_tier"] | null
        }
        Relationships: []
      }
      user_taler_batch_summary: {
        Row: {
          amount_earned: number | null
          amount_expired: number | null
          amount_redeemed: number | null
          amount_remaining: number | null
          earn_month: string | null
          expires_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount_earned?: number | null
          amount_expired?: number | null
          amount_redeemed?: number | null
          amount_remaining?: never
          earn_month?: string | null
          expires_at?: string | null
          status?: never
          user_id?: string | null
        }
        Update: {
          amount_earned?: number | null
          amount_expired?: number | null
          amount_redeemed?: number | null
          amount_remaining?: never
          earn_month?: string | null
          expires_at?: string | null
          status?: never
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_audio_credits: {
        Args: {
          _amount: number
          _description?: string
          _partner_id: string
          _reference_id?: string
          _transaction_type: string
        }
        Returns: {
          amount: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          partner_id: string
          reference_id: string | null
          transaction_type: string
        }
        SetofOptions: {
          from: "*"
          to: "audio_credit_transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      add_taler_to_batch: {
        Args: { p_amount: number; p_user_id: string }
        Returns: {
          amount_earned: number
          amount_expired: number
          amount_redeemed: number
          created_at: string | null
          earn_month: string
          expires_at: string
          id: string
          updated_at: string | null
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "taler_monthly_batches"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      award_leaderboard_badges: { Args: never; Returns: undefined }
      award_review_bonus: {
        Args: { _review_request_id: string; _user_id: string }
        Returns: Json
      }
      can_user_redeem_reward: {
        Args: { _reward_id: string; _user_id: string }
        Returns: boolean
      }
      check_and_award_badges: {
        Args: { _user_id: string }
        Returns: {
          badge_id: string
          earned_at: string
          id: string
          seen_at: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "user_badges"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      check_leaderboard_badge_for_user: {
        Args: { _user_id: string }
        Returns: undefined
      }
      claim_daily_streak: { Args: { _user_id: string }; Returns: Json }
      end_listening_session: { Args: { _session_id: string }; Returns: Json }
      expire_old_taler_batches: {
        Args: never
        Returns: {
          earn_month: string
          expired_amount: number
          user_id: string
        }[]
      }
      generate_redemption_code: { Args: never; Returns: string }
      generate_unique_code: { Args: { prefix?: string }; Returns: string }
      get_cron_job_runs: {
        Args: never
        Returns: {
          command: string
          database: string
          end_time: string
          job_pid: number
          jobid: number
          return_message: string
          runid: number
          start_time: string
          status: string
          username: string
        }[]
      }
      get_cron_jobs: {
        Args: never
        Returns: {
          active: boolean
          command: string
          database: string
          jobid: number
          jobname: string
          nodename: string
          nodeport: number
          schedule: string
          username: string
        }[]
      }
      get_expiring_talers_next_month: {
        Args: never
        Returns: {
          amount_expiring: number
          earn_month: string
          expires_at: string
          user_id: string
        }[]
      }
      get_leaderboard_profile_safe: {
        Args: { profile_id: string }
        Returns: {
          avatar_url: string
          leaderboard_nickname: string
          show_on_leaderboard: boolean
        }[]
      }
      get_partner_public_info: {
        Args: { partner_id: string }
        Returns: {
          address_number: string
          address_street: string
          brand_color: string
          category: string
          city: string
          cover_image_url: string
          description: string
          facebook: string
          google_place_id: string
          google_rating: number
          google_review_count: number
          id: string
          instagram: string
          is_featured: boolean
          lat: number
          lng: number
          logo_url: string
          name: string
          opening_hours: Json
          postal_code: string
          short_description: string
          slug: string
          special_hours: Json
          tags: string[]
          website: string
        }[]
      }
      get_public_partner_by_id: {
        Args: { partner_id: string }
        Returns: {
          address_number: string
          address_street: string
          brand_color: string
          category: string
          city: string
          country: string
          cover_image_url: string
          description: string
          facebook: string
          google_place_id: string
          google_rating: number
          google_review_count: number
          id: string
          instagram: string
          is_featured: boolean
          lat: number
          lng: number
          logo_url: string
          name: string
          opening_hours: Json
          postal_code: string
          short_description: string
          slug: string
          special_hours: Json
          tags: string[]
          website: string
        }[]
      }
      get_public_partner_by_slug: {
        Args: { partner_slug: string }
        Returns: {
          address_number: string
          address_street: string
          brand_color: string
          category: string
          city: string
          country: string
          cover_image_url: string
          description: string
          facebook: string
          google_rating: number
          google_review_count: number
          id: string
          instagram: string
          is_featured: boolean
          lat: number
          lng: number
          logo_url: string
          name: string
          opening_hours: Json
          postal_code: string
          short_description: string
          slug: string
          special_hours: Json
          tags: string[]
          website: string
        }[]
      }
      get_public_partner_safe: {
        Args: { partner_slug: string }
        Returns: {
          address_number: string
          address_street: string
          brand_color: string
          category: string
          city: string
          country: string
          cover_image_url: string
          description: string
          facebook: string
          google_place_id: string
          google_rating: number
          google_review_count: number
          id: string
          instagram: string
          is_featured: boolean
          lat: number
          lng: number
          logo_url: string
          name: string
          opening_hours: Json
          postal_code: string
          short_description: string
          slug: string
          special_hours: Json
          tags: string[]
          website: string
        }[]
      }
      get_public_partners: {
        Args: never
        Returns: {
          address_number: string
          address_street: string
          brand_color: string
          category: string
          city: string
          country: string
          cover_image_url: string
          description: string
          facebook: string
          google_rating: number
          google_review_count: number
          id: string
          instagram: string
          is_featured: boolean
          lat: number
          lng: number
          logo_url: string
          name: string
          opening_hours: Json
          postal_code: string
          short_description: string
          slug: string
          special_hours: Json
          tags: string[]
          website: string
        }[]
      }
      get_public_partners_safe: {
        Args: never
        Returns: {
          address_number: string
          address_street: string
          brand_color: string
          category: string
          city: string
          country: string
          cover_image_url: string
          description: string
          facebook: string
          google_place_id: string
          google_rating: number
          google_review_count: number
          id: string
          instagram: string
          is_featured: boolean
          lat: number
          lng: number
          logo_url: string
          name: string
          opening_hours: Json
          postal_code: string
          short_description: string
          slug: string
          special_hours: Json
          tags: string[]
          website: string
        }[]
      }
      get_public_rewards_safe: {
        Args: never
        Returns: {
          description: string
          id: string
          image_url: string
          is_available: boolean
          partner_id: string
          reward_type: string
          taler_cost: number
          terms: string
          title: string
          valid_from: string
          valid_until: string
          value_amount: number
          value_percent: number
        }[]
      }
      get_remaining_batch_balance: {
        Args: {
          batch_row: Database["public"]["Tables"]["taler_monthly_batches"]["Row"]
        }
        Returns: number
      }
      get_streak_status: { Args: { _user_id: string }; Returns: Json }
      get_user_balance: {
        Args: { _user_id: string }
        Returns: {
          lifetime_earned: number
          lifetime_spent: number
          taler_balance: number
        }[]
      }
      get_user_remaining_redemptions: {
        Args: { _reward_id: string; _user_id: string }
        Returns: number
      }
      get_user_weekly_rank: {
        Args: { _user_id: string }
        Returns: {
          is_participating: boolean
          rank: number
          weekly_earned: number
        }[]
      }
      get_weekly_leaderboard: {
        Args: { _limit?: number }
        Returns: {
          avatar_url: string
          nickname: string
          rank: number
          weekly_earned: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      insert_qr_scan_rate_limited: {
        Args: {
          _ip_address?: string
          _partner_id: string
          _referrer?: string
          _user_agent?: string
          _user_id?: string
          _utm_campaign?: string
          _utm_medium?: string
          _utm_source?: string
        }
        Returns: Json
      }
      is_partner_admin: {
        Args: { _partner_id: string; _user_id: string }
        Returns: boolean
      }
      partner_has_feature: {
        Args: { p_feature: string; p_partner_id: string }
        Returns: boolean
      }
      process_referral:
        | {
            Args: { _referral_code: string; _referred_user_id: string }
            Returns: Json
          }
        | {
            Args: { _referral_code: string; _referred_user_id: string }
            Returns: Json
          }
      purchase_streak_freeze: { Args: { _user_id: string }; Returns: Json }
      redeem_air_drop_code: {
        Args: { _code: string; _user_id: string }
        Returns: Json
      }
      redeem_taler_fifo: {
        Args: { p_amount: number; p_user_id: string }
        Returns: {
          message: string
          redeemed_from: Json
          success: boolean
        }[]
      }
      start_listening_session:
        | { Args: { _user_id: string }; Returns: string }
        | {
            Args: {
              _station_name?: string
              _station_uuid?: string
              _stream_type?: string
              _user_id: string
            }
            Returns: string
          }
      use_audio_credits: {
        Args: {
          _amount: number
          _description?: string
          _partner_id: string
          _reference_id?: string
          _transaction_type: string
        }
        Returns: Json
      }
      use_promo_code: { Args: { _code: string }; Returns: boolean }
      validate_air_drop_code: { Args: { _code: string }; Returns: Json }
      validate_promo_code: { Args: { _code: string }; Returns: Json }
    }
    Enums: {
      partner_admin_role: "owner" | "manager" | "staff"
      partner_tier: "starter" | "partner"
      redemption_status: "pending" | "used" | "expired" | "cancelled"
      reward_type:
        | "fixed_discount"
        | "percent_discount"
        | "free_item"
        | "topup_bonus"
        | "experience"
        | "two_for_one"
      transaction_source:
        | "signup_bonus"
        | "air_drop"
        | "partner_visit"
        | "partner_purchase"
        | "bonus"
        | "reward_redemption"
        | "system"
        | "referral"
        | "radio"
      transaction_type: "earn" | "spend" | "expire" | "adjust"
      user_role: "user" | "partner_admin" | "admin"
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
      partner_admin_role: ["owner", "manager", "staff"],
      partner_tier: ["starter", "partner"],
      redemption_status: ["pending", "used", "expired", "cancelled"],
      reward_type: [
        "fixed_discount",
        "percent_discount",
        "free_item",
        "topup_bonus",
        "experience",
        "two_for_one",
      ],
      transaction_source: [
        "signup_bonus",
        "air_drop",
        "partner_visit",
        "partner_purchase",
        "bonus",
        "reward_redemption",
        "system",
        "referral",
        "radio",
      ],
      transaction_type: ["earn", "spend", "expire", "adjust"],
      user_role: ["user", "partner_admin", "admin"],
    },
  },
} as const
