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

from config import (
    SUPABASE_URL,
    SUPABASE_KEY,
    BASE_PROMPT_PATH,
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


def bake_prompt_for_skill_level(skill_id: str, level: int) -> str:
    """
    Convenience function to fetch skill metadata and bake a prompt in one call.

    Args:
        skill_id: The UUID of the skill
        level: The difficulty level (1-10)

    Returns:
        A concrete prompt string with all variables replaced
    """
    skill_meta = get_skill_metadata(skill_id)

    return bake_prompt(
        skill_name=skill_meta["skill_name"],
        skill_description=skill_meta["skill_description"],
        difficulty=level,
    )
