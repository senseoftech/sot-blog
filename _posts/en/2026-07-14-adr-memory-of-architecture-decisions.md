---
layout: post
title: "ADRs: the memory of your architecture decisions — it's not rocket science!"
date: 2026-07-14 10:00:00
author: AClerbois
ref: adr
image: /images/posts/adr.png
tags: [architecture, documentation, ADR, AI, best-practices]
---

Sprint 23. A new developer joins the team and asks the fatal question: *"Why MongoDB, here? Everything else is SQL Server."* Silence. The person who made that choice left a year ago. Was it a good reason? A constraint of the time? A lost bet? Nobody knows. So nobody dares touch it.

In [the vibe engineering article]({{ site.baseurl }}/2026/07/12/vibe-project-dotnet-foundations/), I slipped in one instruction: *a docs folder with ADRs*. Today, let's unfold it. It's the documentation tool with the best effort-to-value ratio I know — and in the age of AI agents, it's worth double. You'll see: it's not rocket science.

<!--more-->

## Chesterton's fence

An old engineering parable: you find a fence in the middle of a path. Naive reflex: "it serves no purpose, let's remove it." Wise reflex: **"as long as I don't know why it's there, I don't touch it."**

All legacy code is full of Chesterton's fences: that weird cache, that three-attempt retry, that isolated MongoDB. Without the *reason*, every past decision becomes untouchable — or worse, gets demolished by someone unaware of the constraint it solved. The problem isn't the decision; it's the **memory of the decision**.

## The ADR: one record per decision

An **ADR** (*Architecture Decision Record*) is a small Markdown file that captures **one** structural decision. Not a forty-page architecture binder: a record, numbered, dated, that fits on one screen. The classic format (Michael Nygard's) has five sections:

| Section | The question it answers |
| --- | --- |
| **Title + number** | what is this about? (`0007-cqrs-with-carter.md`) |
| **Status** | proposed, accepted, superseded by…? |
| **Context** | what was the situation, the constraints, the options? |
| **Decision** | what did we choose, stated affirmatively? |
| **Consequences** | what does it imply — the good *and* the less good? |

## A concrete example, in full

```markdown
# ADR-0007: CQRS with Minimal API + Carter instead of MVC controllers

## Status
Accepted — 2026-07-12

## Context
The application exposes an API where reads (catalogs, searches) are
20 times more frequent than writes, with different performance needs.
The team (3 devs) knows MVC; nobody has practiced CQRS yet. Part of
the code will be AI-generated: we need a structure the agent can
reproduce without drifting.

Options considered:
1. Classic MVC controllers — familiar, but everything mixes into
   ever-growing controllers.
2. Full CQRS with event sourcing — oversized for the need.
3. "Light" CQRS: Minimal API + Carter + one handler per use case.

## Decision
Option 3. Each feature = one command OR one query, with its dedicated
handler. Carter modules group endpoints by domain.

## Consequences
+ A clear, repeatable mold — including for AI-generated code.
+ Handlers testable in isolation (target: 80% coverage).
- Learning curve for the team (~1 sprint).
- More files; navigation takes getting used to.
- Event sourcing remains possible later; this choice doesn't block it.
```

Notice the **owned negative consequences**: that's what separates an ADR from a marketing document. Eighteen months from now, "why Carter?" will have a complete answer — context, discarded alternatives, accepted price.

## When to write an ADR (and when not to)

The three-question test — one yes is enough:

1. Will the decision be **expensive to reverse**? (framework, database, service boundaries)
2. Does it **constrain** future development? (conventions, imposed patterns)
3. Did it spark **debate** in the team? (if we discussed it for an hour, the conclusion deserves ten minutes of writing)

A variable name, a utility lib replaceable in an hour: no ADR. Otherwise the tool dies under its own weight — ten important records beat a hundred bureaucratic ones.

## The lifecycle: never erase, supersede

Golden rule: **an accepted ADR is immutable.** If the decision changes, you don't edit history — you write a new ADR that *supersedes* the old one, and the old one moves to "Superseded by ADR-0019". The `docs/adr/` folder thus becomes the **chronology** of the project's choices: you can replay the film, understand what was true at the time, and why it no longer is.

Practically: the records live **in the repository** (`docs/adr/NNNN-title.md`), versioned with the code, reviewed in pull requests like everything else. An architecture decision going through code review — that's exactly where it belongs.

## Why it's worth double in the age of AI agents

Three reasons, and the third one is new:

1. **The AI re-contextualizes with it.** A conversation is forgotten by the next session; a `docs/adr/` folder gets re-read. The sprint-24 agent that reads ADR-0007 reproduces the CQRS pattern instead of reinventing controllers — it's the documentation side of the formula from [the vibe engineering post]({{ site.baseurl }}/2026/07/12/vibe-project-dotnet-foundations/): *the prompt expresses the decisions, the repo remembers them*.
2. **The AI drafts it.** The alignment discussion happened in the chat? Ask the agent: "write the ADR for what we just decided". The ideal division of labor: **the human decides, the AI records**, the human reviews.
3. **The ADR protects against overzealous agents.** An agent that "cleans up" code without knowing its reason is Chesterton's fence torn down at LLM speed. The record is the sign saying "this fence is here because…" — readable by humans *and* by machines.

## In summary

- The problem isn't making decisions, it's **losing their reason** — Chesterton's fence.
- An **ADR** = one Markdown record per structural decision: status, context, options, decision, **consequences (negative ones included)**.
- Write one for what's **expensive to reverse, constraining, or debated** — and never edit: **supersede**.
- In the repo, reviewed in PRs — and in the agent era: **the human decides, the AI records, the ADR re-contextualizes** future sessions.

Ten minutes of writing per decision, and never again "we don't know why, so we don't touch it". And that, honestly… is not rocket science.
