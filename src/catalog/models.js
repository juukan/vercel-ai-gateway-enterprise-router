export const MODEL_CATALOG_SNAPSHOT_DATE = "2026-08-13";
export const MODEL_CATALOG_SOURCE = "https://ai-gateway.vercel.sh/v1/models";

/**
 * Prices are USD per one million tokens, captured from the Vercel AI Gateway
 * model catalog on MODEL_CATALOG_SNAPSHOT_DATE. Pricing can change; run
 * `npm run models:check` before making budget decisions.
 */
export const MODELS = Object.freeze({
  "nvidia/nemotron-3-nano-30b-a3b": Object.freeze({
    inputPerMillion: 0.05,
    outputPerMillion: 0.24,
    contextWindow: 262_144,
    role: "low-cost classification and fast generation",
  }),
  "nvidia/nemotron-3-super-120b-a12b": Object.freeze({
    inputPerMillion: 0.15,
    outputPerMillion: 0.65,
    contextWindow: 256_000,
    role: "capable general reasoning",
  }),
  "google/gemini-3.5-flash-lite": Object.freeze({
    inputPerMillion: 0.3,
    outputPerMillion: 2.5,
    contextWindow: 1_000_000,
    role: "high-throughput multimodal generation",
  }),
  "google/gemini-3.5-flash": Object.freeze({
    inputPerMillion: 1.5,
    outputPerMillion: 9,
    contextWindow: 1_000_000,
    role: "capable multimodal reasoning",
  }),
  "openai/gpt-5.6-terra": Object.freeze({
    inputPerMillion: 2,
    outputPerMillion: 12,
    contextWindow: 1_050_000,
    role: "frontier text and vision reasoning",
  }),
  "anthropic/claude-opus-5": Object.freeze({
    inputPerMillion: 5,
    outputPerMillion: 25,
    contextWindow: 1_000_000,
    role: "premium text and vision reasoning",
  }),
});

export const TIER_ORDER = Object.freeze(["fast", "capable", "frontier", "premium"]);

export const MODEL_ALIASES = Object.freeze({
  classifier: Object.freeze({
    text: Object.freeze({
      primary: "nvidia/nemotron-3-nano-30b-a3b",
      fallbacks: Object.freeze(["nvidia/nemotron-3-super-120b-a12b"]),
    }),
  }),
  fast: Object.freeze({
    text: Object.freeze({
      primary: "nvidia/nemotron-3-nano-30b-a3b",
      fallbacks: Object.freeze(["nvidia/nemotron-3-super-120b-a12b"]),
    }),
    image: Object.freeze({
      primary: "google/gemini-3.5-flash-lite",
      fallbacks: Object.freeze(["google/gemini-3.5-flash"]),
    }),
  }),
  capable: Object.freeze({
    text: Object.freeze({
      primary: "nvidia/nemotron-3-super-120b-a12b",
      fallbacks: Object.freeze(["openai/gpt-5.6-terra"]),
    }),
    image: Object.freeze({
      primary: "google/gemini-3.5-flash",
      fallbacks: Object.freeze(["openai/gpt-5.6-terra"]),
    }),
  }),
  frontier: Object.freeze({
    text: Object.freeze({
      primary: "openai/gpt-5.6-terra",
      fallbacks: Object.freeze(["anthropic/claude-opus-5"]),
    }),
    image: Object.freeze({
      primary: "openai/gpt-5.6-terra",
      fallbacks: Object.freeze(["anthropic/claude-opus-5"]),
    }),
  }),
  premium: Object.freeze({
    text: Object.freeze({
      primary: "anthropic/claude-opus-5",
      fallbacks: Object.freeze(["openai/gpt-5.6-terra"]),
    }),
    image: Object.freeze({
      primary: "anthropic/claude-opus-5",
      fallbacks: Object.freeze(["openai/gpt-5.6-terra"]),
    }),
  }),
});

export function resolveModelAlias(alias, modality = "text") {
  const config = MODEL_ALIASES[alias]?.[modality];
  if (!config) throw new Error(`No ${modality} route for alias ${alias}`);
  return config;
}

export function tierIndex(alias) {
  return TIER_ORDER.indexOf(alias);
}

export function isTier(alias) {
  return tierIndex(alias) >= 0;
}

export function aliasesAtOrAbove(minimumAlias) {
  const minimum = tierIndex(minimumAlias);
  if (minimum < 0) throw new Error(`Unknown minimum alias: ${minimumAlias}`);
  return TIER_ORDER.slice(minimum);
}
