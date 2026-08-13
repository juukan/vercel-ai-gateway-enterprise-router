import { MODEL_CATALOG_SOURCE, MODELS } from "../src/catalog/models.js";

const response = await fetch(MODEL_CATALOG_SOURCE, { headers: { accept: "application/json" } });
if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);

const payload = await response.json();
const catalog = new Map((payload.data ?? []).map((model) => [model.id, model]));
let drift = false;

for (const [id, expected] of Object.entries(MODELS)) {
  const current = catalog.get(id);
  if (!current) {
    drift = true;
    console.error(`MISSING ${id}`);
    continue;
  }

  const inputPerMillion = Number(current.pricing?.input) * 1_000_000;
  const outputPerMillion = Number(current.pricing?.output) * 1_000_000;
  const matches =
    Math.abs(inputPerMillion - expected.inputPerMillion) < 1e-9 &&
    Math.abs(outputPerMillion - expected.outputPerMillion) < 1e-9;
  console.log(
    `${matches ? "OK" : "DRIFT"} ${id}: input $${inputPerMillion}/M, output $${outputPerMillion}/M`,
  );
  drift ||= !matches;
}

if (drift) {
  console.error("Model catalog drift detected. Review prices and evaluation results before updating the snapshot.");
  process.exitCode = 1;
}

