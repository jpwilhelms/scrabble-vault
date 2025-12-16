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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      accepted_words: {
        Row: {
          accepted_in_game_id: string | null
          created_at: string
          id: string
          player1_id: string
          player2_id: string
          word: string
        }
        Insert: {
          accepted_in_game_id?: string | null
          created_at?: string
          id?: string
          player1_id: string
          player2_id: string
          word: string
        }
        Update: {
          accepted_in_game_id?: string | null
          created_at?: string
          id?: string
          player1_id?: string
          player2_id?: string
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "accepted_words_accepted_in_game_id_fkey"
            columns: ["accepted_in_game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accepted_words_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accepted_words_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_invitations: {
        Row: {
          created_at: string
          game_id: string
          id: string
          message: string | null
          recipient_id: string
          responded_at: string | null
          sender_id: string
          status: Database["public"]["Enums"]["invitation_status"]
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          message?: string | null
          recipient_id: string
          responded_at?: string | null
          sender_id: string
          status?: Database["public"]["Enums"]["invitation_status"]
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          message?: string | null
          recipient_id?: string
          responded_at?: string | null
          sender_id?: string
          status?: Database["public"]["Enums"]["invitation_status"]
        }
        Relationships: [
          {
            foreignKeyName: "game_invitations_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_invitations_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_invitations_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_turns: {
        Row: {
          created_at: string
          game_id: string
          id: string
          is_bingo: boolean
          player_id: string
          rejection_comment: string | null
          score: number
          status: Database["public"]["Enums"]["turn_status"]
          tiles_placed: Json
          turn_number: number
          validated_at: string | null
          words_formed: Json
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          is_bingo?: boolean
          player_id: string
          rejection_comment?: string | null
          score?: number
          status?: Database["public"]["Enums"]["turn_status"]
          tiles_placed?: Json
          turn_number: number
          validated_at?: string | null
          words_formed?: Json
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          is_bingo?: boolean
          player_id?: string
          rejection_comment?: string | null
          score?: number
          status?: Database["public"]["Enums"]["turn_status"]
          tiles_placed?: Json
          turn_number?: number
          validated_at?: string | null
          words_formed?: Json
        }
        Relationships: [
          {
            foreignKeyName: "game_turns_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_turns_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          board_state: Json
          created_at: string
          current_turn_player_id: string | null
          id: string
          is_solo: boolean
          player1_id: string
          player1_rack: Json
          player1_score: number
          player2_id: string | null
          player2_rack: Json
          player2_score: number
          status: Database["public"]["Enums"]["game_status"]
          tile_bag: Json
          updated_at: string
          winner_id: string | null
        }
        Insert: {
          board_state?: Json
          created_at?: string
          current_turn_player_id?: string | null
          id?: string
          is_solo?: boolean
          player1_id: string
          player1_rack?: Json
          player1_score?: number
          player2_id?: string | null
          player2_rack?: Json
          player2_score?: number
          status?: Database["public"]["Enums"]["game_status"]
          tile_bag?: Json
          updated_at?: string
          winner_id?: string | null
        }
        Update: {
          board_state?: Json
          created_at?: string
          current_turn_player_id?: string | null
          id?: string
          is_solo?: boolean
          player1_id?: string
          player1_rack?: Json
          player1_score?: number
          player2_id?: string | null
          player2_rack?: Json
          player2_score?: number
          status?: Database["public"]["Enums"]["game_status"]
          tile_bag?: Json
          updated_at?: string
          winner_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "games_current_turn_player_id_fkey"
            columns: ["current_turn_player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_player1_id_fkey"
            columns: ["player1_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_player2_id_fkey"
            columns: ["player2_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "games_winner_id_fkey"
            columns: ["winner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      played_words: {
        Row: {
          created_at: string | null
          direction: string
          id: string
          points: number
          position_x: number
          position_y: number
          word: string
        }
        Insert: {
          created_at?: string | null
          direction: string
          id?: string
          points: number
          position_x: number
          position_y: number
          word: string
        }
        Update: {
          created_at?: string | null
          direction?: string
          id?: string
          points?: number
          position_x?: number
          position_y?: number
          word?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          username?: string | null
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
      game_status: "pending" | "active" | "finished" | "abandoned"
      invitation_status: "pending" | "accepted" | "declined" | "expired"
      turn_status: "pending_validation" | "accepted" | "rejected"
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
      game_status: ["pending", "active", "finished", "abandoned"],
      invitation_status: ["pending", "accepted", "declined", "expired"],
      turn_status: ["pending_validation", "accepted", "rejected"],
    },
  },
} as const
