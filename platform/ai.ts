import Anthropic from "@anthropic-ai/sdk";

export type ImageRecognitionInput = {
  base64Image: string;
  prompt: string;
  mediaType?: ImageMediaType;
};

export type ImageRecognitionResult = {
  text: string;
};

export type AiCapabilities = {
  recognizeImage(input: ImageRecognitionInput): Promise<ImageRecognitionResult>;
};

export type ImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

export type AnthropicAiOptions = {
  apiKey?: string;
  model?: string;
  maxTokens?: number;
};

const defaultAnthropicModel = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-5-20250929";
const defaultMaxTokens = 1024;

export function createAnthropicAiCapabilities(
  options: AnthropicAiOptions = {},
): AiCapabilities {
  const model = options.model ?? defaultAnthropicModel;
  const maxTokens = options.maxTokens ?? defaultMaxTokens;
  let anthropic: Anthropic | undefined;

  return {
    async recognizeImage(input) {
      const image = parseBase64Image(input.base64Image);
      const message = await getAnthropicClient().messages.create({
        model,
        max_tokens: maxTokens,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: input.mediaType ?? image.mediaType ?? "image/jpeg",
                  data: image.data,
                },
              },
              {
                type: "text",
                text: input.prompt,
              },
            ],
          },
        ],
      });

      return {
        text: message.content
          .filter((block) => block.type === "text")
          .map((block) => block.text)
          .join("\n"),
      };
    },
  };

  function getAnthropicClient() {
    if (anthropic) {
      return anthropic;
    }

    const apiKey = options.apiKey ?? process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is required to use AI capabilities");
    }

    anthropic = new Anthropic({ apiKey });

    return anthropic;
  }
}

function parseBase64Image(base64Image: string): { data: string; mediaType?: ImageMediaType } {
  const match = base64Image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/);

  if (!match) {
    return { data: base64Image };
  }

  const [, mediaType, data] = match;

  return {
    data,
    mediaType: isSupportedImageMediaType(mediaType) ? mediaType : undefined,
  };
}

function isSupportedImageMediaType(mediaType: string): mediaType is ImageMediaType {
  return ["image/jpeg", "image/png", "image/gif", "image/webp"].includes(mediaType);
}
