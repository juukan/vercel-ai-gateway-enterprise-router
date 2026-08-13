import { tierIndex } from "../catalog/models.js";
import { RouterError } from "./errors.js";

const HIGH_RISK_PATTERNS = [
  /\b(legal|lawyer|contract clause|lawsuit|regulatory|compliance ruling|juridisch|advocaat|contractclausule|rechtszaak)\b/i,
  /\b(medical diagnosis|treatment plan|patient triage|clinical decision|medische diagnose|behandelplan|patienttriage|klinische beslissing)\b/i,
  /\b(investment advice|credit decision|loan approval|financial recommendation|beleggingsadvies|kredietbesluit|lening goedkeuren|financieel advies)\b/i,
  /\b(hiring decision|termination decision|employee discipline|payroll decision|aannamebesluit|ontslagbesluit|disciplinaire maatregel|salarisbesluit)\b/i,
  /\b(security incident|threat model|vulnerability exploit|credential breach|beveiligingsincident|dreigingsmodel|kwetsbaarheid misbruiken|datalek)\b/i,
];

const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+|any\s+|the\s+|your\s+)?(?:previous|prior|system)(?:\s+system)?\s+instructions/i,
  /reveal (the )?(system prompt|hidden instructions|developer message)/i,
  /act as (the )?system/i,
  /exfiltrat(e|ion)|jailbreak/i,
  /negeer\s+(?:alle\s+)?(?:vorige|eerdere|systeem)\s*instructies/i,
  /onthul (de )?(systeemprompt|verborgen instructies|developerboodschap)/i,
];

export function evaluatePolicy(request, env = process.env) {
  if (request.dataClass === "internal" && env.ALLOW_INTERNAL_DATA !== "true") {
    throw new RouterError("Internal data is disabled until the organisation approves the provider policy.", {
      code: "data_class_denied",
      status: 403,
    });
  }
  if (request.dataClass === "restricted" && env.ALLOW_RESTRICTED_DATA !== "true") {
    throw new RouterError("Restricted data is denied by default.", {
      code: "data_class_denied",
      status: 403,
    });
  }
  const highRiskMatches = HIGH_RISK_PATTERNS.filter((pattern) => pattern.test(request.prompt)).map(
    (pattern) => pattern.source,
  );
  const injectionMatches = PROMPT_INJECTION_PATTERNS.filter((pattern) => pattern.test(request.prompt)).map(
    (pattern) => pattern.source,
  );
  const highRisk = highRiskMatches.length > 0 || request.dataClass === "restricted";

  return Object.freeze({
    minimumAlias:
      highRisk || request.dataClass === "restricted"
        ? "frontier"
        : request.capabilities.tools || injectionMatches.length
          ? "capable"
          : "fast",
    highRisk,
    requiresHumanReview: highRisk,
    promptInjectionSuspected: injectionMatches.length > 0,
    reasons: [
      ...(highRisk ? ["high-risk use case requires frontier tier and human review"] : []),
      ...(request.capabilities.tools ? ["tool use requires at least capable tier"] : []),
      ...(request.modality === "image" ? ["image content detected; text-only routes excluded"] : []),
      ...(injectionMatches.length ? ["prompt-injection pattern detected"] : []),
    ],
  });
}

export function assertAliasAllowed(alias, minimumAlias) {
  if (tierIndex(alias) < tierIndex(minimumAlias)) {
    throw new RouterError(`The ${alias} override is below the policy minimum ${minimumAlias}.`, {
      code: "override_below_policy_minimum",
      status: 403,
    });
  }
}
