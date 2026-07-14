---
layout: post
title: "Spec-driven development: the spec becomes the source of truth again — it's not rocket science!"
date: 2026-08-23 10:00:00
author: AClerbois
ref: spec-driven
image: /images/posts/spec-driven.png
tags: [spec-driven, documentation, AI, best-practices]
level: 100
---

Friday, 4 pm. The agent generated the "password reset" feature in twenty minutes. The code is clean, the tests pass. Monday, the product owner watches the demo: *"The link was supposed to expire after 24 hours, not 7 days. And we never say 'this email doesn't exist' — that's an enumeration vulnerability."* Nobody had written it down. The agent guessed. It guessed fast, it guessed well-formatted, and it guessed wrong.

Yesterday we covered [AGENTS.md]({{ site.baseurl }}/2026/08/22/agents-md-your-ai-onboarding-guide/) — the guide that tells the AI *how* to work in your repository. Today, continuing [the artifact map]({{ site.baseurl }}/2026/08/21/the-artifacts-of-vibe-coding-the-complete-map/): **spec-driven development**, or how to tell the AI *what* to build — before it guesses on your behalf. You'll see: it's not rocket science.

<!--more-->

## The architect's plan and the house

A house is built from a plan. And there's a rule every architect knows: **you don't alter the house without updating the plan**. Drill through a load-bearing wall without recording it, and the next project — the extension, the renovation — starts from a plan that's wrong. The next builder will trust a document that lies.

For twenty years, our software "plans" suffered the opposite fate: the initial Word spec, never updated, dead by sprint 3. We eventually declared that *the code is the source of truth* — for lack of anything better. But something has changed: when an AI can **regenerate the code** for a feature in minutes, the code becomes the by-product. What remains, what holds the value, is the intent. **The house can be rebuilt; the plan is the capital.**

## The chain: PRD → spec → plan → code

Spec-driven development puts the documents back in the right order, each at its own altitude:

| Level | Document | Answers | Who decides |
| --- | --- | --- | --- |
| Product | **PRD** | why this feature? for whom? | the product owner |
| Behavior | **Spec** | what must happen, observable from outside? | the team |
| Technical | **Plan** | how we implement it, in which steps? | the dev (+ AI) |
| Execution | **Code** | the implementation itself | the AI (+ human review) |

The spec is the pivot level: precise enough to be verifiable, abstract enough to survive three rewrites of the code. A good spec describes **observable behaviors**, **acceptance criteria** and **edge cases** — never implementation choices. "The link expires after 24 hours": spec. "We store the token in Redis with a TTL": plan.

## A short spec, in full

Not a forty-page requirements binder. One Markdown file per feature, in `docs/specs/`, versioned and reviewed in PRs — like ADRs and the glossary:

```markdown
# Spec: password reset

## Requirements (EARS style)
- WHEN a user requests a reset with a known email, the system
  SHALL send a single-use link valid for 24 hours.
- WHEN the email is unknown, the system SHALL display the same
  confirmation message (no email enumeration possible).
- WHEN the link has expired or was already used, the system SHALL
  display "link expired" and offer to send a new one.
- WHILE a reset is pending, previous links SHALL be invalidated.

## Acceptance criteria
- Given a link older than 24 hours, when the user clicks it,
  then the form is not displayed.
- Given two successive requests, when the first link is used,
  then it is rejected.

## Edge cases
- Deactivated account: same message as "unknown email".
- 3 requests within 10 minutes: rate limit, HTTP 429.

## Out of scope
- Email change, 2FA (separate specs).
```

Everything is **verifiable from the outside**: you can test every line without opening the code. And notice what's *not* there: no Redis, no email library, no class names. That's the plan — the level below.

## The tools that popularized the approach

Two names keep coming up. **GitHub Spec Kit**, open source, structures the flow into three commands — `/specify` (the spec), `/plan` (the technical plan), `/tasks` (the task breakdown) — that the agent executes one after the other. **Kiro**, AWS's IDE, put specs at the heart of its agent mode: every feature starts with a requirements file (in EARS style, precisely) that the AI maintains with you.

But remember the principle, not the tools: a Markdown file in `docs/specs/`, reviewed in PRs, already does 80% of the job. Spec-driven development will outlive Spec Kit the way ADRs outlived their generators.

## Why it's worth double in the AI agent era

1. **The agent implements against the spec instead of guessing.** Without a spec, the AI fills the gaps with statistically plausible choices — a 7-day expiry, an error message that enumerates emails. With the spec in context, every requirement becomes a constraint, and your prompts shrink: "implement the `password-reset.md` spec" is enough.
2. **The spec disambiguates everything downstream.** The plan derives from it, the tests derive from it, code review leans on it — the reviewer (human or AI) compares the code to the spec, not to their intuition. The whole chain descends from the same document.
3. **When code and spec diverge, the spec wins — and the agent can detect the divergence.** That's the architect's-plan rule, and it's a task where AI excels: "compare this module to its spec and list the gaps". Either the code is wrong (fix it — or regenerate it), or the spec has aged (update it in the same PR). The series formula applies as-is: **the AI proposes, the human decides, the repository remembers**.

## The honesty moment

- **This is not waterfall making a comeback.** The waterfall spec described the whole system, up front, in one go. Here: one spec **per feature**, one page, written just before coding, amended along the way. It's just-in-time, not Big Design Up Front.
- **An unmaintained spec lies — and that's worse than no spec.** A wrong plan makes you drill through the wrong wall. The guardrail is the same as for the glossary: the code and its spec travel **in the same PR**, and an unjustified gap blocks the review.
- **The overhead is real for small changes.** A typo fix, a label, a style tweak: no spec. Save it for behaviors worth defending — ten living specs beat a hundred bureaucratic ones.

## In summary

- When AI can **regenerate the code**, the code becomes a by-product — **the spec is the capital**, like the architect's plan versus the house.
- The chain: **PRD → spec → plan → code**, and the spec describes **observable behaviors, acceptance criteria, edge cases** — never the implementation.
- A spec = **one Markdown file per feature** in `docs/specs/`, versioned, reviewed in PRs — Spec Kit and Kiro tool the flow, the principle will outlive them.
- With agents: **the AI implements against the spec**, detects divergences — and when code and spec diverge, **the spec wins**.

You don't alter the house without updating the plan; you don't merge the code without updating the spec. And that, honestly… is not rocket science.
