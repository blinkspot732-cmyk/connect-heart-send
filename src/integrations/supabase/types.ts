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
      account_suspensions: {
        Row: {
          account_count: number | null
          details: string | null
          hardware_fp: string | null
          id: string
          ip_address: string | null
          reason: string
          suspended_at: string
          user_id: string
        }
        Insert: {
          account_count?: number | null
          details?: string | null
          hardware_fp?: string | null
          id?: string
          ip_address?: string | null
          reason?: string
          suspended_at?: string
          user_id: string
        }
        Update: {
          account_count?: number | null
          details?: string | null
          hardware_fp?: string | null
          id?: string
          ip_address?: string | null
          reason?: string
          suspended_at?: string
          user_id?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          active: boolean
          api_key_hash: string
          created_at: string
          id: string
          key_last4: string
          key_prefix: string
          last_used_at: string | null
          name: string
          user_id: string
        }
        Insert: {
          active?: boolean
          api_key_hash: string
          created_at?: string
          id?: string
          key_last4: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          user_id: string
        }
        Update: {
          active?: boolean
          api_key_hash?: string
          created_at?: string
          id?: string
          key_last4?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      behavior_sessions: {
        Row: {
          ai_assessed_at: string | null
          ai_reasoning: string | null
          ai_verdict: string | null
          avg_keystroke_ms: number | null
          bot_score: number | null
          click_count: number | null
          created_at: string
          double_click_count: number | null
          fingerprint: string | null
          id: string
          ip_address: string | null
          is_bot_suspected: boolean | null
          keystroke_count: number | null
          keystroke_intervals: Json | null
          mouse_entropy: number | null
          mouse_event_count: number | null
          mouse_velocity_avg: number | null
          session_id: string
          typing_entropy: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ai_assessed_at?: string | null
          ai_reasoning?: string | null
          ai_verdict?: string | null
          avg_keystroke_ms?: number | null
          bot_score?: number | null
          click_count?: number | null
          created_at?: string
          double_click_count?: number | null
          fingerprint?: string | null
          id?: string
          ip_address?: string | null
          is_bot_suspected?: boolean | null
          keystroke_count?: number | null
          keystroke_intervals?: Json | null
          mouse_entropy?: number | null
          mouse_event_count?: number | null
          mouse_velocity_avg?: number | null
          session_id: string
          typing_entropy?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ai_assessed_at?: string | null
          ai_reasoning?: string | null
          ai_verdict?: string | null
          avg_keystroke_ms?: number | null
          bot_score?: number | null
          click_count?: number | null
          created_at?: string
          double_click_count?: number | null
          fingerprint?: string | null
          id?: string
          ip_address?: string | null
          is_bot_suspected?: boolean | null
          keystroke_count?: number | null
          keystroke_intervals?: Json | null
          mouse_entropy?: number | null
          mouse_event_count?: number | null
          mouse_velocity_avg?: number | null
          session_id?: string
          typing_entropy?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      devices: {
        Row: {
          android_version: string | null
          battery_level: number | null
          connected_at: string | null
          created_at: string
          device_id: string
          device_name: string
          device_token_hash: string
          id: string
          last_seen: string | null
          manufacturer: string | null
          model: string | null
          paired_at: string | null
          pairing_code: string | null
          pairing_code_expires_at: string | null
          signal_strength: number | null
          sim_operator: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          android_version?: string | null
          battery_level?: number | null
          connected_at?: string | null
          created_at?: string
          device_id: string
          device_name: string
          device_token_hash: string
          id?: string
          last_seen?: string | null
          manufacturer?: string | null
          model?: string | null
          paired_at?: string | null
          pairing_code?: string | null
          pairing_code_expires_at?: string | null
          signal_strength?: number | null
          sim_operator?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          android_version?: string | null
          battery_level?: number | null
          connected_at?: string | null
          created_at?: string
          device_id?: string
          device_name?: string
          device_token_hash?: string
          id?: string
          last_seen?: string | null
          manufacturer?: string | null
          model?: string | null
          paired_at?: string | null
          pairing_code?: string | null
          pairing_code_expires_at?: string | null
          signal_strength?: number | null
          sim_operator?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ip_reputation: {
        Row: {
          asn: string | null
          block_reason: string | null
          blocked_at: string | null
          blocked_until: string | null
          country_code: string | null
          created_at: string
          failed_login_count: number
          id: string
          ip_address: string
          is_blocked: boolean
          is_datacenter: boolean | null
          is_vpn: boolean | null
          last_seen_at: string
          request_count: number
          threat_score: number
          updated_at: string
        }
        Insert: {
          asn?: string | null
          block_reason?: string | null
          blocked_at?: string | null
          blocked_until?: string | null
          country_code?: string | null
          created_at?: string
          failed_login_count?: number
          id?: string
          ip_address: string
          is_blocked?: boolean
          is_datacenter?: boolean | null
          is_vpn?: boolean | null
          last_seen_at?: string
          request_count?: number
          threat_score?: number
          updated_at?: string
        }
        Update: {
          asn?: string | null
          block_reason?: string | null
          blocked_at?: string | null
          blocked_until?: string | null
          country_code?: string | null
          created_at?: string
          failed_login_count?: number
          id?: string
          ip_address?: string
          is_blocked?: boolean
          is_datacenter?: boolean | null
          is_vpn?: boolean | null
          last_seen_at?: string
          request_count?: number
          threat_score?: number
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          created_at: string
          delivered_at: string | null
          device_id: string | null
          direction: string
          fail_reason: string | null
          failed_at: string | null
          failure_reason: string | null
          id: string
          message: string
          picked_at: string | null
          queued_at: string
          recipient: string | null
          sender: string | null
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delivered_at?: string | null
          device_id?: string | null
          direction?: string
          fail_reason?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          message: string
          picked_at?: string | null
          queued_at?: string
          recipient?: string | null
          sender?: string | null
          sent_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          delivered_at?: string | null
          device_id?: string | null
          direction?: string
          fail_reason?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          id?: string
          message?: string
          picked_at?: string | null
          queued_at?: string
          recipient?: string | null
          sender?: string | null
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount_kes: number
          authorization_url: string | null
          created_at: string
          display_amount: number | null
          display_currency: string | null
          expires_at: string
          id: string
          paid_at: string | null
          raw_payload: Json | null
          reference: string
          status: string
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_kes: number
          authorization_url?: string | null
          created_at?: string
          display_amount?: number | null
          display_currency?: string | null
          expires_at?: string
          id?: string
          paid_at?: string | null
          raw_payload?: Json | null
          reference: string
          status?: string
          tier: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_kes?: number
          authorization_url?: string | null
          created_at?: string
          display_amount?: number | null
          display_currency?: string | null
          expires_at?: string
          id?: string
          paid_at?: string | null
          raw_payload?: Json | null
          reference?: string
          status?: string
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
          name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          action_taken: string
          ai_assessment: Json | null
          created_at: string
          event_type: string
          fingerprint: string | null
          id: string
          ip_address: string | null
          metadata: Json
          path: string | null
          session_id: string | null
          severity: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action_taken?: string
          ai_assessment?: Json | null
          created_at?: string
          event_type: string
          fingerprint?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json
          path?: string | null
          session_id?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action_taken?: string
          ai_assessment?: Json | null
          created_at?: string
          event_type?: string
          fingerprint?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json
          path?: string | null
          session_id?: string | null
          severity?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      signup_registry: {
        Row: {
          created_at: string
          email: string
          fingerprint: string | null
          hardware_fp: string | null
          id: string
          ip: string | null
          ip_address: string | null
          phone: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          fingerprint?: string | null
          hardware_fp?: string | null
          id?: string
          ip?: string | null
          ip_address?: string | null
          phone?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          fingerprint?: string | null
          hardware_fp?: string | null
          id?: string
          ip?: string | null
          ip_address?: string | null
          phone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          id: string
          paystack_reference: string | null
          status: string
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          paystack_reference?: string | null
          status?: string
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          id?: string
          paystack_reference?: string | null
          status?: string
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      threat_assessments: {
        Row: {
          action_recommended: string | null
          confidence: number | null
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          model_used: string | null
          raw_groq_response: Json | null
          reasoning: string | null
          target_id: string
          target_type: string
          threat_level: string
          threat_types: string[]
        }
        Insert: {
          action_recommended?: string | null
          confidence?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          model_used?: string | null
          raw_groq_response?: Json | null
          reasoning?: string | null
          target_id: string
          target_type: string
          threat_level: string
          threat_types?: string[]
        }
        Update: {
          action_recommended?: string | null
          confidence?: number | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          model_used?: string | null
          raw_groq_response?: Json | null
          reasoning?: string | null
          target_id?: string
          target_type?: string
          threat_level?: string
          threat_types?: string[]
        }
        Relationships: []
      }
      usage_daily: {
        Row: {
          created_at: string
          day: string
          id: string
          sent_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day?: string
          id?: string
          sent_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          sent_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_balances: {
        Row: {
          daily_limit: number
          id: string
          last_refreshed_at: string
          sms_balance: number
          updated_at: string
          user_id: string
        }
        Insert: {
          daily_limit?: number
          id?: string
          last_refreshed_at?: string
          sms_balance?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          daily_limit?: number
          id?: string
          last_refreshed_at?: string
          sms_balance?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
          name?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      webhook_deliveries: {
        Row: {
          attempts: number
          created_at: string
          endpoint_id: string
          event: string
          id: string
          last_error: string | null
          last_response_code: number | null
          next_attempt_at: string
          payload: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          endpoint_id: string
          event: string
          id?: string
          last_error?: string | null
          last_response_code?: number | null
          next_attempt_at?: string
          payload: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          endpoint_id?: string
          event?: string
          id?: string
          last_error?: string | null
          last_response_code?: number | null
          next_attempt_at?: string
          payload?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhook_deliveries_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "webhook_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_endpoints: {
        Row: {
          active: boolean
          created_at: string
          events: string[]
          id: string
          secret: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          events?: string[]
          id?: string
          secret: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          events?: string[]
          id?: string
          secret?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      webhooks: {
        Row: {
          active: boolean | null
          created_at: string | null
          events: string[] | null
          id: string
          url: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string | null
          events?: string[] | null
          id?: string
          url: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string | null
          events?: string[] | null
          id?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "webhooks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_increment_sms_quota: {
        Args: { _user_id: string }
        Returns: Json
      }
      check_signup_allowed: {
        Args: { _fingerprint: string; _phone: string }
        Returns: Json
      }
      deduct_sms_balance: { Args: { p_user_id: string }; Returns: number }
      enforce_account_limit: {
        Args: {
          p_hardware_fp?: string
          p_ip_address?: string
          p_user_id: string
        }
        Returns: Json
      }
      get_account_suspension: { Args: { p_user_id: string }; Returns: Json }
      tier_daily_limit: { Args: { t: string }; Returns: number }
      upgrade_subscription: {
        Args: {
          p_cycle: string
          p_months: number
          p_ref: string
          p_tier: string
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
