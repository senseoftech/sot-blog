---
layout: post
title: "The Agentic SDLC (6/9) — The deterministic/probabilistic boundary: the agent proposes, the gate disposes — it's not rocket science!"
date: 2026-09-05 10:00:00
author: AClerbois
ref: agentic-sdlc-boundary
image: /images/posts/agentic-sdlc-boundary.png
tags: [agentic-sdlc, agents, AI, reliability, governance]
level: 300
---

An agent opens an impeccable GitHub issue: clear title, structured description, the name of the affected customer. One detail: **the customer doesn't exist**. The name was plausible, the API accepted it, the issue went out. Nobody had placed a deterministic check — "is this customer in the system?" — between the agent's proposal and the API call. The lesson of chapter 16 of Daniel Meppiel's [Agentic SDLC Handbook](https://danielmeppiel.github.io/agentic-sdlc-handbook/handbook/ch16-deterministic-probabilistic-boundary.html) fits in one sentence: the fix wasn't a better model, it was **a line to redraw on the architecture diagram**.

After [the attention economy]({{ site.baseurl }}/2026/09/04/agentic-sdlc-5-the-attention-economy/), here is the design decision the handbook ranks as the most important in any agentic system: where the **boundary between deterministic and probabilistic** runs. Not rocket science.

<!--more-->

## Two computers in the same machine

Every agentic system runs two computers side by side:

| | Deterministic side | Probabilistic side |
| --- | --- | --- |
| **Who** | file I/O, tool calls, schema validation, tests, audit trails | the model: reading, drafting, proposing |
| **Behavior** | same inputs → same outputs | same inputs → *similar* outputs |
| **Failures** | loud and traceable | silent: "confident, plausible, wrong" |

Nothing derogatory about the probabilistic side: that's where all the creative value comes from. But you don't hand consequential operations to the component whose failures are undetectable to the naked eye.

## The rule: the model proposes, the gate disposes

Any consequential side effect — and *a fortiori* any irreversible one: writing to production, creating a customer-facing artifact, modifying a canonical table, deploying — executes **on the deterministic side, behind a validation gate the agent cannot bypass**.

The strictest form is called *supervised execution*: the agent holds **no write capability at all**. It produces a buffered artifact (a JSON, a diff, a plan), and a separate deterministic process validates it against a schema and an allowlist before applying it. The principle matches what we wrote about [the GitHub coding agent]({{ site.baseurl }}/2026/08/08/github-coding-agent-issue-to-pull-request/) and [one branch per agent]({{ site.baseurl }}/2026/08/09/one-branch-per-agent-git-in-the-agent-era/): a PR is exactly that — a buffer zone before the irreversible.

## Two disciplines against hallucination

The chapter refuses to treat hallucination as a prompt problem. It's a **system** problem, managed by two complementary disciplines:

1. **Grounding**: load specific, justified context per decision — not ambient vibes — to reduce the *incidence* of hallucinations.
2. **Verification**: assume a hallucination survived grounding, and catch it before externalization with deterministic checks against systems of record — to reduce the *blast radius*.

Both, always. Grounding without verification lets things through; verification without grounding wastes effort.

## The quality gate matrix

Four gate types, along two axes — programmatic/judgement and internal/external:

| | Programmatic | Judgement |
| --- | --- | --- |
| **Internal** | types, lint, schema validation → catches structural defects | the agent re-reads against original intent → catches goal drift |
| **External** | cold review, fresh context, with a rubric → catches structural defects at scale | human checkpoint before the irreversible → catches scope decisions |

The handbook's matching rule: pick the gate that catches **your** failure mode — not the one that's easiest to set up. A JSON schema will never catch goal drift; a tired human will not catch a schema violation.

## In real life

The chapter catalogs concrete implementations of the seam: GitHub agentic workflows' `safe-outputs` blocks (the agent emits JSON, a post-stage validates and applies via API); the sandboxed CI job **without write permissions**, paired with a separate process under a different IAM role that applies validated changes; the approval node in a workflow DAG between "propose" and "apply". Every time, the same geometry: the seam is **reified** in infrastructure, not promised in a prompt.

And three habits to adopt: draw the boundary **on the diagram before coding**; pick your gates **before** picking your model; and never hand out a write token without documenting why.

## A word of honesty

- Gates have a cost: on low-risk work, over-gating kills velocity. The handbook embraces **proportionality** — aggressive autonomy in reversible zones, hard gates in front of the irreversible. We'll come back to this on the governance side in episode 9.
- Watch the "judgement-internal" cell: an agent reviewing itself is still **probabilistic**. It's a useful layer, not a guarantee — never count it as one in a compliance file.

## In short

- Every agentic system = **two computers**: a deterministic one (loud failures) and a probabilistic one (silent failures, "confident, plausible, wrong").
- The golden rule: **the model proposes, the gate disposes** — the irreversible executes on the deterministic side, behind an unbypassable validation.
- Against hallucination: **grounding** (reduce incidence) + **verification** (reduce blast radius).
- Four quality gates (programmatic/judgement × internal/external): choose by the failure mode you need to catch.
- The placement of the seam is **the** number-one architecture decision — before model choice, before window size.

Tomorrow we scale up: multiple agents, waves, checkpoints — and the meta-process that let the handbook itself be written by a fleet of eleven agents. And that, honestly… is not rocket science.
