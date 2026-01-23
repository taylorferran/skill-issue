/**
 * Database types generated from Supabase schema
 * Matches supabase-schema.sql
 */

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          device_id: string | null;
          timezone: string;
          quiet_hours_start: number | null;
          quiet_hours_end: number | null;
          max_challenges_per_day: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          device_id?: string | null;
          timezone?: string;
          quiet_hours_start?: number | null;
          quiet_hours_end?: number | null;
          max_challenges_per_day?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          device_id?: string | null;
          timezone?: string;
          quiet_hours_start?: number | null;
          quiet_hours_end?: number | null;
          max_challenges_per_day?: number;
          created_at?: string;
        };
      };
      skills: {
        Row: {
          id: string;
          name: string;
          description: string;
          difficulty_spec: any; // JSONB
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          difficulty_spec?: any;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          difficulty_spec?: any;
          active?: boolean;
          created_at?: string;
        };
      };
      user_skill_state: {
        Row: {
          id: string;
          user_id: string;
          skill_id: string;
          difficulty_target: number;
          streak_correct: number;
          streak_incorrect: number;
          attempts_total: number;
          correct_total: number;
          last_challenged_at: string | null;
          last_result: 'correct' | 'incorrect' | 'ignored' | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          skill_id: string;
          difficulty_target?: number;
          streak_correct?: number;
          streak_incorrect?: number;
          attempts_total?: number;
          correct_total?: number;
          last_challenged_at?: string | null;
          last_result?: 'correct' | 'incorrect' | 'ignored' | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          skill_id?: string;
          difficulty_target?: number;
          streak_correct?: number;
          streak_incorrect?: number;
          attempts_total?: number;
          correct_total?: number;
          last_challenged_at?: string | null;
          last_result?: 'correct' | 'incorrect' | 'ignored' | null;
          updated_at?: string;
        };
      };
      challenges: {
        Row: {
          id: string;
          user_id: string;
          skill_id: string;
          difficulty: number;
          llm: string;
          prompt_version: string;
          question: string;
          options_json: any; // JSONB (array of 4 strings)
          correct_option: number;
          explanation: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          skill_id: string;
          difficulty: number;
          llm?: string;
          prompt_version?: string;
          question: string;
          options_json: any;
          correct_option: number;
          explanation?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          skill_id?: string;
          difficulty?: number;
          llm?: string;
          prompt_version?: string;
          question?: string;
          options_json?: any;
          correct_option?: number;
          explanation?: string | null;
          created_at?: string;
        };
      };
      push_events: {
        Row: {
          id: string;
          challenge_id: string;
          sent_at: string;
          delivered_at: string | null;
          opened_at: string | null;
          status: 'sent' | 'delivered' | 'failed' | 'opened';
          provider_message_id: string | null;
        };
        Insert: {
          id?: string;
          challenge_id: string;
          sent_at?: string;
          delivered_at?: string | null;
          opened_at?: string | null;
          status?: 'sent' | 'delivered' | 'failed' | 'opened';
          provider_message_id?: string | null;
        };
        Update: {
          id?: string;
          challenge_id?: string;
          sent_at?: string;
          delivered_at?: string | null;
          opened_at?: string | null;
          status?: 'sent' | 'delivered' | 'failed' | 'opened';
          provider_message_id?: string | null;
        };
      };
      answers: {
        Row: {
          id: string;
          challenge_id: string;
          user_id: string;
          selected_option: number;
          is_correct: boolean;
          response_time: number | null;
          confidence: number | null;
          user_feedback: string | null;
          answered_at: string;
        };
        Insert: {
          id?: string;
          challenge_id: string;
          user_id: string;
          selected_option: number;
          is_correct: boolean;
          response_time?: number | null;
          confidence?: number | null;
          user_feedback?: string | null;
          answered_at?: string;
        };
        Update: {
          id?: string;
          challenge_id?: string;
          user_id?: string;
          selected_option?: number;
          is_correct?: boolean;
          response_time?: number | null;
          confidence?: number | null;
          user_feedback?: string | null;
          answered_at?: string;
        };
      };
      scheduling_log: {
        Row: {
          id: string;
          user_id: string;
          skill_id: string;
          decision: boolean;
          reason: string;
          difficulty_target: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          skill_id: string;
          decision: boolean;
          reason: string;
          difficulty_target: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          skill_id?: string;
          decision?: boolean;
          reason?: string;
          difficulty_target?: number;
          created_at?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
