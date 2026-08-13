# Vercel deployment

## Before deployment

This public repository is safe to inspect, not safe to expose anonymously with billing enabled. A non-demo deployment needs:

- `ROUTER_API_TOKEN` or identity-aware replacement;
- rate limits and abuse controls at the edge;
- approved data classes and provider eligibility;
- environment-specific Gateway authentication and budgets;
- telemetry salt from the secret store;
- alerting, incident owner and kill switch;
- `ROUTER_DRY_RUN=true` until shadow evaluation passes.

## Authentication choices

### General Gateway access

On Vercel, OIDC can authenticate AI Gateway without a long-lived general API key. This is suitable when one Gateway identity/budget is enough.

### Per-tier budget keys

For independent `fast`, `capable` and `frontier/premium` caps, create separate AI Gateway keys and set:

```text
AI_GATEWAY_FAST_KEY
AI_GATEWAY_CAPABLE_KEY
AI_GATEWAY_FRONTIER_KEY
```

The application creates a Gateway provider instance for the relevant tier. If a tier key is absent, it falls back to the normal AI SDK Gateway authentication path.

Do not expose any of these variables to the browser with a `NEXT_PUBLIC_` prefix.

## Environment checklist

| Variable | Production position |
|---|---|
| `ROUTER_DRY_RUN` | `true` for shadow; `false` only after approval |
| `ALLOW_INTERNAL_DATA` | `false` until contractual/technical approval |
| `ALLOW_RESTRICTED_DATA` | usually `false`; enable per approved use case, not globally by convenience |
| `AI_GATEWAY_ZERO_DATA_RETENTION` | fail-closed `true` when the plan/providers support it |
| `AI_GATEWAY_DISALLOW_PROMPT_TRAINING` | `true` unless policy explicitly says otherwise |
| `ROUTER_API_TOKEN` | secret or replaced by SSO/service identity |
| `ROUTING_ADMIN_TOKEN` | separate highly restricted secret |
| `ROUTING_TELEMETRY_SALT` | stable secret with rotation procedure |
| `AI_GATEWAY_PROVIDER_ORDER` | blank by default; set only for approved provider constraints |

## Deploy

Import the GitHub repository as a Vercel Next.js project or use the Vercel CLI in the normal controlled deployment workflow. Configure secrets in Vercel, not in repository files.

After the first dry-run deployment:

1. call `/api/route` with the normal bearer token;
2. verify internal/restricted denial;
3. verify image requests never resolve to NVIDIA text-only models;
4. verify unauthorized overrides fail;
5. inspect Gateway tags for cardinality and absence of raw identifiers;
6. exercise budget exhaustion in a non-production key;
7. run the private evaluation set against the deployment;
8. enable generation only for the approved canary group.

## Network and abuse controls

The static bearer token is intentionally small reference code. For a 100+ person deployment, use a service identity or SSO session, per-user/org-unit quotas, an IP/network policy where appropriate, a WAF/body limit and request-rate protection. Do not publish an unrestricted generation endpoint.

## Rollback

Keep the prior deployment and alias mapping available. A rollback returns all callers to the previous mapping because callers depend on stable aliases, not model IDs. Revoke compromised router/Gateway credentials separately; a code rollback does not rotate secrets.

