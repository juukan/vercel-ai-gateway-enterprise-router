import { createGateway } from "ai";

const gatewayCache = new Map();

function keyForAlias(alias, env) {
  if (alias === "fast" || alias === "classifier") return env.AI_GATEWAY_FAST_KEY;
  if (alias === "capable") return env.AI_GATEWAY_CAPABLE_KEY;
  return env.AI_GATEWAY_FRONTIER_KEY;
}

export function gatewayModel(modelId, alias, env = process.env) {
  const apiKey = keyForAlias(alias, env);
  if (!apiKey) return modelId;

  if (!gatewayCache.has(apiKey)) {
    gatewayCache.set(apiKey, createGateway({ apiKey }));
  }
  return gatewayCache.get(apiKey)(modelId);
}

export function hasGatewayAuthentication(env = process.env) {
  return Boolean(
    env.AI_GATEWAY_API_KEY ||
      env.AI_GATEWAY_FAST_KEY ||
      env.AI_GATEWAY_CAPABLE_KEY ||
      env.AI_GATEWAY_FRONTIER_KEY ||
      env.VERCEL_OIDC_TOKEN,
  );
}

