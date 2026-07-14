---
layout: post
title: "RFCs and design docs: decide before you code — it's not rocket science!"
date: 2026-08-24 10:00:00
author: AClerbois
ref: design-docs
image: /images/posts/design-docs.png
tags: [architecture, documentation, RFC, AI, best-practices]
level: 100
---

Architecture meeting, Tuesday 2 pm. Six people, one hour, one topic: "how do we handle multi-tenancy?". Two options passionately defended, a third mentioned in passing, zero conclusion — let's reschedule. Three weeks later, someone has coded their favorite. Not out of malice: because the work had to move, and nobody had written down where the debate stood.

Yesterday we covered [spec-driven development]({{ site.baseurl }}/2026/08/23/spec-driven-development-the-spec-as-source-of-truth/): a spec describes an expected **behavior**. But before you can describe a behavior, you sometimes have to choose a **direction** — and that's the job of the *RFC* (*Request for Comments*), a.k.a. the *design doc*. On [the artifact map]({{ site.baseurl }}/2026/08/21/the-artifacts-of-vibe-coding-the-complete-map/), it's the piece that organizes the debate. You'll see: it's not rocket science.

<!--more-->

## The minutes exist — but where's the meeting?

You already know [the ADR]({{ site.baseurl }}/2026/07/14/adr-memory-of-architecture-decisions/): the **minutes** of a decision *already made*. Context, choice, consequences — signed, archived, immutable. Indispensable… but minutes come *after*. They say nothing about how you decide.

The RFC is **the meeting itself — in writing**. Instead of six people interrupting each other for an hour, a document that states the problem, lays out the options with their price tags, offers a recommendation, and collects comments asynchronously. The meeting becomes re-readable, quotable, and above all: it leaves a trace of *why the other options lost*.

## The anatomy of an RFC

Five sections, in this order — each answers one precise question:

| Section | The question it answers |
| --- | --- |
| **Problem** | what is forcing us to decide, and by when? |
| **Constraints** | what is non-negotiable (budget, team, contracts)? |
| **Options + trade-offs** | which paths, and **what each one costs**? |
| **Recommendation** | what does the author propose — with skin in the game? |
| **Open questions** | what don't we know yet? |

The section doing all the work is **options + trade-offs**. An RFC with a single option isn't an RFC: it's an announcement in disguise. And an option with no owned downside isn't an option: it's marketing.

## A condensed example: "how do we handle multi-tenancy?"

```markdown
# RFC-012: multi-tenant strategy for the API

## Problem
Three "enterprise" customers signed; each requires data isolation.
Today: one database, zero notion of a tenant.
Must be decided before sprint 32 — after that, the migration costs double.

## Constraints
- Infra budget: +20% monthly cost, maximum.
- The team (4 devs) has never practiced row-level security.
- The Contoso contract requires a "dedicated database" option.

## Options
### A. One database per tenant
+ Maximum isolation; per-customer backup/restore is trivial.
- Infra cost ×N; every migration replayed N times; provisioning to build.

### B. One schema per tenant, shared database
+ Good isolation/cost compromise; migrations can be centralized.
- Rarer EF Core tooling; practical ceiling of a few hundred tenants.

### C. TenantId column + global query filter
+ The cheapest; a single migration pipeline.
- Isolation rests on code discipline: one forgotten filter = data leak.

## Recommendation
Option C by default, option A for contracts that require it
(Contoso). EF Core global filter + mandatory isolation tests.

## Open questions
- The extra cost of Contoso's dedicated database: billed or absorbed?
- Postgres RLS as a safety net on top of the filter: worth it?

## Comments open until: 2026-09-05
```

One page. Not forty. The reader in a hurry reads the problem and the recommendation; the reader with a stake attacks the options; and the last line — the **deadline** — prevents the debate that never ends.

## The cycle: proposed → commented → decided → archived

1. **Proposed.** The RFC lands where text gets reviewed: a pull request on `docs/rfc/`, or a commentable document. What matters is that comments are *attached to the text*, not scattered across a chat.
2. **Commented.** Everyone reacts at their own pace: "+1 on C", "objection: the Contoso contract forbids a shared database", "what about migrating existing data?". The meeting happens — no room, no time slot.
3. **Decided.** At the deadline, someone decides — the tech lead, the architect, the team by consensus. No deadline, no decision: just a debate holding its breath.
4. **Archived.** The conclusion becomes an **ADR** that points back to the RFC. The minutes cite the meeting: the ADR says *what we chose*, the RFC keeps *everything we weighed*.

## When to write an RFC — and when a direct ADR is enough

An RFC has a cost: a few hours of writing, a few days of debate. It has to be earned. Two signals, one is enough:

- **The decision commits several teams or several people** who will have to live with it. Deciding alone in your corner guarantees the execution gets sabotaged by inertia — or worse, by the good faith of people who simply weren't told.
- **Nobody has the answer.** If the subject-matter expert is confident and nobody objects: direct ADR, ten minutes, done. The RFC is for when the answer has to *emerge* from the debate — not when it already exists.

## Why it's worth double in the AI agent era

1. **The agent writes the first draft.** The discussion happened in a thread or a chat? "Write the RFC for this discussion: problem, constraints, the three options mentioned with their trade-offs." The skeleton drops out in two minutes; the humans spend their time on substance. The usual formula: **the AI proposes, the human decides, the repository remembers**.
2. **The agent explores the options.** "Give me three approaches to multi-tenancy in .NET, with the trade-offs of each." Three argued options cost a few minutes of generation — three prototypes cost three sprints. The AI widens the field *before* the debate collapses onto the two ideas from the meeting.
3. **The agent red-teams the proposal.** Before opening comments to humans: "attack this design, find the flaws, the edge cases, the fragile assumptions." The agent has neither ego nor politeness — it will flag option C's forgotten filter without worrying about hurting the author's feelings. Human reviewers start from a proposal that has already been stress-tested.

## The honesty moment

- **The RFC can become theater.** If the decision has already been made upstairs, don't stage a fake debate: one sham RFC destroys trust in all the following ones. Write the ADR, own it, move on.
- **Unconcluded RFCs pile up.** A `docs/rfc/` folder full of debates nobody ever settled is a demoralizing graveyard. The guardrail fits in one line: **every RFC has a comment deadline** — and when it hits, you decide, even imperfectly.
- **The AI has no opinion on *your* constraints.** It drafts well, it red-teams well — but it doesn't know the Contoso contract is untouchable, that the infra budget is frozen until January, or that the data team is coming out of a burnout. The technical trade-offs, it sees; the political and budget trade-offs are yours.

## In summary

- The ADR is the **minutes** of a decision already made; the RFC is **the meeting** — the debate organized *beforehand*, in writing and asynchronously.
- Five sections: **problem, constraints, options with trade-offs, recommendation, open questions** — and an option with no owned downside isn't an option.
- The cycle: **proposed → commented → decided → archived in an ADR** — with a comment **deadline**, otherwise the debate never ends.
- With agents: **the AI writes the first draft, explores the options, red-teams the proposal** — and the human decides, because the political and budget constraints aren't in the context window.

One page that organizes the debate before the code, instead of a meeting that starts over every Tuesday. And that, honestly… is not rocket science.
