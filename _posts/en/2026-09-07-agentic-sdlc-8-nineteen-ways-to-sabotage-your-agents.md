---
layout: post
title: "The Agentic SDLC (8/9) — Nineteen ways to sabotage your agents — it's not rocket science!"
date: 2026-09-07 10:00:00
author: AClerbois
ref: agentic-sdlc-anti-patterns
image: /images/posts/agentic-sdlc-anti-patterns.png
tags: [agentic-sdlc, agents, AI, anti-patterns, best-practices]
level: 200
---

"Done — all three files modified and the tests pass." You run `git diff`: **nothing**. The edit failed silently, the agent narrated its success with total confidence, and you just lived through anti-pattern #12 of the catalog. Chapter 20 of Daniel Meppiel's [Agentic SDLC Handbook](https://danielmeppiel.github.io/agentic-sdlc-handbook/handbook/ch20-anti-patterns-and-failure-modes.html) documents **nineteen failure modes** of agentic development — named, diagnosed, treated. Its key line deserves a spot on the wall: AI failures don't crash, they produce plausible wrong output.

After [orchestration]({{ site.baseurl }}/2026/09/06/agentic-sdlc-7-orchestrating-an-agent-fleet/), the penultimate episode plays the blooper reel — except you'll recognize yourself in every line. So did I. Not rocket science, but humbling.

<!--more-->

## The five foundational ones: PROSE in negative

The first five you already know — they are the direct violations of the [PROSE constraints]({{ site.baseurl }}/2026/09/03/agentic-sdlc-4-prose-five-constraints/): the **monolithic prompt** (everything interacts with everything, each added rule destabilizes the others — models interpret context probabilistically, not sequentially), **context dumping** (the whole codebase in the window, the agent fixates on irrelevant details), the **unbounded agent** (no file restrictions), **flat instructions** (rules from different domains contradict each other), and **scope creep** (the task swells mid-session, quality melts along the way).

## The five execution ones: where fleets crash

| Anti-pattern | The symptom | The remedy |
| --- | --- | --- |
| **The solo hero** | one agent, one whole feature, one giant unreadable diff | one file per agent per wave, checkpoints |
| **The trust fall** | taking the agent's word for it ("done!") | **`git diff`, never the narrative** — deterministic verification |
| **Same-file parallel edits** | the second agent fails silently | one file, one agent; sequence across waves |
| **Skipping checkpoints** | three waves in a row untested, root cause unrecoverable | test and commit **every** wave — 2 minutes vs 3 hours |
| **Not fixing the primitives** | the same mistake every session, hand-corrected every time | trace back to the faulty config file: **fix the system, not the output** |

The last one is my favorite: it's [episode 3's feedback loop]({{ site.baseurl }}/2026/09/02/agentic-sdlc-3-the-instrumented-codebase/) run in reverse. Correcting the output without correcting the primitive is bailing water without plugging the hull.

## The nine session ones: wear, cost, trust

The rest of the catalog covers everyday session life: **context window exhaustion** (quality degrades midway — stop, commit, restart fresh, see [episode 5]({{ site.baseurl }}/2026/09/04/agentic-sdlc-5-the-attention-economy/)); **hallucinated edits** (our opening `git diff`); **stale context between waves** (the agent references the interface from two days ago — re-read committed state after every checkpoint); **cost runaway** (fifteen retries for marginal progress — set a budget: after two failures, re-slice or change approach); the **"almost done" trap** (the last 10% resists, sunk cost holds you hostage — commit what works, isolate the hard part); **session state loss** (mid-task crash, inconsistent codebase — commit every wave); **persona drift** (your backend specialist starts refactoring CSS — shorter sessions, role reasserted in the task prompt); **cross-wave merge conflicts** (each wave passes alone, the combination breaks — integration tests at every wave); and **prompt injection via dependencies** (a library README or code comment hijacks the agent — external content = untrusted, allowlists, pre-scanning; we devoted [a whole episode to defense in depth]({{ site.baseurl }}/2026/08/13/prompt-injection-defense-in-depth/)).

## Detecting the silent

Since nothing "crashes", detection has to be planned. The chapter proposes a checklist by granularity: **per dispatch** (does the diff match the task?), **per wave** (tests + convention scan), **per PR** (review of the sensitive spots), **weekly** (trends: churn, intervention rate). The cross-cutting reflex: never accept a success narrative without **deterministic proof** — green tests, inspected diff, re-read file.

## The recovery playbook

When it breaks anyway, six steps: assess and diagnose → snapshot what works → revert the broken sections → decompose the problem → **update the faulty primitive** → re-execute under constraints. Note step 5: every incident must leave a trace in your configuration — or you will relive it.

## A word of honesty

- Nineteen is a catalog, not an anxiety checklist. Most teams accumulate **three or four** of these patterns, not nineteen. Spot yours, fix them in order of cost.
- Some remedies seem to contradict each other (commit often vs don't over-persist). The referee is always the same: is the committed state **tested and consistent**? If yes, move forward; if not, step back.

## In short

- Agent failures are **silent**: plausible, confident, wrong — detection is designed, it doesn't happen by itself.
- Five foundational anti-patterns = the **PROSE violations**; five execution ones for fleets; nine of session wear.
- The reflexes that save you: **`git diff` over the narrative**, test and commit every wave, a retry budget, and **fix the primitive**, not the output.
- Six recovery steps, one non-negotiable: the incident must improve your configuration.

Tomorrow, the finale: we ride up to the executive floor — the honest business case, governance, the teams that change, and the bill that varies 8.5× depending on architecture. And that, honestly… is not rocket science.
