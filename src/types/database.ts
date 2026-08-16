// =============================================================================
// Database Types - Generated from Supabase Schema
// =============================================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          user_id: string
          full_name: string
          phone: string
          role: 'admin' | 'staff' | 'customer'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          phone: string
          role?: 'admin' | 'staff' | 'customer'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          phone?: string
          role?: 'admin' | 'staff' | 'customer'
          created_at?: string
          updated_at?: string
        }
      }
      travel_requests: {
        Row: {
          id: string
          client_user_id: string
          destination_country: string
          travel_type: 'visa_only' | 'visa_flight' | 'visa_hotel' | 'full_package'
          departure_date: string | null
          return_date: string | null
          traveler_count: number
          status: 'pending_documents' | 'documents_review' | 'docs_approved' | 'in_progress' | 'completed' | 'cancelled'
          document_checklist: Json
          documents_completion_percent: number
          customer_notes: string | null
          staff_notes: string | null
          next_action_required: string | null
          next_follow_up_date: string | null
          linked_visa_application_id: string | null
          linked_payment_id: string | null
          assigned_staff_id: string | null
          created_at: string
          updated_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          client_user_id: string
          destination_country: string
          travel_type: 'visa_only' | 'visa_flight' | 'visa_hotel' | 'full_package'
          departure_date?: string | null
          return_date?: string | null
          traveler_count?: number
          status?: 'pending_documents' | 'documents_review' | 'docs_approved' | 'in_progress' | 'completed' | 'cancelled'
          document_checklist?: Json
          documents_completion_percent?: number
          customer_notes?: string | null
          staff_notes?: string | null
          next_action_required?: string | null
          next_follow_up_date?: string | null
          linked_visa_application_id?: string | null
          linked_payment_id?: string | null
          assigned_staff_id?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          client_user_id?: string
          destination_country?: string
          travel_type?: 'visa_only' | 'visa_flight' | 'visa_hotel' | 'full_package'
          departure_date?: string | null
          return_date?: string | null
          traveler_count?: number
          status?: 'pending_documents' | 'documents_review' | 'docs_approved' | 'in_progress' | 'completed' | 'cancelled'
          document_checklist?: Json
          documents_completion_percent?: number
          customer_notes?: string | null
          staff_notes?: string | null
          next_action_required?: string | null
          next_follow_up_date?: string | null
          linked_visa_application_id?: string | null
          linked_payment_id?: string | null
          assigned_staff_id?: string | null
          created_at?: string
          updated_at?: string
          completed_at?: string | null
        }
      }
      document_requirements: {
        Row: {
          id: string
          destination_country: string
          travel_type: 'visa_only' | 'visa_flight' | 'visa_hotel' | 'full_package'
          required_documents: Json
          optional_documents: Json
          special_instructions: string | null
          processing_time_days: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          destination_country: string
          travel_type: 'visa_only' | 'visa_flight' | 'visa_hotel' | 'full_package'
          required_documents: Json
          optional_documents?: Json
          special_instructions?: string | null
          processing_time_days: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          destination_country?: string
          travel_type?: 'visa_only' | 'visa_flight' | 'visa_hotel' | 'full_package'
          required_documents?: Json
          optional_documents?: Json
          special_instructions?: string | null
          processing_time_days?: number
          created_at?: string
          updated_at?: string
        }
      }
      customer_documents: {
        Row: {
          id: string
          travel_request_id: string
          client_user_id: string
          document_type: string
          file_path: string | null
          file_name: string | null
          file_size: number | null
          mime_type: string | null
          status: 'uploaded' | 'under_review' | 'approved' | 'rejected' | 'expired'
          reviewed_by: string | null
          reviewed_at: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          travel_request_id: string
          client_user_id: string
          document_type: string
          file_path?: string | null
          file_name?: string | null
          file_size?: number | null
          mime_type?: string | null
          status?: 'uploaded' | 'under_review' | 'approved' | 'rejected' | 'expired'
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          travel_request_id?: string
          client_user_id?: string
          document_type?: string
          file_path?: string | null
          file_name?: string | null
          file_size?: number | null
          mime_type?: string | null
          status?: 'uploaded' | 'under_review' | 'approved' | 'rejected' | 'expired'
          reviewed_by?: string | null
          reviewed_at?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customer_communications: {
        Row: {
          id: string
          travel_request_id: string
          client_user_id: string
          staff_user_id: string | null
          communication_type: 'email' | 'whatsapp' | 'sms' | 'phone_call' | 'system_notification'
          subject: string | null
          message: string
          sent_at: string
          whatsapp_message_id: string | null
          email_message_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          travel_request_id: string
          client_user_id: string
          staff_user_id?: string | null
          communication_type: 'email' | 'whatsapp' | 'sms' | 'phone_call' | 'system_notification'
          subject?: string | null
          message: string
          sent_at?: string
          whatsapp_message_id?: string | null
          email_message_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          travel_request_id?: string
          client_user_id?: string
          staff_user_id?: string | null
          communication_type?: 'email' | 'whatsapp' | 'sms' | 'phone_call' | 'system_notification'
          subject?: string | null
          message?: string
          sent_at?: string
          whatsapp_message_id?: string | null
          email_message_id?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_my_travel_requests: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          client_user_id: string
          destination_country: string
          travel_type: string
          departure_date: string | null
          return_date: string | null
          traveler_count: number
          status: string
          document_checklist: Json
          documents_completion_percent: number
          customer_notes: string | null
          staff_notes: string | null
          next_action_required: string | null
          next_follow_up_date: string | null
          linked_visa_application_id: string | null
          linked_payment_id: string | null
          assigned_staff_id: string | null
          created_at: string
          updated_at: string
          completed_at: string | null
        }[]
      }
      get_document_requirements: {
        Args: {
          dest_country: string
          trip_type: string
        }
        Returns: {
          required_docs: Json
          optional_docs: Json
          instructions: string
          processing_days: number
        }[]
      }
      update_document_completion: {
        Args: {
          request_id: string
        }
        Returns: number
      }
      create_quotation: {
        Args: {
          p_user_id: string
          p_visa_app_id: string | null
          p_items: Json
          p_total_amount: number
          p_currency?: string
        }
        Returns: string
      }
      send_quotation: {
        Args: {
          p_quote_id: string
        }
        Returns: void
      }
      accept_quotation_and_create_booking: {
        Args: {
          p_quote_id: string
        }
        Returns: string
      }
      record_payment_and_generate_voucher: {
        Args: {
          p_transaction_id: string
          p_amount_paid: number
          p_payment_method: string
          p_receipt_url?: string | null
        }
        Returns: void
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