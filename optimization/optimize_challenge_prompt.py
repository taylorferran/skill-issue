#!/usr/bin/env python3
"""
Opik Agent Optimizer for Challenge Generation Prompts.

This script uses Opik's EvolutionaryOptimizer to automatically improve
the challenge generation prompt by iterating on it and measuring
quality using our LLM-as-judge evaluation.

Key Feature: Per-Skill-Per-Level Optimization
- Prompts are "baked" with concrete values before optimization
- No template variables ({{skill_name}}, etc.) are sent to the optimizer
- Each optimized prompt is specific to one skill at one difficulty level
- Storage: optimized_prompts[skill_id][level] = concrete_prompt

Usage:
    # Optimize specific skill at specific level
    python optimize_challenge_prompt.py --skill <skill_id> --level 3

    # Optimize all levels for a skill
    python optimize_challenge_prompt.py --skill <skill_id> --all-levels

    # List available datasets
    python optimize_challenge_prompt.py --list-datasets

    # List available skills
    python optimize_challenge_prompt.py --list-skills
"""

import argparse
import json
import os
from datetime import datetime
from pathlib import Path

import opik
from opik_optimizer import EvolutionaryOptimizer, MetaPromptOptimizer, ChatPrompt
from opik_optimizer.algorithms.hierarchical_reflective_optimizer import HierarchicalReflectiveOptimizer
from opik.evaluation.metrics.score_result import ScoreResult

from config import (
    validate_config,
    ANTHROPIC_API_KEY,
    OPENAI_API_KEY,
    CHALLENGE_MODEL_LITELLM,
    OPIK_API_KEY,
    OPIK_WORKSPACE,
    OPIK_PROJECT_NAME,
    OPTIMIZED_PROMPTS_PATH,
    PROMPTS_DIR,
)
from evaluator import get_evaluator, is_valid_challenge
from bake_prompt import (
    bake_prompt_for_skill_level,
    get_skill_metadata,
    list_skills,
    get_difficulty_description,
    DIFFICULTY_DESCRIPTIONS,
)


def extract_first_json_object(text: str) -> dict | None:
    """
    Extract the first valid JSON object from text.
    Handles cases with multiple JSON objects or extra content.
    """
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
                try:
                    candidate = text[start_idx:i+1]
                    return json.loads(candidate)
                except json.JSONDecodeError:
                    start_idx = None
                    continue
    return None


def create_quality_metric(skill_name: str, skill_description: str, target_difficulty: int):
    """
    Factory function to create a metric with skill context baked in.

    This allows the metric to evaluate challenges against the known skill+level
    without requiring dataset items to contain this metadata (which would cause
    data leakage and inflate scores).

    The dataset items now have empty `input` and example challenges in `expected_output`.
    The metric compares generated challenge quality against these examples.

    Args:
        skill_name: The skill being tested
        skill_description: Description of the skill
        target_difficulty: The target difficulty level (1-10)

    Returns:
        A metric function compatible with Opik optimizer
    """
    def challenge_quality_metric(dataset_item: dict, llm_output: str) -> ScoreResult:
        """
        Metric function for the optimizer.

        Takes a dataset item and the LLM's generated output, returns a ScoreResult.
        Uses LLM-as-judge to evaluate challenge quality.

        Note: Skill context comes from closure, not dataset_item.
        Dataset items have empty input and example challenges in expected_output.

        Returns ScoreResult with name, value (0-1), and reason for HRPO compatibility.
        """
        # 1. Parse challenge JSON from LLM output
        try:
            challenge = extract_first_json_object(llm_output)
            if not challenge:
                print(f"[Metric] No valid JSON found in output")
                return ScoreResult(
                    name="challenge_quality",
                    value=0.0,
                    reason="No valid JSON found in LLM output"
                )
        except Exception as e:
            print(f"[Metric] JSON parse error: {e}")
            return ScoreResult(
                name="challenge_quality",
                value=0.0,
                reason=f"JSON parse error: {e}"
            )

        # 2. Basic validation
        if not is_valid_challenge(challenge):
            print(f"[Metric] Challenge failed validation")
            return ScoreResult(
                name="challenge_quality",
                value=0.0,
                reason="Challenge failed structural validation (missing fields, wrong option count, etc.)"
            )

        # 3. Get example from dataset item (for comparison)
        example = dataset_item.get("expected_output", {})

        # 4. Run LLM-as-judge evaluation
        # Skill context comes from closure (optimization context), NOT from dataset item
        # This prevents data leakage where dataset hints inflate scores
        evaluator = get_evaluator()

        result = evaluator.evaluate(
            challenge=challenge,
            skill_name=skill_name,
            skill_description=skill_description,
            target_difficulty=target_difficulty,
            example=example,  # Pass example for quality comparison
        )

        # Build detailed reason from evaluation scores
        scores = result["scores"]
        reasons = result.get("reasons", {})
        reason_parts = [
            f"Clarity: {scores['clarity']:.0%} - {reasons.get('clarity', 'N/A')}",
            f"Difficulty: {scores['difficulty_alignment']:.0%} - {reasons.get('difficulty_alignment', 'N/A')}",
            f"Distractors: {scores['distractor_quality']:.0%} - {reasons.get('distractor_quality', 'N/A')}",
            f"Educational: {scores['educational_value']:.0%} - {reasons.get('educational_value', 'N/A')}",
            f"Relevance: {scores['skill_relevance']:.0%} - {reasons.get('skill_relevance', 'N/A')}",
        ]
        detailed_reason = "; ".join(reason_parts)

        print(f"[Metric] Score: {result['composite_score']:.2f}, Passed: {result['passed']}")
        return ScoreResult(
            name="challenge_quality",
            value=result["composite_score"],
            reason=detailed_reason
        )

    return challenge_quality_metric


def load_optimized_prompts() -> dict:
    """Load existing optimized prompts from JSON file."""
    if OPTIMIZED_PROMPTS_PATH.exists():
        with open(OPTIMIZED_PROMPTS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    return {
        "prompts": {},
        "metadata": {"created_at": datetime.now().isoformat()}
    }


def save_optimized_prompt(
    skill_id: str,
    level: int,
    optimized_prompt: str,
    baseline_score: float,
    best_score: float,
    refinements: int,
) -> None:
    """Save the optimized prompt to JSON file with skill+level key."""
    data = load_optimized_prompts()

    # Ensure skill entry exists
    if skill_id not in data["prompts"]:
        data["prompts"][skill_id] = {}

    # Add or update this skill+level's optimized prompt
    # Note: prompt is already concrete (no variables) - ready for direct use
    data["prompts"][skill_id][str(level)] = {
        "prompt": optimized_prompt,
        "baseline_score": baseline_score,
        "best_score": best_score,
        "improvement": best_score - baseline_score,
        "improvement_percent": ((best_score - baseline_score) / baseline_score * 100) if baseline_score > 0 else 0,
        "refinements": refinements,
        "optimized_at": datetime.now().isoformat(),
        "status": "pending",  # Can be: pending, deployed, disabled
    }

    data["metadata"]["last_updated"] = datetime.now().isoformat()
    if "skills_optimized" not in data["metadata"]:
        data["metadata"]["skills_optimized"] = []
    if skill_id not in data["metadata"]["skills_optimized"]:
        data["metadata"]["skills_optimized"].append(skill_id)

    # Save
    PROMPTS_DIR.mkdir(parents=True, exist_ok=True)
    with open(OPTIMIZED_PROMPTS_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    print(f"\n[Optimizer] Saved optimized prompt to: {OPTIMIZED_PROMPTS_PATH}")
    print(f"[Optimizer] Key: prompts.{skill_id}.{level}")


def list_datasets() -> list[str]:
    """List all available skill datasets in Opik."""
    os.environ["OPIK_API_KEY"] = OPIK_API_KEY or ""
    os.environ["OPIK_WORKSPACE"] = OPIK_WORKSPACE or ""

    client = opik.Opik()
    datasets = client.get_datasets()

    skill_datasets = []
    for dataset in datasets:
        # Match both old format (skill_{id}_scenarios) and new format (skill_{id}_level_{level}_scenarios)
        if dataset.name.startswith("skill_") and "_scenarios" in dataset.name:
            skill_datasets.append(dataset.name)
            print(f"  - {dataset.name}")

    return skill_datasets


def list_available_skills() -> list[dict]:
    """List all available skills from Supabase."""
    try:
        skills = list_skills()
        print("\nAvailable skills:")
        for skill in skills:
            print(f"  - {skill['skill_id']}: {skill['skill_name']}")
        return skills
    except Exception as e:
        print(f"Error fetching skills: {e}")
        return []


def run_optimization(
    skill_id: str,
    level: int,
    n_refinements: int = 5,
    optimizer_type: str = "evolutionary",
) -> None:
    """
    Run prompt optimization for a specific skill at a specific difficulty level.

    This uses "baked" prompts where all template variables are replaced with
    concrete values before optimization. The optimizer can mutate any part of
    the prompt without breaking template syntax.

    Uses example-based datasets (skill_{id}_level_{level}_examples) that contain
    high-quality example challenges for quality comparison.

    Args:
        skill_id: The skill ID to optimize for (UUID)
        level: The difficulty level (1-10)
        n_refinements: Number of optimization iterations
        optimizer_type: Which optimizer to use ("evolutionary", "hrpo", or "metaprompt")
    """
    print(f"\n{'='*60}")
    print(f"Per-Skill-Per-Level Prompt Optimization")
    print(f"{'='*60}")
    print(f"Skill ID: {skill_id}")
    print(f"Level: {level}")
    print(f"Refinements: {n_refinements}")
    print(f"Optimizer: {optimizer_type}")
    print(f"Dataset: example-based (GPT-4o generated)")
    print(f"{'='*60}\n")

    # Validate configuration (including Supabase for skill metadata)
    validate_config(require_supabase=True)

    # Configure environment variables
    os.environ["OPIK_API_KEY"] = OPIK_API_KEY
    os.environ["OPIK_WORKSPACE"] = OPIK_WORKSPACE
    os.environ["OPIK_PROJECT_NAME"] = OPIK_PROJECT_NAME
    os.environ["ANTHROPIC_API_KEY"] = ANTHROPIC_API_KEY
    os.environ["OPENAI_API_KEY"] = OPENAI_API_KEY

    opik.configure(
        api_key=OPIK_API_KEY,
        workspace=OPIK_WORKSPACE,
        force=True,
    )
    print(f"[Optimizer] Opik configured for project: {OPIK_PROJECT_NAME}")

    # Fetch skill metadata from Supabase
    print(f"[Optimizer] Fetching skill metadata from Supabase...")
    try:
        skill_meta = get_skill_metadata(skill_id)
        print(f"[Optimizer] Skill: {skill_meta['skill_name']}")
        print(f"[Optimizer] Description: {skill_meta['skill_description'][:100]}...")
    except Exception as e:
        print(f"[Optimizer] Error fetching skill: {e}")
        return

    # Bake the prompt with concrete values (NO template variables)
    print(f"\n[Optimizer] Baking prompt with concrete values...")
    baked_prompt = bake_prompt_for_skill_level(skill_id, level)
    print(f"[Optimizer] Baked prompt length: {len(baked_prompt)} chars")
    print(f"[Optimizer] Difficulty description: {get_difficulty_description(level)}")

    # Create ChatPrompt with the baked (concrete) prompt
    prompt = ChatPrompt(
        model=CHALLENGE_MODEL_LITELLM,
        messages=[
            {"role": "user", "content": baked_prompt}
        ]
    )

    # Load level-specific example dataset
    # New naming: skill_{id}_level_{level}_examples (example-based datasets)
    dataset_name = f"skill_{skill_id}_level_{level}_examples"
    print(f"\n[Optimizer] Loading dataset: {dataset_name}")

    try:
        client = opik.Opik()
        dataset = client.get_dataset(name=dataset_name)
        items = dataset.get_items()
        item_count = len(list(items)) if items else 0
        print(f"[Optimizer] Dataset loaded with {item_count} items")
    except Exception as e:
        print(f"[Optimizer] Error loading dataset: {e}")
        print(f"\n[Optimizer] Dataset '{dataset_name}' not found.")
        print(f"[Optimizer] Generate it first using the backend API:")
        print(f"    POST /api/datasets/generate")
        print(f"    Body: {{ \"skillId\": \"{skill_id}\", \"level\": {level} }}")
        print(f"\n[Optimizer] Or generate all levels:")
        print(f"    POST /api/datasets/generate-all-levels")
        print(f"    Body: {{ \"skillId\": \"{skill_id}\" }}")
        return

    # Initialize optimizer based on type
    # Note: Seeds removed so each run explores different variations
    # Using gpt-4o for better reasoning quality
    if optimizer_type == "hrpo":
        print(f"\n[Optimizer] Initializing HierarchicalReflectiveOptimizer (HRPO)...")
        print(f"[Optimizer] Analysis model: gpt-4o")
        print(f"[Optimizer] Evaluation model: {CHALLENGE_MODEL_LITELLM} (for challenge generation)")
        optimizer = HierarchicalReflectiveOptimizer(
            model="gpt-4o",
            n_threads=1,
            batch_size=5,
            convergence_threshold=0.10,  # Higher threshold - keep exploring longer
            verbose=2,
        )
    elif optimizer_type == "metaprompt":
        print(f"\n[Optimizer] Initializing MetaPromptOptimizer...")
        print(f"[Optimizer] Reasoning model: gpt-4o")
        print(f"[Optimizer] Evaluation model: {CHALLENGE_MODEL_LITELLM} (for challenge generation)")
        optimizer = MetaPromptOptimizer(
            model="gpt-4o",
            prompts_per_round=6,  # More candidates per round
            n_threads=1,
            verbose=2,
        )
    else:
        print(f"\n[Optimizer] Initializing EvolutionaryOptimizer...")
        print(f"[Optimizer] Mutation model: gpt-4o (for prompt mutations)")
        print(f"[Optimizer] Evaluation model: {CHALLENGE_MODEL_LITELLM} (for challenge generation)")
        optimizer = EvolutionaryOptimizer(
            model="gpt-4o",
            n_threads=1,
            population_size=6,  # Larger population for more diversity
            num_generations=5,  # More generations to evolve
            verbose=2,
        )

    # Create metric with skill context baked in
    # This prevents data leakage - skill info comes from optimization context, not dataset
    metric = create_quality_metric(
        skill_name=skill_meta["skill_name"],
        skill_description=skill_meta["skill_description"],
        target_difficulty=level,
    )

    # Run optimization
    print(f"\n[Optimizer] Starting optimization...")
    print(f"[Optimizer] This may take several minutes...\n")

    result = optimizer.optimize_prompt(
        prompt=prompt,
        dataset=dataset,
        metric=metric,
        n_samples=None,  # Use full dataset
        max_trials=n_refinements,
        project_name=OPIK_PROJECT_NAME,
        optimize_prompt=True,  # Allow modifying ALL roles (default only modifies system)
    )

    # Display results
    print(f"\n{'='*60}")
    print("OPTIMIZATION RESULTS")
    print(f"{'='*60}")

    result.display()

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
        prompt_content = best_prompt.messages[0]["content"] if hasattr(best_prompt, 'messages') else str(best_prompt)

        # Note: The prompt is already concrete (no variables) - save as-is
        save_optimized_prompt(
            skill_id=skill_id,
            level=level,
            optimized_prompt=prompt_content,
            baseline_score=initial_score,
            best_score=best_score,
            refinements=n_refinements,
        )
    else:
        print(f"\n[Optimizer] No improvement found. Base prompt is already optimal for this skill+level.")

    print(f"\n[Optimizer] Check Opik dashboard for detailed traces and metrics.")
    print(f"[Optimizer] Project: {OPIK_PROJECT_NAME}")


def run_all_levels_optimization(
    skill_id: str,
    n_refinements: int = 5,
    levels: list[int] | None = None,
    optimizer_type: str = "evolutionary",
) -> None:
    """
    Run optimization for all difficulty levels for a skill.

    Args:
        skill_id: The skill ID to optimize for
        n_refinements: Number of optimization iterations per level
        levels: Optional list of specific levels to optimize (default: 1-10)
        optimizer_type: Which optimizer to use ("evolutionary", "hrpo", or "metaprompt")
    """
    if levels is None:
        levels = list(range(1, 11))

    print(f"\n{'='*60}")
    print(f"Optimizing all levels for skill: {skill_id}")
    print(f"Levels: {levels}")
    print(f"Optimizer: {optimizer_type}")
    print(f"{'='*60}\n")

    for level in levels:
        try:
            print(f"\n{'='*40}")
            print(f"LEVEL {level}/10")
            print(f"{'='*40}")
            run_optimization(skill_id, level, n_refinements, optimizer_type)
        except Exception as e:
            print(f"[Error] Failed to optimize level {level}: {e}")
            continue

    print(f"\n{'='*60}")
    print(f"ALL LEVELS OPTIMIZATION COMPLETE")
    print(f"{'='*60}")


def main():
    parser = argparse.ArgumentParser(
        description="Optimize challenge generation prompts using Opik Agent Optimizer (per-skill-per-level)"
    )
    parser.add_argument(
        "--skill",
        type=str,
        help="Skill ID (UUID) to optimize for",
    )
    parser.add_argument(
        "--level",
        type=int,
        choices=range(1, 11),
        metavar="1-10",
        help="Specific difficulty level to optimize (1-10)",
    )
    parser.add_argument(
        "--all-levels",
        action="store_true",
        help="Optimize all difficulty levels (1-10) for the skill",
    )
    parser.add_argument(
        "--levels",
        type=str,
        help="Comma-separated list of levels to optimize (e.g., '1,3,5,7')",
    )
    parser.add_argument(
        "--refinements",
        type=int,
        default=5,
        help="Number of optimization iterations (default: 5)",
    )
    parser.add_argument(
        "--list-datasets",
        action="store_true",
        help="List available skill datasets in Opik",
    )
    parser.add_argument(
        "--list-skills",
        action="store_true",
        help="List available skills from Supabase",
    )
    parser.add_argument(
        "--optimizer",
        type=str,
        choices=["evolutionary", "hrpo", "metaprompt"],
        default="evolutionary",
        help="Which optimizer to use: evolutionary, hrpo, or metaprompt (default: evolutionary)",
    )

    args = parser.parse_args()

    if args.list_datasets:
        print("\nAvailable datasets:")
        datasets = list_datasets()
        if not datasets:
            print("  No skill datasets found. Generate datasets first via the backend API.")
        return

    if args.list_skills:
        validate_config(require_supabase=True)
        list_available_skills()
        return

    if not args.skill:
        parser.error("--skill is required unless using --list-datasets or --list-skills")

    if args.all_levels:
        # Parse specific levels if provided
        levels = None
        if args.levels:
            levels = [int(x.strip()) for x in args.levels.split(",")]
        run_all_levels_optimization(
            skill_id=args.skill,
            n_refinements=args.refinements,
            levels=levels,
            optimizer_type=args.optimizer,
        )
    elif args.level:
        run_optimization(
            skill_id=args.skill,
            level=args.level,
            n_refinements=args.refinements,
            optimizer_type=args.optimizer,
        )
    else:
        parser.error("Either --level or --all-levels is required with --skill")


if __name__ == "__main__":
    main()
