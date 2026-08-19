import { completeJson, isLlmConfigured, userContent } from "@/lib/llm";
import { analyzeProjectLocally } from "@/lib/local-studio";
import { parsePromptImages } from "@/lib/images";
import type { ProjectIdea, QualitiesRequest } from "@/lib/types";

function isProject(value: unknown): value is ProjectIdea {
  if (!value || typeof value !== "object") return false;
  const project = value as ProjectIdea;
  return typeof project.title === "string" && typeof project.summary === "string";
}

function parseRequest(body: unknown): QualitiesRequest {
  if (!body || typeof body !== "object") {
    throw new Error("Expected a JSON object");
  }
  const input = body as Record<string, unknown>;
  if (!isProject(input.project)) {
    throw new Error("A project is required");
  }
  return {
    project: input.project,
    prompt: typeof input.prompt === "string" ? input.prompt : "",
    images: parsePromptImages(input.images),
  };
}

async function analyzeWithLlm(input: QualitiesRequest) {
  const payload = await completeJson([
    {
      role: "system",
      content: [
        "You decode a software project for a builder who needs to decide whether to start it and how.",
        "Return JSON: { \"analysis\": \"markdown string\" }.",
        "Cover qualities they asked about. If the prompt is empty, cover architecture, MVP vs stretch, learning outcomes, time/risk, and data model.",
        "If images are attached, use them as visual reference for UI, workflow, or product direction. Be specific to THIS project, its industry vertical, and stack. Use the category description. No emojis. No generic pep talks.",
      ].join(" "),
    },
    {
      role: "user",
      content: userContent(
        JSON.stringify({
          project: {
            title: input.project.title,
            summary: input.project.summary,
            domain: input.project.domain,
            categoryId: input.project.categoryId,
            categoryName: input.project.categoryName,
            categoryDescription: input.project.categoryDescription,
            difficulty: input.project.difficulty,
            estimatedWeeks: input.project.estimatedWeeks,
            technologies: input.project.technologies,
            features: input.project.features,
            learningOutcomes: input.project.learningOutcomes,
            audience: input.project.audience,
            complexityDrivers: input.project.complexityDrivers,
            mvpScope: input.project.mvpScope,
            dataModel: input.project.dataModel,
            architecture: input.project.architecture,
          },
          prompt: input.prompt,
          attachedImageNames: input.images.map((image) => image.name),
        }),
        input.images,
      ),
    },
  ]);

  if (typeof payload.analysis !== "string" || payload.analysis.trim().length === 0) {
    throw new Error("LLM returned no analysis");
  }

  return payload.analysis;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = parseRequest(body);

    if (isLlmConfigured()) {
      try {
        const analysis = await analyzeWithLlm(input);
        return Response.json({ analysis, source: "llm" as const });
      } catch (reason) {
        const message =
          reason instanceof Error ? reason.message : "LLM failed";
        return Response.json({
          analysis: analyzeProjectLocally(input),
          source: "local" as const,
          fallback: message,
        });
      }
    }

    return Response.json({
      analysis: analyzeProjectLocally(input),
      source: "local" as const,
    });
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Unexpected error";
    return new Response(message, { status: 400 });
  }
}
