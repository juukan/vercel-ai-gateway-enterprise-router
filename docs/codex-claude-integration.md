# Use from Codex or Claude Code

The repository exposes the router through a local stdio MCP server. This is the safest reusable integration in the reference because both coding agents can call an explicit routed tool without this project impersonating their native model APIs.

## What the integration does

- lets the coding agent inspect a route with `route_request`;
- lets it delegate a bounded permitted subtask with `route_and_generate`;
- returns decision metadata with the generated text;
- keeps Gateway and router credentials in the MCP process environment;
- preserves the coding agent's own model, tools, approvals and conversation.

It does not route every internal Codex/Claude turn. Replacing the base model would require a fully compatible OpenAI Responses or Anthropic Messages gateway, including streaming, tool calls, usage and error semantics. This repository deliberately does not claim that compatibility.

## 1. Run the router

```bash
npm ci --ignore-scripts
cp .env.example .env.local
npm run dev
```

For route inspection only, leave `ROUTER_DRY_RUN=true`. Configure `ROUTER_API_TOKEN` in `.env.local` for a protected local or remote deployment.

The MCP process uses:

```text
ENTERPRISE_ROUTER_URL=http://localhost:3000
ENTERPRISE_ROUTER_TOKEN=<same value as ROUTER_API_TOKEN>
ENTERPRISE_ROUTER_ADMIN_TOKEN=<optional override token>
```

Inject real tokens from the operating-system environment or an approved secret launcher. Do not put them in a checked-in `.mcp.json`, `AGENTS.md`, `CLAUDE.md` or shell script.

## 2. Codex

OpenAI's Codex documentation states that local clients support stdio MCP servers and that CLI/IDE/desktop clients share the MCP configuration for a Codex host.

With the environment variables already present in the process that launches Codex:

```bash
codex mcp add enterprise-router -- node /absolute/path/to/vercel-ai-gateway-enterprise-router/tools/mcp-server.mjs
```

Verify with the Codex MCP settings or CLI, then ask:

```text
Use route_request first for this public architecture comparison. Show me the selected tier, reason and estimated cost before calling route_and_generate.
```

Project-scoped MCP configuration is appropriate only in a trusted project. A user-level configuration is preferable when the same approved router is shared across repositories.

## 3. Claude Code

Anthropic documents the same local stdio pattern:

```bash
claude mcp add enterprise-router --scope user -- node /absolute/path/to/vercel-ai-gateway-enterprise-router/tools/mcp-server.mjs
claude mcp get enterprise-router
```

Then ask Claude Code to call `route_request` or `route_and_generate` explicitly.

For a project-shared `.mcp.json`, include only the command and path. Never commit an actual token. Claude Code asks users to approve project-scoped servers; preserve that review boundary.

## 4. Agent instructions

An instruction block is available at [`examples/agent-policy-snippet.md`](../examples/agent-policy-snippet.md). It tells agents to:

- classify data honestly;
- avoid secrets and proprietary content unless explicitly permitted;
- route before expensive/high-risk/image tasks;
- stop for human review when the router flags it;
- treat the result as decision support, not proof of execution.

## 5. Images from coding agents

The MCP schema accepts base64 data URLs. Avoid passing arbitrary screenshots or repository assets automatically. The agent should first confirm that the image and its data class are allowed. For larger organisational use, replace base64 MCP arguments with an approved upload/reference service.

## 6. Direct LLM gateway use in Claude Code

Anthropic separately documents configuration through an LLM gateway. That path expects Anthropic API compatibility and routes Claude Code's own model traffic. Vercel AI Gateway by itself does not supply the company-specific semantic policy in this repository, and this project's REST API is not an Anthropic Messages proxy. Use a dedicated compatibility layer only if direct base-model routing is a firm requirement, then test tool loops and streaming end to end.

## Operational cautions

- start with `route_request`, not generation;
- do not auto-approve the routed tool for restricted repositories;
- protect the remote router with identity, rate limits and network controls;
- measure duplicated cost: the coding agent plus the delegated routed call;
- cap recursion so an agent cannot repeatedly delegate its own outputs;
- record an approved reason for premium overrides.

Official references: [Codex MCP](https://developers.openai.com/codex/mcp/) and [Claude Code MCP](https://docs.anthropic.com/en/docs/claude-code/mcp).

