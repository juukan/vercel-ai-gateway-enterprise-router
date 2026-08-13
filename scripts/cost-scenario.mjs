import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { estimateAliasCost } from "../src/cost/estimate.js";

const path = resolve(process.argv[2] ?? "config/org-profile.example.json");
const profile = JSON.parse(await readFile(path, "utf8"));
const monthlyRequests =
  profile.employees * profile.requestsPerEmployeePerWorkday * profile.workdaysPerMonth;

const rows = [];
let generationCost = 0;

for (const [alias, share] of Object.entries(profile.tierMix)) {
  const requests = Math.round(monthlyRequests * share);
  const tokens = profile.tokensPerRequest[alias];
  const costPerRequest = estimateAliasCost(alias, tokens.input, tokens.output);
  const cost = requests * costPerRequest;
  generationCost += cost;
  rows.push({ alias, share, requests, costPerRequest, cost });
}

const classifierRequests = Math.round(monthlyRequests * profile.classifierShare);
const classifierCostPerRequest = estimateAliasCost(
  "fast",
  profile.classifierTokens.input,
  profile.classifierTokens.output,
);
const classifierCost = classifierRequests * classifierCostPerRequest;
const subtotal = generationCost + classifierCost;
const budget = subtotal * (1 + profile.budgetBufferPercent / 100);

console.log(`Scenario: ${profile.name}`);
console.log(`Monthly requests: ${monthlyRequests.toLocaleString("en-US")}`);
console.table(
  rows.map((row) => ({
    tier: row.alias,
    share: `${Math.round(row.share * 100)}%`,
    requests: row.requests,
    "cost/request": `$${row.costPerRequest.toFixed(6)}`,
    "monthly cost": `$${row.cost.toFixed(2)}`,
  })),
);
console.log(
  `Classifier (${classifierRequests.toLocaleString("en-US")} ambiguous requests): $${classifierCost.toFixed(2)}`,
);
console.log(`Illustrative monthly model subtotal: $${subtotal.toFixed(2)}`);
console.log(
  `Illustrative budget with ${profile.budgetBufferPercent}% buffer: $${budget.toFixed(2)}`,
);
console.log("Excludes taxes, Vercel plan costs, reporting-cardinality charges, storage, egress and engineering.");

