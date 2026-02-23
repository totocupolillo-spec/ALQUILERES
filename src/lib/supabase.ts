import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Tipos para Supabase
export interface Database {
  public: {
    Tables: {
      properties: {
        Row: {
          id: number
          name: string
          type: string
          building: string
          address: string
          rent: number
          expenses: number
          tenant: string | null
          status: string
          contract_start: string
          contract_end: string
          last_updated: string
          notes: string
          created_at: string
        }
        Insert: {
          name: string
          type: string
          building: string
          address: string
          rent: number
          expenses: number
          tenant?: string | null
          status: string
          contract_start: string
          contract_end: string
          last_updated: string
          notes: string
        }
        Update: {
          name?: string
          type?: string
          building?: string
          address?: string
          rent?: number
          expenses?: number
          tenant?: string | null
          status?: string
          contract_start?: string
          contract_end?: string
          last_updated?: string
          notes?: string
        }
      }
      tenants: {
        Row: {
          id: number
          name: string
          email: string
          phone: string
          property_id: number | null
          property: string
          contract_start: string
          contract_end: string
          deposit: number
          guarantor_name: string
          guarantor_email: string
          guarantor_phone: string
          balance: number
          status: string
          created_at: string
        }
        Insert: {
          name: string
          email: string
          phone: string
          property_id?: number | null
          property: string
          contract_start: string
          contract_end: string
          deposit: number
          guarantor_name: string
          guarantor_email: string
          guarantor_phone: string
          balance?: number
          status: string
        }
        Update: {
          name?: string
          email?: string
          phone?: string
          property_id?: number | null
          property?: string
          contract_start?: string
          contract_end?: string
          deposit?: number
          guarantor_name?: string
          guarantor_email?: string
          guarantor_phone?: string
          balance?: number
          status?: string
        }
      }
      receipts: {
        Row: {
          id: number
          receipt_number: string
          tenant: string
          property: string
          building: string
          month: string
          year: number
          rent: number
          expenses: number
          other_charges: any
          previous_balance: number
          total: number
          paid_amount: number
          remaining_balance: number
          currency: string
          payment_method: string
          status: string
          due_date: string
          created_date: string
          created_at: string
        }
        Insert: {
          receipt_number: string
          tenant: string
          property: string
          building: string
          month: string
          year: number
          rent: number
          expenses: number
          other_charges: any
          previous_balance: number
          total: number
          paid_amount: number
          remaining_balance: number
          currency: string
          payment_method: string
          status: string
          due_date: string
          created_date: string
        }
        Update: {
          receipt_number?: string
          tenant?: string
          property?: string
          building?: string
          month?: string
          year?: number
          rent?: number
          expenses?: number
          other_charges?: any
          previous_balance?: number
          total?: number
          paid_amount?: number
          remaining_balance?: number
          currency?: string
          payment_method?: string
          status?: string
          due_date?: string
          created_date?: string
        }
      }
      cash_movements: {
        Row: {
          id: number
          type: string
          description: string
          category: string | null
          amount: number
          currency: string
          date: string
          tenant: string | null
          property: string | null
          comment: string | null
          created_at: string
        }
        Insert: {
          type: string
          description: string
          category?: string | null
          amount: number
          currency: string
          date: string
          tenant?: string | null
          property?: string | null
          comment?: string | null
        }
        Update: {
          type?: string
          description?: string
          category?: string | null
          amount?: number
          currency?: string
          date?: string
          tenant?: string | null
          property?: string | null
          comment?: string | null
        }
      }
    }
  }
}