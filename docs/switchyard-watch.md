# NVIDIA Switchyard and Nemotron assessment

Assessment date: **13 August 2026**.

## Switchyard is relevant, but not the production dependency

[NVIDIA NeMo Switchyard](https://github.com/NVIDIA-NeMo/Switchyard) is directly relevant to semantic model routing. It supports classifier-based routing, staged routes, escalation and custom strategies. Its Apache-2.0 license makes inspection and adaptation feasible.

However, NVIDIA's repository describes Switchyard as **pre-alpha**, **experimental** and **not intended for production use**. The [v0.2.0 release](https://github.com/NVIDIA-NeMo/Switchyard/releases/tag/v0.2.0) from 10 August 2026 is a substantial Rust redesign, which is evidence of active development and also evidence that the interface is still moving.

Decision for this repository:

- keep company policy, aliases, cost guard and API boundaries independent of a routing framework;
- isolate the model classifier behind `classifyWithGateway`;
- track Switchyard as a candidate classifier/orchestration component;
- do not make it a runtime dependency until its API stabilizes and it passes the same route, security and operational evals.

An earlier [NVIDIA LLM Router Blueprint](https://github.com/NVIDIA-AI-Blueprints/llm-router) is marked deprecated in favor of Switchyard. New work should not be based on that blueprint.

## What would justify a Switchyard pilot

- a stable release and migration policy;
- documented observability and failure behavior;
- measurable improvement over the small hybrid router;
- exact policy-floor enforcement outside model classification;
- clean support for image capability filters and per-request cost limits;
- reproducible Windows/Linux deployment and security review;
- no loss of explainable routing metadata.

The pilot should be route-only, offline or shadow mode first.

## Nemotron 3 Nano and Super

These models are relevant now through Vercel AI Gateway:

- **Nemotron 3 Nano 30B A3B** is exceptionally inexpensive in the dated Gateway snapshot and is used as classifier/fast text candidate.
- **Nemotron 3 Super 120B A12B** provides a low-cost capable text route. Artificial Analysis reports above-average open-weight intelligence and speed for its class, while also showing high verbosity.
- both are text-only in the evidence used here, so neither receives image work.

The internal evaluation set, not the model family name, decides whether they stay in an alias.

## Nemotron-Flash is a separate licensing and availability question

The Hugging Face pages for NVIDIA's Nemotron-Flash 1B/3B instruct models show `CC-BY-NC-4.0` and require `trust_remote_code=true`. For a normal commercial company deployment, the non-commercial license is a blocker unless separate rights are obtained. Remote model code also increases the supply-chain review burden.

Nemotron-Flash was not found in the Vercel AI Gateway model catalog on the assessment date. That does not prove it will never be available; it means it is not a valid default for this repository's current Vercel execution path.

Decision:

- do not use Nemotron-Flash in the public commercial reference path;
- do not confuse it with Nemotron 3 Nano/Super;
- reconsider only when license rights, code review, hosting and measured advantage are clear.

References: [Nemotron-Flash 3B Instruct](https://huggingface.co/nvidia/Nemotron-Flash-3B-Instruct) and [current Vercel model catalog](https://ai-gateway.vercel.sh/v1/models).

