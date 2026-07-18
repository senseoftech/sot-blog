---
layout: post
title: "ECC (2/3) — Anatomy: skills-first, hooks, instincts and memory — it's not rocket science!"
date: 2026-09-15 10:00:00
author: AClerbois
ref: ecc-anatomy
image: /images/posts/ecc-anatomy.png
tags: [agents, AI, claude-code, skills, hooks]
level: 300
---

Trick question: how do you load **278 skills** into an agent without pulverizing its context window? Answer: you don't. You load their *descriptions*, and the body only arrives if the task calls for it. The whole architecture of [ECC]({{ site.baseurl }}/2026/09/14/ecc-1-the-config-that-won-the-hackathon/) rests on that kind of trade-off — and if you followed [our episode on the attention economy]({{ site.baseurl }}/2026/09/04/agentic-sdlc-5-the-attention-economy/), you'll spend this article ticking boxes: budgets, lazy loading, thresholds, gates. The handbook's theory, embodied in a winning config.

Today we dissect ECC's four organs: the skills-first surface, the agent fleet, the hooks, and the "instincts" memory system. Not rocket science.

<!--more-->

## Skills-first: commands are dead, long live skills

The most visible architectural choice: **skills are the primary working surface**, and the 94 historical slash-commands survive only as compatibility *shims*. The difference isn't cosmetic — it's budgetary. A command loads when invoked; a skill permanently exposes its **description** (a few lines) and only materializes its body on activation. It's [PROSE]({{ site.baseurl }}/2026/09/03/agentic-sdlc-4-prose-five-constraints/)'s *progressive disclosure*, applied 278 times over.

Two skills set the house tone:

- **`verification-loop`** — six gates before declaring work done: build → types → lint → tests (80% minimum coverage) → security (credentials, debug statements) → diff review. House rule: if the build breaks, **STOP** and fix before continuing. Output: a standardized **READY / NOT READY** report for the PR — and in long sessions, the loop returns every 15 minutes. It's the tooled-up answer to the "trust fall" from [our anti-patterns gallery]({{ site.baseurl }}/2026/09/07/agentic-sdlc-8-nineteen-ways-to-sabotage-your-agents/): never the narrative, always the proof.
- **`search-first`** — research *before* code: documentation and sources first, implementation second. "Research-first development" turned into a reflex.

## 67 agents and one rule: parallelize

The agent fleet covers the expected roles (planner, architect, code-reviewer, security-reviewer, per-language build-resolvers) and a few gems — special mention for the **`silent-failure-hunter`**, whose name alone summarizes [the deterministic/probabilistic boundary]({{ site.baseurl }}/2026/09/05/agentic-sdlc-6-the-deterministic-probabilistic-boundary/): agent failures are silent, so employ a bloodhound.

The most interesting part lies in the **always-on rules** that drive delegation: complex feature → `planner`, freshly written code → `code-reviewer`, bug → `tdd-guide`, architecture question → `architect` — **without the user asking**. And one all-caps instruction in the text: always parallelize independent tasks, never serialize unnecessarily. It's [fleet orchestration]({{ site.baseurl }}/2026/09/06/agentic-sdlc-7-orchestrating-an-agent-fleet/) reduced to three-line rules.

## Hooks: the deterministic layer

ECC's 20+ hooks are the embodiment of what we preached in [linters that enforce themselves]({{ site.baseurl }}/2026/08/28/linters-and-analyzers-conventions-that-enforce-themselves/): guardrails **outside the model's control**.

| Moment | ECC examples |
| --- | --- |
| **Pre-execution** | block destructive git commands (GateGuard), `console.log`, shell outside tmux |
| **Post-edit** | auto-format, TypeScript verification |
| **Pre-submission** | secret detection by patterns (`sk-`, `ghp-`, `AKIA`…) |
| **Session lifecycle** | save context on Stop, reload on SessionStart |

Tuning happens **at runtime through environment variables**: `ECC_HOOK_PROFILE=minimal|standard|strict` for the enforcement level, `ECC_DISABLED_HOOKS` to switch off one specific hook without touching the config. An annoying hook gets disengaged, not deleted — the config stays shareable.

## Instincts: the memory that learns (under quota)

The most original piece. ECC extracts **patterns mid-session** — your corrections, your preferences, your conventions — and stores them as "instincts" **scored for confidence from 0 to 1**. At the next session start, only instincts above the threshold (0.7 by default) get injected, **six at most**, within a context budget capped at 8,000 characters. The full memory lives on disk (`$ECC_AGENT_DATA_HOME`, isolated per harness so Claude Code and Cursor don't overwrite each other); only the elite makes it into context.

Four commands drive the cycle: `/instinct-status` (see the scores), `/instinct-export` / `/instinct-import` (share your patterns — memory becomes **transferable between humans**), and the most beautiful one: `/evolve`, which **clusters correlated instincts into a reusable skill**. Re-read [the instrumented codebase's feedback loop]({{ site.baseurl }}/2026/09/02/agentic-sdlc-3-the-instrumented-codebase/): every corrected failure becomes a permanent prevention. ECC literally automates that loop — the failure becomes an instinct, the recurring instinct becomes a skill.

## Multi-harness: porting, industrialized

Last organ: parity across seven harnesses, achieved through the adapter pattern (Cursor reuses Claude Code's hook scripts), `AGENTS.md` as the universal format — [we introduced it as your AI's onboarding guide]({{ site.baseurl }}/2026/08/22/agents-md-your-ai-onboarding-guide/) — and cross-platform Node scripts. Remember the diagnosis from [the agentic runtime machine]({{ site.baseurl }}/2026/09/01/agentic-sdlc-2-the-agentic-runtime-machine/): "switching harnesses is porting code". ECC is what porting looks like when you treat it as a product.

## A word of honesty

- Self-learning writes **model-generated configuration** into your system: powerful, and exactly the kind of surface AgentShield exists to audit. Review your instincts the way you review a PR.
- Automatic delegation and parallelism cost tokens: ECC owns that and compensates with strict budget discipline — which is the whole subject of episode 3.
- Some choices are strong opinions (shell constrained to tmux, 80% coverage): author settings, not laws of physics.

## In short

- **Skills-first**: 278 lazily-loaded skills, 94 commands reduced to shims — progressive disclosure at scale.
- **`verification-loop`**: six gates and a READY/NOT READY verdict — proof before narrative, every 15 minutes.
- **67 agents** with rule-driven automatic delegation and mandatory parallelism on independent tasks.
- **Hooks** = the deterministic layer (GateGuard, secrets, formatting), runtime-tunable through profiles.
- **Instincts**: learned memory, confidence-scored, injected under quota (0.7 threshold, max 6, 8,000 characters) — and `/evolve` turns recurring instincts into skills.

Tomorrow, the finale: the **seven transferable lessons** — token economics, MCP drain, strategic compaction, proof before "done"… — and how to apply them to your own harness, Copilot included. And that, honestly… is not rocket science.
