import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import type {
  LLMProvider,
  ChallengeDesignRequest,
  GeneratedChallenge,
} from '@/types';

dotenv.config();
/**
 * LLM Provider abstraction layer
 * Allows swapping between different LLM providers without changing agent code 

 */

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async generateChallenge(request: ChallengeDesignRequest): Promise<GeneratedChallenge> {
    const { skillId, difficulty, skillName, skillDescription } = request;

    const prompt = this.buildChallengePrompt(skillId, skillName, skillDescription, difficulty);

    const message = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001', // Todo: This model is a little dumb honestly, will need to experiment 
      max_tokens: 1500,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : '';

    return this.parseChallengeResponse(responseText, difficulty);
  }

  private buildChallengePrompt(
    skillId: string,
    skillName: string | undefined,
    skillDescription: string | undefined,
    difficulty: number
  ): string {
    return `You are generating a multiple-choice challenge to test knowledge and competence.

SKILL: ${skillName || skillId}
DESCRIPTION: ${skillDescription || 'General knowledge challenge'}
DIFFICULTY LEVEL: ${difficulty}/10

Generate a single MCQ challenge that tests real competence in this skill at this difficulty level.

RULES:
- Difficulty ${difficulty} means: ${this.getDifficultyDescription(difficulty)}
- Question must be answerable in under 30 seconds
- 4 options, only 1 correct
- Randomly shuffle the order of correct answer among the options
- Don't repeat questions you've generated before - each challenge must be unique try to make it unique
- Distractors should be plausible but clearly wrong to someone who knows the subject
- Include a brief explanation of why the answer is correct
- Tailor the question specifically to the skill described above

OUTPUT FORMAT (strict JSON):
{
  "question": "...",
  "options": ["A...", "B...", "C...", "D..."],
  "correctAnswerIndex": 0,
  "explanation": "...",
  "actualDifficulty": ${difficulty}
}

Generate the challenge now:`;
  }

  private getDifficultyDescription(difficulty: number): string {
    const descriptions: Record<number, string> = {
      1: 'Complete Beginner: Generate a question requiring no prior knowledge; assume the respondent is encountering this subject for the very first time.',
      2: 'Novice: Generate a question about basic terminology or fundamental concepts that someone with minimal exposure to the subject could answer.',
      3: 'Basic Understanding: Generate a question that tests foundational knowledge, requiring the respondent to recall core principles or definitions.',
      4: 'Developing Competence: Generate a question that requires applying basic concepts to straightforward scenarios or making simple connections between ideas.',
      5: 'Intermediate: Generate a question that assumes solid foundational knowledge and tests the ability to analyze, compare, or apply concepts in moderately complex situations.',
      6: 'Proficient: Generate a question requiring integration of multiple concepts, awareness of common exceptions, or application to real-world contexts with some nuance.',
      7: 'Advanced: Generate a question that tests deep understanding, including edge cases, limitations of standard approaches, or the ability to evaluate competing methods.',
      8: 'Expert: Generate a question requiring specialized knowledge, critical evaluation of complex scenarios, or synthesis across multiple advanced topics.',
      9: 'Specialist: Generate a question that assumes mastery of the field, testing nuanced judgment, obscure details, or the ability to navigate ambiguous or contested areas.',
      10: 'Subject Matter Expert: Generate a question at the frontier of the domain, requiring knowledge of cutting-edge developments, unresolved debates, or the ability to identify novel insights.'
    };

    return descriptions[difficulty] || descriptions[5];
  }

  private parseChallengeResponse(response: string, targetDifficulty: number): GeneratedChallenge {
    try {
      // Extract JSON from response (handle markdown code blocks)
      const jsonMatch = response.match(/```json\n?(.*?)\n?```/s) || response.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response;

      const parsed = JSON.parse(jsonStr.trim());

      // Validate structure
      if (
        !parsed.question ||
        !Array.isArray(parsed.options) ||
        parsed.options.length !== 4 ||
        typeof parsed.correctAnswerIndex !== 'number' ||
        parsed.correctAnswerIndex < 0 ||
        parsed.correctAnswerIndex > 3
      ) {
        throw new Error('Invalid challenge structure');
      }

      return {
        question: parsed.question,
        options: parsed.options,
        correctAnswerIndex: parsed.correctAnswerIndex,
        explanation: parsed.explanation || '',
        actualDifficulty: parsed.actualDifficulty || targetDifficulty,
      };
    } catch (error) {
      console.error('Failed to parse LLM response:', error);
      console.error('Response was:', response);

      // Return a fallback challenge
      return this.getFallbackChallenge(targetDifficulty);
    }
  }

  private getFallbackChallenge(difficulty: number): GeneratedChallenge {
    // Fallback is intentionally generic - this should rarely be used
    // and indicates an LLM parsing failure that should be investigated
    return {
      question: 'This is a placeholder question. The challenge generation system encountered an error.',
      options: [
        'This is the correct answer (placeholder)',
        'Incorrect option 1',
        'Incorrect option 2',
        'Incorrect option 3',
      ],
      correctAnswerIndex: 0,
      explanation: 'This is a fallback challenge due to a system error. Please report this issue.',
      actualDifficulty: difficulty,
    };
  }
}

// Factory function to create provider
// Todo: Allow switching between multiple providers in future
export function createLLMProvider(): LLMProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('Missing ANTHROPIC_API_KEY environment variable');
  }

  console.log('[LLM Provider] Initializing Anthropic Claude API');
  return new AnthropicProvider(apiKey);
}
