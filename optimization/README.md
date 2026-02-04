# Opik Agent Optimizer - Challenge Prompt Optimization

This directory contains Python scripts for automatically optimizing the challenge generation prompts using [Opik Agent Optimizer](https://www.comet.com/docs/opik/agent_optimization/overview).

## Overview

The optimizer:
1. Connects to existing Opik datasets (generated per skill)
2. Runs optimization trials on the challenge generation prompt
3. Uses LLM-as-judge to score each generated challenge
4. Iteratively improves the prompt using MetaPromptOptimizer
5. Exports optimized prompts for use in the TypeScript backend

## Setup

### 1. Install Python Dependencies

```bash
cd optimization
pip install -r requirements.txt
```

Requires Python 3.10+

### 2. Environment Variables

The optimizer automatically loads environment variables from `packages/backend/.env` (the same file used by the TypeScript backend).

Required variables (should already be configured):
- `ANTHROPIC_API_KEY` - Anthropic API key for LLM calls
- `OPIK_API_KEY` - Opik API key for observability
- `OPIK_WORKSPACE` - Opik workspace name

### 3. Ensure Datasets Exist

The optimizer needs skill datasets to exist in Opik. Generate them via the backend API:

```bash
# Generate datasets for all skills
curl -X POST http://localhost:3001/api/datasets/generate

# Or for a specific skill
curl -X POST http://localhost:3001/api/datasets/generate \
  -H "Content-Type: application/json" \
  -d '{"skillId": "your-skill-id"}'
```

## Usage

### List Available Datasets

```bash
python optimize_challenge_prompt.py --list-datasets
```

### Run Optimization

```bash
# Basic optimization (5 refinements, 10 samples per iteration)
python optimize_challenge_prompt.py --skill javascript-basics

# More iterations for better results
python optimize_challenge_prompt.py --skill javascript-basics --refinements 10

# Use more samples per iteration
python optimize_challenge_prompt.py --skill javascript-basics --samples 20
```

### Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `--skill` | Required | Skill ID to optimize for |
| `--refinements` | 5 | Number of optimization iterations |
| `--samples` | 10 | Dataset items to evaluate per iteration |
| `--list-datasets` | - | List available skill datasets |

## Output

### Optimized Prompts

Successful optimizations are saved to `prompts/optimized_prompts.json`:

```json
{
  "prompts": {
    "javascript-basics": {
      "prompt": "Optimized prompt text...",
      "baseline_score": 0.72,
      "best_score": 0.85,
      "improvement": 0.13,
      "improvement_percent": 18.1,
      "refinements": 5,
      "optimized_at": "2025-02-03T12:00:00"
    }
  },
  "metadata": {
    "created_at": "2025-02-03T12:00:00",
    "last_updated": "2025-02-03T12:00:00"
  }
}
```

### Opik Dashboard

All optimization trials are logged to Opik. View detailed traces at:
- Project: `challenge-prompt-optimization-{skill_id}`
- Includes: prompt variations, scores, token usage, evaluation details

## Integration with TypeScript Backend

After optimization, add the optimized prompt as a new A/B test variant:

```typescript
// In packages/backend/src/config/ab-tests.ts
import optimizedPrompts from '../../../optimization/prompts/optimized_prompts.json';

export const CHALLENGE_PROMPT_EXPERIMENT = {
  enabled: true,
  variants: [
    { name: 'control', weight: 20, template: undefined },
    {
      name: 'optimized_v1',
      weight: 80,
      template: optimizedPrompts.prompts['javascript-basics']?.prompt
    },
  ],
};
```

## Files

| File | Purpose |
|------|---------|
| `requirements.txt` | Python dependencies |
| `config.py` | Configuration (loads from backend/.env) |
| `evaluator.py` | LLM-as-judge evaluation (Python port) |
| `optimize_challenge_prompt.py` | Main optimization script |
| `prompts/challenge_base.txt` | Base prompt template |
| `prompts/optimized_prompts.json` | Output: optimized prompts (generated) |

## Troubleshooting

### "Dataset not found"

Ensure the dataset exists in Opik:
```bash
python optimize_challenge_prompt.py --list-datasets
```

If missing, generate it via the backend API.

### "Missing environment variables"

Check `packages/backend/.env` has all required keys:
- `OPIK_API_KEY`
- `OPIK_WORKSPACE`
- `ANTHROPIC_API_KEY`

### Low improvement scores

- Try increasing `--refinements` (more iterations)
- Try increasing `--samples` (more data per iteration)
- Check Opik dashboard for detailed failure reasons
