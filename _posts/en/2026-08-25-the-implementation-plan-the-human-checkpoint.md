---
layout: post
title: "The implementation plan: the human checkpoint — it's not rocket science!"
date: 2026-08-25 10:00:00
author: AClerbois
ref: implementation-plans
image: /images/posts/implementation-plans.png
tags: [AI, agents, planning, best-practices]
level: 100
---

Friday, 4:42 pm. The agent proudly announces: "Feature implemented — 47 files changed." The diff is 2,000 lines. You scroll. By line 300, your eyes glaze over; by line 800, you approve "on trust". Somewhere in the remaining 1,200, the agent rewrote your authentication middleware. You'll find out on Monday.

Yesterday, we decided before coding with [RFCs and design docs]({{ site.baseurl }}/2026/08/24/rfcs-and-design-docs-decide-before-you-code/). Today, the next stop on [the map of vibe coding artifacts]({{ site.baseurl }}/2026/08/21/the-artifacts-of-vibe-coding-the-complete-map/): the **implementation plan** — the precise moment where the human keeps control over what the agent is about to do. You'll see: it's not rocket science.

<!--more-->

## The quote before the work

Nobody lets a contractor start the work without a quote. The quote reads in ten minutes: which walls, which materials, in what order, at what price. And above all: **you negotiate on the quote**. Once the wall is up, the negotiation changes name — it's called demolition.

The 2,000-line diff is the wall, already built. The 40-line plan is the quote. Reviewing one takes two hours — when you actually review it; reviewing the other takes two minutes. A factor of 100, for the same decision power. The plan is where one minute of your attention has **maximum leverage**: it is THE human checkpoint of vibe coding.

## Plan mode: read, propose, amend, code

The tools have baked the idea in. GitHub Copilot has its *Plan mode* — already covered in [the article on modes]({{ site.baseurl }}/2026/07/04/copilot-modes-ask-edit-agent-plan/) — and Claude Code has its own. The mechanics are the same everywhere, in four beats:

1. **The agent reads.** It explores the code read-only: nothing gets modified.
2. **The agent proposes a plan.** Files, steps, approach — in plain text, before any line of code.
3. **The human amends.** This is the step that matters: you strike out, you clarify, you redirect.
4. **Only then, the agent codes** — following the approved plan.

All the value sits in step 3. Jumping from 2 to 4 by typing "ok go ahead" is signing the quote without reading it.

## What a good plan contains

| Section | The question it answers |
| --- | --- |
| **Goal** | what are we trying to achieve, in one sentence? |
| **Files touched** | where will this happen — and thus, what's the blast radius? |
| **Ordered steps** | in what order — each step compiles and passes the tests |
| **Risks** | what can go wrong, and what do we watch for? |
| **Test strategy** | how will we know it works? |
| **Out of scope** | what we are **not** doing — the golden section |

"Out of scope" is the reviewer's best friend: it's the fence that stops the agent from "improving" three neighboring modules on the way.

## A concrete example, in full

```markdown
# Plan: pagination on GET /api/policies

## Goal
Paginate the policy list (today: everything loaded in memory,
40,000 rows in production).

## Files touched
- Features/Policies/List/ListPoliciesQuery.cs      (page/pageSize parameters)
- Features/Policies/List/ListPoliciesHandler.cs    (Skip/Take on the SQL side)
- Features/Policies/List/ListPoliciesEndpoint.cs   (query string + headers)
- Tests/Policies/ListPoliciesTests.cs

## Steps (each one compiles and passes the tests)
1. Add page/pageSize to the query, defaults: 1 and 20, pageSize max 100.
2. Switch the handler to Skip/Take + CountAsync — check the SQL plan.
3. Expose X-Total-Count and prev/next links in the endpoint.
4. Tests: empty page, last page, pageSize out of bounds.

## Risks
- The mobile app calls this endpoint without parameters: the defaults
  must reproduce today's first-page behavior exactly.

## Test strategy
Integration tests against a real database (Testcontainers) — no EF mocks.

## Out of scope
- No cursor (keyset) pagination: an ADR to write if performance demands it.
- No configurable sorting — that's another ticket.
```

Forty lines, two minutes of reading. And on review, the line "the mobile app calls this endpoint without parameters" jumps out — exactly the kind of thing *you* know and the agent doesn't. You amend one line; it codes for two hours.

## Persist the plans in the repository

A non-trivial plan deserves to outlive the session: `docs/plans/2026-08-25-pagination-policies.md`, versioned with the code. Two benefits. In the **pull request**, the reviewer reads the plan before the diff — same leverage, a second time. And in the **next session**, the agent picking up the work re-reads the plan instead of re-guessing the intent: the repository re-contextualizes, just like with ADRs.

And the difference with [the spec]({{ site.baseurl }}/2026/08/23/spec-driven-development-the-spec-as-source-of-truth/)? Simple: the spec says **what** — the expected behavior, stable over time. The plan says **how and in what order** — and it's disposable once executed. One spec outlives ten plans.

## Why it's worth double in the AI agent era

1. **The plan catches wrong directions before they cost anything.** An agent heading the wrong way produces 2,000 wrong lines with the same confidence as 2,000 right ones. At the plan stage, the wrong direction fits in one line — "I'll rewrite the auth middleware" — and gets fixed in one sentence.
2. **Amending the plan is steering without micro-managing.** Between "I dictate every line" and "I let it run and pray", the plan is the middle ground: you correct the trajectory once, upstream, then let the agent execute. The series formula, in action: **the AI proposes, the human decides, the repository remembers.**
3. **The plan slices the work into verifiable steps.** "Each step compiles and passes the tests" turns one 2,000-line bet into four 500-line bets. At the first red light, you know *which step* lied — instead of digging through a monolithic diff.

## The honesty moment

- **Plans lie at the first obstacle.** Step 2 will reveal a problem nobody had seen, and the plan will have to move. That's normal: you replan. The value is in the *planning* — the exploration, the risks flushed out — not in the document itself.
- **Over-planning a three-line change is theater.** Demanding a plan to fix a typo is bureaucracy dressed up as rigor. A plan has to be earned: several files, a debatable direction, a real risk.
- **An approved plan is not a contract.** "But you approved the plan!" is not a defense. The human stays responsible for the final diff — the plan shrinks the surprise surface, it doesn't replace the review.

## In summary

- Reviewing a plan costs **100× less** than reviewing the diff: negotiate on the **quote**, not on the wall already built.
- *Plan mode*: the agent **reads** and **proposes**, the human **amends**, *then* the agent codes — all the value is in the amendment.
- A good plan: files touched, **ordered steps that compile and test one by one**, risks, test strategy — and the **out of scope**.
- Non-trivial plans live in **`docs/plans/`**: reviewed in PRs, re-read by the next agent. The spec says **what**; the plan says **how**.

Two minutes of attention at the right moment beat two hours of resigned scrolling at the wrong one. And that, honestly… it's not rocket science.
