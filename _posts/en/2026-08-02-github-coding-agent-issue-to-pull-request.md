---
layout: post
title: "The GitHub coding agent: the issue that comes back as a pull request — it's not rocket science!"
date: 2026-08-02 10:00:00
author: AClerbois
ref: coding-agent
image: /images/posts/coding-agent.png
tags: [github, copilot, coding-agent, AI, automation]
level: 200
---

In [the final episode of the CLI series]({{ site.baseurl }}/2026/07/21/copilot-cli-4-delegate-and-automate/), one magic character — `&` — shipped a task "to the cloud". Time to meet who receives it: the **Copilot coding agent**, Copilot's third face. The IDE assists, the CLI lives in your terminal… and the coding agent **works on GitHub.com while you do something else**.

Its user manual fits in one sentence: *assign it an issue, it comes back with a pull request.* The rest — where it works, how to brief it, how to fence it — is today's program. You'll see: it's not rocket science.

<!--more-->

## The flow: an issue goes in, a PR comes out

The basic gesture is disarmingly ordinary: on GitHub, open an issue and **assign it to Copilot** — just like you'd assign a colleague (the CLI's `&` and github.com's Agents interface lead to the same place). Then:

1. The agent starts in an **isolated environment** on GitHub Actions infrastructure: it clones the repo, creates its branch, sets up its workstation.
2. It works: explores the code, edits, compiles, tests — [the harness loop]({{ site.baseurl }}/2026/07/01/the-ai-harness-github-copilot/), fully autonomous.
3. It opens a **draft pull request**, describing what it did — and asks for your review.
4. You comment on the PR; **it answers comments with commits**, like a remote colleague.

The point that changes the nature of the work: it's **asynchronous and parallel**. Three issues assigned at 9 a.m., three PRs to review at 11 — while you were in a meeting. That's no longer assistance; that's **delegation**.

## The brief: a good issue is a work order

You already learned everything in [the subagents article]({{ site.baseurl }}/2026/07/25/copilot-subagents-splitting-the-work/): the coding agent knows only what the issue tells it — **a well-written issue IS the brief**. The same anatomy applies, word for word:

> **[Context]** The `GET /orders/{id}` endpoint returns 500 when the id doesn't exist (log attached).
> **[Mission]** Return 404 with a ProblemDetails, and cover the case with a test.
> **[Constraints]** Follow the `GetOrderById` slice pattern; don't touch the other endpoints.
> **[Deliverable]** PR with the fix + an AAA test that fails before / passes after.

What it does well: reproducible bugs, targeted debt, coverage improvements, the clean tasks of a [vertical slice]({{ site.baseurl }}/2026/07/22/vibe-engineering-vertical-slice-architecture/) — the bounded perimeter, once again. What you don't hand it: architecture decisions ([those are made with you, and recorded as ADRs]({{ site.baseurl }}/2026/07/14/adr-memory-of-architecture-decisions/)), vagueness ("improve perf"), and anything whose success criterion doesn't fit in the issue.

## Its workstation is customizable (and that's where everything plays out)

The coding agent starts in a bare container. Three levers make it *your* employee:

- **`AGENTS.md`** — [your foundations]({{ site.baseurl }}/2026/07/12/vibe-project-dotnet-foundations/), once more: conventions, architecture, build and test commands. The same file that briefs the IDE and the CLI briefs the cloud agent. *The prompt expresses, the repo remembers* — never has a formula worked this hard.
- **`.github/workflows/copilot-setup-steps.yml`** — workstation preparation: preinstall the .NET SDK, restore packages, provision what's needed *before* the agent starts, so it doesn't lose twenty (billed) minutes guessing how to build.
- **MCP servers** — configurable for the agent too: [your stock server]({{ site.baseurl }}/2026/07/26/mcp-server-in-production/), internal tools… the cloud agent gets the same sockets as the team.

## The guardrails: fenced by construction

This is the most reassuring part of the file — the essentials are **structural**, not optional:

- It works on **its own branch**, never on `main`; its pushes are confined to `copilot/*`.
- The PR remains a **draft that requires your review** — and CI workflows only run with your approval: no auto-merge, no wild deployment.
- A **network firewall** bounds what the environment can reach (and widening it is an admin decision).
- Your repo's **branch protections** apply to it like to everyone — the company policy knows no exceptions.

In other words: the worst realistic scenario is *a mediocre PR you decline*. That's the [bounded blast radius]({{ site.baseurl }}/2026/07/22/vibe-engineering-vertical-slice-architecture/), organizational edition. Your reflexes from [the security article]({{ site.baseurl }}/2026/07/10/securing-github-copilot/) still apply — the PR review is *the* checkpoint; treat it as such.

**The word of honesty**, meter-side: every session consumes **premium requests** and **GitHub Actions minutes**. A well-fenced issue that lands on the first try is profitable; ten comment round-trips on a vague brief cost more than doing it yourself. Brief quality isn't just hygiene — it's economics.

## In summary

- The coding agent = the **third Copilot**: assigned issue → work in an isolated environment (Actions) → **draft pull request** → iteration through comments.
- **A well-written issue is the brief**: context, mission, constraints, deliverable — the subagent rules, applied at GitHub scale.
- Its workstation gets prepared: **AGENTS.md** (the foundations), **copilot-setup-steps.yml** (the environment), **MCP** (the sockets).
- Fenced by construction: dedicated branch, mandatory review, firewall, branch protections — worst realistic case: a declined PR.
- And the meter runs (premium requests + Actions minutes): **a careful brief is also an economic decision**.

The series' loop closes: the same AI employee, briefed by the same foundations, assists you in the IDE, lives in your terminal — and now takes tickets while you sleep. And that, honestly… is not rocket science.
