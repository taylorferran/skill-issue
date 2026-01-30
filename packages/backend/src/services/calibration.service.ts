import { getSupabase } from '@/lib/supabase';
import { createLLMProvider } from '@/lib/llm-provider';
import { opikService } from '@/lib/opik';

interface CalibrationQuestion {
  difficulty: number;
  question: string;
  options: string[];
  correctOption: number;
  explanation: string;
}

interface CalibrationResult {
  totalAnswered: number;
  totalCorrect: number;
  accuracy: number;
  averageCorrectDifficulty: number;
  calculatedDifficultyTarget: number;
}

interface CalibrationState {
  id: string;
  user_id: string;
  skill_id: string;
  status: 'pending' | 'in_progress' | 'completed';
  questions_generated_at: string | null;
  completed_at: string | null;
  calculated_difficulty_target: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Calibration Service
 * 
 * Handles generation of calibration questions, tracking user calibration progress,
 * and calculating initial difficulty targets based on calibration performance.
 */
export class CalibrationService {
  private llmProvider = createLLMProvider();

  /**
   * Generate 10 calibration questions for a skill (one for each difficulty 1-10)
   * If questions already exist, returns existing ones
   */
  async generateCalibrationQuestions(skillId: string): Promise<{
    questions: CalibrationQuestion[];
    status: 'generated' | 'already_exists';
  }> {
    const supabase = getSupabase();

    // Check if questions already exist
    const { data: existingQuestions } = await supabase
      .from('calibration_questions')
      .select('*')
      .eq('skill_id', skillId)
      .order('difficulty');

    if (existingQuestions && existingQuestions.length === 10) {
      return {
        questions: (existingQuestions as any[]).map(q => ({
          difficulty: q.difficulty,
          question: q.question,
          options: Array.isArray(q.options_json) ? q.options_json : [],
          correctOption: q.correct_option,
          explanation: q.explanation || '',
        })),
        status: 'already_exists',
      };
    }

    // Get skill details
    const { data: skill } = await supabase
      .from('skills')
      .select('*')
      .eq('id', skillId)
      .single();

    if (!skill) {
      throw new Error(`Skill not found: ${skillId}`);
    }

    const skillData = skill as any;

    // Generate questions for each difficulty level
    const questions: CalibrationQuestion[] = [];

    for (let difficulty = 1; difficulty <= 10; difficulty++) {
      try {
        const result = await this.llmProvider.generateChallenge({
          skillId,
          skillName: skillData.name,
          skillDescription: skillData.description,
          difficulty,
        });

        const challenge = result.challenge;

        questions.push({
          difficulty,
          question: challenge.question,
          options: challenge.options,
          correctOption: challenge.correctAnswerIndex,
          explanation: challenge.explanation,
        });

        // Store in calibration_questions table
        const questionData = {
          skill_id: skillId,
          difficulty,
          question: challenge.question,
          options_json: challenge.options,
          correct_option: challenge.correctAnswerIndex,
          explanation: challenge.explanation,
        };

        await supabase
          .from('calibration_questions')
          // @ts-expect-error - Supabase type inference issue
          .upsert(questionData, { onConflict: 'skill_id,difficulty' });

      } catch (error) {
        console.error(`Failed to generate question for difficulty ${difficulty}:`, error);
        // Continue with other difficulties
      }
    }

    // Track in Opik
    await opikService.trackAgentExecution({
      agentName: 'calibration_question_generation',
      input: { skillId, skillName: skillData.name },
      output: { questionsGenerated: questions.length },
      durationMs: 0,
      success: questions.length === 10,
    });

    return {
      questions,
      status: 'generated',
    };
  }

  /**
   * Get or create calibration state for a user-skill pair
   */
  async getOrCreateCalibrationState(userId: string, skillId: string): Promise<CalibrationState> {
    const supabase = getSupabase();

    // Try to get existing state
    const { data: existing } = await supabase
      .from('user_calibration_state')
      .select('*')
      .eq('user_id', userId)
      .eq('skill_id', skillId)
      .single();

    if (existing) {
      return existing as CalibrationState;
    }

    // Create new state
    const stateData = {
      user_id: userId,
      skill_id: skillId,
      status: 'pending',
    };

    const { data: newState, error } = await supabase
      .from('user_calibration_state')
      // @ts-expect-error - Supabase type inference issue
      .insert(stateData)
      .select()
      .single();

    if (error || !newState) {
      throw new Error(`Failed to create calibration state: ${error?.message}`);
    }

    return newState as CalibrationState;
  }

  /**
   * Start calibration for a user
   * Returns calibration questions and updates state
   */
  async startCalibration(userId: string, skillId: string): Promise<{
    questions: Array<{ difficulty: number; question: string; options: string[] }>;
    status: 'ready' | 'generating' | 'completed';
  }> {
    const supabase = getSupabase();

    // Get or create calibration state
    const state = await this.getOrCreateCalibrationState(userId, skillId);

    // If already completed, return empty
    if (state.status === 'completed') {
      return { questions: [], status: 'completed' };
    }

    // Check if questions exist
    const { data: existingQuestions } = await supabase
      .from('calibration_questions')
      .select('*')
      .eq('skill_id', skillId)
      .order('difficulty');

    // If questions don't exist yet, return generating status
    if (!existingQuestions || existingQuestions.length < 10) {
      return { questions: [], status: 'generating' };
    }

    // Update state to in_progress
    await supabase
      .from('user_calibration_state')
      // @ts-expect-error - Supabase type inference issue
      .update({
        status: 'in_progress',
        questions_generated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('skill_id', skillId);

    // Return questions without correct answers
    const questions = (existingQuestions as any[]).map(q => ({
      difficulty: q.difficulty,
      question: q.question,
      options: Array.isArray(q.options_json) ? q.options_json : [],
    }));

    return { questions, status: 'ready' };
  }

  /**
   * Submit a calibration answer
   */
  async submitCalibrationAnswer(
    userId: string,
    skillId: string,
    difficulty: number,
    selectedOption: number
  ): Promise<{
    isCorrect: boolean;
    correctOption: number;
    explanation: string | null;
    progress: { answered: number; total: number };
  }> {
    const supabase = getSupabase();

    // Get the calibration question
    const { data: question } = await supabase
      .from('calibration_questions')
      .select('*')
      .eq('skill_id', skillId)
      .eq('difficulty', difficulty)
      .single();

    if (!question) {
      throw new Error(`Calibration question not found for difficulty ${difficulty}`);
    }

    const questionData = question as any;

    // Check if already answered
    const { data: existingAnswer } = await supabase
      .from('user_calibration_answers')
      .select('id')
      .eq('user_id', userId)
      .eq('skill_id', skillId)
      .eq('difficulty', difficulty)
      .single();

    if (existingAnswer) {
      throw new Error(`Already answered question for difficulty ${difficulty}`);
    }

    const isCorrect = selectedOption === questionData.correct_option;

    // Store the answer
    const answerData = {
      user_id: userId,
      skill_id: skillId,
      difficulty,
      question: questionData.question,
      options_json: questionData.options_json,
      selected_option: selectedOption,
      correct_option: questionData.correct_option,
      is_correct: isCorrect,
      explanation: questionData.explanation,
    };

    await supabase
      .from('user_calibration_answers')
      // @ts-expect-error - Supabase type inference issue
      .insert(answerData);

    // Get progress
    const { data: answeredQuestions } = await supabase
      .from('user_calibration_answers')
      .select('id')
      .eq('user_id', userId)
      .eq('skill_id', skillId);

    const progress = {
      answered: answeredQuestions?.length || 0,
      total: 10,
    };

    return {
      isCorrect,
      correctOption: questionData.correct_option,
      explanation: questionData.explanation,
      progress,
    };
  }

  /**
   * Complete calibration and calculate difficulty target
   */
  async completeCalibration(userId: string, skillId: string): Promise<CalibrationResult> {
    const supabase = getSupabase();

    // Get all answers
    const { data: answers } = await supabase
      .from('user_calibration_answers')
      .select('*')
      .eq('user_id', userId)
      .eq('skill_id', skillId)
      .order('difficulty');

    if (!answers || answers.length === 0) {
      throw new Error('No calibration answers found');
    }

    const answersData = answers as any[];

    // Calculate metrics
    const totalAnswered = answersData.length;
    const totalCorrect = answersData.filter(a => a.is_correct).length;
    const accuracy = totalCorrect / totalAnswered;

    // Calculate average difficulty of correct answers
    const correctAnswers = answersData.filter(a => a.is_correct);
    const averageCorrectDifficulty = correctAnswers.length > 0
      ? correctAnswers.reduce((sum, a) => sum + a.difficulty, 0) / correctAnswers.length
      : 1;

    // Calculate difficulty target based on performance
    // Formula: Start at the average difficulty they got right, adjusted by overall accuracy
    // If they got 100% right, add 1 to challenge them
    // If they got <50% right, subtract 1 to make it easier
    let calculatedDifficultyTarget = Math.round(averageCorrectDifficulty);
    
    if (accuracy >= 0.9) {
      calculatedDifficultyTarget = Math.min(calculatedDifficultyTarget + 1, 10);
    } else if (accuracy < 0.5) {
      calculatedDifficultyTarget = Math.max(calculatedDifficultyTarget - 1, 1);
    }

    // Update user skill state with calculated difficulty
    await supabase
      .from('user_skill_state')
      // @ts-expect-error - Supabase type inference issue
      .update({
        difficulty_target: calculatedDifficultyTarget,
      })
      .eq('user_id', userId)
      .eq('skill_id', skillId);

    // Update calibration state
    await supabase
      .from('user_calibration_state')
      // @ts-expect-error - Supabase type inference issue
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        calculated_difficulty_target: calculatedDifficultyTarget,
      })
      .eq('user_id', userId)
      .eq('skill_id', skillId);

    // Track in Opik
    await opikService.trackAgentExecution({
      agentName: 'calibration_completion',
      input: { userId, skillId, totalAnswered },
      output: {
        totalCorrect,
        accuracy,
        averageCorrectDifficulty,
        calculatedDifficultyTarget,
      },
      durationMs: 0,
      success: true,
    });

    return {
      totalAnswered,
      totalCorrect,
      accuracy,
      averageCorrectDifficulty,
      calculatedDifficultyTarget,
    };
  }

  /**
   * Check if user needs calibration for a skill
   */
  async needsCalibration(userId: string, skillId: string): Promise<boolean> {
    const supabase = getSupabase();

    // Get user skill state
    const { data: skillState } = await supabase
      .from('user_skill_state')
      .select('difficulty_target')
      .eq('user_id', userId)
      .eq('skill_id', skillId)
      .single();

    const skillStateData = skillState as any;

    // If difficulty_target is 0, they need calibration
    if (skillStateData && skillStateData.difficulty_target === 0) {
      return true;
    }

    // Check calibration state
    const { data: calibrationState } = await supabase
      .from('user_calibration_state')
      .select('status')
      .eq('user_id', userId)
      .eq('skill_id', skillId)
      .single();

    const calibrationStateData = calibrationState as any;

    // If no calibration state or not completed, they need calibration
    if (!calibrationStateData || calibrationStateData.status !== 'completed') {
      return true;
    }

    return false;
  }
}

// Export singleton instance
export const calibrationService = new CalibrationService();
