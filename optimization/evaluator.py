"""
LLM-as-Judge Evaluator for Challenge Quality.
Python port of the TypeScript evaluator from packages/backend/src/lib/evaluator.ts

Evaluates generated challenges on 5 quality dimensions:
- Clarity: Is the question unambiguous?
- Difficulty Alignment: Does it match the target difficulty?
- Distractor Quality: Are wrong options plausible but incorrect?
- Educational Value: Does the explanation teach effectively?
- Skill Relevance: Does it test the stated skill?
"""

import json
import re
from typing import TypedDict, Optional
from anthropic import Anthropic

from config import (
    ANTHROPIC_API_KEY,
    JUDGE_MODEL,
    EVALUATION_WEIGHTS,
    QUALITY_THRESHOLD,
)


class EvaluationScores(TypedDict):
    clarity: float
    difficulty_alignment: float
    distractor_quality: float
    educational_value: float
    skill_relevance: float


class EvaluationResult(TypedDict):
    scores: EvaluationScores
    composite_score: float
    passed: bool
    reasons: dict[str, str]


# Evaluation prompt template (matches TypeScript config/evaluation.ts)
EVALUATION_PROMPT_TEMPLATE = """You are an expert educator evaluating the quality of a multiple-choice question.

## Challenge to Evaluate
**Skill Being Tested**: {skill_name}
**Skill Description**: {skill_description}
**Target Difficulty**: {target_difficulty}/10

**Question**: {question}
**Options**:
A) {option_0}
B) {option_1}
C) {option_2}
D) {option_3}
**Correct Answer**: {correct_letter}) {correct_option}
**Explanation**: {explanation}

## Evaluation Criteria
Rate each dimension from 0-10, where 0 is completely failing and 10 is excellent. Provide a brief reason for each score.

1. **CLARITY**: Is the question clear and unambiguous? Could a competent person misinterpret what's being asked?

2. **DIFFICULTY_ALIGNMENT**: Does the question's complexity appropriately match the target difficulty of {target_difficulty}/10? Consider: vocabulary level, required knowledge depth, cognitive load.

3. **DISTRACTOR_QUALITY**: Are the wrong options plausible enough to require real knowledge to eliminate, but clearly incorrect to someone who understands the material?

4. **EDUCATIONAL_VALUE**: Does the explanation effectively teach WHY the correct answer is right? Would a learner gain understanding?

5. **SKILL_RELEVANCE**: Does this question genuinely test competence in "{skill_name}" as described?

CRITICAL: You MUST return ALL 5 scores and ALL 5 reasons. Missing fields will invalidate the evaluation.

Return ONLY valid JSON with no markdown formatting. Example format:
{{"clarity": 7, "clarityReason": "The question is clear because...", "difficultyAlignment": 6, "difficultyReason": "The difficulty matches because...", "distractorQuality": 8, "distractorReason": "The distractors are good because...", "educationalValue": 7, "educationalReason": "The explanation teaches...", "skillRelevance": 9, "relevanceReason": "This tests the skill because...", "overall": "Good question with minor issues in X"}}

Your response (JSON only, no other text):"""


class ChallengeEvaluator:
    """LLM-as-Judge evaluator for challenge quality."""

    def __init__(self, api_key: Optional[str] = None):
        self.client = Anthropic(api_key=api_key or ANTHROPIC_API_KEY)

    def evaluate(
        self,
        challenge: dict,
        skill_name: str,
        skill_description: str,
        target_difficulty: int,
    ) -> EvaluationResult:
        """
        Evaluate a generated challenge using LLM-as-Judge.
        Returns scores, composite score, and pass/fail status.
        """
        prompt = self._build_prompt(
            challenge=challenge,
            skill_name=skill_name,
            skill_description=skill_description,
            target_difficulty=target_difficulty,
        )

        try:
            message = self.client.messages.create(
                model=JUDGE_MODEL,
                max_tokens=1024,
                temperature=0.3,  # Lower temperature for consistent evaluation
                messages=[{"role": "user", "content": prompt}],
            )

            response_text = message.content[0].text if message.content else ""
            return self._parse_response(response_text)

        except Exception as e:
            print(f"[Evaluator] Evaluation failed: {e}")
            return self._create_failed_evaluation(str(e))

    def _build_prompt(
        self,
        challenge: dict,
        skill_name: str,
        skill_description: str,
        target_difficulty: int,
    ) -> str:
        """Build the evaluation prompt from template."""
        correct_index = challenge.get("correctAnswerIndex", 0)
        options = challenge.get("options", ["", "", "", ""])
        correct_letter = ["A", "B", "C", "D"][correct_index]

        return EVALUATION_PROMPT_TEMPLATE.format(
            skill_name=skill_name,
            skill_description=skill_description,
            target_difficulty=target_difficulty,
            question=challenge.get("question", ""),
            option_0=options[0] if len(options) > 0 else "",
            option_1=options[1] if len(options) > 1 else "",
            option_2=options[2] if len(options) > 2 else "",
            option_3=options[3] if len(options) > 3 else "",
            correct_letter=correct_letter,
            correct_option=options[correct_index] if correct_index < len(options) else "",
            explanation=challenge.get("explanation", "No explanation provided"),
        )

    def _parse_response(self, response: str) -> EvaluationResult:
        """Parse the LLM evaluation response into structured scores."""
        try:
            # Strip markdown code blocks if present
            cleaned = response
            code_block_match = re.search(r"```(?:json)?\n?([\s\S]*)\n?```\s*$", response)
            if code_block_match:
                cleaned = code_block_match.group(1).strip()

            # Extract JSON object
            json_match = re.search(r"\{[\s\S]*\}", cleaned)
            if not json_match:
                raise ValueError("No JSON found in response")

            parsed = json.loads(json_match.group(0))

            # Extract raw scores (handle various naming conventions)
            raw_scores = {
                "clarity": parsed.get("clarity") or parsed.get("Clarity"),
                "difficulty_alignment": (
                    parsed.get("difficultyAlignment")
                    or parsed.get("difficulty_alignment")
                    or parsed.get("DIFFICULTY_ALIGNMENT")
                ),
                "distractor_quality": (
                    parsed.get("distractorQuality")
                    or parsed.get("distractor_quality")
                    or parsed.get("DISTRACTOR_QUALITY")
                ),
                "educational_value": (
                    parsed.get("educationalValue")
                    or parsed.get("educational_value")
                    or parsed.get("EDUCATIONAL_VALUE")
                ),
                "skill_relevance": (
                    parsed.get("skillRelevance")
                    or parsed.get("skill_relevance")
                    or parsed.get("SKILL_RELEVANCE")
                ),
            }

            # Normalize scores (0-10 from LLM -> 0-1)
            scores: EvaluationScores = {
                "clarity": self._normalize_score(raw_scores["clarity"]),
                "difficulty_alignment": self._normalize_score(raw_scores["difficulty_alignment"]),
                "distractor_quality": self._normalize_score(raw_scores["distractor_quality"]),
                "educational_value": self._normalize_score(raw_scores["educational_value"]),
                "skill_relevance": self._normalize_score(raw_scores["skill_relevance"]),
            }

            # Extract reasons
            reasons = {
                "clarity": parsed.get("clarityReason", "No reason provided"),
                "difficulty_alignment": parsed.get("difficultyReason", "No reason provided"),
                "distractor_quality": parsed.get("distractorReason", "No reason provided"),
                "educational_value": parsed.get("educationalReason", "No reason provided"),
                "skill_relevance": parsed.get("relevanceReason", "No reason provided"),
                "overall": parsed.get("overall", "No overall summary"),
            }

            # Calculate weighted composite score
            composite_score = self._calculate_composite(scores)
            passed = composite_score >= QUALITY_THRESHOLD

            return {
                "scores": scores,
                "composite_score": composite_score,
                "passed": passed,
                "reasons": reasons,
            }

        except Exception as e:
            print(f"[Evaluator] Failed to parse response: {e}")
            print(f"[Evaluator] Response was: {response[:500]}")
            return self._create_failed_evaluation(f"Parse error: {e}")

    def _normalize_score(self, value) -> float:
        """Normalize a 0-10 score to 0-1 range."""
        if not isinstance(value, (int, float)):
            return 0.0
        clamped = max(0, min(10, value))
        return clamped / 10

    def _calculate_composite(self, scores: EvaluationScores) -> float:
        """Calculate weighted composite score from individual scores."""
        return (
            scores["clarity"] * EVALUATION_WEIGHTS["clarity"]
            + scores["difficulty_alignment"] * EVALUATION_WEIGHTS["difficulty_alignment"]
            + scores["distractor_quality"] * EVALUATION_WEIGHTS["distractor_quality"]
            + scores["educational_value"] * EVALUATION_WEIGHTS["educational_value"]
            + scores["skill_relevance"] * EVALUATION_WEIGHTS["skill_relevance"]
        )

    def _create_failed_evaluation(self, reason: str) -> EvaluationResult:
        """Create a failed evaluation result."""
        return {
            "scores": {
                "clarity": 0.0,
                "difficulty_alignment": 0.0,
                "distractor_quality": 0.0,
                "educational_value": 0.0,
                "skill_relevance": 0.0,
            },
            "composite_score": 0.0,
            "passed": False,
            "reasons": {
                "clarity": reason,
                "difficulty_alignment": reason,
                "distractor_quality": reason,
                "educational_value": reason,
                "skill_relevance": reason,
                "overall": reason,
            },
        }


def is_valid_challenge(challenge: dict) -> bool:
    """Validate that a challenge has the required structure."""
    # Check question
    question = challenge.get("question", "")
    if not question or len(question) < 10:
        return False
    if len(question) > 500:
        return False

    # Check options
    options = challenge.get("options", [])
    if not isinstance(options, list) or len(options) != 4:
        return False

    for option in options:
        if not option or len(str(option)) < 1:
            return False
        if len(str(option)) > 200:
            return False

    # Check correct answer index
    correct_index = challenge.get("correctAnswerIndex")
    if not isinstance(correct_index, int) or correct_index < 0 or correct_index > 3:
        return False

    # Check for duplicate options
    if len(set(options)) != len(options):
        return False

    return True


# Singleton instance
_evaluator: Optional[ChallengeEvaluator] = None


def get_evaluator() -> ChallengeEvaluator:
    """Get or create the evaluator singleton."""
    global _evaluator
    if _evaluator is None:
        _evaluator = ChallengeEvaluator()
    return _evaluator
