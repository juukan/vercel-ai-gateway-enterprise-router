import { approximateInputTokens } from "../cost/estimate.js";

const FAST_PATTERNS = [
  /\b(summarize|summary|samenvat|vat samen)\b/i,
  /\b(translate|translation|vertaal)\b/i,
  /\b(classify|label|categorize|sentiment)\b/i,
  /\b(rewrite|proofread|spellcheck|herformuleer)\b/i,
  /\b(extract|haal .* uit|return only)\b/i,
];

const CAPABLE_PATTERNS = [
  /\b(sql|python|javascript|typescript|refactor|debug|unit test)\b/i,
  /\b(analy[sz]e|compare|trade-?offs?|root cause|multi-step)\b/i,
  /\b(json schema|structured output|implementation plan)\b/i,
];

const FRONTIER_PATTERNS = [
  /\b(enterprise architecture|board recommendation|merger|acquisition)\b/i,
  /\b(adversarial|red team|formal proof|novel research)\b/i,
  /\b(legal|contract|clinical|investment advice|security incident)\b/i,
];

function count(patterns, prompt) {
  return patterns.reduce((total, pattern) => total + Number(pattern.test(prompt)), 0);
}

export function classifyWithHeuristics(request, policy) {
  const tokens = approximateInputTokens(request.prompt);
  const fastScore = count(FAST_PATTERNS, request.prompt);
  const capableScore = count(CAPABLE_PATTERNS, request.prompt);
  const frontierScore = count(FRONTIER_PATTERNS, request.prompt);

  if (policy.highRisk || frontierScore > 0 || tokens > 24_000) {
    return {
      alias: "frontier",
      confidence: policy.highRisk ? 0.99 : 0.92,
      source: "heuristic",
      reasons: [policy.highRisk ? "hard high-risk policy" : "frontier complexity or long context"],
    };
  }

  if (request.capabilities.tools || capableScore >= 2 || tokens > 6_000) {
    return {
      alias: "capable",
      confidence: request.capabilities.tools || capableScore >= 2 ? 0.9 : 0.82,
      source: "heuristic",
      reasons: [request.capabilities.tools ? "tool use" : "complexity/length signal"],
    };
  }

  if (fastScore > 0 && capableScore === 0 && tokens < 2_500) {
    return {
      alias: "fast",
      confidence: 0.94,
      source: "heuristic",
      reasons: ["bounded transformation or extraction task"],
    };
  }

  if (capableScore > 0) {
    return {
      alias: "capable",
      confidence: 0.78,
      source: "heuristic",
      reasons: ["reasoning or code signal"],
    };
  }

  return {
    alias: tokens < 1_000 ? "fast" : "capable",
    confidence: 0.45,
    source: "heuristic",
    reasons: ["ambiguous request; classifier recommended"],
  };
}

