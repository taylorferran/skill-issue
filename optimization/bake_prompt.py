"""
Prompt Baking Utilities for Per-Skill-Per-Level Optimization.

This module handles:
1. Fetching skill metadata from Supabase
2. Baking template variables into concrete prompts

The key insight is that the Opik EvolutionaryOptimizer mutates the entire prompt,
including template variables like {{skill_name}}, breaking them. By "baking in"
all variables before optimization, we create concrete prompts that can be safely
mutated without breaking the template structure.
"""

from pathlib import Path
from typing import Optional
from supabase import create_client, Client

import json

from config import (
    SUPABASE_URL,
    SUPABASE_KEY,
    BASE_PROMPT_PATH,
    OPTIMIZED_PROMPTS_PATH,
)


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


def get_supabase_client() -> Client:
    """Create and return a Supabase client."""
    if not SUPABASE_URL or not SUPABASE_KEY:
        raise ValueError(
            "Supabase credentials not configured. "
            "Set SUPABASE_URL and SUPABASE_KEY environment variables."
        )
    return create_client(SUPABASE_URL, SUPABASE_KEY)


def get_skill_metadata(skill_id: str) -> dict:
    """
    Fetch skill name and description from Supabase.

    Args:
        skill_id: The UUID of the skill to fetch

    Returns:
        dict with skill_id, skill_name, skill_description

    Raises:
        ValueError: If skill not found
    """
    client = get_supabase_client()

    result = client.table("skills").select("id, name, description").eq("id", skill_id).single().execute()

    if not result.data:
        raise ValueError(f"Skill not found: {skill_id}")

    return {
        "skill_id": result.data["id"],
        "skill_name": result.data["name"],
        "skill_description": result.data["description"],
    }


def list_skills() -> list[dict]:
    """
    List all active skills from Supabase.

    Returns:
        List of dicts with skill_id, skill_name, skill_description
    """
    client = get_supabase_client()

    result = client.table("skills").select("id, name, description").eq("active", True).execute()

    return [
        {
            "skill_id": skill["id"],
            "skill_name": skill["name"],
            "skill_description": skill["description"],
        }
        for skill in (result.data or [])
    ]


def load_base_prompt() -> str:
    """Load the base challenge prompt template."""
    if not BASE_PROMPT_PATH.exists():
        raise FileNotFoundError(f"Base prompt not found: {BASE_PROMPT_PATH}")
    return BASE_PROMPT_PATH.read_text(encoding="utf-8")


def bake_prompt(
    skill_name: str,
    skill_description: str,
    difficulty: int,
    difficulty_description: Optional[str] = None,
    base_prompt: Optional[str] = None,
) -> str:
    """
    Replace all {{variables}} in base prompt with concrete values.

    This creates a prompt with NO template variables that can be safely
    mutated by the optimizer without breaking variable substitution.

    Args:
        skill_name: The name of the skill (e.g., "Python Programming")
        skill_description: The description of the skill
        difficulty: The difficulty level (1-10)
        difficulty_description: Optional custom description, defaults to DIFFICULTY_DESCRIPTIONS
        base_prompt: Optional custom base prompt, defaults to loading from file

    Returns:
        A concrete prompt string with all variables replaced
    """
    if base_prompt is None:
        base_prompt = load_base_prompt()

    if difficulty_description is None:
        difficulty_description = get_difficulty_description(difficulty)

    # Replace all template variables with concrete values
    baked = base_prompt
    baked = baked.replace("{{skill_name}}", skill_name)
    baked = baked.replace("{{skill_description}}", skill_description)
    baked = baked.replace("{{difficulty}}", str(difficulty))
    baked = baked.replace("{{difficulty_description}}", difficulty_description)

    # Also handle the optimizer's {{input.X}} format (in case base prompt uses it)
    baked = baked.replace("{{input.skill_name}}", skill_name)
    baked = baked.replace("{{input.skill_description}}", skill_description)
    baked = baked.replace("{{input.difficulty}}", str(difficulty))

    return baked


def load_existing_optimized_prompt(skill_id: str, level: int) -> str | None:
    """
    Check if an optimized prompt already exists for this skill+level.

    Returns the prompt string if found and deployed, None otherwise.
    """
    if not OPTIMIZED_PROMPTS_PATH.exists():
        return None

    try:
        with open(OPTIMIZED_PROMPTS_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)

        skill_prompts = data.get("prompts", {}).get(skill_id, {})
        level_data = skill_prompts.get(str(level), {})

        # Only use if status is deployed (or pending - still valid for re-optimization)
        if level_data.get("prompt") and level_data.get("status") in ("deployed", "pending"):
            return level_data["prompt"]

    except (json.JSONDecodeError, KeyError, TypeError) as e:
        print(f"[bake_prompt] Warning: Could not load optimized prompt: {e}")

    return None


def bake_prompt_for_skill_level(skill_id: str, level: int, use_optimized: bool = True) -> str:
    """
    Get the best available prompt for a skill+level combination.

    Priority:
    1. Existing optimized prompt (if use_optimized=True and one exists)
    2. Base template with variables baked in

    This allows the optimizer to build on previous improvements rather than
    starting from scratch each time.

    Args:
        skill_id: The UUID of the skill
        level: The difficulty level (1-10)
        use_optimized: Whether to check for existing optimized prompts (default: True)

    Returns:
        A concrete prompt string ready for optimization or generation
    """
    # First, check for existing optimized prompt
    if use_optimized:
        existing = load_existing_optimized_prompt(skill_id, level)
        if existing:
            print(f"[bake_prompt] Using existing optimized prompt for {skill_id} level {level}")
            return existing

    # Fall back to baking from base template
    print(f"[bake_prompt] Using base template for {skill_id} level {level}")
    skill_meta = get_skill_metadata(skill_id)

    return bake_prompt(
        skill_name=skill_meta["skill_name"],
        skill_description=skill_meta["skill_description"],
        difficulty=level,
    )
