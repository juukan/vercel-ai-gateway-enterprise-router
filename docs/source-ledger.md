# Source ledger

Last checked: **13 August 2026**.

This file separates vendor facts, independent benchmark observations and implementation decisions. Time-dependent claims must be refreshed before a production decision.

## Vercel primary sources

| Source | Used for | Freshness note |
|---|---|---|
| [Cost-aware model routing with AI Gateway](https://vercel.com/kb/guide/cost-aware-model-routing-with-ai-gateway) | application-owned classifier; heuristic + classifier hybrid; per-tier keys; tags | updated 17 June 2026 when checked |
| [AI Gateway documentation](https://vercel.com/docs/ai-gateway) | Gateway execution responsibilities and AI SDK use | live documentation |
| [Provider options](https://vercel.com/docs/ai-gateway/models-and-providers/provider-options) | provider order/only, caching, timeouts and fallbacks | live documentation |
| [Model fallbacks](https://vercel.com/docs/ai-gateway/models-and-providers/model-fallbacks) | ordered `providerOptions.gateway.models` | live documentation |
| [Authentication and BYOK](https://vercel.com/docs/ai-gateway/authentication-and-byok) | API keys and Vercel OIDC | live documentation |
| [Zero data retention and no training](https://vercel.com/changelog/zero-data-retention-no-prompt-training-on-ai-gateway) | request privacy options and plan availability | product changelog; verify provider behavior |
| [API key budgets](https://vercel.com/changelog/budgets-for-api-keys-on-ai-gateway) | spend caps and refresh periods | product changelog |
| [Custom reporting](https://vercel.com/changelog/custom-reporting-ai-gateway) | user/tags and reporting pricing | charges can change; refresh before budget approval |
| [Pricing](https://vercel.com/docs/ai-gateway/pricing) | no-markup claim and pricing mechanics | live documentation |
| [Model catalog API](https://ai-gateway.vercel.sh/v1/models) | current model IDs, tags, context and per-token prices | captured in `src/catalog/models.js`; run `npm run models:check` |

## Independent model evidence

| Source | Observation used | Limitation |
|---|---|---|
| [Artificial Analysis: model comparison](https://artificialanalysis.ai/models) | independent intelligence/speed/latency framework | rankings change and are not workload-specific |
| [Nemotron 3 Super](https://artificialanalysis.ai/models/nvidia-nemotron-3-super-120b-a12b) | Index 26, about 138 tok/s, text-only, verbose in current snapshot | median across tracked providers; Gateway behavior may differ |
| [Gemini 3.5 Flash-Lite](https://artificialanalysis.ai/models/gemini-3-5-flash-lite) | Index 37, about 357 tok/s, multimodal input | model/provider settings can differ |
| [Gemini 3.5 Flash](https://artificialanalysis.ai/models/gemini-3-5-flash) | quality/speed by reasoning effort and multimodal support | Gateway default effort is not proven equivalent to AA high |
| [GPT-5.6 Terra xhigh](https://artificialanalysis.ai/models/gpt-5-6-terra-xhigh) | frontier-quality candidate and image support | xhigh benchmark is not necessarily route default |
| [Claude Opus 5](https://artificialanalysis.ai/models/claude-opus-5) | max-effort Index 63, about 52 tok/s, multimodal, high price/verbosity | max effort and first-party API snapshot |

## NVIDIA primary sources

| Source | Used for | Decision |
|---|---|---|
| [NeMo Switchyard repository](https://github.com/NVIDIA-NeMo/Switchyard) | status, strategies and Apache-2.0 license | watch/pilot candidate, not production dependency while pre-alpha |
| [Switchyard v0.2.0](https://github.com/NVIDIA-NeMo/Switchyard/releases/tag/v0.2.0) | current release and Rust redesign | active development; interface risk remains |
| [Deprecated LLM Router Blueprint](https://github.com/NVIDIA-AI-Blueprints/llm-router) | deprecation path | do not start new work on it |
| [Nemotron-Flash 3B Instruct](https://huggingface.co/nvidia/Nemotron-Flash-3B-Instruct) | license and `trust_remote_code` requirement | not default for commercial use; not in Gateway catalog at check date |

## Coding-agent integration sources

| Source | Used for |
|---|---|
| [OpenAI Codex MCP](https://developers.openai.com/codex/mcp/) | local stdio support and shared Codex-host configuration |
| [Anthropic Claude Code MCP](https://docs.anthropic.com/en/docs/claude-code/mcp) | stdio server CLI/configuration pattern |
| [Anthropic LLM gateway configuration](https://docs.anthropic.com/en/docs/claude-code/llm-gateway) | distinction between an MCP tool and direct Claude Code model proxying |

## Implementation inferences

The following are project decisions, not vendor claims:

- company aliases shield callers from model churn;
- modality is a hard eligibility filter;
- cost cannot reduce a request below its policy floor;
- high-consequence output always requires human review;
- independent benchmarks shortlist candidates, while internal evals approve them;
- Switchyard should remain replaceable behind the classifier interface;
- MCP delegation is preferable to claiming incomplete native API compatibility.

