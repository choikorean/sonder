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
      payment_orders: {
        Row: {
          amount: number
          billing_cycle: string
          created_at: string
          id: string
          plan: string
          provider: string | null
          provider_order_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          billing_cycle: string
          created_at?: string
          id?: string
          plan: string
          provider?: string | null
          provider_order_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          billing_cycle?: string
          created_at?: string
          id?: string
          plan?: string
          provider?: string | null
          provider_order_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      subscriptions: {
        Row: {
          billing_cycle: string
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          provider: string | null
          provider_order_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_cycle?: string
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          provider?: string | null
          provider_order_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_cycle?: string
          cancel_at_period_end?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          provider?: string | null
          provider_order_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
        Args: Record<PropertyKey, never>
        Returns: {
          billing_cycle: string
          cancel_at_period_end: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          provider: string | null
          provider_order_id: string | null
          status: string
          updated_at: string
          user_id: string
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
