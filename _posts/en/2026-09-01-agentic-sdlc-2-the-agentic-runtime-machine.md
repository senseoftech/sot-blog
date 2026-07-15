---
layout: post
title: "The Agentic SDLC (2/9) — The agentic runtime machine: the four parts that run your prompts — it's not rocket science!"
date: 2026-09-01 10:00:00
author: AClerbois
ref: agentic-runtime-machine
image: /images/posts/agentic-runtime-machine.png
tags: [agentic-sdlc, agents, AI, harness, github-copilot]
level: 200
---

A team spends weeks polishing its `.instructions.md` files for GitHub Copilot — pixel-perfect `applyTo` globs, per-directory rules, the whole nine yards. Then it tries Claude Code on the same repository… and the agent ignores everything. Not a bug: Claude Code expects `CLAUDE.md` files scoped by directory hierarchy, not globs in `.github/instructions/`. Same concept, incompatible syntax. The team's verdict: "AI is useless." The handbook's verdict: you just discovered that "the AI" doesn't exist — there are **four parts**, and you only changed one of them.

After [the vibe coding cliff]({{ site.baseurl }}/2026/08/31/agentic-sdlc-1-the-vibe-coding-cliff/), we pop the hood with chapter 11 of Daniel Meppiel's [Agentic SDLC Handbook](https://danielmeppiel.github.io/agentic-sdlc-handbook/handbook/ch11-the-runtime-machine.html): the **agentic runtime machine**. Four independent, replaceable components — and a vocabulary that turns "it stopped working" into a precise diagnosis. Not rocket science, promise.

<!--more-->

## The four parts

| Part | What it is | What we forget |
| --- | --- | --- |
| **The model** | the inference engine (Claude, GPT, Gemini…): text in, text out | it has **no memory, no tools, no access** to your code — everything is brought to it |
| **The harness** | the program driving the model: what runs when you type `claude`, `copilot` or open Cursor | it is what loads files, invokes tools, manages the conversation |
| **Agent source code** | your `AGENTS.md`, `.instructions.md`, `SKILL.md`… | this is not documentation: it is **executable configuration** |
| **The client** | whatever triggers the session: terminal, IDE, GitHub Action, cron | it injects the bootstrap context that trickles down through everything else |

Most complaints aimed "at the model" actually target one of the other three parts. We had already sketched the harness in [the AI harness]({{ site.baseurl }}/2026/07/01/the-ai-harness-github-copilot/); the handbook pushes the idea one notch further.

## The harness is a compiler

The opening story is not an anecdote, it's a law. Copilot and Claude Code implement the **same concept** — scoped rules injected automatically — with **incompatible syntaxes**:

| Aspect | GitHub Copilot | Claude Code |
| --- | --- | --- |
| File | `api.instructions.md` | `CLAUDE.md` |
| Location | `.github/instructions/` | nested in the relevant subtree |
| Scoping | `applyTo` frontmatter (glob) | directory hierarchy |
| References | Markdown links | `@path` directive |

The handbook's conclusion: **switching harnesses is porting code, not ticking a box**. The clean move is to keep canonical primitives and write a small shim file at the entry point the new harness expects — exactly like keeping a portable core with per-platform adapters.

## Markdown is code

Your instruction files have *all* the properties of executable code:

- **parsed**: malformed YAML frontmatter fails silently;
- **linked**: cross-file references form a dependency graph;
- **loaded**: their content enters context at deterministic moments, observable in verbose mode;
- **executed**: wording precision matters — "never use X" prevents a regression, "avoid X" leaves room to negotiate.

So: version them, review them in PRs, lint them, test them. It is the direct continuation of what we wrote about [AGENTS.md]({{ site.baseurl }}/2026/08/22/agents-md-your-ai-onboarding-guide/) — with one extra watchword: write these files with the rigor of code, not the looseness of docs.

## The asymmetry that rules everything: inference is per-thread, the filesystem is shared

This is THE load-bearing principle of the book, the one every pattern in the next episodes hangs from. Each inference session is **amnesiac**: a private window that dies with the session and passes nothing on. The **filesystem** is the only persistent, shared memory.

Very concrete consequences:

- two parallel agents cannot talk to each other: they coordinate **exclusively through files**;
- a child agent inherits nothing — it only reads what its parent **wrote to disk**;
- long sessions demand the **plan-write-then-reload** pattern: write the plan to a file along the way, re-read it at decision points, to survive inference boundaries.

Recognize the mechanics of our [Copilot subagents]({{ site.baseurl }}/2026/07/29/copilot-subagents-splitting-the-work/)? That's it — generalized into an architectural principle.

## What this changes on Monday morning

1. **A diagnostic vocabulary.** Different behavior between two machines, two tools, two days? Ask *which of the four parts changed* before blaming "the AI".
2. **A context budget to watch.** A skill that never triggers is often a parent file that ate the budget before it — the transitive closure of your primitives is measurable.
3. **Engineering discipline on primitives.** Review, lint, CI: your agent files are production code.

## A word of honesty

- The four-part breakdown is the **handbook's vocabulary**, not an industry standard — every vendor renames everything their own way. That's exactly what makes it useful: it survives the renamings.
- Portability is improving (the handbook points to emerging standards on the skills side), but today, porting between harnesses is real work. Budget it as such.

## In short

- "The AI" = **model + harness + agent source code + client**. Four independent, replaceable parts — and four distinct suspects when things go wrong.
- **The harness is a compiler**: same concepts, incompatible syntaxes; switching tools is a port.
- **Markdown is code**: parsed, linked, loaded, executed — treat it with the same rigor.
- **Inference is per-thread, the filesystem is shared**: all multi-agent coordination goes through files; hence the plan-write-then-reload pattern.

Tomorrow we equip the repository: the **seven primitives** of the instrumented codebase — instructions, agents, skills, prompts, memory, specs, hooks — and how they snap together. And that, honestly… is not rocket science.
