import type { PromptImage } from "./images";

export type Difficulty = "beginner" | "intermediate" | "advanced";

export type ProjectStatus = "idea" | "done";

export type ProjectIdea = {
  id: string;
  title: string;
  summary: string;
  domain: string;
  categoryId: string;
  categoryName: string;
  categoryDescription: string;
  difficulty: Difficulty;
  estimatedWeeks: number;
  technologies: string[];
  features: string[];
  learningOutcomes: string[];
  audience: string;
  complexityDrivers: string[];
  mvpScope: string;
  dataModel: string;
  architecture: string;
  status: ProjectStatus;
  analysis: string | null;
  source: "local" | "llm";
  createdAt: string;
};

export type GenerateRequest = {
  technologies: string[];
  count: number;
  difficulty: Difficulty | "mixed";
  prompt: string;
  categoryId: string;
  images: PromptImage[];
};

export type QualitiesRequest = {
  project: ProjectIdea;
  prompt: string;
  images: PromptImage[];
};
