export type QuestionId = string;

export type Question = {
  id: QuestionId;
  position: number;
  prompt: string;
  weight: number;
};

export type ApplicationType = "hacker" | "mentor";

export type OrganizerGrade = {
  applicationId: string;
  graderId: string;
  scores: Record<QuestionId, number>;
};
