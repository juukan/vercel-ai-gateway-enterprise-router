import { randomUUID } from "node:crypto";
import { resolveModelAlias, tierIndex } from "../catalog/models.js";
import { applyCostGuard, approximateInputTokens, estimateModelCost } from "../cost/estimate.js";
import { verifyOverrideToken } from "../security/override.js";
import { classifyWithGateway } from "./classifier.js";
import { RouterError } from "./errors.js";
import { classifyWithHeuristics } from "./heuristics.js";
import { normalizeRequest } from "./input.js";
import { assertAliasAllowed, evaluatePolicy } from "./policy.js";

const CLASSIFIER_CONFIDENCE_THRESHOLD = 0.8;

export async function routeRequest(rawRequest, options = {}) {
  const env = options.env ?? process.env;
  const request = normalizeRequest(rawRequest, env);
  const policy = evaluatePolicy(request, env);
  const heuristic = classifyWithHeuristics(request, policy);
  let selection = heuristic;
  let classifier = null;

  if (heuristic.confidence < CLASSIFIER_CONFIDENCE_THRESHOLD && !policy.highRisk) {
    const classify = options.classify ?? classifyWithGateway;
    try {
      classifier = await classify(request, { env });
      selection = {
        alias: classifier.alias,
        confidence: classifier.confidence,
        source: "model_classifier",
        reasons: [classifier.reason],
      };
    } catch (error) {
      selection = {
        alias: tierIndex(heuristic.alias) < tierIndex("capable") ? "capable" : heuristic.alias,
        confidence: heuristic.confidence,
        source: "classifier_fallback",
        reasons: [`classifier unavailable; conservative fallback (${error.code ?? "unknown"})`],
      };
    }
  }

  if (tierIndex(selection.alias) < tierIndex(policy.minimumAlias)) {
    selection = {
      alias: policy.minimumAlias,
      confidence: 1,
      source: "policy_floor",
      reasons: ["selection raised to policy minimum"],
    };
  }

  if (request.forceModelAlias) {
    const overrideAuthorized =
      options.overrideAuthorized ?? verifyOverrideToken(options.authorizationHeader, env.ROUTING_ADMIN_TOKEN);
    if (!overrideAuthorized) {
      throw new RouterError("A valid server-side admin token is required for forceModelAlias.", {
        code: "override_not_authorized",
        status: 403,
      });
    }
    assertAliasAllowed(request.forceModelAlias, policy.minimumAlias);
    selection = {
      alias: request.forceModelAlias,
      confidence: 1,
      source: "authorized_override",
      reasons: ["authorized operator override"],
    };
  }

  const inputTokens = approximateInputTokens(request.prompt);
  if (request.modality === "image" && request.maxCostUsd != null) {
    throw new RouterError(
      "A strict per-request image cost cap is unavailable without provider-specific image tokenization. Use a tier budget or omit maxCostUsd.",
      { code: "image_cost_cap_not_supported", status: 422 },
    );
  }
  const costGuard = applyCostGuard({
    selectedAlias: selection.alias,
    minimumAlias: policy.minimumAlias,
    inputTokens,
    outputTokens: request.maxOutputTokens,
    maxCostUsd: request.maxCostUsd,
    modality: request.modality,
  });

  if (costGuard.action === "blocked_budget_too_low") {
    throw new RouterError("The request budget is below the cheapest policy-compliant route.", {
      code: "budget_too_low",
      status: 422,
      details: costGuard,
    });
  }

  const alias = costGuard.alias;
  const modelRoute = resolveModelAlias(alias, request.modality);
  const modelFallbacks = request.maxCostUsd
    ? modelRoute.fallbacks.filter(
        (modelId) =>
          estimateModelCost(modelId, inputTokens, request.maxOutputTokens) <= request.maxCostUsd,
      )
    : modelRoute.fallbacks;
  return Object.freeze({
    requestId: options.requestId ?? randomUUID(),
    request,
    route: Object.freeze({
      alias,
      modality: request.modality,
      model: modelRoute.primary,
      modelFallbacks: Object.freeze(modelFallbacks),
      source: costGuard.action === "downgraded_within_policy" ? "cost_guard" : selection.source,
      confidence: selection.confidence,
      reasons: Object.freeze([...policy.reasons, ...selection.reasons]),
    }),
    policy,
    costGuard: Object.freeze({
      ...costGuard,
      estimateScope: request.modality === "image" ? "text_tokens_only; image cost excluded" : "text tokens",
    }),
    classifier,
  });
}
