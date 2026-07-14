---
layout: post
title: "Git history: the memory your AI already reads — it's not rocket science!"
date: 2026-07-28 10:00:00
author: AClerbois
ref: git-history
image: /images/posts/git-history.png
tags: [git, conventional-commits, documentation, AI, best-practices]
level: 100
---

Watch an AI agent work on a tricky bug: at some point, almost always, it runs `git log` or `git blame`. It does exactly what a good dev would do: find out **when** that line changed, **together with what**, and **why**. And there, two worlds: either it finds `fix(order): round VAT to the cent before totaling (#412)` — or it finds `fix`, `wip`, `update`, `fix2`.

[Yesterday we saw how AIs build themselves a memory]({{ site.baseurl }}/2026/07/27/how-ai-memory-works/). Today, the twist: your project **already** has a perfect memory — timestamped, tamper-proof — the Git history. The only question is whether you write memories into it, or noise. You'll see: it's not rocket science.

<!--more-->

## The history is a (free) knowledge base

Every commit can answer three questions that neither the code nor the comments can carry:

- **What, together?** The scope: which files moved in a single gesture. An atomic commit draws the invisible links between a handler, its migration and its test.
- **When, and in what order?** The chronology: did this bug appear before or after the EF migration? `git log` answers in seconds.
- **Why?** The intent: the only piece of information that exists *nowhere else*. The diff says what changed; only the message says for what reason.

It's the same thread as [ADRs]({{ site.baseurl }}/2026/07/14/adr-memory-of-architecture-decisions/): losing the *why* makes code untouchable. The ADR captures the big decisions; the commit message captures the thousand small ones — the VAT rounding, the retry added after the incident, the workaround for the driver bug.

## Conventional Commits: three minutes to learn

The [Conventional Commits](https://www.conventionalcommits.org/) format won because it's tiny: a prefix, an optional scope, a description.

```text
feat(catalog): add price-range filter
fix(order): round VAT to the cent before totaling (#412)
refactor(shipping): extract delivery-time calculation to a dedicated service
```

| Prefix | It means | The reader (human or AI) deduces |
| --- | --- | --- |
| `feat` | new capability | expected behavior has grown |
| `fix` | correction | there was a bug — the message says which |
| `refactor` | neither feat nor fix | **behavior must not change** |
| `test`, `docs`, `chore` | periphery | can often be skimmed |

The message body, optional, carries the *why* when it doesn't fit on the line: "the supplier rounds per line, we round per order; one-cent discrepancy on baskets > 40 items". Two sentences written once — re-read at every `git blame` for ten years.

The twin rule: the **atomic commit**. One commit = one logical change. The catch-all commit ("end of day") destroys the history's first treasure: scope. If you'd describe your commit with "and", split it.

## Why it's worth double in the AI-agent era

1. **The agent reads the history unprompted.** `git log --oneline -- path/to/file`, `git blame`, `git show`: these are standard tools of any agent in autonomous mode. A clean history is quality context **already injected** into every session — without a single token from you.
2. **The agent writes the history — brief it.** One line in your [instructions]({{ site.baseurl }}/2026/07/02/github-copilot-skills-instructions-agents-mcp/): *"atomic commits, Conventional Commits format, the body explains the why"*. Agents excel at this discipline — they don't have the 6:45 pm laziness. Many teams discover their finest commit messages are now the machines'.
3. **The loop closes.** The sprint-30 agent reading `fix(order): round VAT…` written by the sprint-12 agent inherits the context without anyone writing a line of documentation. The history becomes a conversation between sessions — [yesterday's memory]({{ site.baseurl }}/2026/07/27/how-ai-memory-works/), repository edition.

And a mechanical bonus: Conventional Commits are **parsable**. Generated changelogs, automatic semantic versioning ([GitVersion](https://gitversion.net/) and friends), CI that reacts differently to a `feat` and a `chore` — prose becomes tooling.

## The honest word

- **Don't rewrite ancient history.** The rotten history of the last three years is unrecoverable — and that's OK. The value builds from today; in six months, the recent layer (the one consulted most) will be clean.
- **Squash merge is a choice, not a reflex.** Crushing a PR of fifteen careful commits into a single "Add feature (#89)" throws away the reasoning's detail. Squash the noise ("fix typo", "oops"), keep the steps that tell the story — or demand PRs small enough that one commit is enough.
- **A commit linter is useful, not sufficient.** [commitlint](https://commitlint.js.org/) or a hook checks the *format*; no machine can check that the message says the *why*. That remains a matter of team culture — and review.

## In summary

- Git history is the only project memory that is **exhaustive, timestamped and free** — provided you write memories into it (`fix(order): round VAT…`) rather than noise (`fix2`).
- Two tiny disciplines suffice: **Conventional Commits** (type, scope, description — the body for the *why*) and the **atomic commit** (one commit = one change; "and" = split).
- AI agents **read** this history spontaneously (`git log`, `git blame`) and **write** it with perfect discipline if your instructions demand it — the ADR captures the big decisions, the commit captures the thousand small ones.
- You don't clean up the past: you write clean **from today**, and you think twice before squashing.

Next time someone — human or agent — runs `git blame` on your code, they'll land on an explanation instead of a riddle. Ten seconds of care per commit, years of free context. And that, honestly… it's not rocket science.
