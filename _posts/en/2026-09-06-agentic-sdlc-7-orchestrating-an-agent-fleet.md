---
layout: post
title: "The Agentic SDLC (7/9) — Orchestrating an agent fleet: waves and checkpoints — it's not rocket science!"
date: 2026-09-06 10:00:00
author: AClerbois
ref: agentic-sdlc-orchestration
image: /images/posts/agentic-sdlc-orchestration.png
tags: [agentic-sdlc, agents, AI, orchestration, multi-agents]
level: 300
---

How do you write a 68,000-word book with AI agents? Exactly the way you ship a 75-file PR: **waves**, **checkpoints**, and never two agents on the same file. Daniel Meppiel's [Agentic SDLC Handbook](https://danielmeppiel.github.io/agentic-sdlc-handbook/handbook/ch17-multi-agent-orchestration.html) has a rare elegance: it is **its own case study** — eleven agents, four pods, a fleet orchestrated by its author with the very method the text teaches.

After [the deterministic boundary]({{ site.baseurl }}/2026/09/05/agentic-sdlc-6-the-deterministic-probabilistic-boundary/), here are chapters 17 and 18: when to go multi-agent, how to partition, and the five-phase meta-process that turns a fleet into shipped software. We laid the groundwork with [Copilot subagents]({{ site.baseurl }}/2026/07/29/copilot-subagents-splitting-the-work/); now we change scale. Not rocket science.

<!--more-->

## First: do you even need it?

Chapter 17 starts by cooling the enthusiasm:

| A single agent is enough if… | A fleet is justified if… |
| --- | --- |
| fewer than ~10 files | 15-20 files and up |
| a single concern | intersecting concerns (architecture + logging + security) |
| linear dependencies | parallelism that would actually save time |
| context fits comfortably in the window | distinct expertise domains to mobilize |

Three specialization patterns recur: **writer/reviewer/tester** (separate production from validation), **domain teams** (each carrying its specialized context), and **audit/execute/validate** (read-only agents explore, the human decides, read-write agents apply).

## The golden rule and the shared truth

One parallelization constraint is non-negotiable: **one file, one agent, per wave**. Put two agents on the same file and the second one's edits fail silently — its textual anchors have moved.

And remember [episode 2]({{ site.baseurl }}/2026/09/01/agentic-sdlc-2-the-agentic-runtime-machine/): sessions are amnesiac and isolated — agent 1 sees neither agent 2's conversation nor its reasoning. Coordination flows through **committed state**: between waves, the repository becomes the ground truth the next wave reads. Hence the imperative ordering: **foundations before consumers** — types, protocols and interfaces in wave 0, implementations after — to avoid *semantic* conflicts, those changes that are individually correct but mutually inconsistent.

## The meta-process: five phases

Chapter 18 assembles it all into a universal flow, tool-independent:

1. **Audit** — 2 to 4 read-only expert agents examine the code from distinct angles and return ranked findings, cited by file and line.
2. **Plan** — the human turns findings into an executable spec: scope, teams, waves, principles. This is **the highest-impact point**: a mediocre plan perfectly executed yields mediocre software. Every task passes the **self-sufficiency test** — completable without questions? If not, re-slice. (A direct echo of [our implementation plan]({{ site.baseurl }}/2026/08/25/the-implementation-plan-the-human-checkpoint/).)
3. **Waves** — parallel execution, one file per agent; every wave ends **tested and committed**.
4. **Validate** — full suite + human inspection of critical changes.
5. **Ship** — merge, changelog, and a **bisectable** history: one commit per wave, green tests at every step.

When a checkpoint breaks, the **ADAPT** loop takes over: diagnose, adjust the plan, re-execute — uncertainty is part of the contract with a probabilistic system. And the process **scales both ways**: under 10 files, compress everything (one audit, one wave); over 100, extend (4-6 experts, 6-10 waves).

## Escalations and the coordination tax

The human orchestrator handles four escalation levels: **L1** the agent self-heals (red tests), **L2** human-refined retry, **L3** design decision, **L4** scope expansion. The handbook's barometer: a healthy plan runs around 20% L3/L4; **above 25%, it's the plan that was underspecified**, not the agents that are bad.

And the honest numbers from the reference PR (75 files): **45 minutes of human coordination** for 24 minutes of agent compute. The win is not raw speed — it's replacing the 30-45 minutes of debugging a degraded single-agent output with quality controlled upstream. Multi-agent pays off when files count in the dozens, concerns partition cleanly, and the pattern will repeat.

## Proof by book

The handbook's case study tells the story of its own writing: **11 agents in 4 pods** (editorial, domain, review, audit), ~50 dispatches, 4 writing waves, 75 fact-check flags, 4 human escalations. Three delicious lessons: a single agent blew up mid-flight on the 15-chapter architecture (context is finite, always); three personas were created **mid-project** in response to real gaps; and the panel's disagreement about how much space to give APM (the author's own tool!) dissolved the moment the Chief Editor stated an explicit principle — the book must be useful without APM, which appears as proof, not prerequisite. **One written principle is worth a thousand implicit arbitrations.**

## A word of honesty

- The coordination tax is real and the handbook prices it itself. A fleet for a 50-line change is an anti-pattern (chapter 27 says it bluntly) — start single-agent, go fleet on the criteria above.
- The orchestration described is still **artisanal**: the human paces the waves. Harnesses are progressively automating this — but the invariants (one file/one agent, commit per wave, foundations first) hold regardless of tooling.

## In short

- Multi-agent only if: **15-20+ files, intersecting concerns, profitable parallelism, distinct expertises**.
- Golden rule: **one file, one agent, per wave** — and committed state as the only shared truth between waves.
- The meta-process: **audit → plan → waves → validate → ship**, with the ADAPT loop when things break; the plan is the highest-impact human point.
- Escalations L1-L4: above 25% L3/L4, redo the plan.
- The existence proof: the handbook itself, written by 11 agents under human editorial direction.

Tomorrow, the gallery of horrors: **nineteen anti-patterns** — from the monolithic prompt to the agent that swears it modified files it never touched. You will recognize yourself (so did I). And that, honestly… is not rocket science.
