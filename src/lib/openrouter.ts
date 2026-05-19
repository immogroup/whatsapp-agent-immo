import OpenAI from "openai";

function getClient(): OpenAI {
  return new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY!,
    defaultHeaders: {
      "HTTP-Referer": process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      "X-Title": "C9 AI Concierge",
    },
  });
}

export async function getAIResponse(
  history: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const systemPrompt =
    process.env.AI_SYSTEM_PROMPT ||
    "You are C9, a helpful AI concierge assistant. Be friendly, concise, and professional.";

  const completion = await getClient().chat.completions.create({
    model: process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini",
    messages: [{ role: "system", content: systemPrompt }, ...history],
    max_tokens: 500,
  });

  return (
    completion.choices[0]?.message?.content ||
    "Sorry, I could not generate a response at this time."
  );
}
