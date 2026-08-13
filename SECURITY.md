# Security policy

## Reporting

Do not open a public issue for a suspected vulnerability or exposed credential. Use GitHub's private vulnerability reporting feature for this repository.

## Deployment boundary

This repository is a reference implementation, not a compliance certification. Before processing company data:

1. approve providers, regions, retention, training and subprocessors;
2. replace the example policy with an organisation-owned policy;
3. provision separate keys and budgets for environments and tiers;
4. keep raw prompts out of logs and analytics;
5. connect `forceModelAlias` to real server-side RBAC;
6. run the evaluation set against every model or policy change;
7. perform a threat model and privacy impact assessment.

Restricted data is denied by default. Never enable it solely because a provider exposes a zero-data-retention flag; contractual and technical controls both matter.

## Secrets

Use Vercel environment variables or OIDC. Never commit `.env` files, API keys, admin tokens or telemetry salts. `npm run test:security` is a safety net, not a substitute for GitHub secret scanning and review.

