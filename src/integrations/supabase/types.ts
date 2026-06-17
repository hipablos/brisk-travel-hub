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
      brand_settings: {
        Row: {
          cnpj: string | null
          cor_botoes: string
          cor_destaque: string
          cor_links: string
          cor_primaria: string
          cor_secundaria: string
          created_at: string
          email: string | null
          empresa_nome: string | null
          endereco: string | null
          favicon_url: string | null
          fundo_login_tipo: string
          fundo_login_valor: string
          fundo_pdf_tipo: string | null
          fundo_pdf_valor: string | null
          id: string
          imagem_institucional_url: string | null
          logo_url: string | null
          nome_sistema: string
          singleton: boolean
          site: string | null
          telefone: string | null
          tema_padrao: string
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          cor_botoes?: string
          cor_destaque?: string
          cor_links?: string
          cor_primaria?: string
          cor_secundaria?: string
          created_at?: string
          email?: string | null
          empresa_nome?: string | null
          endereco?: string | null
          favicon_url?: string | null
          fundo_login_tipo?: string
          fundo_login_valor?: string
          fundo_pdf_tipo?: string | null
          fundo_pdf_valor?: string | null
          id?: string
          imagem_institucional_url?: string | null
          logo_url?: string | null
          nome_sistema?: string
          singleton?: boolean
          site?: string | null
          telefone?: string | null
          tema_padrao?: string
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          cor_botoes?: string
          cor_destaque?: string
          cor_links?: string
          cor_primaria?: string
          cor_secundaria?: string
          created_at?: string
          email?: string | null
          empresa_nome?: string | null
          endereco?: string | null
          favicon_url?: string | null
          fundo_login_tipo?: string
          fundo_login_valor?: string
          fundo_pdf_tipo?: string | null
          fundo_pdf_valor?: string | null
          id?: string
          imagem_institucional_url?: string | null
          logo_url?: string | null
          nome_sistema?: string
          singleton?: boolean
          site?: string | null
          telefone?: string | null
          tema_padrao?: string
          updated_at?: string
        }
        Relationships: []
      }
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
      experiencias: {
        Row: {
          categoria: string | null
          cidade: string | null
          cliente_id: string | null
          cotacao_id: string | null
          created_at: string
          created_by: string | null
          data: string | null
          descricao: string | null
          duracao_min: number | null
          endereco: string | null
          estado: string | null
          google_maps_url: string | null
          google_place_id: string | null
          hora_inicio: string | null
          hora_termino: string | null
          id: string
          idade_minima: number | null
          idioma: string | null
          lat: number | null
          lng: number | null
          nome: string
          pais: string | null
          participantes: number | null
          updated_at: string
        }
        Insert: {
          categoria?: string | null
          cidade?: string | null
          cliente_id?: string | null
          cotacao_id?: string | null
          created_at?: string
          created_by?: string | null
          data?: string | null
          descricao?: string | null
          duracao_min?: number | null
          endereco?: string | null
          estado?: string | null
          google_maps_url?: string | null
          google_place_id?: string | null
          hora_inicio?: string | null
          hora_termino?: string | null
          id?: string
          idade_minima?: number | null
          idioma?: string | null
          lat?: number | null
          lng?: number | null
          nome: string
          pais?: string | null
          participantes?: number | null
          updated_at?: string
        }
        Update: {
          categoria?: string | null
          cidade?: string | null
          cliente_id?: string | null
          cotacao_id?: string | null
          created_at?: string
          created_by?: string | null
          data?: string | null
          descricao?: string | null
          duracao_min?: number | null
          endereco?: string | null
          estado?: string | null
          google_maps_url?: string | null
          google_place_id?: string | null
          hora_inicio?: string | null
          hora_termino?: string | null
          id?: string
          idade_minima?: number | null
          idioma?: string | null
          lat?: number | null
          lng?: number | null
          nome?: string
          pais?: string | null
          participantes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiencias_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiencias_cotacao_id_fkey"
            columns: ["cotacao_id"]
            isOneToOne: false
            referencedRelation: "cotacoes"
            referencedColumns: ["id"]
          },
        ]
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
      hospedagens: {
        Row: {
          checkin: string | null
          checkout: string | null
          cidade: string | null
          cliente_id: string | null
          codigo_confirmacao: string | null
          cotacao_id: string | null
          created_at: string
          created_by: string | null
          endereco: string | null
          estado: string | null
          estrelas: number | null
          google_maps_url: string | null
          google_place_id: string | null
          hospedes: number | null
          id: string
          lat: number | null
          lng: number | null
          noites: number | null
          nome_hotel: string
          numero_reserva: string | null
          observacoes_cliente: string | null
          pais: string | null
          quartos: number | null
          regime_alimentar:
            | Database["public"]["Enums"]["regime_alimentar"]
            | null
          tipo_acomodacao: string | null
          updated_at: string
        }
        Insert: {
          checkin?: string | null
          checkout?: string | null
          cidade?: string | null
          cliente_id?: string | null
          codigo_confirmacao?: string | null
          cotacao_id?: string | null
          created_at?: string
          created_by?: string | null
          endereco?: string | null
          estado?: string | null
          estrelas?: number | null
          google_maps_url?: string | null
          google_place_id?: string | null
          hospedes?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          noites?: number | null
          nome_hotel: string
          numero_reserva?: string | null
          observacoes_cliente?: string | null
          pais?: string | null
          quartos?: number | null
          regime_alimentar?:
            | Database["public"]["Enums"]["regime_alimentar"]
            | null
          tipo_acomodacao?: string | null
          updated_at?: string
        }
        Update: {
          checkin?: string | null
          checkout?: string | null
          cidade?: string | null
          cliente_id?: string | null
          codigo_confirmacao?: string | null
          cotacao_id?: string | null
          created_at?: string
          created_by?: string | null
          endereco?: string | null
          estado?: string | null
          estrelas?: number | null
          google_maps_url?: string | null
          google_place_id?: string | null
          hospedes?: number | null
          id?: string
          lat?: number | null
          lng?: number | null
          noites?: number | null
          nome_hotel?: string
          numero_reserva?: string | null
          observacoes_cliente?: string | null
          pais?: string | null
          quartos?: number | null
          regime_alimentar?:
            | Database["public"]["Enums"]["regime_alimentar"]
            | null
          tipo_acomodacao?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "hospedagens_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hospedagens_cotacao_id_fkey"
            columns: ["cotacao_id"]
            isOneToOne: false
            referencedRelation: "cotacoes"
            referencedColumns: ["id"]
          },
        ]
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
      login_layout_settings: {
        Row: {
          cor_botao: string
          cor_botao_texto: string
          cor_campos: string
          cor_card: string
          cor_icones: string
          cor_links: string
          cor_secundaria: string
          cor_textos: string
          created_at: string
          fundo_tipo: string
          fundo_valor: string
          id: string
          logo_alinhamento: string
          logo_altura: number
          logo_largura: number
          logo_url: string | null
          singleton: boolean
          subtitulo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          cor_botao?: string
          cor_botao_texto?: string
          cor_campos?: string
          cor_card?: string
          cor_icones?: string
          cor_links?: string
          cor_secundaria?: string
          cor_textos?: string
          created_at?: string
          fundo_tipo?: string
          fundo_valor?: string
          id?: string
          logo_alinhamento?: string
          logo_altura?: number
          logo_largura?: number
          logo_url?: string | null
          singleton?: boolean
          subtitulo?: string
          titulo?: string
          updated_at?: string
        }
        Update: {
          cor_botao?: string
          cor_botao_texto?: string
          cor_campos?: string
          cor_card?: string
          cor_icones?: string
          cor_links?: string
          cor_secundaria?: string
          cor_textos?: string
          created_at?: string
          fundo_tipo?: string
          fundo_valor?: string
          id?: string
          logo_alinhamento?: string
          logo_altura?: number
          logo_largura?: number
          logo_url?: string | null
          singleton?: boolean
          subtitulo?: string
          titulo?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          cargo: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          idioma: string | null
          tema: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          idioma?: string | null
          tema?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          cargo?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          idioma?: string | null
          tema?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      telegram_alertas: {
        Row: {
          cliente: string
          created_at: string
          destino: string | null
          enviar_em: string
          erro: string | null
          evento_em: string
          id: string
          mensagem: string
          metadata: Json
          numero_voo: string | null
          origem: string | null
          processed_at: string | null
          referencia: string
          status: string
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cliente: string
          created_at?: string
          destino?: string | null
          enviar_em: string
          erro?: string | null
          evento_em: string
          id?: string
          mensagem: string
          metadata?: Json
          numero_voo?: string | null
          origem?: string | null
          processed_at?: string | null
          referencia: string
          status?: string
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cliente?: string
          created_at?: string
          destino?: string | null
          enviar_em?: string
          erro?: string | null
          evento_em?: string
          id?: string
          mensagem?: string
          metadata?: Json
          numero_voo?: string | null
          origem?: string | null
          processed_at?: string | null
          referencia?: string
          status?: string
          tipo?: string
          updated_at?: string
          user_id?: string
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
          referencia: string | null
          status: string
          tipo: string
          user_id: string
        }
        Insert: {
          created_at?: string
          erro?: string | null
          id?: string
          mensagem: string
          referencia?: string | null
          status: string
          tipo: string
          user_id: string
        }
        Update: {
          created_at?: string
          erro?: string | null
          id?: string
          mensagem?: string
          referencia?: string | null
          status?: string
          tipo?: string
          user_id?: string
        }
        Relationships: []
      }
      telegram_rotina_status: {
        Row: {
          alertas_processados: number
          created_at: string
          erro: string | null
          id: string
          status: string
          ultima_verificacao: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alertas_processados?: number
          created_at?: string
          erro?: string | null
          id?: string
          status?: string
          ultima_verificacao?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alertas_processados?: number
          created_at?: string
          erro?: string | null
          id?: string
          status?: string
          ultima_verificacao?: string | null
          updated_at?: string
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
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
      regime_alimentar:
        | "sem_alimentacao"
        | "cafe_da_manha"
        | "meia_pensao"
        | "pensao_completa"
        | "all_inclusive"
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
      app_role: ["admin", "user"],
      regime_alimentar: [
        "sem_alimentacao",
        "cafe_da_manha",
        "meia_pensao",
        "pensao_completa",
        "all_inclusive",
      ],
    },
  },
} as const
