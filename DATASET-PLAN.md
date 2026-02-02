# Dataset Generation + Real-World Data Promotion — Implementation Plan

## Overview

This feature creates a complete evaluation pipeline where:
1. **Synthetic datasets** are auto-generated when new skills are created
2. **Existing skills** without datasets get datasets generated on startup
3. **Real-world data** from user answers gradually replaces synthetic data when quality metrics are met
4. **Experiments** can be run against datasets to evaluate prompt quality

---

## Opik Dataset Structure

Based on Opik documentation, dataset items use flexible dictionaries with `input` and `expected_output` as key fields:

```typescript
interface ChallengeDatasetItem {
  input: {
    skill_id: string;
    skill_name: string;
    skill_description: string;
    difficulty: number;
    scenario: string;           // Specific scenario/context for the challenge
    expected_concepts: string[]; // Concepts that should be tested
  };
  expected_output: {
    difficulty_range: [number, number];  // Acceptable difficulty (target ± 1)
    required_concepts: string[];         // Must test at least some of these
    question_characteristics: {
      min_length: number;
      max_length: number;
      must_have_explanation: boolean;
      option_count: number;
    };
  };
  metadata: {
    source: 'synthetic' | 'real_world';
    item_id: string;             // For tracking/replacement
    challenge_id?: string;       // If from real-world data
    created_at: string;
    // Real-world only:
    user_metrics?: {
      response_time_score: number;   // 0-1
      user_confidence: number;       // 1-5 normalized to 0-1
      was_correct: boolean;
      judge_composite_score: number; // From LLM-as-Judge
    };
  };
}
```

## Dataset Naming Convention

Each skill gets its own dataset: `skill_{skill_id}_scenarios`

This allows:
- Per-skill experiments and comparisons
- Isolated real-world data promotion
- Clear organization in Opik dashboard

---

## Implementation Steps

### Step 1: Types and Interfaces

**File: `packages/backend/src/types/index.ts`**

Add new types:

```typescript
// ============= Dataset Types =============
export interface DatasetItem {
  input: Record<string, unknown>;
  expected_output: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ChallengeScenario {
  scenario: string;
  expected_concepts: string[];
  difficulty: number;
}

export interface DatasetGenerationResult {
  datasetName: string;
  itemsCreated: number;
  scenarios: ChallengeScenario[];
}

export interface RealWorldCandidate {
  challengeId: string;
  skillId: string;
  difficulty: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
  metrics: {
    responseTimeScore: number;
    userConfidence: number;
    wasCorrect: boolean;
    judgeCompositeScore: number;
  };
}

export interface GoldStandardCriteria {
  minResponseTimeScore: number;     // Default: 0.6
  minJudgeScore: number;            // Default: 0.7
  requireCorrectAnswer: boolean;    // Default: true
}
```

---

### Step 2: Opik Service Additions

**File: `packages/backend/src/lib/opik.ts`**

Add/update these methods:

```typescript
// Export generateUUIDv7 for external use
export { generateUUIDv7 };

// ============= Dataset Management =============

async findDataset(name: string): Promise<{ id: string; name: string } | null> {
  const response = await this.request('GET', `/datasets?name=${encodeURIComponent(name)}`);
  if (response?.ok) {
    const data = await response.json();
    const datasets = data?.content || [];
    return datasets.find((d: any) => d.name === name) || null;
  }
  return null;
}

async createDataset(params: {
  name: string;
  description?: string;
}): Promise<string | null> {
  const id = generateUUIDv7();
  const response = await this.request('POST', '/datasets', {
    id,
    name: params.name,
    description: params.description,
  });
  if (response?.ok) {
    console.log(`[Opik] Dataset created: ${params.name}`);
    return id;
  }
  // Handle 409 - dataset already exists
  if (response?.status === 409) {
    const existing = await this.findDataset(params.name);
    return existing?.id || null;
  }
  return null;
}

async addDatasetItems(
  datasetName: string,
  items: Array<{
    input: Record<string, unknown>;
    expected_output: Record<string, unknown>;
    metadata?: Record<string, unknown>;
  }>
): Promise<void> {
  const formattedItems = items.map(item => ({
    id: generateUUIDv7(),
    input: item.input,
    expected_output: item.expected_output,
    metadata: item.metadata,
    source: item.metadata?.source || 'sdk',
  }));

  // Batch in groups of 50
  for (let i = 0; i < formattedItems.length; i += 50) {
    const batch = formattedItems.slice(i, i + 50);
    await this.request('POST', `/datasets/${encodeURIComponent(datasetName)}/items`, {
      items: batch,
    });
  }

  console.log(`[Opik] Added ${formattedItems.length} items to dataset ${datasetName}`);
}

async getDatasetItems(datasetName: string): Promise<Array<any>> {
  const response = await this.request('GET', `/datasets/${encodeURIComponent(datasetName)}/items`);
  if (response?.ok) {
    const data = await response.json();
    return data?.content || [];
  }
  return [];
}
```

---

### Step 3: LLM Provider Addition

**File: `packages/backend/src/lib/llm-provider.ts`**

Add a generic raw generation method:

```typescript
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
```

---

### Step 4: Dataset Generation Service

**File: `packages/backend/src/lib/dataset-generator.ts`** (new file)

```typescript
import { createLLMProvider } from './llm-provider';
import { opikService } from './opik';
import type { ChallengeScenario, DatasetGenerationResult, DatasetItem } from '@/types';

const SCENARIOS_PER_DIFFICULTY = 5;
const DIFFICULTY_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export class DatasetGenerator {
  private llmProvider = createLLMProvider();

  /**
   * Generate a complete dataset for a skill
   * Creates 5 scenarios per difficulty level = 50 items total
   */
  async generateDatasetForSkill(params: {
    skillId: string;
    skillName: string;
    skillDescription: string;
  }): Promise<DatasetGenerationResult> {
    const datasetName = `skill_${params.skillId}_scenarios`;

    // Check if dataset already exists
    const existing = await opikService.findDataset(datasetName);
    if (existing) {
      console.log(`[DatasetGenerator] Dataset already exists: ${datasetName}`);
      return {
        datasetName,
        itemsCreated: 0,
        scenarios: [],
      };
    }

    console.log(`[DatasetGenerator] Generating dataset for skill: ${params.skillName}`);

    // Create the dataset in Opik
    await opikService.createDataset({
      name: datasetName,
      description: `Challenge scenarios for ${params.skillName}`,
    });

    // Generate scenarios for each difficulty level
    const allScenarios: ChallengeScenario[] = [];
    const datasetItems: DatasetItem[] = [];

    for (const difficulty of DIFFICULTY_LEVELS) {
      const scenarios = await this.generateScenariosForDifficulty({
        skillName: params.skillName,
        skillDescription: params.skillDescription,
        difficulty,
        count: SCENARIOS_PER_DIFFICULTY,
      });

      for (const scenario of scenarios) {
        allScenarios.push(scenario);
        datasetItems.push(this.scenarioToDatasetItem({
          skillId: params.skillId,
          skillName: params.skillName,
          skillDescription: params.skillDescription,
          scenario,
        }));
      }
    }

    // Add items to Opik dataset
    await opikService.addDatasetItems(datasetName, datasetItems);

    console.log(`[DatasetGenerator] Created ${datasetItems.length} scenarios for ${params.skillName}`);

    return {
      datasetName,
      itemsCreated: datasetItems.length,
      scenarios: allScenarios,
    };
  }

  /**
   * Use LLM to generate diverse scenarios for a specific difficulty
   */
  private async generateScenariosForDifficulty(params: {
    skillName: string;
    skillDescription: string;
    difficulty: number;
    count: number;
  }): Promise<ChallengeScenario[]> {
    const prompt = `You are generating test scenarios for evaluating MCQ challenge generation.

SKILL: ${params.skillName}
DESCRIPTION: ${params.skillDescription}
DIFFICULTY LEVEL: ${params.difficulty}/10

Generate ${params.count} diverse scenarios that a challenge at this difficulty level should cover.

For difficulty ${params.difficulty}/10:
${this.getDifficultyGuidance(params.difficulty)}

Each scenario should specify:
1. A specific context/situation where this skill applies
2. The key concepts that should be tested
3. What makes this appropriate for difficulty ${params.difficulty}

OUTPUT FORMAT (strict JSON array):
[
  {
    "scenario": "Brief description of the testing context",
    "expected_concepts": ["concept1", "concept2"],
    "difficulty": ${params.difficulty}
  }
]

Generate ${params.count} diverse, non-overlapping scenarios.`;

    try {
      const response = await this.llmProvider.generateRaw(prompt, {
        maxTokens: 1000,
        temperature: 0.8, // Higher temp for diversity
      });

      const jsonMatch = response.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn(`[DatasetGenerator] Failed to parse scenarios for difficulty ${params.difficulty}`);
        return this.getFallbackScenarios(params.difficulty, params.count);
      }

      const parsed = JSON.parse(jsonMatch[0]) as ChallengeScenario[];
      return parsed.slice(0, params.count);
    } catch (error) {
      console.error(`[DatasetGenerator] Error generating scenarios:`, error);
      return this.getFallbackScenarios(params.difficulty, params.count);
    }
  }

  private getDifficultyGuidance(difficulty: number): string {
    if (difficulty <= 2) {
      return '- Basic recall and recognition\n- Fundamental concepts\n- Clear, straightforward questions';
    } else if (difficulty <= 4) {
      return '- Understanding relationships between concepts\n- Simple application of knowledge\n- Some context required';
    } else if (difficulty <= 6) {
      return '- Application to new situations\n- Combining multiple concepts\n- Analysis of scenarios';
    } else if (difficulty <= 8) {
      return '- Complex problem-solving\n- Edge cases and exceptions\n- Deep understanding required';
    } else {
      return '- Expert-level knowledge\n- Subtle distinctions\n- Real-world complex scenarios\n- Multiple valid approaches to consider';
    }
  }

  private getFallbackScenarios(difficulty: number, count: number): ChallengeScenario[] {
    return Array.from({ length: count }, (_, i) => ({
      scenario: `Generic scenario ${i + 1} at difficulty ${difficulty}`,
      expected_concepts: ['general knowledge'],
      difficulty,
    }));
  }

  private scenarioToDatasetItem(params: {
    skillId: string;
    skillName: string;
    skillDescription: string;
    scenario: ChallengeScenario;
  }): DatasetItem {
    return {
      input: {
        skill_id: params.skillId,
        skill_name: params.skillName,
        skill_description: params.skillDescription,
        difficulty: params.scenario.difficulty,
        scenario: params.scenario.scenario,
        expected_concepts: params.scenario.expected_concepts,
      },
      expected_output: {
        difficulty_range: [
          Math.max(1, params.scenario.difficulty - 1),
          Math.min(10, params.scenario.difficulty + 1),
        ],
        required_concepts: params.scenario.expected_concepts,
        question_characteristics: {
          min_length: 10,
          max_length: 500,
          must_have_explanation: true,
          option_count: 4,
        },
      },
      metadata: {
        source: 'synthetic',
        item_id: `${params.skillId}_d${params.scenario.difficulty}_${Date.now()}`,
        created_at: new Date().toISOString(),
      },
    };
  }

  /**
   * Check all skills and generate datasets for any missing ones
   */
  async ensureAllSkillsHaveDatasets(skills: Array<{
    id: string;
    name: string;
    description: string;
  }>): Promise<{ generated: string[]; skipped: string[] }> {
    const generated: string[] = [];
    const skipped: string[] = [];

    for (const skill of skills) {
      const datasetName = `skill_${skill.id}_scenarios`;
      const existing = await opikService.findDataset(datasetName);

      if (existing) {
        skipped.push(skill.name);
        continue;
      }

      await this.generateDatasetForSkill({
        skillId: skill.id,
        skillName: skill.name,
        skillDescription: skill.description,
      });
      generated.push(skill.name);
    }

    return { generated, skipped };
  }
}

export const datasetGenerator = new DatasetGenerator();
```

---

### Step 5: Real-World Data Promotion Service

**File: `packages/backend/src/lib/dataset-promoter.ts`** (new file)

```typescript
import { getSupabase } from './supabase';
import { opikService } from './opik';
import type { RealWorldCandidate, GoldStandardCriteria, DatasetItem } from '@/types';

const DEFAULT_CRITERIA: GoldStandardCriteria = {
  minResponseTimeScore: 0.6,
  minJudgeScore: 0.7,
  requireCorrectAnswer: true,
};

export class DatasetPromoter {
  /**
   * Find challenges that meet gold standard criteria
   * and could replace synthetic dataset items
   */
  async findPromotionCandidates(
    skillId: string,
    criteria: GoldStandardCriteria = DEFAULT_CRITERIA
  ): Promise<RealWorldCandidate[]> {
    const supabase = getSupabase();

    // Query challenges with good metrics
    const { data: challenges, error } = await supabase
      .from('challenges')
      .select(`
        id,
        skill_id,
        difficulty,
        question,
        options_json,
        correct_option,
        explanation,
        answers!inner (
          is_correct,
          response_time,
          confidence
        )
      `)
      .eq('skill_id', skillId)
      .eq('answers.is_correct', criteria.requireCorrectAnswer ? true : undefined)
      .limit(100);

    if (error || !challenges) {
      console.error('[DatasetPromoter] Error fetching candidates:', error);
      return [];
    }

    // Filter and score candidates
    const candidates: RealWorldCandidate[] = [];

    for (const c of challenges as any[]) {
      const answer = c.answers[0];
      if (!answer) continue;

      // Calculate response time score
      const expectedTimeMs = (10 + (c.difficulty - 1) * 5.5) * 1000;
      const rtRatio = (answer.response_time || 30000) / expectedTimeMs;
      const responseTimeScore = rtRatio <= 1 ? 1.0 : Math.max(0, 1 - (rtRatio - 1) * 0.5);

      // Normalize user confidence (1-5 to 0-1)
      const userConfidence = answer.confidence ? (answer.confidence - 1) / 4 : 0.5;

      // For judge score, we'd need to fetch from Opik feedback scores
      // For now, use a placeholder - this should be enhanced to query Opik
      const judgeCompositeScore = 0.8; // TODO: Fetch from Opik traces

      // Check against criteria
      if (
        responseTimeScore >= criteria.minResponseTimeScore &&
        judgeCompositeScore >= criteria.minJudgeScore &&
        (!criteria.requireCorrectAnswer || answer.is_correct)
      ) {
        candidates.push({
          challengeId: c.id,
          skillId: c.skill_id,
          difficulty: c.difficulty,
          question: c.question,
          options: c.options_json,
          correctAnswerIndex: c.correct_option,
          explanation: c.explanation || '',
          metrics: {
            responseTimeScore,
            userConfidence,
            wasCorrect: answer.is_correct,
            judgeCompositeScore,
          },
        });
      }
    }

    return candidates;
  }

  /**
   * Promote a real-world challenge to replace a synthetic dataset item
   */
  async promoteToDataset(params: {
    candidate: RealWorldCandidate;
    skillName: string;
    skillDescription: string;
  }): Promise<boolean> {
    const datasetName = `skill_${params.candidate.skillId}_scenarios`;

    // Check dataset exists
    const dataset = await opikService.findDataset(datasetName);
    if (!dataset) {
      console.warn(`[DatasetPromoter] Dataset not found: ${datasetName}`);
      return false;
    }

    // Create dataset item from real-world data
    const datasetItem: DatasetItem = {
      input: {
        skill_id: params.candidate.skillId,
        skill_name: params.skillName,
        skill_description: params.skillDescription,
        difficulty: params.candidate.difficulty,
        scenario: `Real-world validated: ${params.candidate.question.substring(0, 100)}...`,
        expected_concepts: [], // Could be extracted from the question
      },
      expected_output: {
        difficulty_range: [
          Math.max(1, params.candidate.difficulty - 1),
          Math.min(10, params.candidate.difficulty + 1),
        ],
        validated_question: params.candidate.question,
        validated_options: params.candidate.options,
        validated_correct_index: params.candidate.correctAnswerIndex,
        validated_explanation: params.candidate.explanation,
      },
      metadata: {
        source: 'real_world',
        item_id: `real_${params.candidate.challengeId}`,
        challenge_id: params.candidate.challengeId,
        created_at: new Date().toISOString(),
        user_metrics: params.candidate.metrics,
      },
    };

    // Add to dataset
    await opikService.addDatasetItems(datasetName, [datasetItem]);

    console.log(`[DatasetPromoter] Promoted challenge ${params.candidate.challengeId} to dataset`);
    return true;
  }

  /**
   * Run promotion for a skill - find candidates and add to dataset
   */
  async runPromotionForSkill(params: {
    skillId: string;
    skillName: string;
    skillDescription: string;
    maxPromotions?: number;
    criteria?: GoldStandardCriteria;
  }): Promise<{ promoted: number; candidates: number }> {
    const maxPromotions = params.maxPromotions || 5;

    const candidates = await this.findPromotionCandidates(
      params.skillId,
      params.criteria
    );

    console.log(`[DatasetPromoter] Found ${candidates.length} promotion candidates for ${params.skillName}`);

    let promoted = 0;
    for (const candidate of candidates.slice(0, maxPromotions)) {
      const success = await this.promoteToDataset({
        candidate,
        skillName: params.skillName,
        skillDescription: params.skillDescription,
      });
      if (success) promoted++;
    }

    return { promoted, candidates: candidates.length };
  }
}

export const datasetPromoter = new DatasetPromoter();
```

---

### Step 6: API Endpoints

**File: `packages/backend/src/api/routes.ts`**

Add these endpoints:

```typescript
import { datasetGenerator } from '@/lib/dataset-generator';
import { datasetPromoter } from '@/lib/dataset-promoter';

/**
 * POST /api/datasets/generate
 * Generate dataset for a specific skill or all skills
 */
router.post('/datasets/generate', async (req: Request, res: Response) => {
  try {
    const { skillId } = req.body;
    const supabase = getSupabase();

    if (skillId) {
      // Generate for specific skill
      const { data: skill, error } = await supabase
        .from('skills')
        .select('id, name, description')
        .eq('id', skillId)
        .single();

      if (error || !skill) {
        return res.status(404).json({ error: 'Skill not found' });
      }

      const result = await datasetGenerator.generateDatasetForSkill({
        skillId: skill.id,
        skillName: skill.name,
        skillDescription: skill.description,
      });

      return res.json(result);
    }

    // Generate for all skills without datasets
    const { data: skills, error } = await supabase
      .from('skills')
      .select('id, name, description')
      .eq('active', true);

    if (error || !skills) {
      return res.status(500).json({ error: 'Failed to fetch skills' });
    }

    const result = await datasetGenerator.ensureAllSkillsHaveDatasets(skills);
    res.json(result);
  } catch (error) {
    console.error('Dataset generation error:', error);
    res.status(500).json({ error: 'Failed to generate dataset' });
  }
});

/**
 * POST /api/datasets/promote
 * Promote real-world data to dataset for a skill
 */
router.post('/datasets/promote', async (req: Request, res: Response) => {
  try {
    const { skillId, maxPromotions, criteria } = req.body;

    if (!skillId) {
      return res.status(400).json({ error: 'skillId required' });
    }

    const supabase = getSupabase();
    const { data: skill, error } = await supabase
      .from('skills')
      .select('id, name, description')
      .eq('id', skillId)
      .single();

    if (error || !skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    const result = await datasetPromoter.runPromotionForSkill({
      skillId: skill.id,
      skillName: skill.name,
      skillDescription: skill.description,
      maxPromotions,
      criteria,
    });

    res.json(result);
  } catch (error) {
    console.error('Dataset promotion error:', error);
    res.status(500).json({ error: 'Failed to promote data' });
  }
});

/**
 * GET /api/datasets/:skillId/status
 * Get dataset status for a skill
 */
router.get('/datasets/:skillId/status', async (req: Request, res: Response) => {
  try {
    const { skillId } = req.params;
    const datasetName = `skill_${skillId}_scenarios`;

    const dataset = await opikService.findDataset(datasetName);
    if (!dataset) {
      return res.json({ exists: false, itemCount: 0 });
    }

    const items = await opikService.getDatasetItems(datasetName);
    const syntheticCount = items.filter((i: any) => i.metadata?.source === 'synthetic').length;
    const realWorldCount = items.filter((i: any) => i.metadata?.source === 'real_world').length;

    res.json({
      exists: true,
      datasetName,
      itemCount: items.length,
      syntheticCount,
      realWorldCount,
      realWorldPercentage: items.length > 0 ? (realWorldCount / items.length * 100).toFixed(1) : 0,
    });
  } catch (error) {
    console.error('Dataset status error:', error);
    res.status(500).json({ error: 'Failed to get dataset status' });
  }
});
```

---

### Step 7: Skill Creation Hook

**File: `packages/backend/src/api/routes.ts`**

Modify the existing skill creation endpoint (or add if not exists):

```typescript
/**
 * POST /api/skills
 * Create a new skill and auto-generate its dataset
 */
router.post('/skills', async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    const supabase = getSupabase();

    // Create skill in database
    const { data: skill, error } = await supabase
      .from('skills')
      .insert({ name, description, active: true })
      .select()
      .single();

    if (error || !skill) {
      return res.status(500).json({ error: 'Failed to create skill' });
    }

    // Auto-generate dataset in background
    datasetGenerator.generateDatasetForSkill({
      skillId: skill.id,
      skillName: skill.name,
      skillDescription: skill.description,
    }).catch(err => {
      console.error('[Skill Creation] Dataset generation failed:', err);
    });

    res.json({
      skill,
      message: 'Skill created. Dataset generation started in background.',
    });
  } catch (error) {
    console.error('Skill creation error:', error);
    res.status(500).json({ error: 'Failed to create skill' });
  }
});
```

---

### Step 8: Startup Check

**File: `packages/backend/src/index.ts`** (or server startup file)

Add startup check:

```typescript
import { datasetGenerator } from '@/lib/dataset-generator';
import { getSupabase } from '@/lib/supabase';

async function ensureDatasetsExist() {
  console.log('[Startup] Checking for skills without datasets...');

  try {
    const supabase = getSupabase();
    const { data: skills, error } = await supabase
      .from('skills')
      .select('id, name, description')
      .eq('active', true);

    if (error || !skills) {
      console.error('[Startup] Failed to fetch skills:', error);
      return;
    }

    const result = await datasetGenerator.ensureAllSkillsHaveDatasets(skills);

    if (result.generated.length > 0) {
      console.log(`[Startup] Generated datasets for: ${result.generated.join(', ')}`);
    }
    if (result.skipped.length > 0) {
      console.log(`[Startup] Existing datasets for: ${result.skipped.join(', ')}`);
    }
  } catch (err) {
    console.error('[Startup] Dataset check failed:', err);
  }
}

// Call on server start (after DB connection)
ensureDatasetsExist();
```

---

## Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `types/index.ts` | Modify | Add dataset and promotion types |
| `lib/opik.ts` | Modify | Add dataset management methods, export generateUUIDv7 |
| `lib/llm-provider.ts` | Modify | Add `generateRaw` method |
| `lib/dataset-generator.ts` | **Create** | LLM-powered scenario generation |
| `lib/dataset-promoter.ts` | **Create** | Real-world data promotion logic |
| `api/routes.ts` | Modify | Add dataset endpoints + skill creation hook |
| `index.ts` | Modify | Add startup dataset check |

---

## Verification Checklist

- [ ] **Step 1**: Types compile without errors
- [ ] **Step 2**: `findDataset`, `createDataset`, `addDatasetItems` work
- [ ] **Step 3**: `generateRaw` produces valid LLM responses
- [ ] **Step 4**: `POST /api/datasets/generate` creates dataset with 50 items
- [ ] **Step 5**: `POST /api/datasets/promote` finds and promotes candidates
- [ ] **Step 6**: All endpoints return expected responses
- [ ] **Step 7**: Creating skill auto-triggers dataset generation
- [ ] **Step 8**: Server startup generates missing datasets

## Test Commands

```bash
# Generate dataset for all skills
curl -X POST http://localhost:3001/api/datasets/generate

# Generate for specific skill
curl -X POST http://localhost:3001/api/datasets/generate \
  -H "Content-Type: application/json" \
  -d '{"skillId": "your-skill-id"}'

# Check dataset status
curl http://localhost:3001/api/datasets/{skillId}/status

# Promote real-world data
curl -X POST http://localhost:3001/api/datasets/promote \
  -H "Content-Type: application/json" \
  -d '{"skillId": "your-skill-id", "maxPromotions": 5}'
```
