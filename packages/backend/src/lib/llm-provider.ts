import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import type {
  LLMProvider,
  ChallengeDesignRequest,
  GeneratedChallenge,
  GeneratedChallengeWithUsage,
} from '@/types';
import { getPromptForChallenge } from './prompt-loader';

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

  async generateChallenge(request: ChallengeDesignRequest & { customTemplate?: string }): Promise<GeneratedChallengeWithUsage> {
    const { skillId, difficulty, skillName, skillDescription, customTemplate } = request;

    const prompt = this.buildChallengePrompt(skillId, skillName, skillDescription, difficulty, customTemplate);

    const message = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001', // Todo: This model is a little dumb honestly, will need to experiment
      max_tokens: parseInt(process.env.LLM_MAX_TOKENS || '1500'),
      temperature: parseFloat(process.env.LLM_TEMPERATURE || '0.7'),
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

    const challenge = this.parseChallengeResponse(responseText, difficulty);

    return {
      challenge,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
      prompt,        // The actual prompt sent to the LLM
      rawResponse: responseText,  // The raw LLM response
    };
  }

  /**
   * Returns the prompt template with {{variable}} placeholders.
   * Used for Opik prompt versioning — only creates a new version when the
   * template structure changes, not when different variables are filled in.
   */
  static getChallengePromptTemplate(): string {
    return `You are generating a multiple-choice challenge to test knowledge and competence.

SKILL: {{skill_name}}
DESCRIPTION: {{skill_description}}
DIFFICULTY LEVEL: {{difficulty}}/10

Generate a single MCQ challenge that tests real competence in this skill at this difficulty level.

RULES:
- Difficulty {{difficulty}} means: {{difficulty_description}}
- Question must be answerable in under 30 seconds
- 4 options, only 1 correct
- Randomly shuffle the order of correct answer among the options
- Don't repeat questions you've generated before - each challenge must be unique try to make it unique
- Distractors should be plausible but clearly wrong to someone who knows the subject
- Include a brief explanation of why the answer is correct
- Tailor the question specifically to the skill described above
- Make sure the correct answer is not ambiguous or debatable

BREVITY REQUIREMENTS (CRITICAL):
- Question: 15-25 words maximum, no unnecessary words
- Options: 3-8 words each, direct answers only
- Explanation: 20-30 words maximum, concise reasoning
- Avoid: storytelling, excessive context, verbose setups, filler words
- Focus: Test the concept directly and efficiently

Examples of good brevity:
✓ "Which sorting algorithm has O(n log n) average time complexity?"
✗ "When implementing a search on a large dataset, which algorithm would be best?"

✓ "What is the capital of France?"
✗ "If you were traveling through Europe and wanted to visit the capital city of France, which city would you go to?"

OUTPUT FORMAT (strict JSON):
{
  "question": "...",
  "options": ["A...", "B...", "C...", "D..."],
  "correctAnswerIndex": 0,
  "explanation": "...",
  "actualDifficulty": {{difficulty}}
}

Generate the challenge now:`;
  }

  private buildChallengePrompt(
    skillId: string,
    skillName: string | undefined,
    skillDescription: string | undefined,
    difficulty: number,
    customTemplate?: string
  ): string {
    // If custom template provided, interpolate variables
    if (customTemplate) {
      return customTemplate
        .replace(/\{\{skill_name\}\}/g, skillName || skillId)
        .replace(/\{\{skill_description\}\}/g, skillDescription || 'General knowledge challenge')
        .replace(/\{\{difficulty\}\}/g, difficulty.toString())
        .replace(/\{\{difficulty_description\}\}/g, this.getDifficultyDescription(difficulty));
    }

    // Use prompt loader to get the best available prompt
    // This checks for optimized prompts first, then falls back to base template
    return getPromptForChallenge(
      skillId,
      skillName || skillId,
      skillDescription || 'General knowledge challenge',
      difficulty
    );
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
      // Use greedy match ([\s\S]*) to handle nested code blocks inside JSON strings
      // The $ anchor ensures we match the LAST ``` in the response
      const jsonMatch = response.match(/```json\n?([\s\S]*)\n?```\s*$/) || response.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : response;

      const parsed = JSON.parse(jsonStr.trim());

      // Handle both correctAnswerIndex and correctOption field names (LLM sometimes uses different names)
      const correctIndex = parsed.correctAnswerIndex ?? parsed.correctOption;

      // Validate structure
      if (
        !parsed.question ||
        !Array.isArray(parsed.options) ||
        parsed.options.length !== 4 ||
        typeof correctIndex !== 'number' ||
        correctIndex < 0 ||
        correctIndex > 3
      ) {
        console.error('Validation failed:', {
          hasQuestion: !!parsed.question,
          isOptionsArray: Array.isArray(parsed.options),
          optionsLength: parsed.options?.length,
          correctIndex,
          correctIndexType: typeof correctIndex
        });
        throw new Error('Invalid challenge structure');
      }

      return {
        question: parsed.question,
        options: parsed.options,
        correctAnswerIndex: correctIndex,
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

  /**
   * Generate a skill description from a skill name
   * Returns description and whether the name is too vague
   */
  async generateSkillDescription(skillName: string): Promise<{
    description: string;
    isVague: boolean;
    message: string;
  }> {
    const prompt = `You are helping create a learning platform skill. Given a skill name, generate a detailed description and assess if the name is specific enough.

SKILL NAME: "${skillName}"

Analyze this skill name and provide:
1. A detailed description (2-3 sentences) of what this skill encompasses
2. Whether the name is too vague/general (e.g., "Coding", "Math", "Science" are vague; "Python Programming", "Algebra I", "Organic Chemistry" are specific)
3. A helpful message for the user

OUTPUT FORMAT (strict JSON):
{
  "description": "Detailed description of the skill...",
  "isVague": true/false,
  "message": "If vague: Suggest being more specific. If specific: Confirmation message."
}

Examples:
- "Coding" -> isVague: true, message: "This is quite general. Try something more specific like 'Python Programming', 'JavaScript Basics', or 'C++ Data Structures'"
- "Python Programming" -> isVague: false, message: "Great! This is a specific, well-defined skill."

Generate the response now:`;

    try {
      const message = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 500,
        temperature: 0.3,
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

      // Extract JSON from response
      const jsonMatch = responseText.match(/```json\n?(.*?)\n?```/s) || responseText.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : responseText;

      const parsed = JSON.parse(jsonStr.trim());

      return {
        description: parsed.description || `${skillName} - A skill for learning and mastering ${skillName}.`,
        isVague: parsed.isVague ?? false,
        message: parsed.message || 'Skill description generated successfully.',
      };
    } catch (error) {
      console.error('Failed to generate skill description:', error);
      
      // Return a basic description on error
      return {
        description: `${skillName} - A skill for learning and mastering ${skillName}.`,
        isVague: false,
        message: 'Description generated with default template.',
      };
    }
  }

  /**
   * Generate raw text from LLM (for dataset generation, etc.)
   */
  async generateRaw(
    prompt: string,
    options: { maxTokens?: number; temperature?: number } = {}
  ): Promise<{ text: string; usage: { inputTokens: number; outputTokens: number } }> {
    const message = await this.client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: options.maxTokens || 1000,
      temperature: options.temperature ?? 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';

    return {
      text,
      usage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    };
  }
}

/**
 * OpenAI Provider for dataset generation (breaks Claude circularity)
 */
export class OpenAIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  /**
   * Generate raw text from OpenAI (for dataset generation)
   *
   * @param prompt - The prompt to send
   * @param options.model - Model to use (default: gpt-4o-mini, use gpt-4o for high-quality examples)
   * @param options.maxTokens - Max tokens to generate
   * @param options.temperature - Temperature for generation
   */
  async generateRaw(
    prompt: string,
    options: { model?: string; maxTokens?: number; temperature?: number } = {}
  ): Promise<{ text: string; usage: { inputTokens: number; outputTokens: number } }> {
    const response = await this.client.chat.completions.create({
      model: options.model || 'gpt-4o-mini',
      max_tokens: options.maxTokens || 1000,
      temperature: options.temperature ?? 0.7,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.choices[0]?.message?.content || '';

    return {
      text,
      usage: {
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
      },
    };
  }
}

// Factory function to create Anthropic provider (default, backwards compatible)
export function createLLMProvider(): AnthropicProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('Missing ANTHROPIC_API_KEY environment variable');
  }
  console.log('[LLM Provider] Initializing Anthropic Claude API');
  return new AnthropicProvider(apiKey);
}

// Factory function to create OpenAI provider (for dataset generation to break circularity)
export function createOpenAIProvider(): OpenAIProvider {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY environment variable');
  }
  console.log('[LLM Provider] Initializing OpenAI API');
  return new OpenAIProvider(apiKey);
}
