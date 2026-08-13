# Evaluation and rollout

## Measure two systems

Routing quality and answer quality are different.

### Router metrics

- route accuracy against reviewed labels;
- under-routing rate: selected below required quality;
- over-routing rate: unnecessary expensive tier;
- data-policy false allow rate, with a target of zero in the release set;
- image-to-text-only violation rate, with a target of zero;
- classifier invocation rate;
- authorized override rate and reasons;
- budget-block and cost-downgrade rate;
- route-decision latency.

### Answer metrics

- task-specific rubric pass rate;
- groundedness and unsupported-claim rate;
- schema validity;
- tool-call correctness and side-effect safety;
- visual reasoning accuracy for image cases;
- language/tone fit;
- p50/p95 time to first answer and total latency;
- tokens and cost per successful task;
- human escalation/correction rate.

## Dataset layers

1. **Synthetic policy cases** in `datasets/routing-eval.jsonl`; safe to publish.
2. **Adversarial cases** for prompt injection, data-class bypass, oversized media and override abuse.
3. **Approved production-like cases** stored privately with redaction and access controls.
4. **Live shadow decisions** sampled under a privacy-reviewed telemetry plan.

Never publish real prompts merely to make the open-source evaluation look realistic.

## Release gates

Suggested starting gates, to be replaced by organisation-specific thresholds:

| Gate | Initial threshold |
|---|---:|
| data-policy false allows in release suite | 0 |
| image routed to text-only primary | 0 |
| under-routing on high-consequence cases | 0 |
| overall reviewed route accuracy | >= 95% |
| answer-quality non-inferiority versus current baseline | >= baseline with confidence interval |
| schema validity for strict JSON use cases | >= 99.5% |
| unexplained cost increase | <= 10% |
| canary error/fallback rate | within agreed SLO |

These numbers are not universal standards. High-consequence use cases often need stricter gates and domain experts.

## Rollout stages

### 0. Contract and inventory

Approve data classes, eligible providers, regions, retention/training, identities, use cases and human review.

### 1. Offline replay

Run the router over synthetic and approved cases. No live generation or user-visible change.

### 2. Shadow routing

Compute a route beside the existing model but continue serving the existing result. Compare route, estimated cost and quality labels.

### 3. Low-risk canary

Enable bounded public summarization/translation/extraction for a small group. Keep a kill switch and current-model fallback.

### 4. Capable workloads

Add code, SQL and internal data only after provider/data approval. Measure corrections and tool safety.

### 5. Frontier and premium

Enable only named use cases with owners, business value and human review. Premium use needs evidence of uplift.

### 6. Continuous recertification

Re-run on any change to model IDs, provider order, system prompt, classifier, pricing, fallback, data policy or tool registry.

## Rollback

Keep the alias mapping and policy in version control. A rollback should be one config/code version change, not edits across application callers. Retain the prior model mapping and evaluation report until the new version completes its observation period.

