import { getCategory, type Category } from "./categories";
import { patternsForDifficulty, type IdeaPattern } from "./idea-patterns";
import type {
  Difficulty,
  GenerateRequest,
  ProjectIdea,
  QualitiesRequest,
} from "./types";

function clampCount(count: number) {
  if (!Number.isFinite(count)) return 8;
  return Math.min(20, Math.max(1, Math.round(count)));
}

function pickWeeks(range: [number, number]) {
  const [min, max] = range;
  return min + Math.floor(Math.random() * (max - min + 1));
}

function shuffle<T>(items: T[]) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function hasTech(techs: string[], name: string) {
  return techs.some((item) => item.toLowerCase() === name.toLowerCase());
}

export function describeArchitecture(technologies: string[]) {
  const techs = technologies.length > 0 ? technologies : ["Next.js", "TypeScript"];
  const front = hasTech(techs, "Next.js")
    ? "a Next.js App Router UI"
    : hasTech(techs, "React")
      ? "a React UI"
      : hasTech(techs, "Vue")
        ? "a Vue UI"
        : hasTech(techs, "Svelte")
          ? "a Svelte UI"
          : "a typed web UI";

  const style = hasTech(techs, "Tailwind CSS")
    ? "styled with Tailwind CSS"
    : "with a tight custom layout system";

  let api: string;
  if (hasTech(techs, "Express") && hasTech(techs, "Next.js")) {
    api = "Next.js for the product surface and an Express API on Node.js for domain routes";
  } else if (hasTech(techs, "Express")) {
    api = "an Express API on Node.js";
  } else if (hasTech(techs, "Fastify")) {
    api = "a Fastify API";
  } else if (hasTech(techs, "NestJS")) {
    api = "a NestJS API";
  } else if (hasTech(techs, "FastAPI")) {
    api = "a FastAPI backend";
  } else if (hasTech(techs, "Next.js")) {
    api = "Next.js Route Handlers as the BFF";
  } else if (hasTech(techs, "Node.js")) {
    api = "Node.js HTTP handlers";
  } else {
    api = "a small HTTP API";
  }

  const dataParts = ["PostgreSQL", "SQLite", "MongoDB"].filter((name) =>
    hasTech(techs, name),
  );
  const orm = hasTech(techs, "Prisma")
    ? " via Prisma"
    : hasTech(techs, "Drizzle")
      ? " via Drizzle"
      : "";
  const data =
    dataParts.length > 0
      ? `persist in ${dataParts.join(" and ")}${orm}`
      : "start with a file- or SQLite-backed store so the first slice ships";

  const extras: string[] = [];
  if (hasTech(techs, "Redis")) extras.push("Redis for cache or ephemeral presence");
  if (hasTech(techs, "WebSockets")) extras.push("WebSockets for live updates");
  if (hasTech(techs, "tRPC")) extras.push("tRPC for typed procedures");
  if (hasTech(techs, "Auth.js")) extras.push("Auth.js for sessions");
  if (hasTech(techs, "Stripe")) extras.push("Stripe for checkout");
  if (hasTech(techs, "Three.js")) extras.push("Three.js for 3D scenes");
  if (hasTech(techs, "PixiJS")) extras.push("PixiJS for 2D scenes");
  if (hasTech(techs, "WebGL")) extras.push("WebGL for the render path");
  if (hasTech(techs, "Canvas 2D")) extras.push("Canvas 2D for the first playable view");
  if (hasTech(techs, "Electron")) extras.push("Electron as a desktop shell");
  if (hasTech(techs, "Tauri")) extras.push("Tauri as a desktop shell");

  const extraLine =
    extras.length > 0 ? ` Layer in ${extras.join("; ")}.` : "";

  return `Build ${front} ${style}. Use ${api}, and ${data}.${extraLine}`;
}

function promptScore(
  category: Category,
  pattern: IdeaPattern,
  built: ReturnType<IdeaPattern["build"]>,
  prompt: string,
) {
  const words = prompt
    .toLowerCase()
    .split(/[^a-z0-9+]+/)
    .filter((word) => word.length > 3);
  if (words.length === 0) return 1;
  const hay = [
    category.name,
    category.description,
    category.actors.join(" "),
    category.objects.join(" "),
    built.title,
    built.pitch,
    built.features.join(" "),
    pattern.id,
  ]
    .join(" ")
    .toLowerCase();
  return words.reduce((score, word) => score + (hay.includes(word) ? 3 : 0), 1);
}

function toIdea(
  category: Category,
  pattern: IdeaPattern,
  technologies: string[],
): ProjectIdea {
  const built = pattern.build(category);
  return {
    id: crypto.randomUUID(),
    title: built.title,
    summary: built.pitch,
    domain: category.name,
    categoryId: category.id,
    categoryName: category.name,
    categoryDescription: category.description,
    difficulty: pattern.difficulty,
    estimatedWeeks: pickWeeks(pattern.weeks),
    technologies,
    features: built.features,
    learningOutcomes: pattern.learning,
    audience: built.audience,
    complexityDrivers: pattern.complexity,
    mvpScope: built.mvp,
    dataModel: built.dataModel,
    architecture: `${describeArchitecture(technologies)} Domain constraint: ${category.description}`,
    status: "idea",
    analysis: null,
    source: "local",
    createdAt: new Date().toISOString(),
  };
}

export function generateIdeasLocally(request: GenerateRequest): ProjectIdea[] {
  const category = getCategory(request.categoryId);
  if (!category) {
    throw new Error("Choose an industry category before generating ideas.");
  }

  const technologies =
    request.technologies.length > 0
      ? request.technologies
      : ["Next.js", "TypeScript", "Tailwind CSS"];
  const count = clampCount(request.count);
  const pool = patternsForDifficulty(request.difficulty);
  const images = request.images ?? [];
  const prompt =
    request.prompt +
    (images.length > 0
      ? ` screenshot mockup ui layout ${images.map((image) => image.name).join(" ")}`
      : "");

  const ranked = shuffle(pool)
    .map((pattern) => {
      const built = pattern.build(category);
      return {
        pattern,
        score: promptScore(category, pattern, built, prompt),
      };
    })
    .sort((a, b) => b.score - a.score);

  const selected: IdeaPattern[] = [];
  for (const item of ranked) {
    if (selected.length >= count) break;
    selected.push(item.pattern);
  }

  if (selected.length < count) {
    const extra = shuffle(pool).filter(
      (pattern) => !selected.some((picked) => picked.id === pattern.id),
    );
    selected.push(...extra.slice(0, count - selected.length));
  }

  return selected.map((pattern) => toIdea(category, pattern, technologies));
}

function mentions(prompt: string, keys: string[]) {
  const hay = prompt.toLowerCase();
  return keys.some((key) => hay.includes(key));
}

function architectureBrief(project: ProjectIdea) {
  return [
    `Stack: ${project.technologies.join(", ") || "your chosen stack"}.`,
    project.architecture,
    `Suggested first folders: app/ (or src/ui), server/ (Express routes or Route Handlers), lib/${project.categoryId || "domain"} (industry rules), and components/ for ${project.features
      .slice(0, 3)
      .join(", ")}.`,
    `Keep the first vertical slice to: ${project.mvpScope}`,
  ].join("\n\n");
}

function effortBrief(project: ProjectIdea) {
  return [
    `Difficulty: ${project.difficulty}. Plan on about ${project.estimatedWeeks} week${project.estimatedWeeks === 1 ? "" : "s"} for an honest MVP, not a portfolio skin.`,
    `What makes it harder than a tutorial: ${project.complexityDrivers.join("; ")}.`,
    `If the estimate slips, cut toward "${project.mvpScope}" and leave polish for a second pass.`,
  ].join("\n\n");
}

function dataBrief(project: ProjectIdea) {
  return [
    `Core records: ${project.dataModel}.`,
    `Model the happy path first, then add the constraints that usually bite in ${project.categoryName} (${project.complexityDrivers[0] ?? "validation"}).`,
    `Expose list + create + update for the primary entity before you build charts or live features.`,
  ].join("\n\n");
}

function learningBrief(project: ProjectIdea) {
  return [
    `You will actually practice: ${project.learningOutcomes.join(", ")}.`,
    `Audience: ${project.audience}.`,
    `Treat ${project.features[0]} as the skill you can demo; everything else is supporting tissue.`,
  ].join("\n\n");
}

function mvpBrief(project: ProjectIdea) {
  return [
    `MVP: ${project.mvpScope}`,
    `Ship these in order: ${project.features.join(" → ")}.`,
    `Stretch only after the MVP is usable by ${project.audience.toLowerCase()}.`,
  ].join("\n\n");
}

function authBrief(project: ProjectIdea) {
  return [
    `In ${project.categoryName}, ${project.audience.toLowerCase()} and staff rarely share the same permissions.`,
    `Gate writes first (create/update/delete) and leave public reads open only if discovery is part of the product.`,
    `Edge cases: duplicate identities, abandoned sessions, and what happens when a member leaves shared ${project.categoryName.toLowerCase()} data.`,
  ].join("\n\n");
}

function testingBrief(project: ProjectIdea) {
  return [
    `Test the domain math, not the chrome. Highest value cases: ${project.complexityDrivers.join("; ")}.`,
    `Add one integration path for the MVP: ${project.mvpScope}`,
    `Skip visual snapshot tests until the information architecture is stable.`,
  ].join("\n\n");
}

function industryBrief(project: ProjectIdea) {
  return [
    `Industry: ${project.categoryName}.`,
    project.categoryDescription || project.summary,
    `The product is only interesting if ${project.features[0]} is true to that industry — a generic CRUD app with this label slapped on does not count.`,
  ].join("\n\n");
}

function qualitiesOverview(project: ProjectIdea) {
  return [
    `${project.title} is a ${project.difficulty} ${project.categoryName} project.`,
    project.summary,
    `Time box: ~${project.estimatedWeeks} weeks. Audience: ${project.audience}.`,
    `Complexity drivers: ${project.complexityDrivers.join("; ")}.`,
    `Learning: ${project.learningOutcomes.join(", ")}.`,
  ].join("\n\n");
}

export function analyzeProjectLocally(request: QualitiesRequest): string {
  const { project } = request;
  const prompt = request.prompt.trim();
  const images = request.images ?? [];
  const sections: { title: string; body: string }[] = [
    { title: "Qualities", body: qualitiesOverview(project) },
    { title: "Industry depth", body: industryBrief(project) },
  ];

  const includeAll = prompt.length === 0;
  const wantsArch = includeAll || mentions(prompt, ["architect", "folder", "structure", "stack", "route"]);
  const wantsMvp = includeAll || mentions(prompt, ["mvp", "scope", "stretch", "feature", "ship"]);
  const wantsLearn = includeAll || mentions(prompt, ["learn", "skill", "outcome", "practice"]);
  const wantsEffort = includeAll || mentions(prompt, ["time", "week", "difficult", "risk", "estimate"]);
  const wantsData = includeAll || mentions(prompt, ["data", "schema", "database", "model", "postgres", "sql"]);
  const wantsAuth = mentions(prompt, ["auth", "permission", "security", "role", "login"]);
  const wantsTest = mentions(prompt, ["test", "edge", "qa", "fail"]);

  if (wantsArch) sections.push({ title: "Architecture", body: architectureBrief(project) });
  if (wantsMvp) sections.push({ title: "MVP vs later", body: mvpBrief(project) });
  if (wantsLearn) sections.push({ title: "What you will learn", body: learningBrief(project) });
  if (wantsEffort) sections.push({ title: "Time, difficulty, risk", body: effortBrief(project) });
  if (wantsData) sections.push({ title: "Data model", body: dataBrief(project) });
  if (wantsAuth) sections.push({ title: "Auth and access", body: authBrief(project) });
  if (wantsTest) sections.push({ title: "Tests and edges", body: testingBrief(project) });

  if (images.length > 0) {
    sections.push({
      title: "Reference images",
      body: [
        `Attached: ${images.map((image) => image.name).join(", ")}.`,
        `Treat these as the UI or product the builder wants this ${project.categoryName} idea to resemble or improve.`,
        `Map the first slice (${project.mvpScope}) onto what those images show instead of inventing a parallel interface.`,
      ].join("\n\n"),
    });
  }

  if (prompt) {
    sections.push({
      title: "Your prompt",
      body: [
        `You asked: ${prompt}`,
        `Read that against ${project.title} in ${project.categoryName}. ${project.categoryDescription}`,
        `If you implement this week, start with ${project.features[0]} on ${project.technologies.slice(0, 3).join(", ") || "your stack"}, and do not open ${project.features[project.features.length - 1]} until that path works.`,
      ].join("\n\n"),
    });
  }

  return sections.map((section) => `## ${section.title}\n\n${section.body}`).join("\n\n");
}

export function ideaFromLlmPayload(
  payload: Record<string, unknown>,
  technologies: string[],
  category: Category,
): ProjectIdea | null {
  const title = typeof payload.title === "string" ? payload.title.trim() : "";
  const summary =
    typeof payload.summary === "string" ? payload.summary.trim() : "";
  if (!title || !summary) return null;

  const difficulty =
    payload.difficulty === "beginner" ||
    payload.difficulty === "intermediate" ||
    payload.difficulty === "advanced"
      ? payload.difficulty
      : "intermediate";

  const estimatedWeeks = Number(payload.estimatedWeeks);
  const weeks = Number.isFinite(estimatedWeeks)
    ? Math.min(16, Math.max(1, Math.round(estimatedWeeks)))
    : 3;

  const asStringArray = (value: unknown) =>
    Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [];

  return {
    id: crypto.randomUUID(),
    title,
    summary,
    domain: category.name,
    categoryId: category.id,
    categoryName: category.name,
    categoryDescription: category.description,
    difficulty,
    estimatedWeeks: weeks,
    technologies,
    features: asStringArray(payload.features).slice(0, 6),
    learningOutcomes: asStringArray(payload.learningOutcomes).slice(0, 6),
    audience: typeof payload.audience === "string" ? payload.audience : category.customer,
    complexityDrivers: asStringArray(payload.complexityDrivers).slice(0, 6),
    mvpScope:
      typeof payload.mvpScope === "string"
        ? payload.mvpScope
        : "Ship a usable happy path before extras.",
    dataModel:
      typeof payload.dataModel === "string"
        ? payload.dataModel
        : `${category.objects.slice(0, 4).join(", ")}`,
    architecture:
      typeof payload.architecture === "string"
        ? payload.architecture
        : describeArchitecture(technologies),
    status: "idea",
    analysis: null,
    source: "llm",
    createdAt: new Date().toISOString(),
  };
}

export function isDifficulty(value: unknown): value is Difficulty | "mixed" {
  return (
    value === "mixed" ||
    value === "beginner" ||
    value === "intermediate" ||
    value === "advanced"
  );
}
