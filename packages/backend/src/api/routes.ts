import express, { Request, Response } from 'express';
import { getSupabase } from '@/lib/supabase';
import { skillStateAgent } from '@/agents/agent3-skill-state';
import { schedulerService } from '@/services/scheduler.service';
import { opikService } from '@/lib/opik';
import { apiKeyAuth } from '@/middleware/auth';
import type { Database } from '@/types/database';
import { AnswerChallengeRequestSchema, CreateUserRequestSchema, EnrollSkillRequestSchema, UpdateUserRequestSchema, UpdateUserSkillRequestSchema } from '@shared/schemas';
const router = express.Router();

// Log all incoming requests for debugging
router.use((req, _res, next) => {
  console.log(`[API] ${req.method} ${req.path}`);
  next();
});

/**
 * GET /api/health
 * Health check endpoint (no auth required)
 */
router.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Apply API key authentication to all other routes
// Can be disabled by setting API_AUTH_ENABLED=false
router.use(apiKeyAuth);

// Type aliases for database rows
type Challenge = Database['public']['Tables']['challenges']['Row'];
type AnswerInsert = Database['public']['Tables']['answers']['Insert'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];
type UserSkillStateInsert = Database['public']['Tables']['user_skill_state']['Insert'];
type UserSkillStateUpdate = Database['public']['Tables']['user_skill_state']['Update'];

/**
 * POST /api/answer
 * Submit an answer to a challenge
 */
router.post('/answer', async (req: Request, res: Response) => {
  let traceId: string | undefined;
  try {
    const validation = AnswerChallengeRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validation.error.errors,
      });
    }

    const body = validation.data;
    const supabase = getSupabase();

    // Create a single root trace for the entire answer submission flow
    // Tags will be added after we load the challenge
    traceId = await opikService.startTrace({
      name: 'answer_submission',
      input: { challengeId: body.challengeId, userId: body.userId },
      tags: [`challenge:${body.challengeId}`], // Add challenge tag immediately
    });

    // Load challenge to check correct answer
    const lookupStart = Date.now();
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', body.challengeId)
      .single<Challenge>();

    if (challengeError || !challenge) {
      await opikService.createSpan({
        traceId,
        name: 'load_challenge',
        type: 'general',
        input: { challengeId: body.challengeId },
        output: { found: false },
        durationMs: Date.now() - lookupStart,
      });
      await opikService.endTrace({ traceId, error: new Error('Challenge not found') });
      return res.status(404).json({ error: 'Challenge not found' });
    }

    // Check if already answered
    const { data: existingAnswer } = await supabase
      .from('answers')
      .select('id')
      .eq('challenge_id', body.challengeId)
      .eq('user_id', body.userId)
      .single();

    await opikService.createSpan({
      traceId,
      name: 'load_challenge',
      type: 'general',
      input: { challengeId: body.challengeId },
      output: { found: true, alreadyAnswered: !!existingAnswer },
      durationMs: Date.now() - lookupStart,
    });

    if (existingAnswer) {
      await opikService.endTrace({ traceId, error: new Error('Challenge already answered') });
      return res.status(400).json({ error: 'Challenge already answered' });
    }

    // Determine if correct
    const isCorrect = body.selectedOption === challenge.correct_option;

    // Store answer in answers table
    const storeStartTime = Date.now();
    const answerData: AnswerInsert = {
      challenge_id: body.challengeId,
      user_id: body.userId,
      selected_option: body.selectedOption,
      is_correct: isCorrect,
      response_time: body.responseTime || null,
      confidence: body.confidence || null,
      user_feedback: body.userFeedback || null,
    };

    const { error: insertError } = await supabase
      .from('answers')
      // @ts-expect-error - Supabase type inference issue
      .insert(answerData);

    if (insertError) {
      console.error('Failed to store answer:', insertError);
      await opikService.endTrace({ traceId, error: new Error('Failed to store answer') });
      return res.status(500).json({ error: 'Failed to store answer' });
    }

    // Create span for the DB write
    await opikService.createSpan({
      traceId,
      name: 'store_answer',
      type: 'general',
      input: { challengeId: body.challengeId },
      output: { isCorrect },
      durationMs: Date.now() - storeStartTime,
    });

    // Track metrics with Opik — creates a span under the root trace
    await opikService.trackChallengeMetrics({
      challengeId: challenge.id,
      userId: body.userId,
      skillId: challenge.skill_id,
      difficulty: challenge.difficulty,
      isCorrect,
      responseTimeMs: body.responseTime || 30000,
      userConfidence: body.confidence,
      traceId,
    });

    // Add feedback scores for richer evaluation data
    // Response time score: 1.0 if fast, decays for slow responses
    // Expected time: 10s at difficulty 1, scaling to 60s at difficulty 10
    const expectedTimeMs = (10 + (challenge.difficulty - 1) * 5.5) * 1000;
    const responseTimeMs = body.responseTime || 30000;
    const rtRatio = responseTimeMs / expectedTimeMs;
    const responseTimeScore = rtRatio <= 1 ? 1.0 : Math.max(0, 1 - (rtRatio - 1) * 0.5);

    await opikService.addFeedbackScore({
      traceId,
      name: 'response_time',
      value: Math.round(responseTimeScore * 100) / 100,
      source: 'sdk',
      reason: `${responseTimeMs}ms vs ${expectedTimeMs}ms expected (difficulty ${challenge.difficulty})`,
    });

    // Confidence calibration: did user's confidence match their result?
    // High confidence + correct = well calibrated (1.0)
    // High confidence + wrong = overconfident (0.0)
    // Low confidence + wrong = well calibrated (1.0)
    // Low confidence + correct = underconfident (0.5)
    if (body.confidence) {
      const isHighConfidence = body.confidence >= 4;
      let calibrationScore: number;
      let calibrationReason: string;

      if (isHighConfidence && isCorrect) {
        calibrationScore = 1.0;
        calibrationReason = 'High confidence, correct answer - well calibrated';
      } else if (isHighConfidence && !isCorrect) {
        calibrationScore = 0.0;
        calibrationReason = 'High confidence, wrong answer - overconfident (possible misconception)';
      } else if (!isHighConfidence && !isCorrect) {
        calibrationScore = 1.0;
        calibrationReason = 'Low confidence, wrong answer - well calibrated';
      } else {
        calibrationScore = 0.5;
        calibrationReason = 'Low confidence, correct answer - underconfident or lucky guess';
      }

      await opikService.addFeedbackScore({
        traceId,
        name: 'confidence_calibration',
        value: calibrationScore,
        source: 'sdk',
        reason: `Confidence ${body.confidence}/5: ${calibrationReason}`,
      });
    }

    // Difficulty calibration: is the user at an appropriate difficulty level?
    // Calculate accuracy INCLUDING this answer (fixes stale data bug)
    const { data: skillState } = await supabase
      .from('user_skill_state')
      .select('attempts_total, correct_total')
      .eq('user_id', body.userId)
      .eq('skill_id', challenge.skill_id)
      .single();

    if (skillState) {
      const s = skillState as any;
      // Include current answer in the calculation
      const newAttempts = (s.attempts_total || 0) + 1;
      const newCorrect = (s.correct_total || 0) + (isCorrect ? 1 : 0);
      const accuracy = newCorrect / newAttempts;

      // Sweet spot is 50-80% accuracy — means difficulty is well-matched
      const inSweetSpot = accuracy >= 0.5 && accuracy <= 0.8;
      let diffScore: number;
      let diffReason: string;

      if (inSweetSpot) {
        diffScore = 1.0;
        diffReason = 'Accuracy in sweet spot (50-80%) - difficulty well matched';
      } else if (accuracy > 0.8) {
        diffScore = Math.max(0, 1 - (accuracy - 0.8) * 5);
        diffReason = 'Accuracy too high - consider increasing difficulty';
      } else {
        diffScore = Math.max(0, accuracy * 2);
        diffReason = 'Accuracy too low - consider decreasing difficulty';
      }

      await opikService.addFeedbackScore({
        traceId,
        name: 'difficulty_match',
        value: Math.round(diffScore * 100) / 100,
        source: 'sdk',
        reason: `User accuracy ${(accuracy * 100).toFixed(0)}% (${newCorrect}/${newAttempts}) at difficulty ${challenge.difficulty}: ${diffReason}`,
      });
    }

    // Update user skill state via Agent 3 — creates a span under the root trace
    await skillStateAgent.updateSkillState({
      userId: body.userId,
      skillId: challenge.skill_id,
      isCorrect,
      responseTimeMs: body.responseTime || 30000,
      difficulty: challenge.difficulty,
    }, traceId);

    // End the root trace with linking metadata
    await opikService.endTrace({
      traceId,
      output: {
        isCorrect,
        correctOption: challenge.correct_option,
        // Linking metadata for analysis
        challengeId: challenge.id,
        skillId: challenge.skill_id,
        difficulty: challenge.difficulty,
      },
    });

    // Return result
    res.json({
      isCorrect,
      correctOption: challenge.correct_option,
      explanation: challenge.explanation,
    });
  } catch (error) {
    console.error('Answer error:', error);
    if (traceId) {
      await opikService.endTrace({ traceId, error: error as Error });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/challenges/:challengeId
 * Get a specific challenge (without correct answer)
 */
router.get('/challenges/:challengeId', async (req: Request, res: Response) => {
  try {
    const { challengeId } = req.params;
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from('challenges')
      .select(`
        id,
        user_id,
        skill_id,
        difficulty,
        question,
        options_json,
        created_at,
        skills!inner(name)
      `)
      .eq('id', challengeId)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Challenge not found' });
    }

    const challenge = data as any;

    res.json({
      id: challenge.id,
      userId: challenge.user_id,
      skillId: challenge.skill_id,
      skillName: challenge.skills?.name,
      difficulty: challenge.difficulty,
      question: challenge.question,
      options: challenge.options_json,
      createdAt: challenge.created_at,
    });
  } catch (error) {
    console.error('Get challenge error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/users/:userId/skills
 * Get user's skill states
 */
router.get('/users/:userId/skills', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const supabase = getSupabase();

    const { data: userSkills, error } = await supabase
      .from('user_skill_state')
      .select(`
        *,
        skills!inner(id, name, description)
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Get user skills error:', error);
      return res.status(500).json({ error: 'Failed to load user skills' });
    }

    const formatted = (userSkills || []).map((us: any) => ({
      skillId: us.skill_id,
      skillName: us.skills.name,
      skillDescription: us.skills.description,
      difficultyTarget: us.difficulty_target,
      attemptsTotal: us.attempts_total,
      correctTotal: us.correct_total,
      accuracy: us.attempts_total > 0 ? us.correct_total / us.attempts_total : 0,
      streakCorrect: us.streak_correct,
      streakIncorrect: us.streak_incorrect,
      lastChallengedAt: us.last_challenged_at,
      lastResult: us.last_result,
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get user skills error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/users/:userId/challenges/history
 * Get users challenge history with answers
 */
router.get('/users/:userId/challenges/history', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const supabase = getSupabase();

    const { data: answers, error } = await supabase
      .from('answers')
      .select(`
        *,
        challenges!inner(
          id,
          skill_id,
          difficulty,
          question,
          options_json,
          correct_option,
          explanation,
          created_at,
          skills!inner(name)
        )
      `)
      .eq('user_id', userId)
      .order('answered_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Get challenge history error:', error);
      return res.status(500).json({ error: 'Failed to load history' });
    }

    const formatted = (answers || []).map((answer: any) => ({
      answerId: answer.id,
      challengeId: answer.challenge_id,
      skillId: answer.challenges.skill_id,
      skillName: answer.challenges.skills.name,
      difficulty: answer.challenges.difficulty,
      question: answer.challenges.question,
      options: answer.challenges.options_json,
      selectedOption: answer.selected_option,
      correctOption: answer.challenges.correct_option,
      isCorrect: answer.is_correct,
      explanation: answer.challenges.explanation,
      responseTime: answer.response_time,
      confidence: answer.confidence,
      answeredAt: answer.answered_at,
      createdAt: answer.challenges.created_at,
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get challenge history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/users/:userId/challenges/pending
 * Get unanswered challenges for a user
 */
router.get('/users/:userId/challenges/pending', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const supabase = getSupabase();

    // Get all challenges for this user
    const { data: challenges, error: challengesError } = await supabase
      .from('challenges')
      .select(`
        id,
        skill_id,
        difficulty,
        question,
        options_json,
        created_at,
        skills!inner(name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (challengesError) {
      console.error('Get challenges error:', challengesError);
      return res.status(500).json({ error: 'Failed to load challenges' });
    }

    if (!challenges || challenges.length === 0) {
      return res.json([]);
    }

    // Get all answers for these challenges
    const challengeIds = challenges.map((c: any) => c.id);
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('challenge_id')
      .in('challenge_id', challengeIds);

    if (answersError) {
      console.error('Get answers error:', answersError);
      return res.status(500).json({ error: 'Failed to load answers' });
    }

    // Filter out answered challenges
    const answeredIds = new Set((answers || []).map((a: any) => a.challenge_id));
    const unansweredChallenges = challenges.filter((c: any) => !answeredIds.has(c.id));

    // Format response
    const formatted = unansweredChallenges.map((challenge: any) => ({
      challengeId: challenge.id,
      skillId: challenge.skill_id,
      skillName: challenge.skills.name,
      difficulty: challenge.difficulty,
      question: challenge.question,
      options: challenge.options_json,
      createdAt: challenge.created_at,
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Get pending challenges error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/skills
 * Get all available skills
 */
router.get('/skills', async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabase();

    const { data: skills, error } = await supabase
      .from('skills')
      .select('id, name, description, active')
      .eq('active', true)
      .order('name');

    if (error) {
      console.error('Get skills error:', error);
      return res.status(500).json({ error: 'Failed to load skills' });
    }

    res.json(skills || []);
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/users
 * Create a new user
 */
router.post('/users', async (req: Request, res: Response) => {
  console.log('[POST /users] Route handler called');
  console.log('[POST /users] Request body:', JSON.stringify(req.body));
  try {
    const validation = CreateUserRequestSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validation.error.errors,
      });
    }

    const body = validation.data;
    const supabase = getSupabase();

    const userData: UserInsert = {
      id: body.id,
      device_id: body.deviceId,
      timezone: body.timezone,
      quiet_hours_start: body.quietHoursStart,
      quiet_hours_end: body.quietHoursEnd,
      max_challenges_per_day: body.maxChallengesPerDay,
    };

    const { data: user, error } = await supabase
      .from('users')
      // @ts-expect-error - Supabase type inference issue
      .insert(userData)
      .select()
      .single();

    if (error) {
      console.error('Failed to create user:', error);
      return res.status(500).json({ error: 'Failed to create user', details: error.message });
    }

    res.status(201).json({
      id: (user as any).id,
      deviceId: (user as any).device_id,
      timezone: (user as any).timezone,
      quietHoursStart: (user as any).quiet_hours_start,
      quietHoursEnd: (user as any).quiet_hours_end,
      maxChallengesPerDay: (user as any).max_challenges_per_day,
      createdAt: (user as any).created_at,
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/users
 * Get all users
 */
router.get('/users', async (_req: Request, res: Response) => {
  try {
    const supabase = getSupabase();

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get users error:', error);
      return res.status(500).json({ error: 'Failed to load users' });
    }

    const formattedUsers = (users || []).map((user: any) => ({
      id: user.id,
      deviceId: user.device_id,
      timezone: user.timezone,
      quietHoursStart: user.quiet_hours_start,
      quietHoursEnd: user.quiet_hours_end,
      maxChallengesPerDay: user.max_challenges_per_day,
      createdAt: user.created_at,
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/users/:userId
 * Get user details
 */
router.get('/users/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const supabase = getSupabase();

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = user as any;
    res.json({
      id: userData.id,
      deviceId: userData.device_id,
      timezone: userData.timezone,
      quietHoursStart: userData.quiet_hours_start,
      quietHoursEnd: userData.quiet_hours_end,
      maxChallengesPerDay: userData.max_challenges_per_day,
      createdAt: userData.created_at,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/users/:userId
 * Update user settings
 */
router.put('/users/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const validation = UpdateUserRequestSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validation.error.errors,
      });
    }

    const body = validation.data;
    const supabase = getSupabase();

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateData: UserUpdate = {
      device_id: body.deviceId,
      timezone: body.timezone,
      quiet_hours_start: body.quietHoursStart,
      quiet_hours_end: body.quietHoursEnd,
      max_challenges_per_day: body.maxChallengesPerDay,
    };

    const { data: user, error } = await supabase
      .from('users')
      // @ts-expect-error - Supabase type inference issue
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('Failed to update user:', error);
      return res.status(500).json({ error: 'Failed to update user' });
    }

    const userData = user as any;
    res.json({
      id: userData.id,
      deviceId: userData.device_id,
      timezone: userData.timezone,
      quietHoursStart: userData.quiet_hours_start,
      quietHoursEnd: userData.quiet_hours_end,
      maxChallengesPerDay: userData.max_challenges_per_day,
      createdAt: userData.created_at,
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/users/:userId/skills
 * Enroll user in a skill (create user_skill_state)
 */
router.post('/users/:userId/skills', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const validation = EnrollSkillRequestSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validation.error.errors,
      });
    }

    const body = validation.data;
    const supabase = getSupabase();

    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if skill exists
    const { data: skill } = await supabase
      .from('skills')
      .select('id, name, active')
      .eq('id', body.skillId)
      .single();

    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    const skillData = skill as any;
    if (!skillData.active) {
      return res.status(400).json({ error: 'Skill is not active' });
    }

    // Check if already enrolled
    const { data: existing } = await supabase
      .from('user_skill_state')
      .select('id')
      .eq('user_id', userId)
      .eq('skill_id', body.skillId)
      .single();

    if (existing) {
      return res.status(400).json({ error: 'User already enrolled in this skill' });
    }

    // Create user skill state
    const userSkillData: UserSkillStateInsert = {
      user_id: userId,
      skill_id: body.skillId,
      difficulty_target: body.difficultyTarget,
    };

    const { data: userSkill, error } = await supabase
      .from('user_skill_state')
      // @ts-expect-error - Supabase type inference issue
      .insert(userSkillData)
      .select()
      .single();

    if (error) {
      console.error('Failed to enroll user in skill:', error);
      return res.status(500).json({ error: 'Failed to enroll in skill' });
    }

    const userSkillAny = userSkill as any;
    res.status(201).json({
      id: userSkillAny.id,
      userId: userSkillAny.user_id,
      skillId: userSkillAny.skill_id,
      skillName: skillData.name,
      difficultyTarget: userSkillAny.difficulty_target,
      attemptsTotal: userSkillAny.attempts_total,
      correctTotal: userSkillAny.correct_total,
      streakCorrect: userSkillAny.streak_correct,
      streakIncorrect: userSkillAny.streak_incorrect,
      lastChallengedAt: userSkillAny.last_challenged_at,
      lastResult: userSkillAny.last_result,
      updatedAt: userSkillAny.updated_at,
    });
  } catch (error) {
    console.error('Enroll skill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/users/:userId/skills/:skillId
 * Update user skill state (e.g, manually adjust difficulty target)
 */
router.put('/users/:userId/skills/:skillId', async (req: Request, res: Response) => {
  try {
    const { userId, skillId } = req.params;
    const validation = UpdateUserSkillRequestSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Invalid request',
        details: validation.error.errors,
      });
    }

    const body = validation.data;
    const supabase = getSupabase();

    // Check if user skill exists
    const { data: existing } = await supabase
      .from('user_skill_state')
      .select('id')
      .eq('user_id', userId)
      .eq('skill_id', skillId)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'User not enrolled in this skill' });
    }

    const updateData: UserSkillStateUpdate = {
      difficulty_target: body.difficultyTarget,
    };

    const { data: userSkill, error } = await supabase
      .from('user_skill_state')
      // @ts-expect-error - Supabase type inference issue
      .update(updateData)
      .eq('user_id', userId)
      .eq('skill_id', skillId)
      .select(`
        *,
        skills!inner(name)
      `)
      .single();

    if (error) {
      console.error('Failed to update user skill:', error);
      return res.status(500).json({ error: 'Failed to update user skill' });
    }

    const userSkillAny = userSkill as any;
    res.json({
      id: userSkillAny.id,
      userId: userSkillAny.user_id,
      skillId: userSkillAny.skill_id,
      skillName: userSkillAny.skills.name,
      difficultyTarget: userSkillAny.difficulty_target,
      attemptsTotal: userSkillAny.attempts_total,
      correctTotal: userSkillAny.correct_total,
      streakCorrect: userSkillAny.streak_correct,
      streakIncorrect: userSkillAny.streak_incorrect,
      lastChallengedAt: userSkillAny.last_challenged_at,
      lastResult: userSkillAny.last_result,
      updatedAt: userSkillAny.updated_at,
    });
  } catch (error) {
    console.error('Update user skill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/users/:userId/skills/:skillId
 * Remove a skill from user (unenroll)
 */
router.delete('/users/:userId/skills/:skillId', async (req: Request, res: Response) => {
  try {
    const { userId, skillId } = req.params;
    const supabase = getSupabase();

    // Check if user skill exists
    const { data: existing } = await supabase
      .from('user_skill_state')
      .select('id')
      .eq('user_id', userId)
      .eq('skill_id', skillId)
      .single();

    if (!existing) {
      return res.status(404).json({ error: 'User not enrolled in this skill' });
    }

    const { error } = await supabase
      .from('user_skill_state')
      .delete()
      .eq('user_id', userId)
      .eq('skill_id', skillId);

    if (error) {
      console.error('Failed to delete user skill:', error);
      return res.status(500).json({ error: 'Failed to unenroll from skill' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Delete user skill error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/scheduler/tick
 * Manually trigger a scheduling tick (for testing)
 */
router.post('/scheduler/tick', async (_req: Request, res: Response) => {
  try {
    console.log('[API] Manual scheduling tick triggered');

    // Run the scheduling tick
    await schedulerService.runSchedulingTick();

    res.json({
      success: true,
      message: 'Scheduling tick completed',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[API] Manual tick error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run scheduling tick',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

console.log('[Routes] All routes defined, exporting router');
console.log(`[Routes] Router stack length: ${router.stack?.length}`);

export default router;
