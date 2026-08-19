import { isLlmConfigured } from "@/lib/llm";

export async function GET() {
  return Response.json({
    llm: isLlmConfigured(),
    model: isLlmConfigured() ? (process.env.OPENAI_MODEL ?? "gpt-4o-mini") : null,
  });
}
