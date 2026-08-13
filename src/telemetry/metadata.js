import { createHash } from "node:crypto";

function cleanTag(value) {
  return String(value ?? "unknown")
    .toLowerCase()
    .replace(/[^a-z0-9:_-]/g, "-")
    .slice(0, 60);
}

export function opaqueUserId(userId, salt) {
  if (!userId || !salt) return undefined;
  return createHash("sha256").update(`${salt}:${userId}`).digest("hex").slice(0, 32);
}

export function gatewayMetadata(decision, env = process.env) {
  const providerOrder = String(env.AI_GATEWAY_PROVIDER_ORDER ?? "")
    .split(",")
    .map((provider) => provider.trim())
    .filter(Boolean);

  return {
    user: opaqueUserId(decision.request.userId, env.ROUTING_TELEMETRY_SALT),
    tags: [
      `tier:${cleanTag(decision.route.alias)}`,
      `usage:${cleanTag(decision.request.usage)}`,
      `data:${cleanTag(decision.request.dataClass)}`,
      `modality:${cleanTag(decision.request.modality)}`,
      `unit:${cleanTag(decision.request.orgUnit)}`,
    ],
    ...(providerOrder.length ? { order: providerOrder } : {}),
    models: [...decision.route.modelFallbacks],
    caching: "auto",
    zeroDataRetention: env.AI_GATEWAY_ZERO_DATA_RETENTION !== "false",
    disallowPromptTraining: env.AI_GATEWAY_DISALLOW_PROMPT_TRAINING !== "false",
  };
}

