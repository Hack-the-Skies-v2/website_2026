import type { ApplicationType, Question } from "./types";

/**
 * Review prompts for each application track.
 * Keep these aligned with the apply form so answer indices map cleanly.
 */
const HACKER_QUESTIONS: Question[] = [
  {
    id: "hacker-q1",
    position: 1,
    prompt: "Tell us about something you built or made that you are proud of.",
    weight: 1,
  },
  {
    id: "hacker-q2",
    position: 2,
    prompt: "Why do you want to attend Hack the Skies 2026?",
    weight: 1,
  },
  {
    id: "hacker-q3",
    position: 3,
    prompt: "What do you hope to learn or contribute during the weekend?",
    weight: 1,
  },
];

const MENTOR_QUESTIONS: Question[] = [
  {
    id: "mentor-q1",
    position: 1,
    prompt: "What experience do you bring that would help mentees at Hack the Skies?",
    weight: 1,
  },
  {
    id: "mentor-q2",
    position: 2,
    prompt: "How do you usually support students when they get stuck?",
    weight: 1,
  },
  {
    id: "mentor-q3",
    position: 3,
    prompt: "Why do you want to mentor at Hack the Skies 2026?",
    weight: 1,
  },
];

export function questionsForType(type: ApplicationType): Question[] {
  return type === "mentor" ? MENTOR_QUESTIONS : HACKER_QUESTIONS;
}

/** Map stored answer array indices onto the question set for this track. */
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
