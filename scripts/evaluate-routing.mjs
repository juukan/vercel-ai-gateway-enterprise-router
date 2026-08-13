import { readFile } from "node:fs/promises";
import { routeRequest } from "../src/routing/router.js";

const rows = (await readFile("datasets/routing-eval.jsonl", "utf8"))
  .split(/\r?\n/)
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const imageFixture = "data:image/png;base64,iVBORw0KGgo=";
const env = {
  ROUTER_MAX_PROMPT_CHARS: "30000",
  ROUTER_DEFAULT_MAX_OUTPUT_TOKENS: "700",
  ALLOW_INTERNAL_DATA: "false",
  ALLOW_RESTRICTED_DATA: "false",
};

let failed = 0;
for (const row of rows) {
  const input = structuredClone(row.input);
  if (input.images) input.images = input.images.map(() => ({ dataUrl: imageFixture }));
  let outcome = "route";
  let decision;
  try {
    decision = await routeRequest(input, {
      env,
      classify: async () => ({ alias: "capable", confidence: 0.81, reason: "deterministic eval fixture" }),
    });
  } catch (error) {
    outcome =
      error.code === "data_class_denied"
        ? "deny_by_default"
        : error.code === "budget_too_low"
          ? "block_budget_below_policy"
          : error.code === "override_not_authorized"
            ? "require_admin_authorization"
            : error.code === "image_cost_cap_not_supported"
              ? "block_unverifiable_image_cost"
              : `unexpected:${error.code ?? error.name}`;
  }

  const checks = [outcome === row.expected.outcome];
  if (decision && row.expected.minimumAlias) checks.push(decision.policy.minimumAlias === row.expected.minimumAlias);
  if (decision && row.expected.modality) checks.push(decision.request.modality === row.expected.modality);
  if (decision && row.expected.humanReview != null) checks.push(decision.policy.requiresHumanReview === row.expected.humanReview);
  if (decision && row.expected.promptInjection != null) checks.push(decision.policy.promptInjectionSuspected === row.expected.promptInjection);
  if (decision && row.expected.textOnlyModelDenied) checks.push(!decision.route.model.startsWith("nvidia/"));

  const passed = checks.every(Boolean);
  if (!passed) failed += 1;
  console.log(`${passed ? "PASS" : "FAIL"} ${row.id} -> ${outcome}${decision ? `/${decision.route.alias}/${decision.route.model}` : ""}`);
}

console.log(`${rows.length - failed}/${rows.length} routing cases passed.`);
if (failed) process.exitCode = 1;
