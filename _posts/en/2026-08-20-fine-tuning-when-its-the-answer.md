---
layout: post
title: "Fine-tuning, when it's really the answer — it's not rocket science!"
date: 2026-08-20 10:00:00
author: AClerbois
ref: fine-tuning-400
image: /images/posts/fine-tuning-400.png
tags: [AI, LLM, fine-tuning, lora, training]
level: 400
---

Level 400, episode 8 — the last of the series, and a rehabilitation. In [the RAG article]({{ site.baseurl }}/2026/07/18/rag-embeddings-explained-simply/), I waved fine-tuning away: *"expensive, slow, frozen — prefer context"*. That was true **at level 100**, for the problem of the moment (giving fresh knowledge). But it was a half-truth, and an architect deserves the other half.

Today: *when* fine-tuning is the right answer — and it is, sometimes, honestly — without the heavy math. LoRA, SFT vs DPO, catastrophic forgetting, and the break-even calculation. You'll see: it's not rocket science.

<!--more-->

## The founding distinction: knowledge vs behavior

The misunderstanding that ruins everything. Fine-tuning gets misclassified because people ask it for the wrong thing. The rule in one line:

> **RAG teaches the model *what to know*. Fine-tuning teaches it *how to behave*.**

You want it to know your up-to-date refund policy? [RAG]({{ site.baseurl }}/2026/08/01/build-your-rag-in-dotnet/) — the knowledge changes, you don't carve it. You want it to *always* answer in your system's exact JSON format, with your brand's tone, following a specific business reasoning that three pages of prompt can't reliably impose? **There**, fine-tuning wins. You don't inject facts, you shape a **reflex**.

The signal that should make you consider it: your [system prompt]({{ site.baseurl }}/2026/07/12/vibe-project-dotnet-foundations/) has swollen to two thousand tokens of examples and style rules, you [pay for it on every turn]({{ site.baseurl }}/2026/08/03/prompt-caching-under-the-hood/), and it still "goes off the rails" one time in ten. That's when moving the behavior from the prompt *into the weights* becomes profitable.

## LoRA: fine-tuning without retraining the world

Why fine-tuning had its "expensive" reputation: retraining **all** the weights of a 70-billion-parameter model needs a GPU farm. The revolution is **LoRA** (*Low-Rank Adaptation*) and its variant **QLoRA**.

The idea, as an image: instead of repainting the whole building, you **add a thin layer of adapters** — small matrices grafted onto the model, representing a tiny fraction of the parameters. You freeze the original model, you train only those adapters. Decisive consequences:

- **Accessible**: a LoRA fine-tune often fits on **a single card** (QLoRA adds [quantization]({{ site.baseurl }}/2026/08/16/the-economics-of-inference/) to lower memory further). Not a farm, one GPU.
- **Light to deploy**: the adapter weighs a few megabytes, plugs onto the base model, swaps hot. You can have *several* (one per task) on the same model.

LoRA turned fine-tuning from an infrastructure project into a product-team operation. That's what makes this article relevant in 2026 and not in 2022.

## SFT and DPO: show, or make prefer

Two ways to teach a behavior, not to be confused:

- **SFT** (*Supervised Fine-Tuning*): you show **examples of good answers**. "Here are 500 tickets, here's the ideal summary of each." The model learns to imitate. It's the main path, the one you start with.
- **DPO** (*Direct Preference Optimization*): you show **pairs** — "for this input, this answer is *better* than that one". The model learns a preference, a quality judgment. Useful when "good" is easier to *compare* than to *write* — tone, diplomacy, avoiding a flaw.

The reflex: **SFT to install the behavior, DPO to refine it** on the nuances that examples alone capture poorly. And the quality of all this lives, as always, in the data.

## The word of honesty: the three traps

- **Catastrophic forgetting.** In learning your task, the model can **unlearn** general capabilities — the price of too narrow a specialization. You watch it with [evals]({{ site.baseurl }}/2026/08/18/eval-engineering-statistical-rigor/) that *also* cover the skills you want to preserve, not just the new task.
- **The data is all the work.** 90% of a successful fine-tune's effort is **curating the dataset**: hundreds to thousands of clean, representative, consistent examples. A mediocre dataset carves flaws into the weights — far harder to fix than a bad prompt.
- **Frozen, again.** A fine-tuned model is a **versioned** artifact: new need, new training round, new eval, new deployment. An MLOps-style cycle, not a prompt edit. It's [an ADR]({{ site.baseurl }}/2026/07/14/adr-memory-of-architecture-decisions/) in its own right.

## The break-even calculation

The order to try, from least to most binding — **never skip a step**:

1. **Prompt engineering** — free, instant, reversible. Exhaust it first, always.
2. **RAG** — when fresh or private *knowledge* is missing.
3. **Fine-tuning** — when *behavior* resists the prompt, at sufficient volume to amortize the MLOps cycle, and often **alongside** RAG (a model fine-tuned for format + RAG for facts: the winning combo).

The honest rule, symmetric with June's: **if the prompt is enough, don't fine-tune.** But when a behavior must be *reliable*, *compact* (out of the prompt paid on every turn) and *repeatable*, then carving it into the weights isn't a luxury — it's the right architecture.

## In summary

- **RAG = knowledge, fine-tuning = behavior.** The wrong classification is the cause of 90% of disappointments.
- **LoRA/QLoRA** made fine-tuning accessible (one card, a few-MB adapter) — hence its rehabilitation in 2026.
- **SFT** (imitate examples) then **DPO** (learn preferences) — the curated data is 90% of the work.
- The traps: **catastrophic forgetting** (non-regression evals), frozen **MLOps cycle** (ADR), and the trial order **prompt → RAG → fine-tuning**, never skipped.

Fine-tuning isn't level 100's bogeyman: it's the tool you bring out when behavior must be carved, not recited. Rehabilitated, framed, and in its right place — the last step, the one you climb knowingly. And that, honestly… is not rocket science.
