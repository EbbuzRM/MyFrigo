// supabase.ts — supabase module.
//
// exports: Json | Database | Tables | TablesInsert | TablesUpdate
// used_by: services\CategoryService.ts
//                   services\IconLoader.ts
//                   services\ProductStorage.ts
//                   services\SettingsService.ts
//                   services\TemplateService.ts
//                   services\UserDeviceService.ts
//                   services\supabaseClient.ts
// rules:   - Import types from this file are consumed across the entire app; any changes to table schemas must be coordinated with all query builders and type consumers
//          - The `Json` type is used recursively for `local_icon` and similar fields; modifications to its definition could cascade to all table definitions
//          - The `Row`, `Insert`, and `Update` type patterns must remain consistent across all tables to maintain type safety with Supabase client operations
// agent:   deepseek/deepseek-chat | deepseek | 2026-05-09 | codedna-cli | initial CodeDNA annotation pass
// message: 

// Tipi generati automaticamente da Supabase
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
      app_settings: {
        Row: {
          created_at: string | null
          id: number
          notification_days: number | null
          theme: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          notification_days?: number | null
          theme?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          notification_days?: number | null
          theme?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      barcode_templates: {
        Row: {
          barcode: string
          brand: string | null
          category: string | null
          created_at: string
          image_url: string | null
          name: string
        }
        Insert: {
          barcode: string
          brand?: string | null
          category?: string | null
          created_at?: string
          image_url?: string | null
          name: string
        }
        Update: {
          barcode?: string
          brand?: string | null
          category?: string | null
          created_at?: string
          image_url?: string | null
          name?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          local_icon: Json | null
          name: string
          user_id: string | null
        }
        Insert: {
          color?: string | null
          icon?: string | null
          id: string
          is_default?: boolean | null
          local_icon?: Json | null
          name: string
          user_id?: string | null
        }
        Update: {
          color?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          local_icon?: Json | null
          name: string
          user_id?: string | null
        }
        Relationships: []
      }
      products: {
        Row: {
          added_method: string | null
          barcode: string | null
          brand: string | null
          category: string | null
          consumed_date: string | null
          created_at: string
          expiration_date: string | null
          id: string
          image_url: string | null
          is_frozen: boolean | null
          name: string
          notes: string | null
          purchase_date: string | null
          quantities: Json | null
          quantity: number | null
          status: string | null
          unit: string | null
          user_id: string | null
        }
        Insert: {
          added_method?: string | null
          barcode?: string | null
          brand?: string | null
          category?: string | null
          consumed_date?: string | null
          created_at?: string
          expiration_date?: string | null
          id: string
          image_url?: string | null
          is_frozen?: boolean | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          quantities?: Json | null
          quantity?: number | null
          status?: string | null
          unit?: string | null
          user_id?: string | null
        }
        Update: {
          added_method?: string | null
          barcode?: string | null
          brand?: string | null
          category?: string | null
          consumed_date?: string | null
          created_at?: string | null
          expiration_date?: string | null
          id?: string
          image_url?: string | null
          is_frozen?: boolean | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          quantities?: Json | null
          quantity?: number | null
          status?: string | null
          unit?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          onesignal_id: string | null
          push_token: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          onesignal_id?: string | null
          push_token?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          onesignal_id?: string | null
          push_token?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_devices: {
        Row: {
          created_at: string
          device_id: string
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: number
          user_id: string
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: number
          user_id?: string
        }
        Relationships: []
      }
      user_notification_settings: {
        Row: {
          notification_days: number
          notifications_enabled: boolean
          user_id: string
        }
        Insert: {
          notification_days?: number
          notifications_enabled?: boolean
          user_id: string
        }
        Update: {
          notification_days?: number
          notifications_enabled?: boolean
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_email_exists: {
        Args: { email_to_check: string }
        Returns: boolean
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

// Tipi helper per facilitare l'uso
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
