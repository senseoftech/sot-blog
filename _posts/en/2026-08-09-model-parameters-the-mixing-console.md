---
layout: post
title: "Model parameters: the mixing console of your prompt — it's not rocket science!"
date: 2026-08-09 10:00:00
author: AClerbois
ref: model-parameters
image: /images/posts/model-parameters.png
tags: [AI, LLM, parameters, temperature, top-p, api]
level: 200
---

You make your first call to a model API, and there it is: a wall of parameters — `temperature`, `top_p`, `max_tokens`, `frequency_penalty`, `stop`, `seed`… Most people touch temperature, pray, and leave the rest to chance. A shame: each knob does *one* precise thing, and knowing which to turn changes everything.

Today's image: a **mixing console**. You're the sound engineer, each fader and dial has a role, and the skill is knowing *which* to push for the effect you want — not pushing them all to the max. Let's walk the console, group by group. You'll see: it's not rocket science.

<!--more-->

## The "randomness" group: temperature and top_p

The two best-known faders — and the most misused. They dose the randomness in the choice of each word ([the real mechanism is tomorrow's]({{ site.baseurl }}/2026/08/10/sampling-and-constrained-decoding/), today we stay practical):

- **`temperature`**: the width of the draw. Low (→ 0), the model almost always takes the most probable word — sober, repetitive, reliable. High (→ 1 or 2 depending on the provider), it dares improbable choices — creative, diverse, adventurous. It's the knob from [the hallucinations article]({{ site.baseurl }}/2026/07/16/why-ai-hallucinates/).
- **`top_p`** (nucleus): instead of dosing randomness, it **cuts the tail** of unlikely words — "keep only the candidates weighing p%". At 0.1, ultra-restrictive; at 1, anything goes.

**The golden rule nobody states**: don't push **both at once**. They act on the same distribution, and combining them makes behavior unpredictable. Pick **one**: temperature for most cases, top_p if you want to firmly bound the drift. Leave the other at its default.

*(On open models, two cousins appear: `top_k` — "keep the k best candidates" — and `min_p` — "nothing below X% of the favorite". Same family, finer tuning.)*

## The "length" group: max_tokens

A single fader, but a classic trap. **`max_tokens`** (sometimes `max_completion_tokens`) caps the length of the **response** — [output tokens, the most expensive]({{ site.baseurl }}/2026/07/05/llm-tokens-input-output-cached/). Two things you absolutely must know:

- **It truncates, it doesn't summarize.** Hitting the limit cuts the response **mid-sentence** — it's not "be shorter", it's "stop dead". For shorter, ask in the prompt; the parameter is a seatbelt, not a style instruction.
- **Reasoning models count their thinking in it.** On those models, the invisible "thinking" tokens consume the budget before the visible answer even starts — cap too low, and you get… nothing. Budget generously.

## The "repetition" group: frequency and presence

Two dials to fight the model that rambles — useful in long generation:

| Knob | What it penalizes | The effect |
| --- | --- | --- |
| **`frequency_penalty`** | words already used **often** | breaks literal repetitions ("very very very") |
| **`presence_penalty`** | words that **already appeared** (even once) | pushes toward new topics, more variety |

Typical values from -2 to 2. A slight positive (0.3–0.6) usually suffices; too high, the model forbids itself necessary words and gets weird. Leave at zero by default, touch only if you *see* the rambling.

## The "control" group: stop, seed, n

The knobs that frame the output without touching the style:

- **`stop`** (or `stop_sequences`): strings that **cut generation** as soon as they appear. Essential when you generate homemade structure ("stop at `###`") or a single line in a dialogue.
- **`seed`**: a seed to **attempt** to reproduce an output. The important word is *attempt* — [it's never guaranteed]({{ site.baseurl }}/2026/08/10/sampling-and-constrained-decoding/) across a fleet of GPUs. Useful in development to replay a case, not a promise of determinism.
- **`n`**: request **several answers** in one call — handy for picking the best or exploring variants (beware, it multiplies the output bill).
- **`logit_bias`**: force or ban specific words. Powerful, surgical, rarely needed — the expert's knob.

## The "structure & thinking" group

The most modern settings, met elsewhere in the series:

- **`response_format`** / **structured outputs**: impose a JSON schema. It's not a style setting but [a contract that constrains generation]({{ site.baseurl }}/2026/07/29/tool-calling-under-the-hood/) — valid JSON by construction. The right reflex for anything feeding a screen or an import.
- **Reasoning effort** (`reasoning_effort` or a thinking budget depending on the provider): on reasoning models, dosing *how much* the model "thinks" before answering. Low = fast and cheap; high = slower but better on hard problems. It's the knob already met in [Copilot CLI]({{ site.baseurl }}/2026/07/19/copilot-cli-2-the-daily-routine/) — the same logic as [choosing the right model]({{ site.baseurl }}/2026/06/25/which-model-to-choose-github-copilot/), but for compute intensity.

## The recipes: which setting for which use

The table to keep handy — a starting point, not a law:

| Use | temperature | The rest |
| --- | --- | --- |
| **Factual, extraction, classification** | 0 – 0.3 | `response_format` if structured output |
| **Code** | 0 – 0.2 | large max_tokens (reasoning included) |
| **Writing, rewriting** | 0.6 – 0.8 | slight `frequency_penalty` if repetitive |
| **Brainstorm, ideation** | 0.9 – 1.2 | `n` > 1 to vary the angles |
| **Chat / assistant** | 0.5 – 0.7 | `stop` on the speaking turn |

## The word of honesty

- **Names and ranges vary by provider.** OpenAI, Anthropic, open models don't expose exactly the same knobs or bounds (temperature up to 2 for one, 1 for another; `stop` vs `stop_sequences`…). **Always check *your* provider's docs** — this guide gives the map, not the exact territory.
- **The defaults are good.** In the vast majority of cases, touch *only* the temperature. Cargo-culting settings ("I copied top_p 0.92 from a tutorial") does more harm than good.
- **Tune with [evals]({{ site.baseurl }}/2026/07/17/testing-an-ai-application-evals/), not by feel.** A parameter that's "better" over three tries might be luck. Measure before carving.

## In summary

- An API call is a **mixing console**: each knob does one thing, the art is touching few.
- **Randomness**: `temperature` **or** `top_p`, never both. **Length**: `max_tokens` truncates (doesn't summarize) and includes reasoning.
- **Repetition**: `frequency`/`presence_penalty` against rambling, dose lightly. **Control**: `stop`, `seed` (best-effort), `n`, `logit_bias`.
- **Structure**: `response_format` for guaranteed JSON; **reasoning effort** to dose the thinking.
- And above all: defaults are fine, names vary by provider, and **you tune with evals**.

The console has many knobs, but a good mix pushes three, not thirty. Start with temperature, add a fader when a precise need calls for it, and measure. And that, honestly… is not rocket science.
