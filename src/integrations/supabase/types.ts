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
      clientes: {
        Row: {
          created_at: string
          data: Json
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          nome: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      cotacoes: {
        Row: {
          code: string
          created_at: string
          data: Json
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          data?: Json
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          data?: Json
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      formas_pagamento: {
        Row: {
          acrescimo: number
          ativo: boolean
          created_at: string
          desconto: number
          id: string
          intervalo_dias: number
          nome: string
          observacao: string | null
          parcelas: number
          updated_at: string
          user_id: string
        }
        Insert: {
          acrescimo?: number
          ativo?: boolean
          created_at?: string
          desconto?: number
          id?: string
          intervalo_dias?: number
          nome: string
          observacao?: string | null
          parcelas?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          acrescimo?: number
          ativo?: boolean
          created_at?: string
          desconto?: number
          id?: string
          intervalo_dias?: number
          nome?: string
          observacao?: string | null
          parcelas?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      integracoes: {
        Row: {
          ambiente: string
          api_key: string | null
          api_url: string | null
          ativo: boolean
          categoria: string
          config: Json
          created_at: string
          id: string
          last_sync_at: string | null
          nome: string
          provedor: string | null
          secret_key: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ambiente?: string
          api_key?: string | null
          api_url?: string | null
          ativo?: boolean
          categoria: string
          config?: Json
          created_at?: string
          id?: string
          last_sync_at?: string | null
          nome: string
          provedor?: string | null
          secret_key?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ambiente?: string
          api_key?: string | null
          api_url?: string | null
          ativo?: boolean
          categoria?: string
          config?: Json
          created_at?: string
          id?: string
          last_sync_at?: string | null
          nome?: string
          provedor?: string | null
          secret_key?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      labels_custom: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color: string
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      telegram_config: {
        Row: {
          ativo: boolean
          chat_id: string | null
          created_at: string
          id: string
          notificar_checkin: boolean
          notificar_embarque: boolean
          notificar_followup: boolean
          notificar_pagamentos: boolean
          notificar_tarefas: boolean
          notificar_vendas: boolean
          token_bot: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          chat_id?: string | null
          created_at?: string
          id?: string
          notificar_checkin?: boolean
          notificar_embarque?: boolean
          notificar_followup?: boolean
          notificar_pagamentos?: boolean
          notificar_tarefas?: boolean
          notificar_vendas?: boolean
          token_bot?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          chat_id?: string | null
          created_at?: string
          id?: string
          notificar_checkin?: boolean
          notificar_embarque?: boolean
          notificar_followup?: boolean
          notificar_pagamentos?: boolean
          notificar_tarefas?: boolean
          notificar_vendas?: boolean
          token_bot?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      telegram_envios: {
        Row: {
          created_at: string
          erro: string | null
          id: string
          mensagem: string
          status: string
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          erro?: string | null
          id?: string
          mensagem: string
          status: string
          tipo: string
          user_id: string
        }
        Update: {
          created_at?: string
          erro?: string | null
          id?: string
          mensagem?: string
          status?: string
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      termos_modelos: {
        Row: {
          ativo: boolean
          categoria: string
          conteudo: string
          created_at: string
          id: string
          nome: string
          padrao: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          ativo?: boolean
          categoria: string
          conteudo?: string
          created_at?: string
          id?: string
          nome: string
          padrao?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          ativo?: boolean
          categoria?: string
          conteudo?: string
          created_at?: string
          id?: string
          nome?: string
          padrao?: boolean
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
      [_ in never]: never
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
