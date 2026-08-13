import { MODELS, aliasesAtOrAbove, resolveModelAlias, tierIndex } from "../catalog/models.js";

export function approximateInputTokens(text) {
  return Math.max(1, Math.ceil(String(text ?? "").length / 4));
}

export function estimateModelCost(modelId, inputTokens, outputTokens) {
  const model = MODELS[modelId];
  if (!model) throw new Error(`No price snapshot for ${modelId}`);
  return (
    (inputTokens / 1_000_000) * model.inputPerMillion +
    (outputTokens / 1_000_000) * model.outputPerMillion
  );
}

export function estimateAliasCost(alias, inputTokens, outputTokens, modality = "text") {
  const modelId = resolveModelAlias(alias, modality).primary;
  return estimateModelCost(modelId, inputTokens, outputTokens);
}

export function applyCostGuard({ selectedAlias, minimumAlias, inputTokens, outputTokens, maxCostUsd, modality }) {
  const estimatedCostUsd = estimateAliasCost(selectedAlias, inputTokens, outputTokens, modality);

  if (maxCostUsd == null) {
    return { alias: selectedAlias, action: "within_policy", estimatedCostUsd };
  }

  if (estimatedCostUsd <= maxCostUsd) {
    return { alias: selectedAlias, action: "within_budget", estimatedCostUsd };
  }

  const candidates = aliasesAtOrAbove(minimumAlias)
    .filter((alias) => tierIndex(alias) <= tierIndex(selectedAlias))
    .map((alias) => ({
      alias,
      estimatedCostUsd: estimateAliasCost(alias, inputTokens, outputTokens, modality),
    }))
    .filter((candidate) => candidate.estimatedCostUsd <= maxCostUsd)
    .sort((a, b) => tierIndex(b.alias) - tierIndex(a.alias));

  if (candidates.length > 0) {
    return {
      ...candidates[0],
      action: "downgraded_within_policy",
      previousAlias: selectedAlias,
    };
  }

  return {
    alias: selectedAlias,
    action: "blocked_budget_too_low",
    estimatedCostUsd,
    minimumEstimatedCostUsd: estimateAliasCost(minimumAlias, inputTokens, outputTokens, modality),
  };
}

export function actualCostFromUsage(modelId, usage) {
  const inputTokens = Number(usage?.inputTokens ?? usage?.promptTokens ?? 0);
  const outputTokens = Number(usage?.outputTokens ?? usage?.completionTokens ?? 0);
  return {
    inputTokens,
    outputTokens,
    estimatedCostUsd: estimateModelCost(modelId, inputTokens, outputTokens),
  };
}
