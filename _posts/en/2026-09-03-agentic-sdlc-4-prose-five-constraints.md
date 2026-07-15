---
layout: post
title: "The Agentic SDLC (4/9) — PROSE: five constraints for reliable agents — it's not rocket science!"
date: 2026-09-03 10:00:00
author: AClerbois
ref: agentic-sdlc-prose
image: /images/posts/agentic-sdlc-prose.png
tags: [agentic-sdlc, agents, AI, prose, architecture, best-practices]
level: 200
---

REST never prescribed a language, a framework or a format. It laid down **constraints** — statelessness, uniform interface, caching — and those constraints *induced* the properties we wanted: a web that scales and evolves piece by piece. The central bet of Daniel Meppiel's [Agentic SDLC Handbook](https://danielmeppiel.github.io/agentic-sdlc-handbook/handbook/ch13-the-prose-specification.html) is to repeat exactly that move for AI agents. It's called **PROSE**, and it's chapter 13 — the heart of the book.

After [the agentic runtime machine]({{ site.baseurl }}/2026/09/01/agentic-sdlc-2-the-agentic-runtime-machine/) and [the seven primitives]({{ site.baseurl }}/2026/09/02/agentic-sdlc-3-the-instrumented-codebase/), here is the grammar that holds them together. Five constraints, five anti-patterns killed, one checklist. Not rocket science.

<!--more-->

## The five constraints in one table

| Letter | Constraint | The rule | The anti-pattern it kills |
| --- | --- | --- | --- |
| **P** | Progressive Disclosure | context arrives **just-in-time**, not just-in-case | context dumping |
| **R** | Reduced Scope | tasks sized to context capacity | scope creep |
| **O** | Orchestrated Composition | small, chainable primitives, no monolith | the monolithic prompt |
| **S** | Safety Boundaries | tools, knowledge and authority explicitly bounded | the unbounded agent |
| **E** | Explicit Hierarchy | rules in a tree, global to local | flat instructions |

Notice the correspondence with [episode 1]({{ site.baseurl }}/2026/08/31/agentic-sdlc-1-the-vibe-coding-cliff/): each constraint answers a structural property of LLMs — finite context (P, R), probabilistic output (S), the need for composition and clear resolution (O, E).

## A quick tour, with the concrete moves

- **Progressive Disclosure.** Attention degrades under load, so you optimize signal-to-noise, not volume. The move: **Markdown links with descriptive labels** instead of inlined content — the agent loads when relevant.
- **Reduced Scope.** The sizing heuristic is brilliantly simple: a well-sized task is one the agent finishes **without asking a question**. If you're adding context mid-session, the scope was wrong from the start.
- **Orchestrated Composition.** The 3,000-word prompt covering role, standards, errors, tests and security is unpredictable: everything interacts with everything. The move: one file = one responsibility, and workflows that **reference** instead of copy-pasting.
- **Safety Boundaries.** Three boundaries per agent: **capability** (which tools), **knowledge** (which context), **authority** (what needs human approval). The chapter ships four standard roles — code writer, reviewer, test runner, deployer — each with its STOP gates. A direct echo of [securing GitHub Copilot]({{ site.baseurl }}/2026/07/10/securing-github-copilot/).
- **Explicit Hierarchy.** A root `AGENTS.md` for the baseline, scoped files for domains: the agent resolves from most specific to most general — and you can add rules to a module **without touching the parents**.

## Independent on paper, interdependent in practice

The most useful part of the chapter is its three failure stories — applying four constraints out of five is not enough:

1. **Hierarchy without Progressive Disclosure**: a beautiful file tree… of self-contained, obese files. The agent gets everything at once and can no longer tell what applies to its task.
2. **Reduced Scope without Composition**: well-sized tasks but guidance copy-pasted everywhere. The standard changes, and every service drifts with its stale copy.
3. **Safety Boundaries without Reduced Scope**: strict gates drowned under 40,000 tokens of implementation detail — the agent has *forgotten* the constraints loaded at session start.

## In the field: JWT in five sessions

The chapter's worked example — adding JWT authentication to an Express app — shows the full system: an instruction hierarchy (root → backend → auth rules with STOP gates on token logic), a bounded persona (edits `src/auth/` and `tests/auth/`, no deploy access), and a split into **five fresh-context sessions** (token schema, middleware, refresh endpoint, integration tests, frontend by a *different* agent). The delicious moment: in session 2, the backend agent tries to modify the frontend API client — **its tool boundary stops it**, it reports the suggestion, and the frontend specialist handles it in session 5 with the right context. The constraint didn't cripple the system; it routed the information.

## The compliance checklist

Eleven yes/no questions to audit your setup — here's the skeleton: do your files **link** instead of inlining? does each task fit **in one sentence**? does each file have **a single responsibility**? does each agent have an **explicit tool list** and **STOP gates**? do your rules exist at **three levels of specificity**? Remediation priority per the handbook: safety gaps first (S), then hierarchy (E), then the rest by pain.

## A word of honesty

- PROSE is an **opinionated discipline**, not a standard blessed by a committee — the author says so himself. The REST analogy is a goal, not a given: REST won because everyone adopted it, and that part of the game is still open.
- You recognized some old friends: single responsibility, least privilege, separation of concerns. That's deliberate — and rather reassuring: PROSE applies to agents principles that forty years of software engineering have already stress-tested.

## In short

- **PROSE** = Progressive Disclosure, Reduced Scope, Orchestrated Composition, Safety Boundaries, Explicit Hierarchy — five constraints that *induce* reliability, modularity and auditability, the way REST induced the web's scalability.
- Each constraint kills one specific anti-pattern: context dumping, scope creep, the monolithic prompt, the unbounded agent, flat instructions.
- They are **interdependent**: four out of five, and the system leaks through the fifth.
- Test yourself with the **eleven-question checklist** — safety first.

Tomorrow we dive into the resource this whole system is economizing: **attention**. Window ≠ focus, the U-curve, and the full load lifecycle of your primitives. And that, honestly… is not rocket science.
