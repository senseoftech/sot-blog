---
layout: post
title: "The Agentic SDLC (1/9) — The vibe coding cliff: why your agents need a method — it's not rocket science!"
date: 2026-08-31 10:00:00
author: AClerbois
ref: agentic-sdlc-thesis
image: /images/posts/agentic-sdlc-thesis.png
tags: [agentic-sdlc, vibe-coding, agents, AI, methodology]
level: 200
---

On Friday, the agent built your prototype in two hours and you applauded. On Monday, released onto the real repository — fifteen years of history, conventions nobody ever wrote down, a legacy module everyone tiptoes around — the same agent invents APIs, tramples your house rules and returns a diff nobody dares to merge. That moment has a name: **the vibe coding cliff**. And above all it has a remedy, which is not "wait for a better model".

That is the thesis of the [Agentic SDLC Handbook](https://danielmeppiel.github.io/agentic-sdlc-handbook/) by Daniel Meppiel — Global Black Belt at Microsoft, creator of APM — a free, online book, written *with* the very method it teaches. Its opening line sums up the problem: every engineering organization is adopting AI coding agents, almost none of them has a methodology for it. This nine-episode series walks through his vision, from the developer's desk to the CTO's office. You'll see: it's not rocket science.

<!--more-->

## The cliff, up close

The handbook opens on something you have probably lived through: AI agents fail on real codebases in **predictable** ways. Three patterns keep coming back:

| Failure pattern | What happens |
| --- | --- |
| **Context exhaustion** | the whole system doesn't fit in the window; the agent loses the thread mid-session |
| **Hallucinated interfaces** | the agent invents plausible APIs that don't exist in your code |
| **Violated conventions** | team rules that were never written down are invisible to it — so it steamrolls them |

The trap is that these failures are **silent**. A weak model fails loudly: it can't do the task, and you see it. A powerful model with poor context fails *confidently*: plausible code that passes review… and breaks in production.

## It's not the model, it's what we feed it

The classic objection: "the next model will fix this." The handbook compiles numbers that tell a different story. Context windows grew from 2,048 tokens (GPT-3, 2020) to over a million today — a factor of 500. If size were the problem, satisfaction would have followed. Yet the Stack Overflow 2024 survey shows 76% adoption but 45% of respondents rating AI as "bad" on complex tasks; the 2025 edition adds that 66% describe solutions that are "almost right, but not quite". And GitClear's analyses across 211 million lines measure **churn** (code rewritten shortly after being produced) exploding among heavy AI users.

Doubling the window and then doubling what you pour into it changes nothing: everything that enters **competes for the same attention**. We already brushed against this in [the context window: the art of compressing and forgetting]({{ site.baseurl }}/2026/07/26/context-window-compress-forget/) — the handbook turns it into a founding principle.

## The three properties that won't go away

Meppiel's whole method flows from three structural properties of LLMs — not bugs, **characteristics**:

1. **Context is finite and fragile.** Fixed capacity, competing attention; quality degrades under load.
2. **Context must be explicit.** A repository holds two kinds of knowledge: the written code (accessible to AI) and the understood conventions (in people's heads). The agent only has the first — and the seam between the two is exactly where things break.
3. **Output is probabilistic.** Same inputs, different outputs. Reliability isn't assumed, it's **architected**.

Does that second point ring a bell? It is precisely the bet of our series [“the repo that talks”]({{ site.baseurl }}/2026/08/21/the-artifacts-of-vibe-coding-the-complete-map/): turning implicit knowledge into versioned artifacts. The two visions snap together — we'll come back to it in episode 3.

## The answer: constraints, not magic

Against all this, the handbook proposes **PROSE**: five architectural constraints — Progressive Disclosure, Reduced Scope, Orchestrated Composition, Safety Boundaries, Explicit Hierarchy. The explicit analogy is **REST**: REST prescribed no technology, it laid down constraints that *induce* the desired properties (scalability, independent evolution). PROSE does the same for agents: each constraint answers one of the three properties above and induces reliability, modularity, auditability. Episode 4 goes through them one by one.

Meppiel frames it all with an image borrowed from Andrej Karpathy: we are in "the 1980s" of this kind of computing. The processor (the LLM) is already powerful; everything around it — harnesses, constraints, primitives, package managers — is embryonic. A stack is forming before our eyes, and that stack is what this series climbs down, layer by layer.

## The map of the series

| # | Date | Episode |
| --- | --- | --- |
| 1 | today | **The vibe coding cliff** — you are here |
| 2 | [September 1]({{ site.baseurl }}/2026/09/01/agentic-sdlc-2-the-agentic-runtime-machine/) | the agentic runtime machine: model, harness, agent source code, client |
| 3 | [September 2]({{ site.baseurl }}/2026/09/02/agentic-sdlc-3-the-instrumented-codebase/) | the instrumented codebase: seven primitives to equip your agents |
| 4 | [September 3]({{ site.baseurl }}/2026/09/03/agentic-sdlc-4-prose-five-constraints/) | PROSE: the five constraints in detail |
| 5 | [September 4]({{ site.baseurl }}/2026/09/04/agentic-sdlc-5-the-attention-economy/) | the attention economy: the window is not the focus |
| 6 | [September 5]({{ site.baseurl }}/2026/09/05/agentic-sdlc-6-the-deterministic-probabilistic-boundary/) | the deterministic/probabilistic boundary: the agent proposes, the machine disposes |
| 7 | [September 6]({{ site.baseurl }}/2026/09/06/agentic-sdlc-7-orchestrating-an-agent-fleet/) | orchestrating an agent fleet: waves and checkpoints |
| 8 | [September 7]({{ site.baseurl }}/2026/09/07/agentic-sdlc-8-nineteen-ways-to-sabotage-your-agents/) | nineteen anti-patterns, from the monolithic prompt to the unbounded agent |
| 9 | [September 8]({{ site.baseurl }}/2026/09/08/agentic-sdlc-9-for-leaders-business-case-governance-the-bill/) | for leaders: business case, governance, teams and the bill |

## A word of honesty

- The handbook is a **living document in pre-release** (v0.11, June 2026) under a CC BY-NC-ND license. Its author is the first to label his evidence: one large, public, verifiable PR, industry surveys, and estimates flagged as estimates. Enterprise-scale validation is still ahead.
- This series is a **commented reading, not a translation**: I run Meppiel's vision through the filter of this blog and my .NET/GitHub Copilot daily life. For the full text — free — [it's here](https://danielmeppiel.github.io/agentic-sdlc-handbook/).

## In short

- The **vibe coding cliff**: agents shine in demos and fail on real repositories, along three predictable patterns — exhausted context, hallucinated interfaces, violated conventions.
- It is **not a model problem**: windows ×500, satisfaction flat; what matters is what fills the window.
- Three structural properties won't go away: **finite** context, **invisible implicit** knowledge, **probabilistic** output.
- The handbook's answer: **PROSE**, five architectural constraints in the spirit of REST — and a whole stack forming above the LLMs.
- Nine episodes to take it all apart, from the dev's terminal to the CFO's spreadsheet.

Tomorrow we pop the hood: when you type a prompt, *who* does what? Model, harness, instruction files, client — the four parts of the agentic runtime machine. And that, honestly… is not rocket science.
