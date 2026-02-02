/**
 * Question Pool Service
 * Typed wrappers for question pool RPC functions
 */

import { getSupabase } from '@/lib/supabase';

/**
 * Result type for available pool questions
 */
export interface PoolQuestion {
  pool_question_id: string;
  question: string;
  options_json: string[];
  correct_option: number;
  explanation: string | null;
  avg_rating: number | null;
  times_used: number;
}

/**
 * Find available questions from the pool for a user
 * Returns questions that match criteria and user hasn't answered
 */
export async function findAvailablePoolQuestions(
  userId: string,
  skillId: string,
  difficulty: number,
  minRating: number = 2.0,
  limit: number = 5
): Promise<{ data: PoolQuestion[] | null; error: any }> {
  const supabase = getSupabase();

  try {
    // @ts-expect-error - Supabase RPC type inference issue with custom functions
    const result = await supabase.rpc('find_available_pool_questions', {
      p_user_id: userId,
      p_skill_id: skillId,
      p_difficulty: difficulty,
      p_min_rating: minRating,
      p_limit: limit,
    });

    return result;
  } catch (error) {
    console.error('[QuestionPool] Error calling find_available_pool_questions:', error);
    return { data: null, error };
  }
}

/**
 * Update question pool rating after user feedback
 */
export async function updateQuestionPoolRating(
  questionPoolId: string,
  rating: number
): Promise<{ error: any }> {
  const supabase = getSupabase();

  if (rating < 1 || rating > 5) {
    return { error: new Error('Rating must be between 1 and 5') };
  }

  try {
    // @ts-expect-error - Supabase RPC type inference issue with custom functions
    const result = await supabase.rpc('update_question_pool_rating', {
      p_question_pool_id: questionPoolId,
      p_rating: rating,
    });

    return { error: result.error };
  } catch (error) {
    console.error('[QuestionPool] Error calling update_question_pool_rating:', error);
    return { error };
  }
}
