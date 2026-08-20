import { getCategory } from "@/lib/categories";
import { parsePromptImages } from "@/lib/images";
import { completeJson, isLlmConfigured, userContent } from "@/lib/llm";
import { planFromLlmPayload, planProductLocally } from "@/lib/local-plan";
import type { PlanRequest, ProductPlan } from "@/lib/types";

function parseRequest(body: unknown): PlanRequest {
  if (!body || typeof body !== "object") {
    throw new Error("Expected a JSON object");
  }
  const input = body as Record<string, unknown>;
  const title = typeof input.title === "string" ? input.title.trim() : "";
  const brief = typeof input.brief === "string" ? input.brief : "";
  if (!title && !brief.trim()) {
    throw new Error("Give the product a name or a brief before planning.");
  }
  const technologies = Array.isArray(input.technologies)
    ? input.technologies.filter(
        (item): item is string => typeof item === "string" && item.trim().length > 0,
      )
    : [];
  const categoryId =
    typeof input.categoryId === "string" && input.categoryId.length > 0
      ? input.categoryId
      : null;
  if (categoryId && !getCategory(categoryId)) {
    throw new Error("Unknown industry category");
  }

  return {
    title: title || "Untitled large product",
    brief,
    technologies,
    categoryId,
    images: parsePromptImages(input.images),
  };
}

function toPlan(
  draft: ReturnType<typeof planProductLocally>,
  source: ProductPlan["source"],
): ProductPlan {
  return {
    ...draft,
    id: crypto.randomUUID(),
    source,
    createdAt: new Date().toISOString(),
  };
}

async function planWithLlm(request: PlanRequest): Promise<ProductPlan> {
  const category = getCategory(request.categoryId);
  const payload = await completeJson([
    {
      role: "system",
      content: [
        "You write implementation plans for EXTREMELY LARGE software products (game clones, tycoons, ERPs, platforms).",
        "The plan must be phased, honest about years vs weeks, and stop the builder from boiling the ocean.",
        "Return JSON: { \"title\": string, \"markdown\": string, \"phases\": [ { \"name\": string, \"goal\": string, \"deliverables\": string[] } ] }.",
        "markdown uses ## headings. Cover thesis, non-goals, systems order, vertical slice, modules, data, risks, first ten days, staffing.",
        "If this is a commercial-game clone, say inspired-by systems only — no ripping assets.",
        "If images are attached, use them as visual reference.",
        "No emojis. No motivational filler.",
      ].join(" "),
    },
    {
      role: "user",
      content: userContent(
        JSON.stringify({
          title: request.title,
          brief: request.brief,
          technologies: request.technologies,
          category: category
            ? { id: category.id, name: category.name, description: category.description }
            : null,
        }),
        request.images,
      ),
    },
  ]);

  const draft = planFromLlmPayload(payload, request);
  if (!draft) {
    throw new Error("LLM returned no plan");
  }
  return toPlan(draft, "llm");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = parseRequest(body);

    if (isLlmConfigured()) {
      try {
        const plan = await planWithLlm(input);
        return Response.json({ plan, source: "llm" as const });
      } catch (reason) {
        const message = reason instanceof Error ? reason.message : "LLM failed";
        return Response.json({
          plan: toPlan(planProductLocally(input), "local"),
          source: "local" as const,
          fallback: message,
        });
      }
    }

    return Response.json({
      plan: toPlan(planProductLocally(input), "local"),
      source: "local" as const,
    });
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Unexpected error";
    return new Response(message, { status: 400 });
  }
}
