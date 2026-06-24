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
      billing_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          user_id?: string
        }
        Relationships: []
      }
      billing_keys: {
        Row: {
          card_cl: string | null
          card_code: string | null
          card_name: string | null
          card_no_masked: string | null
          created_at: string
          id: string
          is_active: boolean
          issued_at: string | null
          nicepay_bid: string
          nicepay_mid: string
          removed_at: string | null
          user_id: string
        }
        Insert: {
          card_cl?: string | null
          card_code?: string | null
          card_name?: string | null
          card_no_masked?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          issued_at?: string | null
          nicepay_bid: string
          nicepay_mid: string
          removed_at?: string | null
          user_id: string
        }
        Update: {
          card_cl?: string | null
          card_code?: string | null
          card_name?: string | null
          card_no_masked?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          issued_at?: string | null
          nicepay_bid?: string
          nicepay_mid?: string
          removed_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      consultation_summaries: {
        Row: {
          audio_url: string | null
          client_summary: string
          created_at: string
          id: string
          next_actions: string | null
          next_guidance: string | null
          original_text: string | null
          required_documents: string | null
          summary: string
          transcript: string | null
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          client_summary: string
          created_at?: string
          id?: string
          next_actions?: string | null
          next_guidance?: string | null
          original_text?: string | null
          required_documents?: string | null
          summary: string
          transcript?: string | null
          user_id: string
        }
        Update: {
          audio_url?: string | null
          client_summary?: string
          created_at?: string
          id?: string
          next_actions?: string | null
          next_guidance?: string | null
          original_text?: string | null
          required_documents?: string | null
          summary?: string
          transcript?: string | null
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          joined_at: string
          organization_id: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          joined_at?: string
          organization_id: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          joined_at?: string
          organization_id?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invites: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string | null
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string | null
          expires_at: string
          id?: string
          invited_by: string
          organization_id: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string | null
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_user_id: string
          seat_limit: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_user_id: string
          seat_limit?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_user_id?: string
          seat_limit?: number
          updated_at?: string
        }
        Relationships: []
      }
      payment_attempts: {
        Row: {
          attempt_no: number
          attempted_at: string
          id: string
          payment_id: string
          raw_response: Json | null
          result_code: string | null
          result_msg: string | null
          user_id: string
        }
        Insert: {
          attempt_no?: number
          attempted_at?: string
          id?: string
          payment_id: string
          raw_response?: Json | null
          result_code?: string | null
          result_msg?: string | null
          user_id: string
        }
        Update: {
          attempt_no?: number
          attempted_at?: string
          id?: string
          payment_id?: string
          raw_response?: Json | null
          result_code?: string | null
          result_msg?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_attempts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_orders: {
        Row: {
          amount: number
          auth_tid: string | null
          billing_cycle: string
          checkout_type: string
          created_at: string
          goods_name: string | null
          id: string
          metadata: Json
          moid: string | null
          plan: string
          provider: string | null
          provider_order_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          auth_tid?: string | null
          billing_cycle: string
          checkout_type?: string
          created_at?: string
          goods_name?: string | null
          id?: string
          metadata?: Json
          moid?: string | null
          plan: string
          provider?: string | null
          provider_order_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          auth_tid?: string | null
          billing_cycle?: string
          checkout_type?: string
          created_at?: string
          goods_name?: string | null
          id?: string
          metadata?: Json
          moid?: string | null
          plan?: string
          provider?: string | null
          provider_order_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          auth_code: string | null
          auth_date: string | null
          created_at: string
          failed_at: string | null
          goods_name: string
          id: string
          moid: string
          nicepay_tid: string | null
          paid_at: string | null
          payment_order_id: string | null
          raw_response: Json | null
          result_code: string | null
          result_msg: string | null
          status: string
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          auth_code?: string | null
          auth_date?: string | null
          created_at?: string
          failed_at?: string | null
          goods_name: string
          id?: string
          moid: string
          nicepay_tid?: string | null
          paid_at?: string | null
          payment_order_id?: string | null
          raw_response?: Json | null
          result_code?: string | null
          result_msg?: string | null
          status?: string
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          auth_code?: string | null
          auth_date?: string | null
          created_at?: string
          failed_at?: string | null
          goods_name?: string
          id?: string
          moid?: string
          nicepay_tid?: string | null
          paid_at?: string | null
          payment_order_id?: string | null
          raw_response?: Json | null
          result_code?: string | null
          result_msg?: string | null
          status?: string
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_payment_order_id_fkey"
            columns: ["payment_order_id"]
            isOneToOne: false
            referencedRelation: "payment_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          office_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name?: string | null
          office_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          office_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      report_explanations: {
        Row: {
          change_reason: string | null
          created_at: string
          current_tax: number
          due_date: string | null
          id: string
          memo: string | null
          previous_tax: number | null
          result: string
          tax_type: string
          user_id: string
        }
        Insert: {
          change_reason?: string | null
          created_at?: string
          current_tax: number
          due_date?: string | null
          id?: string
          memo?: string | null
          previous_tax?: number | null
          result: string
          tax_type: string
          user_id: string
        }
        Update: {
          change_reason?: string | null
          created_at?: string
          current_tax?: number
          due_date?: string | null
          id?: string
          memo?: string | null
          previous_tax?: number | null
          result?: string
          tax_type?: string
          user_id?: string
        }
        Relationships: []
      }
      request_generations: {
        Row: {
          business_type: string
          created_at: string
          id: string
          memo: string | null
          result: string
          tax_type: string
          user_id: string
        }
        Insert: {
          business_type: string
          created_at?: string
          id?: string
          memo?: string | null
          result: string
          tax_type: string
          user_id: string
        }
        Update: {
          business_type?: string
          created_at?: string
          id?: string
          memo?: string | null
          result?: string
          tax_type?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_phrases: {
        Row: {
          content: string
          created_at: string
          id: string
          label: string
          organization_id: string | null
          scope: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          label: string
          organization_id?: string | null
          scope?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          label?: string
          organization_id?: string | null
          scope?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_phrases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          next_billing_at: string | null
          organization_id: string | null
          plan: string
          provider: string | null
          provider_order_id: string | null
          started_at: string | null
          status: string
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle?: string
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          next_billing_at?: string | null
          organization_id?: string | null
          plan?: string
          provider?: string | null
          provider_order_id?: string | null
          started_at?: string | null
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle?: string
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          next_billing_at?: string | null
          organization_id?: string | null
          plan?: string
          provider?: string | null
          provider_order_id?: string | null
          started_at?: string | null
          status?: string
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_events: {
        Row: {
          created_at: string
          feature: string
          id: string
          metadata: Json | null
          tokens_estimated: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          feature: string
          id?: string
          metadata?: Json | null
          tokens_estimated?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          feature?: string
          id?: string
          metadata?: Json | null
          tokens_estimated?: number | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      current_month_usage: {
        Row: {
          feature: string | null
          usage_count: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      start_free_trial: {
        Args: never
        Returns: {
          billing_cycle: string
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          next_billing_at: string | null
          plan: string
          provider: string | null
          provider_order_id: string | null
          started_at: string | null
          status: string
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "subscriptions"
          isOneToOne: true
          isSetofReturn: false
        }
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
