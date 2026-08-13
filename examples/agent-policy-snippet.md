# Agent instruction snippet

Paste the following into the relevant `AGENTS.md` or `CLAUDE.md` only after the MCP server is configured:

```md
## Enterprise model router

- Use `route_request` before delegating an ambiguous, expensive, high-risk or image-based subtask.
- Set `dataClass` honestly. Never downgrade data classification to make a request pass.
- Do not send secrets, credentials, `.env` files, customer records, personal data or proprietary source code unless the deployment policy explicitly permits that data class.
- Use `route_and_generate` for a bounded secondary task, not as evidence that an external action was executed.
- Treat `requiresHumanReview: true` as a hard stop before consequential action.
- Use `forceModelAlias` only when an authorized operator explicitly asks and the admin credential is configured outside the repository.
```

