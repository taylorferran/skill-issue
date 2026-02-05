"""
Configuration for Opik Agent Optimizer.
Loads environment variables and sets up API clients.
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from backend directory (shared with TypeScript backend)
env_path = Path(__file__).parent.parent / "packages" / "backend" / ".env"
load_dotenv(env_path)

# Fallback to optimization/.env if backend/.env doesn't exist
if not env_path.exists():
    fallback_env = Path(__file__).parent / ".env"
    load_dotenv(fallback_env)

# API Keys
OPIK_API_KEY = os.getenv("OPIK_API_KEY")
OPIK_WORKSPACE = os.getenv("OPIK_WORKSPACE")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")  # Used by optimizer for reasoning

# Model configuration
# LiteLLM format (with anthropic/ prefix) - used by opik-optimizer
CHALLENGE_MODEL_LITELLM = "anthropic/claude-haiku-4-5-20251001"
# Direct Anthropic SDK format (no prefix) - used by evaluator
JUDGE_MODEL_ANTHROPIC = "claude-haiku-4-5-20251001"

# Evaluation weights (must match TypeScript config/evaluation.ts)
EVALUATION_WEIGHTS = {
    "clarity": 0.20,
    "difficulty_alignment": 0.25,
    "distractor_quality": 0.20,
    "educational_value": 0.15,
    "skill_relevance": 0.20,
}

# Quality threshold
QUALITY_THRESHOLD = 0.7

# Opik project name (must match TypeScript backend)
OPIK_PROJECT_NAME = "skill-issue"

# Paths
PROMPTS_DIR = Path(__file__).parent / "prompts"
BASE_PROMPT_PATH = PROMPTS_DIR / "challenge_base.txt"
OPTIMIZED_PROMPTS_PATH = PROMPTS_DIR / "optimized_prompts.json"


def validate_config():
    """Validate that all required configuration is present."""
    missing = []

    if not OPIK_API_KEY:
        missing.append("OPIK_API_KEY")
    if not OPIK_WORKSPACE:
        missing.append("OPIK_WORKSPACE")
    if not ANTHROPIC_API_KEY:
        missing.append("ANTHROPIC_API_KEY")
    if not OPENAI_API_KEY:
        missing.append("OPENAI_API_KEY (needed for optimizer reasoning model)")

    if missing:
        raise ValueError(f"Missing required environment variables: {', '.join(missing)}")

    if not BASE_PROMPT_PATH.exists():
        raise ValueError(f"Base prompt file not found: {BASE_PROMPT_PATH}")

    return True
