---
layout: post
title: "ECC (1/3) — The Claude Code config that won Anthropic's hackathon — it's not rocket science!"
date: 2026-09-14 10:00:00
author: AClerbois
ref: ecc-winning-config
image: /images/posts/ecc-winning-config.png
tags: [agents, AI, claude-code, configuration, open-source]
level: 200
---

For nine episodes, [our Agentic SDLC series]({{ site.baseurl }}/2026/08/31/agentic-sdlc-1-the-vibe-coding-cliff/) defended one thesis: coding with agents demands a method — primitives, constraints, validation gates. What was missing was the exhibit. Here it is. February 2026, Anthropic × Forum Ventures hackathon at Cerebral Valley: Affaan Mustafa and his co-founder win by building [zenith.chat](https://zenith.chat) **entirely in Claude Code**. And instead of keeping the recipe, the winner published his whole configuration under MIT: [**ECC**](https://github.com/affaan-m/ecc), "the agent harness operating system". More than 230,000 GitHub stars later, it is probably the most scrutinized agent config in the world.

This three-episode mini-series dissects it: today the story and the overview, tomorrow the technical anatomy, the day after the lessons to steal — even if you don't use Claude Code. Not rocket science.

<!--more-->

## The identity card

ECC is not "a config file": it's a complete system, born — per its author — of more than ten months of intensive daily use building real products:

| Component | Volume | Role |
| --- | --- | --- |
| **Skills** | 278 | the primary working surface: TDD, review, e2e, deployment, research… |
| **Agents** | 67 | delegable specialists: planner, architect, per-language reviewers |
| **Rules** | 34 (9 common + 25 per language) | the always-true: style, git, workflow |
| **Hooks** | 20+ scripts | event-driven automations: guardrails, formatting, secrets |
| **MCP** | 14 ready-made servers | GitHub, Supabase, Vercel, Railway… |
| **Shims** | 94 legacy commands | backward compatibility during the migration to skills |

All of it multi-harness — Claude Code, Cursor, Codex, OpenCode, Gemini, Copilot, Zed — maintained by a solo developer shipping weekly, backed by 230+ contributors. If you read [our episode on the agentic runtime machine]({{ site.baseurl }}/2026/09/01/agentic-sdlc-2-the-agentic-runtime-machine/), you recognize the "agent source code" box — pushed here to industrial scale.

## The hackathon as a crash test

The story fits in one line from the author: the win **validated that the config was production-ready**. Building a complete product in a weekend, driven entirely from the harness, is the ultimate crash test for a configuration — the opposite of a collection of theoretical prompts. It's exactly the "handbook written with the method it teaches" principle we admired [in Daniel Meppiel's work]({{ site.baseurl }}/2026/09/06/agentic-sdlc-7-orchestrating-an-agent-fleet/): proof by use.

## AgentShield: born the same weekend

Out of the same hackathon came **AgentShield**, a security auditor… for agent configurations. The tool scans `CLAUDE.md`, `settings.json`, MCP configs, hooks, agents and skills along five axes: secrets detection (14 patterns), permission auditing, hook injection analysis, MCP server risk profiling, agent config review. The spec sheet claims 1,282 tests, 98% coverage, 102 static analysis rules — and an adversarial pipeline of three Claude Opus agents: red team, blue team, auditor.

Take a second to appreciate the reversal: **the agent config has become an attack surface that deserves its own scanner**. It's the logical continuation of what we wrote in [prompt injection: defense in depth]({{ site.baseurl }}/2026/08/13/prompt-injection-defense-in-depth/) — more on this in episode 3.

## Trying it without hurting yourself

Three installation paths, from simplest to finest:

1. **The plugin** (recommended): `/plugin install ecc@ecc` from the Claude Code marketplace.
2. **Selective install**: `install.sh` / `install.ps1` with `minimal`, `core` or `full` profiles.
3. **Manual copy**: cherry-pick agents, rules and skills into `~/.claude/`.

And pitfall #1, documented by the author himself: **never stack the methods** — plugin *then* install script = duplicate skills, duplicate hooks, conflicting context. The README even ships the uninstall `--dry-run` to dig yourself out.

One last point, and not the least: the author explicitly warns that **unofficial third-party mirrors** of his config circulate and may contain malware — install only from verified channels (the GitHub repo, the official npm packages, the `ecc@ecc` slug). An agent config deserves the same paranoia as a dependency.

## The map of the mini-series

| # | Date | Episode |
| --- | --- | --- |
| 1 | today | **The config that won** — you are here |
| 2 | [September 15]({{ site.baseurl }}/2026/09/15/ecc-2-anatomy-skills-hooks-instincts/) | anatomy: skills-first, hooks, instincts and memory |
| 3 | [September 16]({{ site.baseurl }}/2026/09/16/ecc-3-the-lessons-to-steal/) | the lessons to steal — even without Claude Code |

## A word of honesty

- 230,000 stars don't mean "install everything": ECC is a **personal config turned ecosystem**. Its first value, for us, is to be **read** — a free, annotated catalog of production-proven patterns.
- The project has a transparent commercial side (ECC Pro, sponsors) funding the shipping cadence; the core stays MIT "perpetually". Worth keeping in mind while reading the README, as with any open source project with a paid tier.

## In short

- **ECC** = the complete configuration of the Anthropic × Forum Ventures hackathon winner (Feb 2026, zenith.chat built entirely in Claude Code), published under MIT — 278 skills, 67 agents, 34 rules, 20+ hooks, multi-harness.
- Born of **ten months of real use**, validated by the win — proof by use, not theory.
- **AgentShield**, born the same weekend, scans… agent configs: the config is officially an attack surface.
- Install through **one** path (plugin or script or manual), from **verified channels** only.

Tomorrow we pop the hood: how 278 skills fit without melting the context window, what the hooks guard, and the "instincts" system that learns from your sessions. And that, honestly… is not rocket science.
