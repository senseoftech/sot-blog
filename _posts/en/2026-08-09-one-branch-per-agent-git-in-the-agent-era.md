---
layout: post
title: "One branch per agent: Git in the agent era — it's not rocket science!"
date: 2026-08-09 10:00:00
author: AClerbois
ref: agentic-branches
image: /images/posts/agentic-branches.png
tags: [git, branching, trunk-based, worktree, AI, coding-agent, best-practices]
level: 200
---

Do the math: one dev opens two or three branches a week. A three-dev team that delegates seriously — [subagents]({{ site.baseurl }}/2026/07/29/copilot-subagents-splitting-the-work/) locally, the [coding agent]({{ site.baseurl }}/2026/08/08/github-coding-agent-issue-to-pull-request/) in the cloud — can produce **fifteen a day**. Your branching strategy was designed for the first world. It just changed orders of magnitude without asking your opinion.

Until now, this series treated branches as an implementation detail (the agent "pushes its branch", period). Today we flip the perspective: **the branching strategy is part of the harness**. It decides where agents may write, how their work reaches `main`, and how fast parallel worksites collide. You'll see: it's not rocket science.

<!--more-->

## The scale change kills GitFlow

GitFlow — `develop`, release branches, hotfix branches, ceremonial merges — assumes branches that are **long-lived and rare**. Multiply the authors by the agents and every assumption breaks: fifteen daily branches living a week each is a mathematical guarantee of cascading conflicts, and a `develop` that diverges from `main` becomes a second world every agent has to re-contextualize.

The model that survives the volume is the simplest one: **trunk-based development**. A single long-lived branch (`main`), **short** work branches — hours or days, never weeks — merged as soon as CI is green and review is done. The shorter a branch lives, the less it diverges; the less it diverges, the cheaper the integration. It's [the vertical slice]({{ site.baseurl }}/2026/07/25/vibe-engineering-vertical-slice-architecture/) applied to time: thin slices, continuously integrated.

The golden rule to give your agents (and your humans): **one issue = one branch = one PR**. The brief comes in through [the issue template]({{ site.baseurl }}/2026/08/07/issue-templates-your-agents-brief/), the work goes out through the PR — the whole cycle fits in a day.

## The branch as a trust boundary

A branch isn't just a workspace: it's a **permission level**. The GitHub coding agent already illustrates this — confined to `copilot/*`, unable to push anywhere else. Generalize the principle with a naming convention that says *who* wrote:

| Pattern | Author | Associated rules |
| --- | --- | --- |
| `feat/*`, `fix/*` | humans | standard protections |
| `copilot/*`, `agent/*` | agents | pushes refused everywhere else, human review **mandatory** |
| `main` | nobody directly | everything goes through PR + green CI |

The tooling that enforces all this already exists in GitHub: **rulesets** (protections by branch pattern: required review, required checks, no force-push), and **CODEOWNERS** to route review — `docs/adr/` to the architects, `*.sql` to whoever sleeps badly during migrations. An agent that drifts doesn't meet a reprimand: it meets a wall. It's your favorite principle — *back the prose with tooling* — applied to Git.

## The PR: the airlock between the machine world and main

In an augmented team, the pull request changes status: it's no longer *one* quality step among others, it's **the single crossing point** between the machines' work and the branch everyone shares. Two practical consequences:

- **PR size becomes a design constraint.** Fifteen 300-line PRs get read; three 3,000-line PRs get skim-approved — and skim-approving machine code is the very definition of risk. Bound the scope in the issue, demand thin slices.
- **The queue becomes a real topic.** Fifteen green PRs targeting `main` the same afternoon means merges that stale each other out. GitHub's **merge queue** solves it: each PR is re-tested against the *actual* state of `main` before merging, in order. Auto-merge ("merge when everything is green **and approved**") completes the picture — the human approves, the machinery does the rest.

## Locally: worktrees, parallelism without the conflicts

The local counterpart of "one branch per agent": **git worktrees** — several working directories on the same repository, each on its own branch. Three parallel agent worksites = three worktrees: nobody overwrites anybody's files, and your main directory stays clean for *your* work. [Copilot CLI made it a command]({{ site.baseurl }}/2026/07/24/copilot-cli-4-delegate-and-automate/) (`/worktree`), but the mechanism is standard Git:

```bash
git worktree add ../app-fix-vat copilot/fix-vat-rounding
# ... the agent works in ../app-fix-vat ...
git worktree remove ../app-fix-vat   # after the merge
```

The hygiene that goes with it: one worktree per worksite, removed as soon as the PR merges. Zombie worktrees lingering three weeks recreate exactly the divergence you were avoiding.

## The honest word

- **The bottleneck is no longer Git, it's you.** Fifteen PRs a day are easy to produce; they are not easy to *review*. If review capacity doesn't keep up, pressure will mount to approve fast — resist: that's precisely the airlock protecting `main`. Reducing agent throughput beats degrading review.
- **Never auto-merge agent code without human review.** The temptation will come ("CI is green, tests pass…"); [the security article]({{ site.baseurl }}/2026/07/10/securing-github-copilot/) showed why it's a no. CI checks that it works; review checks that it's *what you wanted*.
- **Trunk-based demands solid tests.** Merging fast into `main` is only healthy if CI catches regressions. Without the net, short branches propagate mistakes faster — tooling first, throughput second.

## In summary

- Agents change the **order of magnitude**: fifteen branches a day. GitFlow collapses; **trunk-based** with short branches (one issue = one branch = one PR) survives.
- The branch is a **trust boundary**: naming conventions by author (`copilot/*`), rulesets and CODEOWNERS enforcing the rules mechanically.
- The **PR is the single airlock** between machines and `main`: small PRs, non-negotiable human review, merge queue and auto-merge for the machinery.
- Locally, **one worktree per worksite** — created for the branch, removed after the merge.

Your branching model is no longer a team preference: it's the infrastructure that decides whether ten agents save you ten times the time or cost you ten times the patience. Design it as such — and record it in an ADR, obviously. And that, honestly… it's not rocket science.
