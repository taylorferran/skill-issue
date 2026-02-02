/**
 * Database types generated from Supabase schema
 * Matches supabase-schema.sql
 */

export interface Database {
  public: {
    Functions: {
      find_available_pool_questions: {
        Args: {
          p_user_id: string;
          p_skill_id: string;
          p_difficulty: number;
          p_min_rating?: number;
          p_limit?: number;
        };
        Returns: {
          pool_question_id: string;
          question: string;
          options_json: any;
          correct_option: number;
          explanation: string | null;
          avg_rating: number | null;
          times_used: number;
        }[];
      };
      update_question_pool_rating: {
        Args: {
          p_question_pool_id: string;
          p_rating: number;
        };
        Returns: void;
      };
    };
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
      calibration_questions: {
        Row: {
          id: string;
          skill_id: string;
          difficulty: number;
          question: string;
          options_json: any;
          correct_option: number;
          explanation: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          skill_id: string;
          difficulty: number;
          question: string;
          options_json: any;
          correct_option: number;
          explanation?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          skill_id?: string;
          difficulty?: number;
          question?: string;
          options_json?: any;
          correct_option?: number;
          explanation?: string | null;
          created_at?: string;
        };
      };
      user_calibration_state: {
        Row: {
          id: string;
          user_id: string;
          skill_id: string;
          status: 'pending' | 'in_progress' | 'completed';
          questions_generated_at: string | null;
          completed_at: string | null;
          calculated_difficulty_target: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          skill_id: string;
          status?: 'pending' | 'in_progress' | 'completed';
          questions_generated_at?: string | null;
          completed_at?: string | null;
          calculated_difficulty_target?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          skill_id?: string;
          status?: 'pending' | 'in_progress' | 'completed';
          questions_generated_at?: string | null;
          completed_at?: string | null;
          calculated_difficulty_target?: number | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      user_calibration_answers: {
        Row: {
          id: string;
          user_id: string;
          skill_id: string;
          difficulty: number;
          question: string;
          options_json: any;
          selected_option: number;
          correct_option: number;
          is_correct: boolean;
          explanation: string | null;
          answered_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          skill_id: string;
          difficulty: number;
          question: string;
          options_json: any;
          selected_option: number;
          correct_option: number;
          is_correct: boolean;
          explanation?: string | null;
          answered_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          skill_id?: string;
          difficulty?: number;
          question?: string;
          options_json?: any;
          selected_option?: number;
          correct_option?: number;
          is_correct?: boolean;
          explanation?: string | null;
          answered_at?: string;
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
          question_hash: string | null;
          question_pool_id: string | null;
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
          question_hash?: string | null;
          question_pool_id?: string | null;
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
          question_hash?: string | null;
          question_pool_id?: string | null;
          options_json?: any;
          correct_option?: number;
          explanation?: string | null;
          created_at?: string;
        };
      };
      question_pool: {
        Row: {
          id: string;
          skill_id: string;
          difficulty: number;
          question: string;
          question_hash: string;
          options_json: any; // JSONB (array of 4 strings)
          correct_option: number;
          explanation: string | null;
          llm: string;
          prompt_version: string;
          times_used: number;
          total_ratings: number;
          sum_ratings: number;
          avg_rating: number | null; // Computed column
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          skill_id: string;
          difficulty: number;
          question: string;
          question_hash: string;
          options_json: any;
          correct_option: number;
          explanation?: string | null;
          llm?: string;
          prompt_version?: string;
          times_used?: number;
          total_ratings?: number;
          sum_ratings?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          skill_id?: string;
          difficulty?: number;
          question?: string;
          question_hash?: string;
          options_json?: any;
          correct_option?: number;
          explanation?: string | null;
          llm?: string;
          prompt_version?: string;
          times_used?: number;
          total_ratings?: number;
          sum_ratings?: number;
          active?: boolean;
          created_at?: string;
          updated_at?: string;
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
    Enums: Record<string, never>;
  };
}
