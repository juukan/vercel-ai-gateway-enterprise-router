# Architecture

## Responsibility split

The key design decision is to keep semantic routing company-owned.

| Layer | Owns | Must not own |
|---|---|---|
| Caller | task, honest data class, desired output constraints | vendor model IDs or authorization policy |
| Router policy | data admission, modality, risk floor, override rules, cost behavior | provider uptime balancing |
| Router classifier | tier recommendation for ambiguous permitted requests | data admission or authorization |
| Model catalog | stable alias-to-model mapping and dated price snapshot | automatic production adoption |
| Vercel AI Gateway | auth, provider routing, model call, usage tags, caching, fallback | business meaning of a request |
| Evaluation system | route accuracy, answer quality, latency and cost acceptance | changing production policy silently |

If the classifier is unavailable, the router selects at least `capable`. If a high-risk request cannot fit its cost ceiling, the router blocks; it does not silently lower the quality floor.

## Decision state

Every accepted request produces a decision with:

- a generated `requestId`;
- sanitized input metadata, including detected modality and image count;
- `minimumAlias` from hard policy;
- selected alias, primary model and fallback models;
- decision source: heuristic, classifier, policy floor, cost guard or override;
- confidence and explainable reasons;
- estimated primary-model cost;
- human-review and injection flags.

The public response intentionally omits prompt and image bytes. The internal decision object retains them only long enough to perform generation.

## Modality boundary

`images` must contain validated base64 data URLs. The router derives `modality=image` from that array. It ignores any caller attempt to assert vision support without image content.

Text and image models are resolved after the tier is selected:

```text
tier=capable + modality=text  -> Nemotron 3 Super
tier=capable + modality=image -> Gemini 3.5 Flash
```

This prevents a common routing failure: selecting a cheap model that cannot process the actual input type.

The reference accepts only PNG, JPEG, WEBP and GIF. A full upload service should inspect magic bytes rather than trusting a data URL header, limit pixel dimensions and decompression ratio, quarantine files, perform malware/content scanning and pass an approved object reference to the model layer.

## Hybrid routing

The local heuristic handles high-confidence cases at zero model latency. The classifier is used only below a confidence threshold. The classifier prompt:

- treats the incoming request as untrusted data;
- returns one constrained tier object;
- never receives restricted data unless policy has already permitted it;
- cannot lower the hard policy minimum;
- fails conservatively.

This design follows Vercel's published recommendation to combine heuristics with a small classifier for ambiguous cases.

## Cost behavior

The preflight guard estimates input tokens as `characters / 4` and uses the maximum requested output. That is conservative enough for routing but not billing-grade tokenization.

When a selected text route exceeds `maxCostUsd`, it searches downward for the highest affordable alias that remains at or above `minimumAlias`. If no such route exists, the request is blocked with `budget_too_low`. Fallback models that exceed the request cap are removed for that call.

The reference rejects a strict `maxCostUsd` on image requests. Provider-specific image tokenization is required to make that promise honestly. Image traffic remains governed by alias selection and aggregate tier-key budgets; a production image tokenizer can replace this fail-closed behavior.

Without a request cap, the estimate uses the primary model and fallbacks may have a different price. A stricter production implementation should either:

- validate the maximum price of every configured fallback against the request cap;
- use manual fallback attempts with a remaining-budget ledger; or
- treat request-level cost as guidance and enforce hard aggregate budgets at the Gateway key.

## Availability and semantics

Gateway `models` are ordered model fallbacks. They are used when the primary fails. Fallbacks should be evaluated for schema adherence, tool behavior and safety before production. A fallback is not guaranteed to be semantically identical.

Provider `order` is optional. With no order, Gateway uses recent uptime and latency. Set an order only when contractual, regional or BYOK requirements justify constraining that choice.

## Extension points

- replace token auth with identity-aware middleware and RBAC;
- replace regex signals with a versioned policy engine;
- add a provider/model eligibility registry by data class and region;
- store decision events in privacy-reviewed telemetry;
- add tool registries and tool-loop budgets;
- add document/audio/video modalities;
- replace `classifyWithGateway` with Switchyard after maturity and evaluation;
- move price snapshots to an approved catalog update workflow.
