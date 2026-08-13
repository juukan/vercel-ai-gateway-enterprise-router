# Model selection and benchmark evidence

Snapshot date: **13 August 2026**.

The route policy uses three evidence lanes:

1. **Vercel AI Gateway catalog** for the models that can actually be called, their advertised modalities/context and the price paid through Gateway.
2. **Artificial Analysis** for independent, time-dependent indicators of intelligence, speed, latency, verbosity and modality.
3. **Organisation evaluation** for route accuracy and task quality on the real workload.

No model is promoted based on a leaderboard position alone.

## Candidate ledger

| Candidate | Role here | Independent signal | Gateway signal | Decision |
|---|---|---|---|---|
| NVIDIA Nemotron 3 Nano 30B A3B | classifier and fast text | no equivalent AA evidence used in this snapshot | text, reasoning/tool tags; $0.05 input / $0.24 output per 1M | cheap candidate, must pass internal classification and task evals |
| NVIDIA Nemotron 3 Super 120B A12B | capable text | AA Intelligence Index 26; about 138 output tok/s; text-only; noted as verbose | $0.15 / $0.65 per 1M; text-only route | strong price/throughput candidate, not sufficient for maximum-quality or image work |
| Gemini 3.5 Flash-Lite | fast image | AA Index 37; about 357 tok/s; text/image/speech/video input; 1M context | vision tag; $0.30 / $2.50 per 1M | high-throughput image candidate |
| Gemini 3.5 Flash | capable image | AA reports 35 at minimal and 50 at high effort, with image input | vision/tool tags; $1.50 / $9 per 1M | use only after fixing and evaluating the actual effort/settings used through Gateway |
| GPT-5.6 Terra | frontier text and image | AA reports Index 52 for the xhigh variant; image support; higher quality/cost than capable tier | vision/tool tags; $2 / $12 per 1M | frontier candidate with an explicit caveat that AA's xhigh setup may differ from the route default |
| Claude Opus 5 | premium text and image | AA max-effort Index 63, about 52 tok/s; top quality but slower, verbose and expensive | vision/tool tags; $5 / $25 per 1M | premium/availability candidate, never the cost default |

All prices are USD per one million input/output tokens from Vercel's catalog snapshot, not from Artificial Analysis. AA provider pricing can differ from Gateway pricing.

## Why Nemotron is not used for images

Artificial Analysis identifies Nemotron 3 Super as text input/text output and explicitly says it cannot process images. Vercel's catalog similarly lacks a vision tag for Nano and Super. The router therefore resolves an image-capable mapping after tier selection.

This is a hard capability filter, not a classifier opinion.

## Why the current leader is not the default

Claude Opus 5 scored highest in the referenced AA max-effort snapshot, but that variant was also materially slower and more expensive. A 100+ person organisation usually gets more value from a portfolio:

- fast models for bounded, high-volume work;
- capable models for routine reasoning/code;
- frontier models where errors are costlier than inference;
- premium only where measured quality uplift justifies cost and latency.

## Benchmark limitations

- Artificial Analysis results change and provider performance varies.
- A reasoning-effort variant is not necessarily the default model behavior reached through Gateway.
- A composite intelligence score does not establish legal, financial, medical or security fitness.
- General text scores do not replace visual reasoning, tool-use, coding, language or domain-specific evals.
- Throughput after first token is different from time to first answer.
- Verbosity affects both latency and billed output.
- Model catalog tags state advertised capability, not policy approval.

## Promotion checklist

A model mapping change requires:

1. availability and modality confirmation in the live Vercel catalog;
2. updated primary and fallback prices;
3. current independent benchmark capture with exact effort/provider variant;
4. route dataset pass rate at or above the current baseline;
5. answer-quality non-inferiority for every affected use case;
6. schema/tool/injection tests where relevant;
7. latency and cost distribution, not just averages;
8. privacy, region, retention and provider approval;
9. canary plus rollback to the previous alias map;
10. a dated owner decision.

The command `npm run models:check` detects Vercel catalog price drift. It intentionally does not edit code.

