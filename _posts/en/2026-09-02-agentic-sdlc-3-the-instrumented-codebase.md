---
layout: post
title: "The Agentic SDLC (3/9) — The instrumented codebase: seven primitives to equip your agents — it's not rocket science!"
date: 2026-09-02 10:00:00
author: AClerbois
ref: agentic-sdlc-primitives
image: /images/posts/agentic-sdlc-primitives.png
tags: [agentic-sdlc, agents, AI, instructions, skills, best-practices]
level: 200
---

Ask your team where it is written that "middleware decorators go in `middleware.py`" or that "the old HTTP client has been deprecated since March". Answer: nowhere. It's *known*, not written. For a new colleague, the coffee machine fixes that; for an agent that shows up **amnesiac at every session**, it's a landmine. Chapter 12 of Daniel Meppiel's [Agentic SDLC Handbook](https://danielmeppiel.github.io/agentic-sdlc-handbook/handbook/ch12-the-instrumented-codebase.html) attacks exactly that seam: the **instrumented codebase**, or how to convert tacit knowledge into files the agent loads as context.

If you followed our series [“the repo that talks”]({{ site.baseurl }}/2026/08/21/the-artifacts-of-vibe-coding-the-complete-map/), you are on familiar ground — and you are about to see how Meppiel systematizes the idea into a **small programming language with seven primitives**. Not rocket science.

<!--more-->

## The seven primitives

Each primitive fills one specific knowledge gap and loads at one specific moment — that pairing (what + when) is what makes the system:

| Primitive | Loading | Role |
| --- | --- | --- |
| **Instructions** (`.instructions.md`) | eager, glob-scoped | the conventions of a file domain ("all middleware goes through X") |
| **Agents** (`.agent.md`) | on delegation | specialist personas: expertise, named patterns, allowed tools |
| **Skills** (`SKILL.md`) | lazy, on demand | reusable decision frameworks, not mere rules |
| **Prompts** (`.prompt.md`) | invoked by the human | repeatable workflows — the repo's makefile targets |
| **Memory** (`.memory.md`) | eager, persistent | dated decisions, trade-offs, project history |
| **Specs** (`.spec.md`) | invoked at session start | a feature's scope: components, contracts, criteria |
| **Hooks** | event-driven | automatic reactions: lint on save, tests on new file |

Three design rules run through the chapter: keep files **short** (under 40-50 lines, otherwise split), give patterns **names** (agents cite what has a name), and include the **anti-patterns** ("never do X" encodes institutional memory).

## Assembly: a hierarchy, not a pile

For a given task, effective context assembles in layers, general to specific: global instructions → scoped instructions → activated skills → agent persona → prompt or spec → memory → hooks across the board. Each layer **narrows the field and adds precision**. A conflict between layers is not bad luck: it's a design bug to fix.

You can hear the echo of [AGENTS.md]({{ site.baseurl }}/2026/08/22/agents-md-your-ai-onboarding-guide/) and [Copilot's skills, instructions and agents]({{ site.baseurl }}/2026/07/02/github-copilot-skills-instructions-agents-mcp/): the bricks already exist in your tools. What the handbook adds is the **grammar** for composing them.

## The instrumentation audit: where to start

The chapter's how-to fits in five steps, and it makes an excellent team workshop:

1. **List your conventions** — expect 30 to 60 items from one team discussion.
2. **Classify them**: already in the code? in the docs? only in heads? (focus on the heads)
3. **Rank by cost of failure**: security first, style last.
4. **Map each item** to one of the seven primitives.
5. **Write 3 to 5 files** covering the critical ones — and iterate on feedback.

Then the **feedback loop** takes over. For every failed agent output, a diagnosis: violated convention → scoped instruction; output too generic → enrich the persona; no decision framework → extract a skill; missing historical context → update memory. Every correction becomes a **permanent prevention** — compound interest applied to context.

## What it pays back

The handbook offers field-observed orders of magnitude: convention violations dropping from 40-60% of output to under 10%, reviews emptied of style nitpicks to keep only substance, code needing rewrite cut in half. And a realistic roadmap: week 1, global instructions + one scoped file + one persona; week 2, test on real work and update memory; week 3, first skill and first prompt; then monthly review and **deletion of dead rules**.

## A word of honesty

- The handbook's before/after numbers are **field estimates**, not a controlled study — the author presents them as such. Take the trend, not the decimal.
- The classic trap: generating fifty primitive files in a week. That is the surest way to produce dead documentation — the chapter's rule is clear: **add only in response to an observed failure**, and prune monthly.
- Artifacts and primitives don't duplicate each other: the [artifacts of the repo that talks]({{ site.baseurl }}/2026/08/21/the-artifacts-of-vibe-coding-the-complete-map/) (ADRs, glossary, tests…) document the *system* for humans and agents; primitives configure *agent behavior*. The latter point to the former — it's a marriage, not a rivalry.

## In short

- The instrumented codebase converts **tacit knowledge** into loadable files: the direct answer to episode 1's "dual knowledge problem".
- **Seven primitives**, each with its loading moment: instructions, agents, skills, prompts, memory, specs, hooks.
- Assembly is a **hierarchy** from general to specific — a conflict is a design bug.
- Start with the **instrumentation audit** (5 steps, 3-5 files), then let the **feedback loop** grow the system in response to real failures.
- Short files, named patterns, included anti-patterns — and monthly pruning.

Tomorrow, the handbook's centerpiece: **PROSE**, the five architectural constraints that hold the whole edifice together — with their openly claimed lineage from REST. And that, honestly… is not rocket science.
