---
layout: post
title: "Sampling: temperature, top-p and constrained decoding — it's not rocket science!"
date: 2026-08-15 10:00:00
author: AClerbois
ref: sampling-400
image: /images/posts/sampling-400.png
tags: [AI, LLM, sampling, temperature, structured-outputs]
level: 400
---

Level 400, episode 3. In [the hallucinations article]({{ site.baseurl }}/2026/07/19/why-ai-hallucinates/), we met **temperature** — "the dose of randomness". And in [tool calling]({{ site.baseurl }}/2026/08/02/tool-calling-under-the-hood/), **structured outputs** — "the contract that constrains generation". Two claims dropped without the mechanism. Today, we look at how a token is *actually* chosen.

On the menu: the probability distribution, how temperature/top-p/top-k sculpt it, why perfect determinism doesn't exist *even* at temperature zero, and how a grammar forces valid JSON at the decoding level. You'll see: it's not rocket science.

<!--more-->

## What comes out of the model: a distribution, not a word

Let's pick up where [the KV cache]({{ site.baseurl }}/2026/08/14/inside-30ms-of-a-token-attention-kv-cache/) left off. After digesting the context, the model doesn't produce "a word". It produces, for **each possible token in the vocabulary** (tens of thousands), a raw score — a **logit**. A function (softmax) turns these logits into a **probability distribution**: *"'Paris' 82%, 'the' 6%, 'Lyon' 3%…"* over the whole vocabulary.

The model stops there. **Choosing** the token from that distribution is a separate step — **sampling** — and it's *that* which the parameters control. Crucial distinction: the model proposes a fixed distribution; the sampler draws a token from it. Changing the temperature doesn't change what the model "thinks" — it changes how you draw from what it thinks.

## Temperature: flatten or sharpen the distribution

**Temperature** acts on the logits *before* the softmax. The right image: it **reshapes the curve**.

- **Low temperature** (→ 0): the curve **sharpens**. The gap between the favorite and the rest widens; the most probable token dominates. Predictable, repetitive, sober.
- **High temperature** (> 1): the curve **flattens**. The outsiders climb back up, the model dares improbable choices. Creative, diverse, adventurous.

Concretely: factual, code, extraction → **low**; brainstorm, writing variety → **high**. It's not an "intelligence" knob, it's a "width of the draw" knob. A high-temperature model isn't more creative *in the sense of better* — it's just allowed to leave the most probable paths.

## Top-k, top-p, min-p: where you cut the tail

Temperature alone leaves a tiny chance to the absurd tokens of the long tail. So you bound it with filters — applied *before* the draw:

| Filter | What it does | The image |
| --- | --- | --- |
| **top-k** | keeps only the *k* most probable tokens | "the top 40 candidates, bin the rest" |
| **top-p** (nucleus) | keeps tokens until cumulating *p*% of probability | "the smallest group that weighs 90%" |
| **min-p** | threshold relative to the best token | "nothing below 5% of the favorite" |

The most used is **top-p** (nucleus sampling): its selection size **adapts** to the context — wide when the model hesitates between a thousand plausible continuations, narrow when only one imposes itself. It's the default fluidity/safety trade-off of most APIs. In practice you combine: top-p to cut the absurd tail, temperature to dose within what remains.

## The bomb: temperature 0 is NOT deterministic

Here's what separates level 300 from 400, and what costs hours of debugging to those who ignore it. "I set temperature 0, I always take the most probable token, so it's reproducible." **False in production**, and for physical reasons, not software ones:

- **Floating-point arithmetic isn't associative.** `(a + b) + c ≠ a + (b + c)` on a GPU. And the computations are spread across thousands of cores whose **aggregation order varies** from one run to another. Two near-tied logits can thus swap — and a token flips.
- **Non-deterministic batching.** Your request is processed alongside others, in a batch whose composition changes on every call; the resulting GPU kernel optimizations alter the order of operations. The output thus depends on *who else* was calling at the same moment — which you don't control.

Consequence for the architect: **determinism isn't a property to build on.** That's exactly what grounds [the evals approach]({{ site.baseurl }}/2026/07/20/testing-an-ai-application-evals/) — you manage *thresholds*, not identical outputs — and the statistical eval engineering this blog will soon tackle. A fixed `seed` helps in development; it guarantees nothing across a GPU fleet.

## Constrained decoding: how JSON becomes valid *by construction*

There remains the [tool calling]({{ site.baseurl }}/2026/08/02/tool-calling-under-the-hood/) promise to honor: **structured outputs**. The mechanism is crystalline in its elegance and lodges *exactly* at the sampling step.

At each token, before drawing, you know the target grammar (your JSON Schema). You **mask the logits** of all tokens that would violate that grammar — their probability is forced to zero. If the schema expects `{` as the opening, every token other than `{` is eliminated *before* the draw. The model literally **cannot** produce invalid JSON: the grammar acts as a rail.

That's the whole difference from "answer in JSON please": the prayer hopes the distribution favors JSON; the constraint mechanically **forbids** off-grammar tokens. And it clarifies the final nuance: constrained decoding guarantees a valid *shape* (the JSON parses), never a correct *substance* (the values are true). The shape by grammar, [the substance by evals]({{ site.baseurl }}/2026/07/20/testing-an-ai-application-evals/) — always.

## In summary

- The model produces a **probability distribution** (logits → softmax); **sampling** draws a token from it — two distinct steps.
- **Temperature** reshapes the curve (low = sharp/sober, high = flat/creative); **top-p** cuts the tail adaptively — that's the default duo.
- **Temperature 0 ≠ deterministic**: non-associative floats + variable batching on GPU. You build on **thresholds** (evals), never on exact reproducibility.
- **Structured outputs** mask off-grammar logits at each token: valid JSON *by construction* — the shape, never the substance.

The model thinks in probabilities, the sampler decides, and the grammar lays the rails: that's how a word becomes *the* word. Randomness, here, is a parameter — not a fate. And that, honestly… is not rocket science.
