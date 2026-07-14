---
layout: post
title: "The context window: the art of compressing and forgetting — it's not rocket science!"
date: 2026-07-23 10:00:00
author: AClerbois
ref: context-window
image: /images/posts/context-window.png
tags: [AI, LLM, context-window, tokens, context-engineering]
level: 200
---

You've been chatting with Claude or ChatGPT for an hour, and something degrades: it "forgets" what you said at the beginning, mixes up instructions, goes in circles. Not a bug — a **context window** reaching saturation, and a tool handling it more or less gracefully.

In [the tokens article]({{ site.baseurl }}/2026/07/05/llm-tokens-input-output-cached/), we saw that everything in the context is paid for on every turn. Today, one floor up: **how tools compress, summarize and forget** — the concrete patterns behind Claude, ChatGPT, Copilot CLI and the others. You'll see: it's not rocket science.

<!--more-->

## The work desk (and its two diseases)

The image to keep: the context window is the model's **desk**. Everything it knows about your conversation sits on it — your messages, its answers, open files, tool outputs. What's not on the desk **doesn't exist** for it.

That desk has two diseases:

1. **The wall.** The window is finite — 128,000, 200,000, sometimes a million tokens depending on the model. Once full, that's it: something must be thrown away to put something else down.
2. **Dilution — the sneaky disease.** Well *before* the wall, quality drops. A model drowning in 150,000 tokens retrieves information less reliably than at 20,000 — research even showed the middle of the context is retained worst (*lost in the middle*). A big desk covered in papers is not an efficient desk.

The corollary that stings: **the giant window is not the magic fix.** Gemini and its million-token window push back the wall, not the dilution — nor [the bill]({{ site.baseurl }}/2026/07/05/llm-tokens-input-output-cached/). Hence a whole craft: **context engineering**.

## Pattern 1: the sliding window — throw away the oldest papers

The primitive method: when the desk overflows, throw away **the oldest documents**. That's the *sliding window* of early chatbots — and ChatGPT's baseline behavior in a very long conversation: the beginning eventually falls out of the window, silently.

Simple, but brutal: the oldest papers are often **the most important ones** — the initial brief, the constraints set at the start. That's exactly the "it forgot what I told it at the beginning". Nobody does *only* this anymore, but it's the base brick.

## Pattern 2: compaction — summarize before throwing away

The star pattern, the one you've already met twice on this blog:

- **Claude Code** does *auto-compact*: approaching the limit, it **writes a structured summary** of the conversation — decisions made, files touched, task state, next steps — then replaces the detailed history with that summary. The conversation continues, lightened.
- **Copilot CLI** does the same [at 95% of the gauge]({{ site.baseurl }}/2026/07/19/copilot-cli-2-the-daily-routine/), and `/compact` triggers it on demand.

The image: before clearing the desk, you write **a synthesis sheet** and keep only that. The subtlety few people see: *the model itself* writes the sheet — and the whole art lies in what it preserves. Decisions and constraints: yes. The forty back-and-forths it took to get there: no.

**The word of honesty**: a summary is **a chosen loss**. The detail the sheet didn't keep is gone for good — that's why, after a compaction, an agent can "forget" a nuance mentioned three hours earlier. Compaction manages saturation; it doesn't cancel it.

## Pattern 3: selective forgetting — drop the big stale blocks

More surgical: instead of summarizing everything, identify **the bulky blocks that became useless** and drop only those. Suspect number one: old **tool outputs**. The 3,000-line listing the agent read an hour ago served its purpose — the decision derived from it is recorded; the listing itself is now dead weight.

That's the principle of the Claude API's *context editing*: clearing old tool results while keeping the conversation thread. On the desk: throw away the draft printouts, keep the notes taken on them.

## Pattern 4: externalization — the sticky note instead of memory

The most elegant pattern, and the reflex of modern agents: **write outside the context**. Rather than keeping a 2,000-token plan on the desk for the whole session, the agent writes it to a file (`TODO.md`, a plan, working notes) and keeps only **a pointer** on the desk — "the plan is in docs/plan.md". Needs the detail? It re-reads the file, uses it, and the context breathes again.

You've seen it at work without naming it: Claude Code maintains its memory files and task lists, autonomous agents keep logbooks. The disk is infinite and free; the desk is small and expensive — **what must last goes to disk.**

## Pattern 5: just-in-time loading — bring only the useful file

The mirror of the previous one: never put *everything* on the desk upfront. That's [RAG and its librarian]({{ site.baseurl }}/2026/07/15/rag-embeddings-explained-simply/) — the three right excerpts at the right time — but also the daily mechanics of agents: Copilot CLI doesn't load your whole repository, it runs targeted searches and opens only the relevant files. *Just-in-time context*: the right information, at the right time, in small quantity.

And it's the hidden argument of [the sliced architecture]({{ site.baseurl }}/2026/07/22/vibe-engineering-vertical-slice-architecture/): a feature that fits in one folder is a folder that fits on the desk.

## Pattern 6: separate desks — delegate to avoid clutter

The team pattern: each specialist works at **their own desk**, and reports only their conclusion to the boss. [Copilot CLI]({{ site.baseurl }}/2026/07/20/copilot-cli-3-the-team-in-the-terminal/)'s *Explore* agent digs through the codebase on its own and comes back with three paragraphs — the 50,000 tokens of exploration **never touched** your main context. Same logic in [Agent Framework]({{ site.baseurl }}/2026/07/11/microsoft-agent-framework-build-your-ai-agent-team/): context isolation is a form of compression.

## What your tools do, at a glance

| Tool | Its visible strategy |
| --- | --- |
| **Claude / Claude Code** | auto-compact with structured summary + externalization (memory files) + context editing on the API side |
| **ChatGPT** | sliding window + condensation in long conversations + its separate "memory" (patience: tomorrow's article) |
| **Copilot CLI** | `/context` gauge, auto-compaction at 95%, `/compact`, subagents at separate desks |
| **Gemini** | the very big table (1M tokens) — useful, but dilution and the bill remain |

## In summary

- The context window has two diseases: **the wall** (hard limit) and **dilution** (quality dropping well before) — the big window only treats the first.
- Six patterns, from bluntest to finest: **slide** (drop the old), **compact** (summarize before dropping), **forget selectively** (big stale blocks), **externalize** (the sticky note on disk), **load just-in-time** (the librarian), **separate the desks** (delegate).
- Compaction is a **chosen loss**: sometimes the right move is still `/clear` and a clean brief.
- And the best compression is **not dirtying the desk**: short contexts, sliced tasks, vertical slices.

A well-kept desk rather than a giant desk: that's context engineering in a nutshell. Tomorrow, the natural sequel: if the context is working memory, disposable by nature… **how do AIs remember you?** Until then… it's not rocket science.
