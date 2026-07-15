---
layout: post
title: "The Agentic SDLC (5/9) — The attention economy: the window is not the focus — it's not rocket science!"
date: 2026-09-04 10:00:00
author: AClerbois
ref: agentic-sdlc-context-economy
image: /images/posts/agentic-sdlc-context-economy.png
tags: [agentic-sdlc, agents, AI, context, attention]
level: 300
---

On the product page: "one-million-token context window". In your session: an agent that, forty minutes in, ignores a rule that has been loaded since the start. Contradiction? No — a confusion between two quantities. The window is **addressable memory**; attention is the **CPU cache**: smaller, position-sensitive, and degrading under load. The vendor's number never promised the model reasons uniformly over everything you pour into it.

Chapters 14 and 15 of Daniel Meppiel's [Agentic SDLC Handbook](https://danielmeppiel.github.io/agentic-sdlc-handbook/handbook/ch15-attention-and-context-economy.html) form the "physics" side of the method: how context **reaches** the model (the load lifecycle), and what the model actually **does** with it (the attention economy). After [PROSE]({{ site.baseurl }}/2026/09/03/agentic-sdlc-4-prose-five-constraints/), here is why those constraints work. Not rocket science.

<!--more-->

## The U-curve: where is your rule sitting?

Long-context research converges on a U-shaped curve: attention is strong at the **head** of the context (system prompt, initial rules), strong at the **tail** (the latest turns), and weak **in the middle** — the trough. The vicious part: the middle is a conveyor belt. What starts at the head **drifts** into it as turns and tool outputs pile up.

Hence the chapter's canonical failure: a team adds an 800-line architecture document hoping for better reviews. Opposite result — the slab pushes the critical rules into the degraded zone. The rule is *in the window*, but it no longer receives enough attention to influence the output. Re-read [the context window]({{ site.baseurl }}/2026/07/26/context-window-compress-forget/) and [our dive into attention and the KV cache]({{ site.baseurl }}/2026/08/14/inside-30ms-of-a-token-attention-kv-cache/): same mechanics, seen from above.

## The load lifecycle: four phases, three modes

Before asking what the model *looks at*, the content has to *arrive*. Chapter 14 describes your primitives' full pipeline:

**Resolve** (dependency resolution, lockfile) → **Materialize** (files land where the harness expects them: `.github/`, `.claude/`…) → **Bind** (the harness classifies each file into a load mode) → **Activate** (the dispatcher picks what actually enters, based on the task and the remaining budget).

| Binding mode | When it loads | The price |
| --- | --- | --- |
| **Eager** | every session, unconditionally | consumes budget, always |
| **Lazy** | description loads eagerly, body on activation | allows hundreds of skills at no per-session cost |
| **Dispatcher-mediated** | explicit invocation, sub-agent | the cost lands in the child's context |

The sneakiest bug lives at the joint: a skill that is registered but **never activates**, because eager loads ate the budget and the dispatcher down-ranks it. Five determinants can be tested one by one: path globs, valid YAML frontmatter, lockfile closure, description matching (probabilistic!), and budget pressure. Your harness's verbose logs show exactly which phase failed.

## The three structural levers

1. **Progressive disclosure** — load when needed, not in case: every primitive added eagerly degrades all the others.
2. **Subagent isolation** — a child thread restarts with a **fresh** window, in the strong zones of the U-curve, instead of inheriting the parent's mid-context swamp. That's the theory behind [our Copilot subagents]({{ site.baseurl }}/2026/07/29/copilot-subagents-splitting-the-work/).
3. **Plan-write-then-reload** — in long sessions, write the plan to a file and **re-read** it at decision points: the re-read brings the plan back from the trough into the high-attention tail, exactly when it matters.

## The cost/benefit matrix of context loads

| Content type | Cost | Recommended treatment |
| --- | --- | --- |
| Base project rules | low | at the head, always loaded |
| Scoped rules | moderate | progressive disclosure |
| Source files | moderate to high | load selectively |
| Tool output from old turns | grows without bound | summarize into the plan, purge |
| Pasted stack traces | high, fast-melting value | after two pastes: reset the session |
| Web-fetched docs | very high | one-shot grounding, bounded scope |

Diagnosis fits in three questions: how many tokens were loaded at the failure point? where is the failing instruction **sitting** in the window? how many tool outputs have piled up since it was last reinforced? Per the handbook, these three questions solve most attention-starvation cases.

## A word of honesty

- The U-curve is an **empirical, moving** result: recent models keep improving on long contexts. But the economics remain: attention is finite, position matters, and there is no free lunch — a design principle more durable than any benchmark.
- Don't cargo-cult the reset: killing a session that was going fine has a cost too. The useful signal is **observed degradation** (forgotten conventions, answers getting longer), not a token counter for its own sake.

## In short

- **Window ≠ focus**: the window is addressable, attention is small, positional, and degrades under load — a U-curve, with drift toward the trough.
- Context follows a pipeline: **resolve → materialize → bind → activate**, with three binding modes; a skill that "doesn't work" is often a skill that never activated, down-ranked by budget pressure.
- Three levers: **progressive disclosure**, **fresh-context subagents**, **plan-write-then-reload**.
- Sort your loads with the cost/benefit matrix — and beware of piled-up stack traces.

Tomorrow, the uncomfortable question: what do we *actually* let the agent do? The deterministic/probabilistic boundary — the model proposes, the gate disposes. And that, honestly… is not rocket science.
