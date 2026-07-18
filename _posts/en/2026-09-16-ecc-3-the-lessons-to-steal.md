---
layout: post
title: "ECC (3/3) — The lessons to steal, even without Claude Code — it's not rocket science!"
date: 2026-09-16 10:00:00
author: AClerbois
ref: ecc-lessons
image: /images/posts/ecc-lessons.png
tags: [agents, AI, best-practices, github-copilot, configuration]
level: 200
---

Not a Claude Code user? Doesn't matter. The best ideas in [ECC]({{ site.baseurl }}/2026/09/14/ecc-1-the-config-that-won-the-hackathon/) are not Claude Code ideas: they are **harness** ideas — and your Copilot, your Cursor or your Codex obey the same laws. To close this mini-series, here are the seven lessons I take away from the winning config, each verifiable in the repo, each transferable by Monday morning.

Grab a notebook. Not rocket science — and it's lived experience, not theory.

<!--more-->

## Lesson 1 — Economy first, heroics second

The README's most counter-intuitive advice: **don't make the biggest model your default**. ECC's recommended setup: Sonnet as the base model (≈ −60% cost, enough for most coding tasks), a *thinking tokens* cap at 10,000 instead of 31,999 (≈ −70% on the hidden reasoning cost), and the big model **on demand** for problems that deserve it. The winner of an Anthropic hackathon doesn't burn Opus on variable renames — meditate on that, and re-read [the economics of inference]({{ site.baseurl }}/2026/08/16/the-economics-of-inference/).

## Lesson 2 — Your MCPs are eating your window

The number that stings, as the README puts it: every MCP tool description consumes tokens from your 200k window — potentially shrinking it to ~70k of useful space. The ECC discipline: **fewer than 10 active MCP servers, fewer than 80 tools**, and runtime deactivation of anything the current project doesn't need. We announced it in [our attention economy episode]({{ site.baseurl }}/2026/09/04/agentic-sdlc-5-the-attention-economy/): the *bind* isn't free. Take inventory of your MCP servers today — you'll be surprised.

## Lesson 3 — Compact at boundaries, never mid-flight

The `strategic-compact` skill flips the default reflex: don't let compaction fire **at 95% full**, in a panic, in the middle of an implementation — it takes the variable names and file paths you need most with it. Compact **deliberately at logical boundaries**: after research, after a milestone, after a closed debugging session. ECC even lowers the auto-compact threshold to 50% to stay in control. It's the operational cousin of the handbook's *plan-write-then-reload* [pattern]({{ site.baseurl }}/2026/09/04/agentic-sdlc-5-the-attention-economy/).

## Lesson 4 — "Done" is a verdict, not a sentence

The `verification-loop` [we saw yesterday]({{ site.baseurl }}/2026/09/15/ecc-2-anatomy-skills-hooks-instincts/) deserves to be stolen as-is: six gates (build, types, lint, tests, security, diff), a binary **READY / NOT READY** verdict, and a ban on continuing over a broken build. Whatever your harness: write that checklist into your instructions and demand the report. It's the tooled-up antidote to the [nineteen ways to sabotage your agents]({{ site.baseurl }}/2026/09/07/agentic-sdlc-8-nineteen-ways-to-sabotage-your-agents/) — the trust fall first among them.

## Lesson 5 — Memory gets a budget like everything else

ECC's memory isn't an attic, it's an **airlock with a quota**: at most 8,000 characters injected at startup, six instincts maximum, a 0.7 confidence threshold — and a global kill-switch for small-context setups. Unlimited memory is an anti-feature: it recreates the very context dumping it claimed to solve. If you keep [a logbook for your AI]({{ site.baseurl }}/2026/07/27/how-ai-memory-works/), give it a cap and value-based triage — not an infinite scroll.

## Lesson 6 — Your config is an attack surface

AgentShield exists because ECC's creator spotted the blind spot: we scan our dependencies, never our agent files. Yet a hook can exfiltrate, an MCP server can lie, a skill copied from a gist can carry an injection — and the author himself warns that malicious mirrors of his own config circulate. Three reflexes: **audit** your configs (secrets, permissions, hooks), **install** from verified channels only, and **review** any model-generated config before persisting it. The logical sequel to [securing GitHub Copilot]({{ site.baseurl }}/2026/07/10/securing-github-copilot/) and [defense in depth]({{ site.baseurl }}/2026/08/13/prompt-injection-defense-in-depth/).

## Lesson 7 — Start minimal, prune often

The author of 278 skills tells you himself **not to install them all**: installation profiles (`minimal`, `core`, `full`), rules copied only for *your* stack, and the #1 documented pitfall — stacking install methods into conflict. It's word for word the [instrumented codebase]({{ site.baseurl }}/2026/09/02/agentic-sdlc-3-the-instrumented-codebase/) roadmap: 3 to 5 files first, growth driven by real failures, monthly pruning. The perfect config isn't the biggest one; it's the one where every line has earned its place.

## Bringing it home: the Copilot table

| ECC idea | GitHub Copilot equivalent |
| --- | --- |
| Lazy skills | [skills and scoped instructions]({{ site.baseurl }}/2026/07/02/github-copilot-skills-instructions-agents-mcp/) (`applyTo`) |
| Specialized agents | [subagents and custom agents]({{ site.baseurl }}/2026/07/29/copilot-subagents-splitting-the-work/) |
| GateGuard hooks | branch protections, CI, [linters]({{ site.baseurl }}/2026/08/28/linters-and-analyzers-conventions-that-enforce-themselves/), org policies |
| Instincts / memory | [AGENTS.md]({{ site.baseurl }}/2026/08/22/agents-md-your-ai-onboarding-guide/) + a versioned journal, curated by hand |
| Model economy | [picking your model per task]({{ site.baseurl }}/2026/06/25/which-model-to-choose-github-copilot/) |
| MCP budget | same servers, same drain — inventory and deactivate |

One honest absence: an equivalent of **event hooks** doesn't exist everywhere — hence the fallback to CI and repo protections, which do the same job one step later.

## A word of honesty

- A winning config is winning **for its author**: ten months of *his* failures, *his* stacks, *his* opinions (tmux, 80% coverage). Clone the method — the failure → rule → skill loop — not the content wholesale.
- The quoted numbers (−60%, −70%, 200k→70k) are ECC's README numbers: operating orders of magnitude observed by the author, not controlled benchmarks. Verify against your own bills.

## In short — the mini-series in one idea

- **Economize first**: small model by default, capped thinking, deliberate compaction, inventoried MCPs.
- **Prove next**: six gates, one verdict, never "done" on someone's word.
- **Capitalize last**: memory under quota, rules born from failures, regular pruning — and a config audited like code, because it is code.
- ECC is the life-size demonstration of what [the Agentic SDLC series]({{ site.baseurl }}/2026/08/31/agentic-sdlc-1-the-vibe-coding-cliff/) theorized: the winning repo is an **instrumented, bounded, measured** repo.

Thanks for following this deep dive — [Affaan Mustafa's repo is right here](https://github.com/affaan-m/ecc), free, readable, and honestly more instructive than many paid trainings. Steal, adapt, prune. And that, honestly… is not rocket science.
