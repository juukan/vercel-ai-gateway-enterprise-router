# Cost governance for an organisation with 100+ people

## Start with workload, not seats

Monthly model cost is approximately:

```text
sum per route (
  requests
  * ((input tokens / 1,000,000 * input price)
     + (output tokens / 1,000,000 * output price))
)
+ classifier calls
+ retries/fallbacks/tool calls
+ non-model platform and reporting costs
```

Seats are only a volume driver. The material inputs are request count, token length, output caps, reasoning tokens, image accounting, tool loops, cache hit rate, fallback rate and tier mix.

## Included scenario

`config/org-profile.example.json` models:

- 150 employees;
- 12 requests per employee per workday;
- 22 workdays;
- 39,600 monthly requests;
- 20% ambiguous requests using the classifier;
- 68% fast, 25% capable, 6% frontier and 1% premium generation;
- different token envelopes per tier.

At the 13 August 2026 Vercel price snapshot:

| Component | Illustrative monthly cost |
|---|---:|
| Fast | $2.50 |
| Capable | $7.45 |
| Frontier | $63.68 |
| Premium | $27.72 |
| Classifier | $0.28 |
| Subtotal | **$101.63** |
| 35% buffer | **$137.19** |

The lesson is not that enterprise LLM usage costs $137. The lesson is that 7% frontier/premium traffic dominates this token scenario. Route mix and output length matter more than the headline price of the classifier.

## Costs excluded from the example

- Vercel plan and infrastructure;
- taxes and currency conversion;
- custom reporting cardinality/query charges;
- image token calculations;
- caching write/read differences;
- regional pricing or BYOK provider differences;
- retries and a more expensive model fallback;
- embeddings, storage, retrieval and egress;
- web search and paid tools;
- reasoning tokens not represented by the simple envelope;
- security, evaluation, support and engineering.

## Per-tier keys and budgets

Vercel supports budget caps on AI Gateway API keys. Use different keys for environment and tier so a premium spike cannot consume the fast workload's allocation.

Illustrative CLI shape from Vercel documentation:

```bash
vercel ai-gateway api-keys create --name production-fast --budget BUDGET_USD --refresh-period monthly
vercel ai-gateway api-keys create --name production-capable --budget BUDGET_USD --refresh-period monthly
vercel ai-gateway api-keys create --name production-frontier --budget BUDGET_USD --refresh-period monthly
```

Map the returned keys to `AI_GATEWAY_FAST_KEY`, `AI_GATEWAY_CAPABLE_KEY` and `AI_GATEWAY_FRONTIER_KEY` in the secret store. Never paste them into repository files or shell history.

Budget caps reject new requests after exhaustion. Define user-facing behavior before enabling them:

- fast exhaustion: queue, retry after reset or use an approved local path;
- capable exhaustion: fail clearly or use fast only when the policy floor allows it;
- frontier exhaustion: require approval or defer; never silently downgrade high-risk work;
- premium exhaustion: stop premium use and review demand.

## Operating thresholds

A practical control rhythm:

| Threshold | Action |
|---|---|
| 70% of monthly forecast | notify service owner; inspect volume, output length and route mix |
| 85% | restrict non-essential premium use; check misuse and retry loops |
| 100% budget cap | execute the documented per-tier exhaustion behavior |
| >20% week-over-week token growth | investigate use-case adoption versus defect |
| >2% fallback rate | provider/model reliability review |
| route mix outside approved band | sampling and classifier/policy review |

## Reporting metadata

The implementation sends low-cardinality tags for tier, usage, data class, modality and organisational unit. A supplied user ID is salted and hashed before it becomes the Gateway `user` field.

Vercel charges for custom reporting based on written unique tag/user values and reporting queries. Avoid high-cardinality tags such as request IDs, prompt hashes or timestamps. Keep `orgUnit` to an approved small vocabulary.

## Forecast process

1. Run two weeks in route-only shadow mode.
2. Sample route errors and establish an approved tier mix.
3. Measure p50/p95 input, output, reasoning and image use by use case.
4. Include retry, fallback and growth factors.
5. Set a forecast, soft alert and hard behavior per tier.
6. Reforecast monthly and on every model-price or use-case change.

