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
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          address_number: string | null
          address_street: string | null
          billing_email: string | null
          brand_color: string | null
          category: string | null
          city: string | null
          commission_percent: number | null
          contract_end: string | null
          contract_start: string | null
          country: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          email: string | null
          facebook: string | null
          google_place_id: string | null
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
          postal_code: string | null
          review_request_delay_minutes: number | null
          review_request_enabled: boolean | null
          short_description: string | null
          slug: string
          special_hours: Json | null
          tags: string[] | null
          updated_at: string
          verified_at: string | null
          website: string | null
        }
        Insert: {
          address_number?: string | null
          address_street?: string | null
          billing_email?: string | null
          brand_color?: string | null
          category?: string | null
          city?: string | null
          commission_percent?: number | null
          contract_end?: string | null
          contract_start?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          facebook?: string | null
          google_place_id?: string | null
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
          postal_code?: string | null
          review_request_delay_minutes?: number | null
          review_request_enabled?: boolean | null
          short_description?: string | null
          slug: string
          special_hours?: Json | null
          tags?: string[] | null
          updated_at?: string
          verified_at?: string | null
          website?: string | null
        }
        Update: {
          address_number?: string | null
          address_street?: string | null
          billing_email?: string | null
          brand_color?: string | null
          category?: string | null
          city?: string | null
          commission_percent?: number | null
          contract_end?: string | null
          contract_start?: string | null
          country?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          facebook?: string | null
          google_place_id?: string | null
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
          postal_code?: string | null
          review_request_delay_minutes?: number | null
          review_request_enabled?: boolean | null
          short_description?: string | null
          slug?: string
          special_hours?: Json | null
          tags?: string[] | null
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
      radio_listening_sessions: {
        Row: {
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          rewarded: boolean
          started_at: string
          taler_awarded: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          rewarded?: boolean
          started_at?: string
          taler_awarded?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          rewarded?: boolean
          started_at?: string
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
      rewards: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
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
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
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
      [_ in never]: never
    }
    Functions: {
      award_leaderboard_badges: { Args: never; Returns: undefined }
      award_review_bonus: {
        Args: { _review_request_id: string; _user_id: string }
        Returns: Json
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
      generate_redemption_code: { Args: never; Returns: string }
      generate_unique_code: { Args: { prefix?: string }; Returns: string }
      get_streak_status: { Args: { _user_id: string }; Returns: Json }
      get_user_balance: {
        Args: { _user_id: string }
        Returns: {
          lifetime_earned: number
          lifetime_spent: number
          taler_balance: number
        }[]
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
      is_partner_admin: {
        Args: { _partner_id: string; _user_id: string }
        Returns: boolean
      }
      process_referral: {
        Args: { _referral_code: string; _referred_user_id: string }
        Returns: Json
      }
      purchase_streak_freeze: { Args: { _user_id: string }; Returns: Json }
      start_listening_session: { Args: { _user_id: string }; Returns: string }
    }
    Enums: {
      partner_admin_role: "owner" | "manager" | "staff"
      redemption_status: "pending" | "used" | "expired" | "cancelled"
      reward_type:
        | "fixed_discount"
        | "percent_discount"
        | "free_item"
        | "topup_bonus"
        | "experience"
      transaction_source:
        | "signup_bonus"
        | "air_drop"
        | "partner_visit"
        | "partner_purchase"
        | "bonus"
        | "reward_redemption"
        | "system"
        | "referral"
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
      redemption_status: ["pending", "used", "expired", "cancelled"],
      reward_type: [
        "fixed_discount",
        "percent_discount",
        "free_item",
        "topup_bonus",
        "experience",
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
      ],
      transaction_type: ["earn", "spend", "expire", "adjust"],
      user_role: ["user", "partner_admin", "admin"],
    },
  },
} as const
