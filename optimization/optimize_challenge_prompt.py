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
import re
from datetime import datetime
from pathlib import Path

import opik
from opik_optimizer import MetaPromptOptimizer, ChatPrompt
from anthropic import Anthropic

from config import (
    validate_config,
    ANTHROPIC_API_KEY,
    CHALLENGE_MODEL,
    OPIK_API_KEY,
    OPIK_WORKSPACE,
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


def challenge_quality_metric(dataset_item: dict, llm_output: str) -> float:
    """
    Metric function for the optimizer.

    Takes a dataset item and the LLM's generated output, returns a score 0-1.
    Uses LLM-as-judge to evaluate challenge quality.
    """
    # 1. Parse challenge JSON from LLM output
    try:
        # Try to extract JSON from the output
        json_match = re.search(r"\{[\s\S]*\}", llm_output)
        if not json_match:
            print(f"[Metric] No JSON found in output")
            return 0.0

        challenge = json.loads(json_match.group(0))
    except json.JSONDecodeError as e:
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


def save_optimized_prompt(
    skill_id: str,
    optimized_prompt: str,
    baseline_score: float,
    best_score: float,
    refinements: int,
) -> None:
    """Save the optimized prompt to JSON file."""
    # Load existing optimized prompts or create new
    if OPTIMIZED_PROMPTS_PATH.exists():
        with open(OPTIMIZED_PROMPTS_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
    else:
        data = {"prompts": {}, "metadata": {"created_at": datetime.now().isoformat()}}

    # Add or update this skill's optimized prompt
    data["prompts"][skill_id] = {
        "prompt": optimized_prompt,
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

    # Configure Opik
    opik.configure(
        api_key=OPIK_API_KEY,
        workspace=OPIK_WORKSPACE,
    )

    # Load base prompt
    base_prompt = load_base_prompt()
    print(f"[Optimizer] Loaded base prompt ({len(base_prompt)} chars)")

    # Create ChatPrompt for optimizer
    prompt = ChatPrompt(
        messages=[
            {"role": "user", "content": base_prompt}
        ]
    )

    # Connect to existing Opik dataset
    dataset_name = f"skill_{skill_id}_scenarios"
    print(f"[Optimizer] Loading dataset: {dataset_name}")

    try:
        dataset = opik.get_dataset(dataset_name)
        print(f"[Optimizer] Dataset loaded with {len(dataset)} items")
    except Exception as e:
        print(f"[Optimizer] Error loading dataset: {e}")
        print(f"[Optimizer] Available datasets:")
        list_datasets()
        return

    # Initialize optimizer
    print(f"\n[Optimizer] Initializing MetaPromptOptimizer...")
    optimizer = MetaPromptOptimizer(
        model=CHALLENGE_MODEL,
        project_name=f"challenge-prompt-optimization-{skill_id}",
        n_refinements=n_refinements,
    )

    # Run optimization
    print(f"\n[Optimizer] Starting optimization...")
    print(f"[Optimizer] This may take several minutes...\n")

    result = optimizer.optimize_prompt(
        prompt=prompt,
        dataset=dataset,
        metric=challenge_quality_metric,
        n_samples=n_samples,
    )

    # Display results
    print(f"\n{'='*60}")
    print("OPTIMIZATION RESULTS")
    print(f"{'='*60}")

    result.display()

    print(f"\nBaseline Score: {result.baseline_score:.4f}")
    print(f"Best Score: {result.best_score:.4f}")
    print(f"Improvement: {result.best_score - result.baseline_score:.4f} ({((result.best_score - result.baseline_score) / result.baseline_score * 100) if result.baseline_score > 0 else 0:.1f}%)")

    # Save optimized prompt
    if result.best_score > result.baseline_score:
        print(f"\n[Optimizer] Improvement detected! Saving optimized prompt...")
        save_optimized_prompt(
            skill_id=skill_id,
            optimized_prompt=result.best_prompt.messages[0]["content"],
            baseline_score=result.baseline_score,
            best_score=result.best_score,
            refinements=n_refinements,
        )
    else:
        print(f"\n[Optimizer] No improvement found. Base prompt is already optimal for this dataset.")

    print(f"\n[Optimizer] Check Opik dashboard for detailed traces and metrics.")
    print(f"[Optimizer] Project: challenge-prompt-optimization-{skill_id}")


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
        default=10,
        help="Number of dataset items per iteration (default: 10)",
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
