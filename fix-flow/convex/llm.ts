type ChatMessage = { role: string; content: string };

export type LlmImage = {
  mimeType: string;
  base64: string;
};

/** Fast, cheap model — same role gpt-4o-mini had for classification. */
const ANTHROPIC_MODEL = "claude-haiku-4-5";
/** OpenRouter Claude fallback if Anthropic is unavailable. */
const OPENROUTER_CLAUDE_MODEL = "anthropic/claude-haiku-4-5";

/**
 * JSON from classify. Claude (Anthropic) first; OpenRouter Claude fallback.
 */
export async function chatJson(
  messages: ChatMessage[],
  label: string,
  image?: LlmImage,
): Promise<string> {
  const errors: string[] = [];

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    try {
      return await callAnthropic(anthropicKey, ANTHROPIC_MODEL, messages, label, image);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(`Anthropic: ${msg}`);
      console.error(`${label}: Anthropic failed`, error);
    }
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    try {
      return await callOpenRouterClaude(
        openRouterKey,
        OPENROUTER_CLAUDE_MODEL,
        messages,
        label,
        image,
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
      : "Set ANTHROPIC_API_KEY (and optionally OPENROUTER_API_KEY) in Convex environment variables.";
  throw new Error(`${label} failed. ${hint}`);
}

type AnthropicContentPart =
  | { type: "text"; text: string }
  | {
      type: "image";
      source: {
        type: "base64";
        media_type: string;
        data: string;
      };
    };

function splitSystemAndMessages(messages: ChatMessage[]): {
  system: string | undefined;
  messages: ChatMessage[];
} {
  const systemParts: string[] = [];
  const rest: ChatMessage[] = [];
  for (const message of messages) {
    if (message.role === "system") {
      systemParts.push(message.content);
    } else {
      rest.push(message);
    }
  }
  return {
    system: systemParts.length > 0 ? systemParts.join("\n\n") : undefined,
    messages: rest,
  };
}

function buildAnthropicUserContent(
  text: string,
  image?: LlmImage,
): string | AnthropicContentPart[] {
  if (!image) return text;
  const mediaType =
    image.mimeType === "image/png" ||
    image.mimeType === "image/jpeg" ||
    image.mimeType === "image/gif" ||
    image.mimeType === "image/webp"
      ? image.mimeType
      : "image/jpeg";
  return [
    { type: "text", text },
    {
      type: "image",
      source: {
        type: "base64",
        media_type: mediaType,
        data: image.base64,
      },
    },
  ];
}

async function callAnthropic(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  label: string,
  image?: LlmImage,
): Promise<string> {
  const { system, messages: chatMessages } = splitSystemAndMessages(messages);

  const anthropicMessages: Array<{
    role: "user" | "assistant";
    content: string | AnthropicContentPart[];
  }> = [];

  let imageAttached = false;
  for (const message of chatMessages) {
    const role = message.role === "assistant" ? "assistant" : "user";
    if (role === "user" && image && !imageAttached) {
      anthropicMessages.push({
        role: "user",
        content: buildAnthropicUserContent(message.content, image),
      });
      imageAttached = true;
    } else {
      anthropicMessages.push({
        role,
        content: message.content,
      });
    }
  }

  if (anthropicMessages.length === 0) {
    throw new Error(`${label}: no user messages for Claude`);
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      temperature: 0.2,
      ...(system
        ? {
            system: `${system}\n\nRespond with valid JSON only — no markdown fences.`,
          }
        : {}),
      messages: anthropicMessages,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${label} Claude HTTP ${response.status}: ${body.slice(0, 280)}`);
  }

  const data = (await response.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text = data.content?.find((c) => c.type === "text")?.text;
  if (!text) throw new Error(`${label} Claude returned empty content`);
  return unwrapJsonText(text);
}

/** OpenRouter uses OpenAI-compatible chat completions for Claude models. */
async function callOpenRouterClaude(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  label: string,
  image?: LlmImage,
): Promise<string> {
  type Part =
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } };

  const openAiMessages: Array<{ role: string; content: string | Part[] }> = [];
  let imageAttached = false;
  for (const message of messages) {
    if (message.role === "user" && image && !imageAttached) {
      openAiMessages.push({
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
    } else {
      openAiMessages.push(message);
    }
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: openAiMessages,
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${label} OpenRouter HTTP ${response.status}: ${body.slice(0, 280)}`);
  }

  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error(`${label} OpenRouter returned empty content`);
  return unwrapJsonText(content);
}

function unwrapJsonText(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return fenced ? fenced[1].trim() : trimmed;
}

const TRANSLATE_SYSTEM = (lang: "si" | "ta") => `You are a professional translator working for FixFlow AI in Sri Lanka.
Translate the following home repair issue summary from English to ${lang === "si" ? "colloquial Sinhala" : "colloquial Tamil"}.
Translate for a homeowner audience. Keep the phrasing extremely natural and colloquial, not formal, literary, or academic. Keep trade terms simple (e.g. use standard local terms for plumbing, electrical, etc. that a normal homeowner uses).
Return JSON only with a single key "translated": "your translation here".`;

const ANTHROPIC_STRONG_MODEL = "claude-3-5-sonnet-20241022";
const OPENROUTER_STRONG_MODEL = "openai/gpt-4o";

export async function translateText(
  text: string,
  targetLang: "si" | "ta",
): Promise<string> {
  const messages = [
    { role: "system", content: TRANSLATE_SYSTEM(targetLang) },
    { role: "user", content: text },
  ];

  const errors: string[] = [];

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (anthropicKey) {
    try {
      const res = await callAnthropic(anthropicKey, ANTHROPIC_STRONG_MODEL, messages, "translate");
      const parsed = JSON.parse(res) as { translated?: string };
      if (parsed.translated) return parsed.translated.trim();
    } catch (error) {
      errors.push(`Anthropic translate failed: ${String(error)}`);
    }
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    try {
      const res = await callOpenRouterClaude(openRouterKey, OPENROUTER_STRONG_MODEL, messages, "translate");
      const parsed = JSON.parse(res) as { translated?: string };
      if (parsed.translated) return parsed.translated.trim();
    } catch (error) {
      errors.push(`OpenRouter translate failed: ${String(error)}`);
    }
  }

  console.error("Translation failed, falling back to original text.", errors);
  return text;
}
