import { getCategory } from "@/lib/categories";
import { parsePromptImages } from "@/lib/images";
import { completeJson, isLlmConfigured, userContent } from "@/lib/llm";
import {
  generateIdeasLocally,
  ideaFromLlmPayload,
  isDifficulty,
} from "@/lib/local-studio";
import type { GenerateRequest, ProjectIdea } from "@/lib/types";

function parseRequest(body: unknown): GenerateRequest {
  if (!body || typeof body !== "object") {
    throw new Error("Expected a JSON object");
  }
  const input = body as Record<string, unknown>;
  const technologies = Array.isArray(input.technologies)
    ? input.technologies.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0,
      )
    : [];
  const count = typeof input.count === "number" ? input.count : Number(input.count);
  const difficulty = isDifficulty(input.difficulty) ? input.difficulty : "mixed";
  const prompt = typeof input.prompt === "string" ? input.prompt : "";
  const categoryId = typeof input.categoryId === "string" ? input.categoryId : "";

  if (!getCategory(categoryId)) {
    throw new Error("Choose an industry category before generating ideas.");
  }

  return {
    technologies,
    count: Number.isFinite(count) ? count : 8,
    difficulty,
    prompt,
    categoryId,
    images: parsePromptImages(input.images),
  };
}

async function generateWithLlm(request: GenerateRequest): Promise<ProjectIdea[]> {
  const category = getCategory(request.categoryId);
  if (!category) {
    throw new Error("Unknown industry category");
  }

  const payload = await completeJson([
    {
      role: "system",
      content: [
        "You invent concrete software project ideas for ONE industry vertical.",
        "Every idea must be in-depth for that industry — named actors, records, and workflows from the category description — not a generic CRUD app with the industry label slapped on.",
        "Return JSON: { \"ideas\": [ ... ] }.",
        "Each idea must include: title, summary, domain, difficulty (beginner|intermediate|advanced), estimatedWeeks (number), features (string[]), learningOutcomes (string[]), audience, complexityDrivers (string[]), mvpScope, dataModel, architecture.",
        "Ideas must actually use the requested technologies together.",
        "If images are attached, treat them as screenshots or mockups to emulate or improve. Do not use emojis. Do not invent fake APIs or companies.",
      ].join(" "),
    },
    {
      role: "user",
      content: userContent(
        JSON.stringify({
          category: {
            id: category.id,
            name: category.name,
            description: category.description,
            actors: category.actors,
            objects: category.objects,
            customer: category.customer,
            staff: category.staff,
          },
          technologies: request.technologies,
          count: request.count,
          difficulty: request.difficulty,
          extraInstructions: request.prompt,
          attachedImageNames: request.images.map((image) => image.name),
        }) +
          (request.images.length > 0
            ? " Use the attached images as visual reference for the product, UI, or workflow the builder wants."
            : ""),
        request.images,
      ),
    },
  ]);

  const rawIdeas = Array.isArray(payload.ideas) ? payload.ideas : [];
  const ideas = rawIdeas
    .map((item) =>
      item && typeof item === "object"
        ? ideaFromLlmPayload(
            item as Record<string, unknown>,
            request.technologies,
            category,
          )
        : null,
    )
    .filter((item): item is ProjectIdea => item !== null);

  if (ideas.length === 0) {
    throw new Error("LLM returned no usable ideas");
  }

  return ideas.slice(0, Math.min(20, Math.max(1, request.count)));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = parseRequest(body);

    if (isLlmConfigured()) {
      try {
        const ideas = await generateWithLlm(input);
        return Response.json({ ideas, source: "llm" as const });
      } catch (reason) {
        const ideas = generateIdeasLocally(input);
        const message =
          reason instanceof Error ? reason.message : "LLM failed";
        return Response.json({
          ideas,
          source: "local" as const,
          fallback: message,
        });
      }
    }

    return Response.json({
      ideas: generateIdeasLocally(input),
      source: "local" as const,
    });
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Unexpected error";
    const status = message.includes("industry") ? 400 : 500;
    return new Response(message, { status });
  }
}
