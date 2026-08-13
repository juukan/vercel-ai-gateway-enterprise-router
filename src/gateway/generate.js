import { generateText } from "ai";
import { actualCostFromUsage } from "../cost/estimate.js";
import { systemPromptFor } from "../prompts/templates.js";
import { gatewayMetadata } from "../telemetry/metadata.js";
import { gatewayModel, hasGatewayAuthentication } from "./client.js";
import { RouterError } from "../routing/errors.js";

function userMessages(request) {
  if (request.modality === "text") return undefined;
  return [
    {
      role: "user",
      content: [
        { type: "text", text: request.prompt },
        ...request.images.map((image) => ({ type: "image", image: image.dataUrl })),
      ],
    },
  ];
}

export async function generateFromDecision(decision, env = process.env) {
  if (!hasGatewayAuthentication(env)) {
    throw new RouterError("Configure Vercel OIDC or an AI Gateway API key before generation.", {
      code: "gateway_not_configured",
      status: 503,
    });
  }

  const messages = userMessages(decision.request);
  const result = await generateText({
    model: gatewayModel(decision.route.model, decision.route.alias, env),
    system: systemPromptFor(decision.request),
    ...(messages ? { messages } : { prompt: decision.request.prompt }),
    maxOutputTokens: decision.request.maxOutputTokens,
    temperature: decision.request.usage === "extraction" ? 0 : 0.2,
    providerOptions: { gateway: gatewayMetadata(decision, env) },
  });

  return Object.freeze({
    text: result.text,
    finishReason: result.finishReason,
    usage: result.usage,
    cost: actualCostFromUsage(decision.route.model, result.usage),
  });
}

