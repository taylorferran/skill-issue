#!/usr/bin/env python3
"""
Opik Agent Optimizer for Challenge Generation Prompts.

This script uses Opik's MetaPromptOptimizer to automatically improve
the challenge generation prompt by iterating on it and measuring
quality using our LLM-as-judge evaluation.

Usage:
    python optimize_challenge_prompt.py --skill javascript-basics
    python optimize_challenge_prompt.py --skill javascript-basics --refinements 10
    python optimize_challenge_prompt.py --list-datasets
"""

import argparse
import json
import os
import re
from datetime import datetime
from pathlib import Path

import opik
from opik_optimizer import MetaPromptOptimizer, EvolutionaryOptimizer, ChatPrompt
from anthropic import Anthropic

from config import (
    validate_config,
    ANTHROPIC_API_KEY,
    OPENAI_API_KEY,
    CHALLENGE_MODEL_LITELLM,
    OPIK_API_KEY,
    OPIK_WORKSPACE,
    OPIK_PROJECT_NAME,
    BASE_PROMPT_PATH,
    OPTIMIZED_PROMPTS_PATH,
    PROMPTS_DIR,
)
from evaluator import get_evaluator, is_valid_challenge


# Difficulty descriptions (matches TypeScript llm-provider.ts)
DIFFICULTY_DESCRIPTIONS = {
    1: "Basic recall, simple facts",
    2: "Simple recall with minor context",
    3: "Understanding basic relationships",
    4: "Applying knowledge to straightforward situations",
    5: "Analyzing moderately complex scenarios",
    6: "Combining multiple concepts",
    7: "Evaluating edge cases",
    8: "Complex problem-solving with nuance",
    9: "Expert-level synthesis",
    10: "Master-level with subtle distinctions",
}


def get_difficulty_description(difficulty: int) -> str:
    """Get description for a difficulty level."""
    return DIFFICULTY_DESCRIPTIONS.get(difficulty, f"Difficulty level {difficulty}")


def extract_first_json_object(text: str) -> dict | None:
    """
    Extract the first valid JSON object from text.
    Handles cases with multiple JSON objects or extra content.
    """
    # Find all potential JSON object starts
    depth = 0
    start_idx = None

    for i, char in enumerate(text):
        if char == '{':
            if depth == 0:
                start_idx = i
            depth += 1
        elif char == '}':
            depth -= 1
            if depth == 0 and start_idx is not None:
                # Try to parse this substring as JSON
                try:
                    candidate = text[start_idx:i+1]
                    return json.loads(candidate)
                except json.JSONDecodeError:
                    # Reset and continue looking
                    start_idx = None
                    continue
    return None


def challenge_quality_metric(dataset_item: dict, llm_output: str) -> float:
    """
    Metric function for the optimizer.

    Takes a dataset item and the LLM's generated output, returns a score 0-1.
    Uses LLM-as-judge to evaluate challenge quality.
    """

    # 1. Parse challenge JSON from LLM output
    try:
        # Try to extract the first valid JSON object
        challenge = extract_first_json_object(llm_output)
        if not challenge:
            print(f"[Metric] No valid JSON found in output")
            return 0.0
    except Exception as e:
        print(f"[Metric] JSON parse error: {e}")
        return 0.0

    # 2. Basic validation
    if not is_valid_challenge(challenge):
        print(f"[Metric] Challenge failed validation")
        return 0.0

    # 3. Run LLM-as-judge evaluation
    evaluator = get_evaluator()

    # Extract skill info from dataset item
    # Handle both nested (input.skill_name) and flat (skill_name) formats
    if "input" in dataset_item:
        skill_name = dataset_item["input"].get("skill_name", "Unknown Skill")
        skill_description = dataset_item["input"].get("skill_description", "")
        target_difficulty = dataset_item["input"].get("difficulty", 5)
    else:
        skill_name = dataset_item.get("skill_name", "Unknown Skill")
        skill_description = dataset_item.get("skill_description", "")
        target_difficulty = dataset_item.get("difficulty", 5)

    result = evaluator.evaluate(
        challenge=challenge,
        skill_name=skill_name,
        skill_description=skill_description,
        target_difficulty=target_difficulty,
    )

    print(f"[Metric] Score: {result['composite_score']:.2f}, Passed: {result['passed']}")
    return result["composite_score"]


def load_base_prompt() -> str:
    """Load the base challenge prompt template."""
    if not BASE_PROMPT_PATH.exists():
        raise FileNotFoundError(f"Base prompt not found: {BASE_PROMPT_PATH}")
    return BASE_PROMPT_PATH.read_text(encoding="utf-8")


def convert_to_production_syntax(prompt: str) -> str:
    """
    Convert optimizer variable syntax back to production syntax.

    During optimization, we use {{input.skill_name}} to match dataset structure.
    In production, the TypeScript backend expects {{skill_name}}.

    This function converts: {{input.X}} -> {{X}}
    """
    # Map of optimizer syntax -> production syntax
    conversions = [
        ("{{input.skill_name}}", "{{skill_name}}"),
        ("{{input.skill_description}}", "{{skill_description}}"),
        ("{{input.difficulty}}", "{{difficulty}}"),
        ("{{input.scenario}}", "{{scenario}}"),
        ("{{input.expected_concepts}}", "{{expected_concepts}}"),
        ("{{input.skill_id}}", "{{skill_id}}"),
        # Also handle without spaces (Jinja2 style)
        ("{{ input.skill_name }}", "{{ skill_name }}"),
        ("{{ input.skill_description }}", "{{ skill_description }}"),
        ("{{ input.difficulty }}", "{{ difficulty }}"),
        ("{{ input.scenario }}", "{{ scenario }}"),
        ("{{ input.expected_concepts }}", "{{ expected_concepts }}"),
        ("{{ input.skill_id }}", "{{ skill_id }}"),
    ]

    result = prompt
    for optimizer_syntax, production_syntax in conversions:
        result = result.replace(optimizer_syntax, production_syntax)

    return result


def save_optimized_prompt(
    skill_id: str,
    optimized_prompt: str,
    baseline_score: float,
    best_score: float,
    refinements: int,
) -> None:
    """Save the optimized prompt to JSON file."""
    # Convert from optimizer syntax ({{input.X}}) to production syntax ({{X}})
    production_prompt = convert_to_production_syntax(optimized_prompt)

    # Load existing optimized prompts or create new
    if OPTIMIZED_PROMPTS_PATH.exists():
        with open(OPTIMIZED_PROMPTS_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
    else:
        data = {"prompts": {}, "metadata": {"created_at": datetime.now().isoformat()}}

    # Add or update this skill's optimized prompt (using production syntax)
    data["prompts"][skill_id] = {
        "prompt": production_prompt,
        "baseline_score": baseline_score,
        "best_score": best_score,
        "improvement": best_score - baseline_score,
        "improvement_percent": ((best_score - baseline_score) / baseline_score * 100) if baseline_score > 0 else 0,
        "refinements": refinements,
        "optimized_at": datetime.now().isoformat(),
    }

    data["metadata"]["last_updated"] = datetime.now().isoformat()

    # Save
    PROMPTS_DIR.mkdir(parents=True, exist_ok=True)
    with open(OPTIMIZED_PROMPTS_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    print(f"\n[Optimizer] Saved optimized prompt to: {OPTIMIZED_PROMPTS_PATH}")


def list_datasets() -> list[str]:
    """List all available skill datasets in Opik."""
    # Ensure Opik is configured via environment
    os.environ["OPIK_API_KEY"] = OPIK_API_KEY or ""
    os.environ["OPIK_WORKSPACE"] = OPIK_WORKSPACE or ""

    client = opik.Opik()

    # Get all datasets
    datasets = client.get_datasets()

    skill_datasets = []
    for dataset in datasets:
        if dataset.name.startswith("skill_") and dataset.name.endswith("_scenarios"):
            # Extract skill ID from dataset name
            skill_id = dataset.name.replace("skill_", "").replace("_scenarios", "")
            skill_datasets.append(skill_id)
            print(f"  - {skill_id} ({dataset.name})")

    return skill_datasets


def run_optimization(
    skill_id: str,
    n_refinements: int = 5,
    n_samples: int = 10,
) -> None:
    """
    Run prompt optimization for a specific skill.

    Args:
        skill_id: The skill ID to optimize for (e.g., "javascript-basics")
        n_refinements: Number of optimization iterations
        n_samples: Number of dataset items to use per iteration
    """
    print(f"\n{'='*60}")
    print(f"Opik Agent Optimizer - Challenge Prompt Optimization")
    print(f"{'='*60}")
    print(f"Skill: {skill_id}")
    print(f"Refinements: {n_refinements}")
    print(f"Samples per iteration: {n_samples}")
    print(f"{'='*60}\n")

    # Validate configuration
    validate_config()

    # Configure environment variables for Opik and LiteLLM
    os.environ["OPIK_API_KEY"] = OPIK_API_KEY
    os.environ["OPIK_WORKSPACE"] = OPIK_WORKSPACE
    os.environ["OPIK_PROJECT_NAME"] = OPIK_PROJECT_NAME
    # LiteLLM needs API keys for both providers
    os.environ["ANTHROPIC_API_KEY"] = ANTHROPIC_API_KEY
    os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY

    opik.configure(
        api_key=OPIK_API_KEY,
        workspace=OPIK_WORKSPACE,
        force=True,  # Override existing config
    )
    print(f"[Optimizer] Opik configured for project: {OPIK_PROJECT_NAME}")

    # Load base prompt
    base_prompt = load_base_prompt()
    print(f"[Optimizer] Loaded base prompt ({len(base_prompt)} chars)")

    # Create ChatPrompt for optimizer (model must be specified here for LiteLLM routing)
    prompt = ChatPrompt(
        model=CHALLENGE_MODEL_LITELLM,
        messages=[
            {"role": "user", "content": base_prompt}
        ]
    )

    # Connect to existing Opik dataset
    dataset_name = f"skill_{skill_id}_scenarios"
    print(f"[Optimizer] Loading dataset: {dataset_name}")

    try:
        client = opik.Opik()
        dataset = client.get_dataset(name=dataset_name)
        # Get items to check count (Dataset object doesn't support len())
        items = dataset.get_items()
        item_count = len(list(items)) if items else 0
        print(f"[Optimizer] Dataset loaded with {item_count} items")
    except Exception as e:
        print(f"[Optimizer] Error loading dataset: {e}")
        print(f"[Optimizer] Available datasets:")
        list_datasets()
        return

    # Initialize optimizer
    # Use OpenAI for the optimizer's internal reasoning/prompt generation
    # (Claude has parsing issues with the optimizer's expected structured output format)
    # The ChatPrompt still uses Claude for actual challenge generation/evaluation
    print(f"\n[Optimizer] Initializing EvolutionaryOptimizer...")
    print(f"[Optimizer] Mutation model: gpt-4o-mini (for prompt mutations)")
    print(f"[Optimizer] Evaluation model: {CHALLENGE_MODEL_LITELLM} (for challenge generation)")
    optimizer = EvolutionaryOptimizer(
        model="gpt-4o-mini",  # Model for generating mutations
        n_threads=1,  # Reduced to 1 to avoid rate limiting
        population_size=4,  # Number of prompts per generation
        num_generations=3,  # Number of evolution rounds
        verbose=2,  # Increase verbosity
        seed=42,
    )

    # Run optimization
    print(f"\n[Optimizer] Starting optimization...")
    print(f"[Optimizer] This may take several minutes...\n")

    result = optimizer.optimize_prompt(
        prompt=prompt,
        dataset=dataset,
        metric=challenge_quality_metric,  # Required: scoring function
        n_samples=None,  # Use FULL dataset for consistent comparison between prompts
        max_trials=n_refinements,  # Maximum prompts to evaluate
        project_name=OPIK_PROJECT_NAME,
    )

    # Display results
    print(f"\n{'='*60}")
    print("OPTIMIZATION RESULTS")
    print(f"{'='*60}")

    # Show built-in display
    result.display()

    # Debug: Show what prompts were actually tried
    print(f"\n{'='*60}")
    print("DEBUG: PROMPTS HISTORY")
    print(f"{'='*60}")
    if hasattr(result, 'history') and result.history:
        print(f"Number of entries in history: {len(result.history)}")
        for i, entry in enumerate(result.history[:5]):  # Show first 5
            print(f"\n--- Entry {i+1} ---")
            print(f"Type: {type(entry)}")
            if hasattr(entry, 'prompt'):
                prompt_preview = str(entry.prompt)[:200] if entry.prompt else "None"
                print(f"Prompt preview: {prompt_preview}...")
            if hasattr(entry, 'score'):
                print(f"Score: {entry.score}")
            if isinstance(entry, dict):
                print(f"Keys: {list(entry.keys())}")
                if 'prompt' in entry:
                    print(f"Prompt preview: {str(entry['prompt'])[:200]}...")
    else:
        print("No history available or history is empty")

    # Access result using correct attribute names
    initial_score = result.initial_score
    best_score = result.score
    best_prompt = result.prompt

    print(f"\nInitial Score: {initial_score:.4f}")
    print(f"Best Score: {best_score:.4f}")
    improvement = best_score - initial_score
    improvement_pct = (improvement / initial_score * 100) if initial_score > 0 else 0
    print(f"Improvement: {improvement:.4f} ({improvement_pct:.1f}%)")

    # Save optimized prompt if improvement found
    if best_score > initial_score and best_prompt is not None:
        print(f"\n[Optimizer] Improvement detected! Saving optimized prompt...")
        # Extract prompt content from ChatPrompt object
        prompt_content = best_prompt.messages[0]["content"] if hasattr(best_prompt, 'messages') else str(best_prompt)
        save_optimized_prompt(
            skill_id=skill_id,
            optimized_prompt=prompt_content,
            baseline_score=initial_score,
            best_score=best_score,
            refinements=n_refinements,
        )
    else:
        print(f"\n[Optimizer] No improvement found. Base prompt is already optimal for this dataset.")

    print(f"\n[Optimizer] Check Opik dashboard for detailed traces and metrics.")
    print(f"[Optimizer] Project: {OPIK_PROJECT_NAME}")


def main():
    parser = argparse.ArgumentParser(
        description="Optimize challenge generation prompts using Opik Agent Optimizer"
    )
    parser.add_argument(
        "--skill",
        type=str,
        help="Skill ID to optimize for (e.g., 'javascript-basics')",
    )
    parser.add_argument(
        "--refinements",
        type=int,
        default=5,
        help="Number of optimization iterations (default: 5)",
    )
    parser.add_argument(
        "--samples",
        type=int,
        default=5,
        help="Number of dataset items per iteration (default: 5, use fewer to avoid rate limits)",
    )
    parser.add_argument(
        "--list-datasets",
        action="store_true",
        help="List available skill datasets",
    )

    args = parser.parse_args()

    if args.list_datasets:
        print("\nAvailable skill datasets:")
        datasets = list_datasets()
        if not datasets:
            print("  No skill datasets found. Generate datasets first via the backend API.")
        return

    if not args.skill:
        parser.error("--skill is required unless using --list-datasets")

    run_optimization(
        skill_id=args.skill,
        n_refinements=args.refinements,
        n_samples=args.samples,
    )


if __name__ == "__main__":
    main()
