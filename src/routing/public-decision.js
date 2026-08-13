export function publicDecision(decision) {
  return {
    requestId: decision.requestId,
    route: decision.route,
    policy: decision.policy,
    costGuard: decision.costGuard,
    classifier: decision.classifier
      ? {
          alias: decision.classifier.alias,
          confidence: decision.classifier.confidence,
          reason: decision.classifier.reason,
          model: decision.classifier.model,
          usage: decision.classifier.usage,
        }
      : null,
    input: {
      dataClass: decision.request.dataClass,
      usage: decision.request.usage,
      modality: decision.request.modality,
      imageCount: decision.request.images.length,
      promptCharacters: decision.request.prompt.length,
      maxOutputTokens: decision.request.maxOutputTokens,
      orgUnit: decision.request.orgUnit,
    },
  };
}

