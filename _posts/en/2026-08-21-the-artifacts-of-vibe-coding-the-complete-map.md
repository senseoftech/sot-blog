---
layout: post
title: "The artifacts of vibe coding: the repo that talks — it's not rocket science!"
date: 2026-08-21 10:00:00
author: AClerbois
ref: vibe-coding-artifacts
image: /images/posts/vibe-coding-artifacts.png
tags: [documentation, vibe-coding, agents, AI, best-practices]
level: 100
---

Try the experiment: give the same prompt to two AI agents, one in a bare repository, the other in an equipped one — ADRs, a glossary, schemas, tests that tell the story of the behavior. The first one guesses; the second one **knows**. Same model, same prompt, two unrelated results. The difference doesn't come from the AI: it comes from what the repository has to say to it.

Since this summer, this series has been exploring those artifacts one by one — [ADRs]({{ site.baseurl }}/2026/07/14/adr-memory-of-architecture-decisions/), [the glossary]({{ site.baseurl }}/2026/07/16/the-domain-glossary/), [diagrams as code]({{ site.baseurl }}/2026/07/17/diagrams-as-code-the-map-ai-can-read/), [Git history]({{ site.baseurl }}/2026/07/28/git-history-the-memory-your-ai-already-reads/). Today, let's climb up for the view: here is the **complete map** of the repo that talks — and the next ten days to walk it. You'll see: it's not rocket science.

<!--more-->

## The thesis: value migrates from the code to its artifacts

Vibe coding has a side effect few people spell out: **code becomes regenerable**. An implementation an agent can rewrite in twenty minutes is no longer the project's capital. The capital is everything that *constrains* and *explains* that code: the decisions, the vocabulary, the contracts, the tests, the conventions. Lose the code, you regenerate it; lose the artifacts, you regenerate **anything at all**.

Hence the rule that structures the whole series: every artifact lives **in the repository**, versioned, reviewed in pull requests — because that's where, and only where, your agent reads it on every session. An external wiki is invisible to it; a Markdown file next to the code is free context.

## The map: four families

### 1. The memory of decisions — the *why*

| Artifact | What it captures | The article |
| --- | --- | --- |
| **ADR** | a decision made, its options, its price | [already published]({{ site.baseurl }}/2026/07/14/adr-memory-of-architecture-decisions/) |
| **RFC / design doc** | a decision *in progress* — the organized debate | [August 24]({{ site.baseurl }}/2026/08/24/rfcs-and-design-docs-decide-before-you-code/) |
| **Git history** | the thousand small decisions, commit by commit | [already published]({{ site.baseurl }}/2026/07/28/git-history-the-memory-your-ai-already-reads/) |

This family's common thread: Chesterton's fence. An agent that doesn't know *why* something exists demolishes it with enthusiasm.

### 2. Intent — the *what*

| Artifact | What it captures | The article |
| --- | --- | --- |
| **Spec** | the expected behavior, source of truth | [August 23]({{ site.baseurl }}/2026/08/23/spec-driven-development-the-spec-as-source-of-truth/) |
| **Issue template** | a task's brief, agent-ready | [already published]({{ site.baseurl }}/2026/08/07/issue-templates-your-agents-brief/) |
| **Implementation plan** | the *how*, approved before the code | [August 25]({{ site.baseurl }}/2026/08/25/the-implementation-plan-the-human-checkpoint/) |
| **Tests** | the executable spec — the one that cannot lie | [August 26]({{ site.baseurl }}/2026/08/26/tests-the-executable-spec/) |

This is the control family: in vibe coding, you don't re-read a 2,000-line diff — you approve a spec, amend a plan, and demand green tests.

### 3. The guardrails — what *enforces itself*

| Artifact | What it captures | The article |
| --- | --- | --- |
| **Schemas and contracts** (OpenAPI, JSON Schema, types) | machine-verifiable boundaries | [August 27]({{ site.baseurl }}/2026/08/27/schemas-and-contracts-machine-verifiable-context/) |
| **Linters and analyzers** | self-enforcing conventions | [August 28]({{ site.baseurl }}/2026/08/28/linters-and-analyzers-conventions-that-enforce-themselves/) |
| **One branch per agent** | the isolation that makes mistakes reversible | [already published]({{ site.baseurl }}/2026/08/09/one-branch-per-agent-git-in-the-agent-era/) |

The agents' favorite family: they don't even read these artifacts, they **bump into them** — and correct themselves. Every automated rule is one instruction you don't have to write and one review comment you don't have to make.

### 4. Shared context — what *everyone reads*

| Artifact | What it captures | The article |
| --- | --- | --- |
| **AGENTS.md / instructions** | the AI's onboarding guide, re-read every session | [August 22]({{ site.baseurl }}/2026/08/22/agents-md-your-ai-onboarding-guide/) |
| **Domain glossary** | the single vocabulary, business ↔ code | [already published]({{ site.baseurl }}/2026/07/16/the-domain-glossary/) |
| **Diagrams as code** | the system map, editable by the agent | [already published]({{ site.baseurl }}/2026/07/17/diagrams-as-code-the-map-ai-can-read/) |
| **Runbook** | the manual for known outages | [already published]({{ site.baseurl }}/2026/08/05/the-runbook-the-manual-your-agent-is-waiting-for/) |
| **Postmortem** | the memory of incidents | [August 29]({{ site.baseurl }}/2026/08/29/the-postmortem-the-memory-of-incidents/) |
| **llms.txt** | your published docs, written for other people's agents | [August 30]({{ site.baseurl }}/2026/08/30/llms-txt-documentation-written-for-ai/) |

## The pattern that shows up everywhere

Re-read any episode already published and you'll find the same three rules — they hold for the entire map:

1. **The AI proposes, the human decides, the repo remembers.** The agent excels at writing the draft (the ADR, the glossary, the postmortem, the diagram); the human keeps the decision; the repository keeps the record.
2. **Selectivity is the value.** Ten living records beat a hundred bureaucratic ones — an artifact nobody maintains becomes a versioned lie.
3. **All of this was already worth gold before AI.** None of these artifacts was invented for agents; they already served humans. Agents just make them **pay twice**: what helped the new colleague now helps a new colleague who shows up amnesiac *every single session*.

## The honesty moment

- **Don't install all sixteen at once.** A repository that goes from zero artifacts to the full arsenal in a week mostly produces dead documentation. Start where it bleeds: the agent names things wrong? Glossary. It undoes your choices? ADRs. It ignores your conventions? AGENTS.md and linters.
- **Artifacts don't replace conversation.** A team that stopped talking because "it's all in the docs" has a problem Markdown won't fix.

## In summary

- In vibe coding, **code becomes regenerable**; the capital is the artifacts that constrain and explain it — all of them **in the repository**, versioned, reviewed in PRs.
- Four families: the **memory of decisions** (ADRs, RFCs, Git), **intent** (specs, plans, tests), the **guardrails** (schemas, linters), and **shared context** (AGENTS.md, glossary, diagrams, runbooks, postmortems, llms.txt).
- Everywhere the same pattern: **the AI proposes, the human decides, the repo remembers** — and selectivity is the value.
- What's next: **one artifact per day until August 30**. The map is drawn; let's walk it.

A repo that talks is an agent that knows — and a human who sleeps well. See you tomorrow for the first stop: AGENTS.md. And that, honestly… it's not rocket science.
