---
layout: post
title: "Ask, Edit, Agent, Plan: GitHub Copilot's modes — and why planning changes everything"
date: 2026-07-04 10:00:00
author: AClerbois
ref: copilot-modes
image: /images/posts/copilot-modes.png
tags: [github, copilot, AI, agents, LLM]
---

Same Copilot, same model, same project… and yet four radically different outcomes depending on a little dropdown most people ignore: the **mode**. Ask, Edit, Agent — and the newcomer that changes everything for big tasks, **Plan**.

Choosing the right mode means deciding **who holds the wheel**. And on a big task, charging off without unfolding the map is the best way to drive three hours in the wrong direction. Let's take it all apart. And you'll see: it's not rocket science.

<!--more-->

## The through-line: who holds the wheel?

In [the harness article]({{ site.baseurl }}/2026/07/01/the-ai-harness-github-copilot/), we saw that Copilot is a machine: a loop, tools, a model. The **modes** are that machine's gearstick. They don't change the engine — they change **how much of the driving you delegate.**

On the left of the stick, you keep your hands on the wheel and Copilot advises you. On the right, you hand it the whole trip and keep watch. In between, it's all a matter of **how much you delegate**. Let's go through each notch.

## The four modes

### Ask — you ask for directions

**The analogy:** the co-pilot beside you. You ask a question, it answers; you do the driving. It never touches the wheel.

**Concretely:** you select some code, ask a question, Copilot answers — it explains, suggests a snippet, reminds you of an edge case. **It changes no files.** Zero risk, instant answer.

**When to use it:** to understand, explore, learn. "What does this function do?", "how do I test this?", "what's the idiomatic way in Rust?". It's the safest and fastest mode.

### Edit — you delegate a precise stretch

**The analogy:** cruise control on a stretch **you** picked. You stay in charge of the trajectory, the machine handles the segment.

**Concretely:** you point at the files to change, describe the change in plain language ("add error handling", "switch to async/await"), and Copilot applies **review-ready** edits within that scope. You approve before anything sticks.

**When to use it:** when you **already know what to do and where**, but don't want to type it all. A targeted change, a localized refactoring. You're not dropping the reins — you're delegating a precise move.

### Agent — you hand over the wheel

**The analogy:** self-driving. You give the destination, the car plans the route, turns, brakes, corrects itself. You keep your eyes on the road and a hand near the brake.

**Concretely:** you give a high-level goal; the agent reasons across the whole project, picks the files, writes the code, runs the commands, reads the errors and **iterates on its own** until the goal is met. It applies changes automatically, surfacing sensitive commands for approval. It's the [harness's agent loop]({{ site.baseurl }}/2026/07/01/the-ai-harness-github-copilot/) in full action.

**When to use it:** to build a feature, scaffold a module, fix a bug that spans several files. Powerful — which is exactly why the next mode becomes vital.

### Plan — you unfold the map before leaving

**The analogy:** before a big trip, you spread the map on the hood and trace the route **together**, before turning the key. You spot the tolls, the detours, the questions ("which way, exactly?").

**Concretely:** in Plan mode, Copilot **explores the codebase, asks clarifying questions, and produces an implementation plan for you to review** — all **before** writing a single line. You course-correct on the plan, then let the agent execute it.

**When to use it:** as soon as the task is big, ambiguous, or spans several places. It's the heart of this article, so let's dig into **why**.

## Why planning before a big task changes everything

Turn the agent loose straight onto "redo the whole authentication system" and here's what happens: it **assumes** what you meant, heads off in one direction, produces 400 lines of diff… and 20 minutes later you discover it solved the wrong problem. You throw it all away and start over. Expensive in time, in [credits]({{ site.baseurl }}/2026/07/05/llm-tokens-input-output-cached/), in nerves.

The plan breaks that vicious circle. Here's what it buys you:

- **It surfaces ambiguities *before* the code.** Clarifying questions ("which session strategy? JWT or cookie?") come up when they cost one sentence to fix — not 400 lines.
- **It makes correction cheap.** Redirecting a three-bullet plan is trivial. Redirecting a large diff already written is a whole job. You fix the map, not the road already built.
- **It splits into reviewable steps.** A big task becomes a list of steps you approve one by one — instead of a wall of changes to swallow at once.
- **It keeps context clean.** An agent following a clear plan stays focused; it wanders less, so it wastes less context (and fewer tokens).
- **It creates a contract.** The approved plan becomes the reference: at the end, you check the result *against the plan*, not against some vague starting intention.

The golden rule fits in one image: **ten minutes of map save three hours of detour.** On a small task, planning is a needless luxury. On a big one, it's what separates a fine result from an "undo everything and restart". Measure twice, cut once.

## The link with models: which model, which mode

This is where it all comes together. I've already argued that [one model is not another]({{ site.baseurl }}/2026/06/25/which-model-to-choose-github-copilot/) — city cars, sedans, semi-trailers. The mode tells you **how much you delegate**; the model tells you **how much power you hitch**. The two are chosen together.

| Mode | What Copilot does | Recommended model range | Why |
| --- | --- | --- | --- |
| **Ask** | Answers, without touching code | 🟢 City car (Haiku, Flash, mini) | Instant answer, negligible cost, plenty enough |
| **Edit** | Edits a scope you choose | 🔵 Sedan (Sonnet, GPT-5.4) | Good quality/price for targeted code |
| **Agent** | Builds autonomously, multi-file | 🔵 Sedan by default, 🟣 Semi-trailer when stuck | The sedan often suffices; move up on the real knots |
| **Plan** | Thinks and traces the route | 🟣 Semi-trailer (Opus, GPT-5.5) | This is the "reasoning" step: pay for the best brain **here** |

And here's the **advice that really makes the difference**:

> **Plan with a big model, execute with a cheaper one.**

The reasoning — the hard part, the one that decides the direction — concentrates in the **plan**. That's where the powerful model (the [semi-trailer, or even Fable 5]({{ site.baseurl }}/2026/06/25/which-model-to-choose-github-copilot/) for very big jobs) earns its price. Once the plan is approved, execution is often mechanical: a sedan runs it through very well, at a fraction of the cost.

You get the best of both worlds: the **decision quality** of a large model where it counts, and the **controlled cost** of a mid-range model where the road is already traced. It's exactly the "[token cost]({{ site.baseurl }}/2026/07/05/llm-tokens-input-output-cached/)" reasoning applied to the way you work.

## The recap table

| Mode | The image | Who holds the wheel | Use it for |
| --- | --- | --- | --- |
| **Ask** | The co-pilot who answers | You, 100% | Understanding, exploring, learning |
| **Edit** | Cruise control on a stretch | You, the machine executes | A targeted change you can describe |
| **Agent** | Self-driving | Copilot, you keep watch | Building, scaffolding, fixing across files |
| **Plan** | The map on the hood | You frame it, before leaving | Any big ambiguous or multi-file task |

## The simple rule to remember

- **Small question?** → Ask, light model.
- **Precise, known change?** → Edit, all-rounder model.
- **Feature to build?** → Agent, all-rounder — and move up a range if it stalls.
- **Big fuzzy task?** → **Plan first**, with a big model. Then Agent to execute, possibly with a cheaper model.

The beginner's reflex is to do everything in Agent mode with the biggest model "to be safe". The pro's reflex is to **dose it**: the right mode and the right model for each moment of the trip. The difference doesn't show on a line of code — it shows on the bill, and on the number of times you didn't have to start over.

Choosing your mode is choosing who drives. Planning before you charge off is looking at the map before you turn the key.

And that, when you get down to it… is not rocket science.
