---
layout: post
title: "AGENTS.md: your AI's onboarding guide — it's not rocket science!"
date: 2026-08-22 10:00:00
author: AClerbois
ref: agent-instructions
image: /images/posts/agent-instructions.png
tags: [documentation, agents, AI, best-practices]
level: 100
---

Monday, 9 a.m. The new hire arrives. You show them everything: the build command, the house conventions, the one table you must never rename. They're brilliant, they code fast, the day goes great. Tuesday, 9 a.m. They come back… remembering nothing. Not the build, not the conventions, not the table. You explain it all again. Wednesday? Same thing. This colleague exists: it's your AI agent, amnesiac every morning.

Yesterday, [the complete map of vibe coding artifacts]({{ site.baseurl }}/2026/08/21/the-artifacts-of-vibe-coding-the-complete-map/) set the scene. First stop on the map, and not by accident: the **agent instructions file** — the onboarding booklet your amnesiac colleague re-reads at every session. You'll see: it's not rocket science.

<!--more-->

## The colleague who starts from zero every morning

An AI agent keeps nothing from one session to the next. Yesterday's conversation — where you explained three times that the integration tests require Docker — is gone. Every session starts from a blank page: same questions, same guesses, same mistakes, same corrections. You remember; it doesn't.

With humans, we solved this long ago: the onboarding guide. You write it once, the newcomer reads it, and you stop re-explaining. The only difference with AI is that *your* newcomer has to re-read the guide **every single morning**. Good news: re-reading without ever getting bored is precisely what an agent does better than anyone.

## The onboarding booklet: AGENTS.md and its cousins

The cure fits in one Markdown file **at the root of the repository**, which the agent reads automatically at the start of every session. The emerging standard is called **AGENTS.md** (described at agents.md) — "a README for agents", adopted by many tools. Its cousins do the same job under other names: `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot.

The exact name matters little; the idea is the same everywhere: everything you keep repeating to the agent at the start of a session belongs in this file — and never needs repeating again.

## A complete example: twenty lines for a .NET project

```markdown
# MyShop — agent instructions

## Build & tests
- Build: `dotnet build MyShop.sln` (repo root, .NET 9).
- Local tests: `dotnet test --filter Category!=Integration`.
  Integration tests require Docker: `docker compose up -d db`.
- Before any commit: `dotnet format --verify-no-changes`.

## Conventions
- Light CQRS: one command OR one query per feature, dedicated
  handler in `src/Features/<Domain>/` (see ADR-0007).
- Business naming: follow `docs/glossary.md` — the insured is
  `Customer`, never `Client`.
- No `DateTime.Now`: inject `TimeProvider`.

## Known traps
- The `TIERS` table is ERP legacy: never rename it.
- `appsettings.Development.json` is not versioned: start from
  `appsettings.Template.json`.

## Definition of "done"
Green build, green tests, format verified — and if the decision
is structural, an ADR in `docs/adr/`.
```

Twenty lines, four sections: the **exact commands** (the ones that actually work, prerequisites included), the **conventions you can't deduce from the code**, the **known traps**, and the **definition of "done"**. Notice the cross-references: the file duplicates neither [the ADRs]({{ site.baseurl }}/2026/07/14/adr-memory-of-architecture-decisions/) nor [the glossary]({{ site.baseurl }}/2026/07/16/the-domain-glossary/) — it points to them.

## What to put in — and above all what to leave out

Every line of this file is re-read **at every session** and costs tokens every time. A line that doesn't prevent a mistake is a line that dilutes the others. The test:

| In the onboarding booklet? | Verdict |
| --- | --- |
| The **exact** build and test commands, prerequisites included | ✅ yes |
| Conventions **not deducible from the code** ("no `DateTime.Now`") | ✅ yes |
| **Known traps** ("`TIERS`, never rename") | ✅ yes |
| The definition of "**done**" (build, tests, format, ADR) | ✅ yes |
| What the code already says (the folder tree, the project list) | ❌ no |
| Ambient prose ("we value quality") | ❌ no |

The rule from the other artifacts applies here more than anywhere: ten important instructions beat a hundred bureaucratic ones.

## Root + folders: instructions as nesting dolls

One single file for a whole monolith eventually overflows. The fix: **hierarchy**. One `AGENTS.md` at the root for the global stuff (build, definition of "done"), and one per folder for the local stuff — `src/Features/AGENTS.md` for the CQRS conventions, `tests/AGENTS.md` for the testing conventions. The agent applies the file closest to the code it's touching. Simple rule: the general at the root, the specific as close to the code as possible.

## Why it's worth double in the AI agent era

Three reasons — and here, "double" is almost an understatement:

1. **It's the most directly read artifact on the whole map.** ADRs, the glossary, the diagrams: the agent reads them *if* it finds them. The instructions file, though, is loaded by default at the start of every session. That makes it the gateway to everything else: one line saying "check `docs/adr/` before touching the architecture" is enough to plug in the long-term memory. For the precise mechanics on the Copilot side — instructions, skills, agents — see [the dedicated article]({{ site.baseurl }}/2026/07/02/github-copilot-skills-instructions-agents-mcp/).
2. **The golden rule: corrected twice = one line.** Every remark you repeat a second time when reviewing an agent's PR must become a line in the file. Review stops being a recurring chore and becomes an investment: **the AI proposes, the human decides, the repository remembers** — and the same mistake doesn't come back a third time.
3. **It turns amnesia into an asset.** A human re-reading the onboarding guide every morning would be a waste. An agent applies the booklet to the letter from the first minute, every session, without fatigue or personal interpretation. The same onboarding, perfectly reproducible — for the second agent as for the two-hundredth.

## The honesty moment

- **The file drifts.** Nobody re-reads it spontaneously, and a build command that changed makes it silently wrong. The reflex: when the agent gets something wrong, re-read the file first — the missing or stale instruction is often hiding there.
- **Too long = diluted.** A three-hundred-line file drowns the three vital instructions in noise — and the agent, like a hurried reader, retains the middle poorly. Pruning is maintenance, not sacrilege.
- **It's not magic.** An instruction is not a constraint: the agent *can* ignore it, especially when it's buried. The truly non-negotiable conventions deserve an executable guardrail on top — an analyzer, a failing test.

## In summary

- Your AI agent is a colleague who is **amnesiac every morning**: the instructions file is the onboarding booklet it re-reads at every session.
- **AGENTS.md** (and its cousins `CLAUDE.md`, `copilot-instructions.md`) holds the **exact commands**, the **non-deducible conventions**, the **known traps** and the definition of "**done**" — not what the code already says, since every line costs tokens at every session.
- **Hierarchical**: the general at the root, the specific in one file per folder, as close to the code as possible.
- The golden rule: **every correction repeated twice in review becomes a line in the file** — the AI proposes, the human decides, the repository remembers.

Twenty lines of Markdown, re-read every morning without complaint by the most diligent colleague on the team. And that, honestly… is not rocket science.
