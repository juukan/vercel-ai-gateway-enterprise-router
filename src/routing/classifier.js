import { generateText } from "ai";
import { resolveModelAlias } from "../catalog/models.js";
import { gatewayModel, hasGatewayAuthentication } from "../gateway/client.js";
import { CLASSIFIER_SYSTEM_PROMPT } from "../prompts/templates.js";
import { RouterError } from "./errors.js";

const ALLOWED = new Set(["fast", "capable", "frontier", "premium"]);

export async function classifyWithGateway(request, { env = process.env } = {}) {
  if (!hasGatewayAuthentication(env)) {
    throw new RouterError("No Gateway authentication is configured for the classifier.", {
      code: "classifier_not_configured",
      status: 503,
    });
  }

  const config = resolveModelAlias("classifier", "text");
  const result = await generateText({
    model: gatewayModel(config.primary, "classifier", env),
    system: CLASSIFIER_SYSTEM_PROMPT,
    prompt: `<routing_context modality="${request.modality}" image_count="${request.images.length}" usage="${request.usage}" strict_json="${request.capabilities.strictJson}" tools="${request.capabilities.tools}" />\n<untrusted_request>\n${request.prompt}\n</untrusted_request>`,
    temperature: 0,
    maxOutputTokens: 80,
    providerOptions: {
      gateway: {
        models: [...config.fallbacks],
        tags: ["purpose:router-classifier", `modality:${request.modality}`],
        zeroDataRetention: env.AI_GATEWAY_ZERO_DATA_RETENTION !== "false",
        disallowPromptTraining: env.AI_GATEWAY_DISALLOW_PROMPT_TRAINING !== "false",
      },
    },
  });

  let parsed;
  try {
    parsed = JSON.parse(result.text.trim().replace(/^```json\s*|\s*```$/g, ""));
  } catch {
    throw new RouterError("Classifier returned invalid JSON.", {
      code: "classifier_invalid_output",
      status: 502,
    });
  }

  if (!ALLOWED.has(parsed.tier)) {
    throw new RouterError("Classifier returned an unknown tier.", {
      code: "classifier_invalid_output",
      status: 502,
    });
  }

  return Object.freeze({
    alias: parsed.tier,
    confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.5)),
    reason: String(parsed.reason ?? "model-classified request").slice(0, 200),
    model: config.primary,
    usage: result.usage,
  });
}

