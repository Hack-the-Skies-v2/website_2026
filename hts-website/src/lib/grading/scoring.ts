import type { Question, QuestionId } from "./types";

export const SCORE_MIN = 1;
export const SCORE_MAX = 10;
export const SCORE_STEP = 0.5;

export function isValidScore(value: number): boolean {
  if (!Number.isFinite(value)) return false;
  if (value < SCORE_MIN || value > SCORE_MAX) return false;
  return Number.isInteger(value / SCORE_STEP);
}

/** Weighted composite on the 1–10 scale. Null until every question is scored. */
export function compositeScore(
  scores: Record<QuestionId, number>,
  questions: Question[],
): number | null {
  const totalWeight = questions.reduce((sum, q) => sum + q.weight, 0);
  if (totalWeight <= 0) return null;

  let weighted = 0;
  for (const question of questions) {
    const score = scores[question.id];
    if (score == null) return null;
    weighted += score * question.weight;
  }

  return weighted / totalWeight;
}

/** Slider positions: 0 is unrated; 1…SCORE_POSITIONS map onto the 1–10 scale. */
export const SCORE_POSITIONS = (SCORE_MAX - SCORE_MIN) / SCORE_STEP + 1;

export function scoreToPosition(score: number | null): number {
  if (score == null) return 0;
  return Math.round((score - SCORE_MIN) / SCORE_STEP) + 1;
}

export function positionToScore(position: number): number | null {
  if (position <= 0) return null;
  return SCORE_MIN + (position - 1) * SCORE_STEP;
}

export function averageComposite(
  gradeScores: Record<QuestionId, number>[],
  questions: Question[],
): number | null {
  const composites = gradeScores
    .map((scores) => compositeScore(scores, questions))
    .filter((value): value is number => value != null);
  if (composites.length === 0) return null;
  return composites.reduce((sum, value) => sum + value, 0) / composites.length;
}
