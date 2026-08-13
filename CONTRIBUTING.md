# Contributing

Changes to routing behavior must include:

- a synthetic case in `datasets/routing-eval.jsonl`;
- a deterministic unit test when a hard policy changes;
- an updated cost scenario when model prices or token assumptions change;
- a source-ledger update for claims about vendor features;
- no real prompts, user identifiers, customer names or credentials.

Run before opening a pull request:

```bash
npm ci --ignore-scripts
npm test
npm run eval:routing
npm run test:security
npm audit --audit-level=high
npm run costs
npm run build
```

Model and policy changes require an owner from engineering and an owner from security/privacy. High-risk use cases additionally require the relevant business or legal owner.
