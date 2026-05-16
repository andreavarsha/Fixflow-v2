type ChatMessage = { role: string; content: string };

export type LlmImage = {
  mimeType: string;
  base64: string;
};

const OPENAI_MODEL = "gpt-4o-mini";
const OPENROUTER_MODEL = "openai/gpt-4o-mini";

/** JSON from classify / translate. OpenAI first, OpenRouter fallback (PRD build strategy). */
export async function chatJson(
  messages: ChatMessage[],
  label: string,
  image?: LlmImage,
): Promise<string> {
  const errors: string[] = [];

  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      return await callOpenAiCompatible(
        "https://api.openai.com/v1/chat/completions",
        openaiKey,
        OPENAI_MODEL,
        messages,
        label,
        image,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(`OpenAI: ${msg}`);
      console.error(`${label}: OpenAI failed`, error);
    }
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    try {
      if (image) {
        console.warn(
          `${label}: OpenRouter fallback uses text only (no photo).`,
        );
      }
      return await callOpenAiCompatible(
        "https://openrouter.ai/api/v1/chat/completions",
        openRouterKey,
        OPENROUTER_MODEL,
        messages,
        label,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(`OpenRouter: ${msg}`);
      console.error(`${label}: OpenRouter failed`, error);
    }
  }

  const hint =
    errors.length > 0
      ? errors.join(" | ")
      : "Set OPENAI_API_KEY (and optionally OPENROUTER_API_KEY) in Convex environment variables.";
  throw new Error(`${label} failed. ${hint}`);
}

function buildOpenAiMessages(
  messages: ChatMessage[],
  image?: LlmImage,
): Array<{ role: string; content: string | OpenAiContentPart[] }> {
  if (!image) {
    return messages;
  }

  const result: Array<{ role: string; content: string | OpenAiContentPart[] }> =
    [];
  let imageAttached = false;

  for (const message of messages) {
    if (message.role === "user" && !imageAttached) {
      result.push({
        role: "user",
        content: [
          { type: "text", text: message.content },
          {
            type: "image_url",
            image_url: {
              url: `data:${image.mimeType};base64,${image.base64}`,
            },
          },
        ],
      });
      imageAttached = true;
      continue;
    }
    result.push(message);
  }

  return result;
}

type OpenAiContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

async function callOpenAiCompatible(
  url: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  label: string,
  image?: LlmImage,
): Promise<string> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: buildOpenAiMessages(messages, image),
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${label} LLM HTTP ${response.status}: ${body.slice(0, 280)}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error(`${label} LLM returned empty content`);
  return unwrapJsonText(content);
}

function unwrapJsonText(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}
