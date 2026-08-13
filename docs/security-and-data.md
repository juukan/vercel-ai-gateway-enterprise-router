# Security and data controls

## Default policy

| Data class | Default | Required before enabling |
|---|---|---|
| `public` | allowed | normal application security and acceptable-use controls |
| `internal` | denied | approved providers/regions, retention and training terms, access control, DPIA as applicable |
| `restricted` | denied | use-case-specific approval, strong identity, audit, contractual controls, incident and deletion procedures |

`AI_GATEWAY_ZERO_DATA_RETENTION` and `AI_GATEWAY_DISALLOW_PROMPT_TRAINING` are sent as request options by default. They are useful technical controls, but they do not prove that every provider, feature, region or tool path satisfies the organisation's obligations.

## Threats and controls

| Threat | Reference control | Production extension |
|---|---|---|
| secret committed to Git | `.env*` ignored, example values blank, secret-pattern test | GitHub secret scanning, push protection, rotation playbook |
| unauthenticated spend | optional `ROUTER_API_TOKEN` | SSO/service identity, rate limits, WAF and quotas |
| override abuse | separate admin bearer token and policy floor | RBAC, justification, expiry, dual approval and audit |
| prompt injection | detection, capable floor, untrusted-content system prompts | source isolation, tool allowlists, output validation, continuous red-team set |
| sensitive data leakage | deny internal/restricted by default, no prompt logging | DLP/redaction, provider eligibility matrix, retention verification |
| image SSRF | remote URLs rejected | approved object store, fetch proxy and egress allowlist |
| image bomb/active content | media allowlist, 5 MB/item, SVG rejected | magic-byte/dimension/decompression scan and quarantine |
| classifier manipulation | classifier cannot change hard policy; constrained output | adversarial evals and independent policy engine |
| runaway cost | output cap, request guard, tier keys/budgets | per-user quotas, tool-loop limits and anomaly detection |
| fallback changes semantics | explicit ordered models | fallback-specific evals and schema enforcement |
| telemetry becomes personal data | salted opaque user ID, low-cardinality tags | privacy review, retention, access and deletion process |

## Authentication boundaries

- `ROUTER_API_TOKEN` protects normal API use when configured.
- `ROUTING_ADMIN_TOKEN` separately permits `forceModelAlias`.
- tier Gateway keys are server-only.
- callers never submit provider credentials.
- Vercel OIDC is preferred for the general Vercel-hosted path where it fits the deployment.

The demo tokens are static because the repository must run without an identity provider. They are not the target enterprise architecture.

## Logging

The API logs only a stable error label, error name and route path for unexpected exceptions. It does not log:

- prompts;
- image data;
- authorization headers;
- user IDs;
- generated text.

If observability is added, create a schema allowlist. Never pass the entire request or model response object to a logger.

## Images

The reference uses base64 data URLs to prove modality routing without allowing arbitrary server-side URL fetches. Production should avoid large base64 bodies where possible:

1. authenticate upload;
2. write to a quarantine bucket;
3. validate magic bytes, size, dimensions and decompression ratio;
4. scan content;
5. issue a short-lived approved object reference;
6. delete according to policy.

The router should receive verified modality metadata from that trusted upload service, while the model call receives the approved content.

## High-consequence output

`requiresHumanReview` means the output cannot directly trigger employment, credit, legal, medical, security or other consequential action. A stronger model does not remove that requirement.

