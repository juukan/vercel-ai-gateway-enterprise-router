import { isTier } from "../catalog/models.js";
import { RouterError } from "./errors.js";

const DATA_CLASSES = new Set(["public", "internal", "restricted"]);
const USAGES = new Set([
  "general",
  "summarization",
  "translation",
  "extraction",
  "support",
  "analysis",
  "code",
  "executive",
]);

function finiteNumber(value, name, { minimum, maximum }) {
  if (value == null || value === "") return undefined;
  const number = Number(value);
  if (!Number.isFinite(number) || number < minimum || number > maximum) {
    throw new RouterError(`${name} must be between ${minimum} and ${maximum}.`, {
      code: "invalid_request",
      status: 400,
    });
  }
  return number;
}

export function normalizeRequest(input, env = process.env) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new RouterError("A JSON object is required.", { code: "invalid_request", status: 400 });
  }

  const prompt = typeof input.prompt === "string" ? input.prompt.trim() : "";
  const maxPromptChars = Number(env.ROUTER_MAX_PROMPT_CHARS ?? 30_000);
  if (!prompt) {
    throw new RouterError("prompt is required.", { code: "invalid_request", status: 400 });
  }
  if (prompt.length > maxPromptChars) {
    throw new RouterError(`prompt exceeds the ${maxPromptChars}-character limit.`, {
      code: "request_too_large",
      status: 413,
    });
  }

  const dataClass = input.dataClass ?? "public";
  if (!DATA_CLASSES.has(dataClass)) {
    throw new RouterError("dataClass must be public, internal or restricted.", {
      code: "invalid_request",
      status: 400,
    });
  }

  const usage = input.usage ?? "general";
  if (!USAGES.has(usage)) {
    throw new RouterError(`Unsupported usage: ${usage}.`, {
      code: "invalid_request",
      status: 400,
    });
  }

  const forceModelAlias = input.forceModelAlias || undefined;
  if (forceModelAlias && !isTier(forceModelAlias)) {
    throw new RouterError("forceModelAlias must be fast, capable, frontier or premium.", {
      code: "invalid_request",
      status: 400,
    });
  }

  const maxOutputTokens = Math.round(
    finiteNumber(input.maxOutputTokens ?? env.ROUTER_DEFAULT_MAX_OUTPUT_TOKENS ?? 700, "maxOutputTokens", {
      minimum: 32,
      maximum: 8192,
    }),
  );

  const images = normalizeImages(input.images);

  return Object.freeze({
    prompt,
    dataClass,
    usage,
    maxOutputTokens,
    maxCostUsd: finiteNumber(input.maxCostUsd, "maxCostUsd", { minimum: 0.000001, maximum: 100 }),
    forceModelAlias,
    images: Object.freeze(images),
    modality: images.length > 0 ? "image" : "text",
    userId: typeof input.userId === "string" ? input.userId.slice(0, 200) : undefined,
    orgUnit: typeof input.orgUnit === "string" ? input.orgUnit.slice(0, 50) : "unassigned",
    capabilities: Object.freeze({
      tools: Boolean(input.capabilities?.tools),
      vision: images.length > 0,
      strictJson: Boolean(input.capabilities?.strictJson),
    }),
  });
}

function normalizeImages(images) {
  if (images == null) return [];
  if (!Array.isArray(images) || images.length > 4) {
    throw new RouterError("images must be an array with at most four items.", {
      code: "invalid_image_input",
      status: 400,
    });
  }

  return images.map((image, index) => {
    const dataUrl = typeof image === "string" ? image : image?.dataUrl;
    if (typeof dataUrl !== "string") {
      throw new RouterError(`images[${index}] must contain a dataUrl.`, {
        code: "invalid_image_input",
        status: 400,
      });
    }
    const match = /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
    if (!match) {
      throw new RouterError("Only base64 PNG, JPEG, WEBP or GIF data URLs are accepted.", {
        code: "invalid_image_input",
        status: 400,
      });
    }
    const approximateBytes = Math.floor((match[2].length * 3) / 4);
    if (approximateBytes > 5 * 1024 * 1024) {
      throw new RouterError(`images[${index}] exceeds 5 MB.`, {
        code: "image_too_large",
        status: 413,
      });
    }
    return Object.freeze({ dataUrl, mediaType: match[1], approximateBytes });
  });
}
