import type { ApplicationType, Question } from "./types";

/** Keep in sync with ApplicationForm hacker questions. */
export const HACKER_QUESTIONS: Question[] = [
  {
    id: "hacker-q1",
    position: 1,
    prompt: "What are you hoping to learn or build at Hack the Skies?",
    weight: 1,
  },
  {
    id: "hacker-q2",
    position: 2,
    prompt: "Describe a project or idea you are proud of.",
    weight: 1,
  },
  {
    id: "hacker-q3",
    position: 3,
    prompt: "How do you approach solving a difficult problem?",
    weight: 1,
  },
  {
    id: "hacker-q4",
    position: 4,
    prompt: "What role do you usually play on a team?",
    weight: 1,
  },
  {
    id: "hacker-q5",
    position: 5,
    prompt: "What would you contribute to the Hack the Skies community?",
    weight: 1,
  },
];

/** Keep in sync with ApplicationForm mentor fields used for review. */
export const MENTOR_QUESTIONS: Question[] = [
  {
    id: "mentor-q1",
    position: 1,
    prompt: "What technologies, programming languages, or tools are you most familiar with?",
    weight: 1,
  },
  {
    id: "mentor-q2",
    position: 2,
    prompt:
      "Have you mentored, taught, tutored, or worked with high-school students before? If yes, briefly describe.",
    weight: 1,
  },
  {
    id: "mentor-q3",
    position: 3,
    prompt: "What are you hoping to get out of mentoring at Hack the Skies?",
    weight: 1,
  },
];

/** Keep in sync with ApplicationForm judge fields used for review. */
export const JUDGE_QUESTIONS: Question[] = [
  {
    id: "judge-q1",
    position: 1,
    prompt: "What makes a strong hackathon project?",
    weight: 1,
  },
  {
    id: "judge-q2",
    position: 2,
    prompt: "Briefly describe your professional background and expertise.",
    weight: 1,
  },
  {
    id: "judge-q3",
    position: 3,
    prompt:
      "Have you judged a hackathon, competition, pitch competition, science fair, or similar event? If yes, briefly describe.",
    weight: 1,
  },
];

export function questionsForType(type: ApplicationType): Question[] {
  if (type === "mentor") return MENTOR_QUESTIONS;
  if (type === "judge") return JUDGE_QUESTIONS;
  return HACKER_QUESTIONS;
}

export function answersByQuestion(
  type: ApplicationType,
  answers: unknown,
): { question: Question; text: string }[] {
  const questions = questionsForType(type);
  const list = Array.isArray(answers)
    ? answers.map((answer) => (typeof answer === "string" ? answer : String(answer ?? "")))
    : [];

  return questions.map((question, index) => ({
    question,
    text: list[index]?.trim() || "",
  }));
}
