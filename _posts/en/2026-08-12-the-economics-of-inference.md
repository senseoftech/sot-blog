---
layout: post
title: "The economics of inference: VRAM, batching and the break-even point — it's not rocket science!"
date: 2026-08-12 10:00:00
author: AClerbois
ref: inference-economics-400
image: /images/posts/inference-economics-400.png
tags: [AI, LLM, inference, gpu, cost, self-hosting]
level: 400
---

Level 400, episode 4 — the article for those who sign the invoices. In [June's BYOK post]({{ site.baseurl }}/certificate/2026/06/05/ghco-affranchir-les-tokens/), we freed the AI from billed tokens by self-hosting it. The question left open: **from what point is it profitable?** And above all: *why* a long context costs memory, not just computation.

The [KV cache]({{ site.baseurl }}/2026/08/08/inside-30ms-of-a-token-attention-kv-cache/) gave us the physical key; today we turn it into economics. VRAM, continuous batching, quantization, and the API vs self-host break-even calculation. You'll see: it's not rocket science.

<!--more-->

## The real bottleneck isn't compute, it's memory

A wrong intuition to correct right away: "a GPU serves a model, so more requests = more compute". In reality, at inference, the wall you hit first is **VRAM** — the GPU's memory. It hosts two things:

1. **The model weights** — fixed cost. A 70-billion-parameter model in 16 bits is ~140 GB just to exist; in 8 bits, ~70 GB. Constant, whatever the traffic.
2. **The KV cache** — **variable cost, per request and per token**. Remember: [every in-flight token keeps its Keys and Values]({{ site.baseurl }}/2026/08/08/inside-30ms-of-a-token-attention-kv-cache/) in VRAM. An 8,000-token conversation thus reserves a slice of memory proportional to it — *for its entire duration*.

The financial consequence is counterintuitive and central: **"long context" = "reserved GPU memory" = "fewer simultaneous conversations on the same card".** The real cost of a big context isn't only the [quadratic computation]({{ site.baseurl }}/2026/08/08/inside-30ms-of-a-token-attention-kv-cache/), it's that it **takes up a spot** other users can no longer have. Your per-token bill is just a proxy for that.

## Continuous batching: why total throughput rules

A GPU processes requests in **batches**: a thousand users share the same card, their tokens generated in parallel. Hence two metrics you must stop confusing:

- **Latency** — the time for *your* answer. Decomposed: the **TTFT** (time to first token, dominated by the [quadratic prefill]({{ site.baseurl }}/2026/08/08/inside-30ms-of-a-token-attention-kv-cache/) of your whole prompt) then the **tokens/second** of the decode.
- **Throughput** — the total tokens/second the card outputs, all users combined. It's *this* that determines the cost per token.

**Continuous batching** (vLLM and the like) is the queen optimization: instead of waiting for a whole batch to finish, you inject a new request as soon as a spot frees up. The card stays saturated, throughput climbs, cost per token collapses. The architect's lesson: **a self-hosted model is only profitable when saturated.** A card at 30% utilization costs almost as much as at 100% — but produces three times less.

## Quantization: trading a little precision for a lot of memory

The lever that makes self-hosting practical. Weights are stored as floating-point numbers; **quantization** compresses them into fewer bits — 16 → 8 → 4 — dividing the VRAM footprint accordingly (and speeding things up, memory being the bottleneck).

| Precision | Footprint (70B model) | What you lose |
| --- | --- | --- |
| 16 bits (bf16) | ~140 GB | reference |
| 8 bits (INT8) | ~70 GB | negligible in practice |
| 4 bits (AWQ/GPTQ) | ~35 GB | measurable, often acceptable |

Modern methods (AWQ, GPTQ) are **smart**: they finely preserve the weights most sensitive to rounding instead of dumbly rounding everything. 4-bit fits a 70B on a single big card — the difference between "rentable" and "out of reach". **The word of honesty**: the loss is real and **must be measured on *your* task** — with [your evals]({{ site.baseurl }}/2026/07/17/testing-an-ai-application-evals/), not on a generic benchmark. Sometimes painless, sometimes disqualifying depending on your case's sensitivity.

## The break-even calculation: API or self-hosted?

The decision, stripped bare. The API is paid **per token, no commitment, elastic**; self-hosting is paid **per GPU-hour, fixed, whether it runs or not**.

- **Below a certain volume** → the API wins, always. A €20,000/year card idle at night never beats a meter that drops to zero when you don't call it. That's the overwhelming majority of projects.
- **Above, with sustained and predictable throughput** → self-hosted (saturated, quantized) pulls ahead: the fixed cost amortizes over a constant flow.
- **The other criteria, often decisive before price**: **data residency** (the real driver of [the BYOK article]({{ site.baseurl }}/certificate/2026/06/05/ghco-affranchir-les-tokens/) — your data doesn't leave), controlled **latency**, independence from a provider, and access to specialized open models.

The honest rule: **start on API. Migrate to self-hosted when throughput is proven, predictable, and the card would be saturated** — or when compliance requires it. Migrating too early means paying for a card to watch it sleep.

## In summary

- The inference bottleneck is **VRAM**: weights (fixed) + **KV cache** (variable per token) — hence "long context = reserved memory = fewer simultaneous requests".
- Two distinct metrics: **latency** (TTFT + tokens/s, for you) and **throughput** (for cost). **Continuous batching** saturates the card and collapses the per-token cost.
- **Quantization** (8/4 bits, AWQ/GPTQ) trades a little quality for a lot of VRAM — loss to be measured on *your* evals.
- Break-even: **API by default** (elastic); **self-hosted** when sustained throughput + saturated card, or when data residency/latency demand it.

A GPU is an office building: profitable full, ruinous half-empty — and the KV cache is the rent each conversation pays for the space it occupies. That's the economics of inference, no mystery. And that, honestly… is not rocket science.
