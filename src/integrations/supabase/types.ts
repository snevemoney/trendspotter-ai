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
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      company_matches: {
        Row: {
          company_name: string
          created_at: string
          exchange: string | null
          id: string
          match_confidence: number | null
          reasoning: string | null
          source: string | null
          ticker: string | null
          trend_id: string
          user_id: string
        }
        Insert: {
          company_name: string
          created_at?: string
          exchange?: string | null
          id?: string
          match_confidence?: number | null
          reasoning?: string | null
          source?: string | null
          ticker?: string | null
          trend_id: string
          user_id: string
        }
        Update: {
          company_name?: string
          created_at?: string
          exchange?: string | null
          id?: string
          match_confidence?: number | null
          reasoning?: string | null
          source?: string | null
          ticker?: string | null
          trend_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_matches_trend_id_fkey"
            columns: ["trend_id"]
            isOneToOne: false
            referencedRelation: "trend_items"
            referencedColumns: ["id"]
          },
        ]
      }
      extracted_entities: {
        Row: {
          confidence: number | null
          created_at: string
          entity_text: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id: string
          user_id: string
          video_id: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          entity_text: string
          entity_type: Database["public"]["Enums"]["entity_type"]
          id?: string
          user_id: string
          video_id: string
        }
        Update: {
          confidence?: number | null
          created_at?: string
          entity_text?: string
          entity_type?: Database["public"]["Enums"]["entity_type"]
          id?: string
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extracted_entities_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      keywords: {
        Row: {
          active: boolean | null
          created_at: string
          cycles_completed: number | null
          id: string
          is_current: boolean | null
          keyword: string
          sort_order: number | null
          user_id: string
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          cycles_completed?: number | null
          id?: string
          is_current?: boolean | null
          keyword: string
          sort_order?: number | null
          user_id: string
        }
        Update: {
          active?: boolean | null
          created_at?: string
          cycles_completed?: number | null
          id?: string
          is_current?: boolean | null
          keyword?: string
          sort_order?: number | null
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          metadata: Json | null
          read: boolean
          title: string
          trend_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean
          title: string
          trend_id?: string | null
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          trend_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_trend_id_fkey"
            columns: ["trend_id"]
            isOneToOne: false
            referencedRelation: "trend_items"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          cycles_per_keyword: number | null
          id: string
          min_comments: number | null
          min_confidence_score: number | null
          min_likes: number | null
          notify_high_confidence: boolean | null
          scan_frequency_minutes: number | null
          scan_mode: Database["public"]["Enums"]["scan_mode"] | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cycles_per_keyword?: number | null
          id?: string
          min_comments?: number | null
          min_confidence_score?: number | null
          min_likes?: number | null
          notify_high_confidence?: boolean | null
          scan_frequency_minutes?: number | null
          scan_mode?: Database["public"]["Enums"]["scan_mode"] | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cycles_per_keyword?: number | null
          id?: string
          min_comments?: number | null
          min_confidence_score?: number | null
          min_likes?: number | null
          notify_high_confidence?: boolean | null
          scan_frequency_minutes?: number | null
          scan_mode?: Database["public"]["Enums"]["scan_mode"] | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scans: {
        Row: {
          completed_at: string | null
          created_at: string
          entities_extracted: number | null
          id: string
          keyword_id: string | null
          keyword_text: string
          mode: Database["public"]["Enums"]["scan_mode"] | null
          status: Database["public"]["Enums"]["scan_status"] | null
          user_id: string
          videos_found: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          entities_extracted?: number | null
          id?: string
          keyword_id?: string | null
          keyword_text: string
          mode?: Database["public"]["Enums"]["scan_mode"] | null
          status?: Database["public"]["Enums"]["scan_status"] | null
          user_id: string
          videos_found?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          entities_extracted?: number | null
          id?: string
          keyword_id?: string | null
          keyword_text?: string
          mode?: Database["public"]["Enums"]["scan_mode"] | null
          status?: Database["public"]["Enums"]["scan_status"] | null
          user_id?: string
          videos_found?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "scans_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      trend_items: {
        Row: {
          blindspot_score: number | null
          created_at: string
          entity_type: Database["public"]["Enums"]["entity_type"] | null
          first_seen: string
          id: string
          label: Database["public"]["Enums"]["trend_label"] | null
          last_seen: string
          primary_entity: string
          score: number | null
          signal_phrases: string[] | null
          status: string | null
          summary: string | null
          total_comments: number | null
          total_likes: number | null
          total_shares: number | null
          updated_at: string
          user_id: string
          video_count: number | null
        }
        Insert: {
          blindspot_score?: number | null
          created_at?: string
          entity_type?: Database["public"]["Enums"]["entity_type"] | null
          first_seen?: string
          id?: string
          label?: Database["public"]["Enums"]["trend_label"] | null
          last_seen?: string
          primary_entity: string
          score?: number | null
          signal_phrases?: string[] | null
          status?: string | null
          summary?: string | null
          total_comments?: number | null
          total_likes?: number | null
          total_shares?: number | null
          updated_at?: string
          user_id: string
          video_count?: number | null
        }
        Update: {
          blindspot_score?: number | null
          created_at?: string
          entity_type?: Database["public"]["Enums"]["entity_type"] | null
          first_seen?: string
          id?: string
          label?: Database["public"]["Enums"]["trend_label"] | null
          last_seen?: string
          primary_entity?: string
          score?: number | null
          signal_phrases?: string[] | null
          status?: string | null
          summary?: string | null
          total_comments?: number | null
          total_likes?: number | null
          total_shares?: number | null
          updated_at?: string
          user_id?: string
          video_count?: number | null
        }
        Relationships: []
      }
      trend_video_links: {
        Row: {
          created_at: string
          id: string
          trend_id: string
          video_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          trend_id: string
          video_id: string
        }
        Update: {
          created_at?: string
          id?: string
          trend_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trend_video_links_trend_id_fkey"
            columns: ["trend_id"]
            isOneToOne: false
            referencedRelation: "trend_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trend_video_links_video_id_fkey"
            columns: ["video_id"]
            isOneToOne: false
            referencedRelation: "videos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_actions: {
        Row: {
          action: Database["public"]["Enums"]["user_action_type"]
          created_at: string
          id: string
          notes: string | null
          tags: string[] | null
          trend_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action: Database["public"]["Enums"]["user_action_type"]
          created_at?: string
          id?: string
          notes?: string | null
          tags?: string[] | null
          trend_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action?: Database["public"]["Enums"]["user_action_type"]
          created_at?: string
          id?: string
          notes?: string | null
          tags?: string[] | null
          trend_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_actions_trend_id_fkey"
            columns: ["trend_id"]
            isOneToOne: false
            referencedRelation: "trend_items"
            referencedColumns: ["id"]
          },
        ]
      }
      videos: {
        Row: {
          author: string | null
          caption: string | null
          captured_at: string
          comments: number | null
          id: string
          keyword: string | null
          likes: number | null
          posted_at: string | null
          scan_id: string | null
          shares: number | null
          url: string | null
          user_id: string
          video_id: string
        }
        Insert: {
          author?: string | null
          caption?: string | null
          captured_at?: string
          comments?: number | null
          id?: string
          keyword?: string | null
          likes?: number | null
          posted_at?: string | null
          scan_id?: string | null
          shares?: number | null
          url?: string | null
          user_id: string
          video_id: string
        }
        Update: {
          author?: string | null
          caption?: string | null
          captured_at?: string
          comments?: number | null
          id?: string
          keyword?: string | null
          likes?: number | null
          posted_at?: string | null
          scan_id?: string | null
          shares?: number | null
          url?: string | null
          user_id?: string
          video_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "videos_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "scans"
            referencedColumns: ["id"]
          },
        ]
      }
      watchlist: {
        Row: {
          created_at: string
          id: string
          type: Database["public"]["Enums"]["watchlist_type"]
          user_id: string
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          type: Database["public"]["Enums"]["watchlist_type"]
          user_id: string
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["public"]["Enums"]["watchlist_type"]
          user_id?: string
          value?: string
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
      entity_type: "brand" | "product"
      scan_mode: "recent" | "popular"
      scan_status: "pending" | "running" | "completed" | "failed"
      trend_label: "low" | "medium" | "high"
      user_action_type: "saved" | "ignored" | "shortlisted" | "archived"
      watchlist_type: "brand" | "ticker"
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
      entity_type: ["brand", "product"],
      scan_mode: ["recent", "popular"],
      scan_status: ["pending", "running", "completed", "failed"],
      trend_label: ["low", "medium", "high"],
      user_action_type: ["saved", "ignored", "shortlisted", "archived"],
      watchlist_type: ["brand", "ticker"],
    },
  },
} as const
