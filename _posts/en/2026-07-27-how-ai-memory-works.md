---
layout: post
title: "AI memory: how ChatGPT and Claude remember you — it's not rocket science!"
date: 2026-07-27 10:00:00
author: AClerbois
ref: ai-memory
image: /images/posts/ai-memory.png
tags: [AI, LLM, memory, context-engineering, privacy]
level: 200
---

"I told you yesterday!" — and yet no: yesterday doesn't exist for a language model. Its knowledge is **frozen** at training time, and its context window — [yesterday's desk]({{ site.baseurl }}/2026/07/26/context-window-compress-forget/) — empties with every new conversation. An LLM is, by construction, a **brilliant amnesiac**.

And yet ChatGPT knows your preferences, Claude remembers your projects, Copilot CLI recalls your conventions. No magic: everything that looks like memory is an **external system**, built around the model. Today we take those systems apart — floor by floor. You'll see: it's not rocket science.

<!--more-->

## The Memento colleague

The right image is the hero of the film *Memento*: unable to form new memories, he copes through a **system** — tattoos for the essentials, annotated polaroids, notes everywhere. He remembers nothing; his system remembers for him.

An AI "with memory" is exactly that. The model stays amnesiac — **its weights never change** while you use it. Around it, a system extracts, stores, and **lays the right notes back on the desk** at the start of each session. Three immediate consequences:

- "Memory" is not learning: the model doesn't get smarter, it gets **better briefed** (the [fine-tuning vs context]({{ site.baseurl }}/2026/07/18/rag-embeddings-explained-simply/) nuance, again).
- Every recalled memory **occupies the desk**: memory consumes context, [bill included]({{ site.baseurl }}/2026/07/05/llm-tokens-input-output-cached/).
- What's stored can be **read, edited, deleted** — and that's excellent news.

## Floor 1: working memory (already covered)

The context window: everything on the desk during the session. Volatile by nature — that was [yesterday's article]({{ site.baseurl }}/2026/07/26/context-window-compress-forget/), with its six compression patterns. Just remember it's the **mandatory gateway**: wherever it comes from, a memory only acts once it lands on the desk.

## Floor 2: user cards — ChatGPT's and Claude's memory

The system best known to the general public. During the conversation, a discreet process spots what's worth keeping and writes it down as **small cards**:

> *"Develops in .NET and Blazor"* · *"Prefers concise answers"* · *"Preparing an Azure certification"*

At each new session, the relevant cards are **re-injected into the context** — and that's why ChatGPT "knows" what you do for a living. Two mechanisms coexist at OpenAI: **explicit memories** (the cards, viewable and deletable one by one in settings) and **chat history reference** (drawing from your past conversations). Claude plays a similar tune with its project-scoped memory, toggleable and **inspectable** — you can read what it retained, correct it, erase it.

The reflex to build: **go read your cards.** It's your profile as seen by the machine — and sometimes one stale card ("works in Java", since 2024…) biases all your answers. A memory needs maintenance.

## Floor 3: tool memory — the repository that learns

The floor that concerns us most as developers — you met it in [episode 2 of the CLI series]({{ site.baseurl }}/2026/07/22/copilot-cli-2-the-daily-routine/):

- **Copilot CLI** maintains a *repository memory*: conventions discovered while working ("xUnit tests in triple A", "endpoints via Carter") are noted and reused — plus a cross-session memory to pick up last week's thread.
- **Claude Code** keeps **memory files in Markdown**: dated, organized, versionable notes — the most inspectable form there is: `git diff` on your AI's memory.

Note the kinship with *Memento*: in both cases, these are **text files** the system re-reads at startup. No black box — notes.

## Floor 4: human-written memory — your foundations

This article's twist: you've been doing memory engineering **since the beginning of this series**. `AGENTS.md`, repository instructions, [ADRs]({{ site.baseurl }}/2026/07/14/adr-memory-of-architecture-decisions/) — what are they, if not memories written *by you*, injected into every session?

The difference with floor 3 is a difference of **pen**: here the human writes (reliable, intentional, reviewed in PRs), there the tool learns (automatic, but fallible). The two complement each other — the [vibe engineering]({{ site.baseurl }}/2026/07/12/vibe-project-dotnet-foundations/) formula gets its final word: *the prompt expresses, the repo remembers, the tooling enforces… and the tool learns the rest.*

## Floor 5: searchable memory — RAG on your own past

Last floor, for large volumes: when memories number in the thousands, you can't re-inject everything. You **index** them — [embeddings, vector database]({{ site.baseurl }}/2026/07/18/rag-embeddings-explained-simply/) — and recall only the most relevant ones for the question at hand. The librarian, applied to your own history. That's the mechanics of [Agent Framework]({{ site.baseurl }}/2026/07/11/microsoft-agent-framework-build-your-ai-agent-team/)'s *context providers*, which push the idea all the way to **knowledge graphs**: memories that are *connected* (this customer → prefers → express delivery), not just stacked.

## The full cycle (and its traps)

Every AI memory lives the same four-beat cycle: **extract** (what to keep? — after the response), **store** (card, file, vector), **recall** (lay it on the desk at the right time), **maintain** (deduplicate, update, expire). And each beat has its trap:

- **Polluted memory**: a wrong or stale card gets re-injected *every session* — a permanent bias. Hence the importance of inspectability (and the advantage of Markdown memories: they can be proofread).
- **Privacy**: what's remembered **travels in every prompt**. In a company, "what does the tool retain, where, for whom?" belongs in the same folder as [Copilot security]({{ site.baseurl }}/2026/07/10/securing-github-copilot/) — incognito/memory-off modes exist for good reasons.
- **Overflow**: remembering too much resurrects [yesterday's dilution]({{ site.baseurl }}/2026/07/26/context-window-compress-forget/). A good memory **forgets** — it's a feature, not a flaw.

## In summary

| Floor | Who writes | Lifespan | Example |
| --- | --- | --- | --- |
| Context window | the session | the conversation | yesterday's desk |
| User cards | the tool (auto) | months | ChatGPT Memory, Claude memory |
| Tool memory | the tool (auto) | the project's life | Copilot CLI repository memory |
| Written foundations | **you** | the project's life | AGENTS.md, ADRs, instructions |
| Indexed memory | the tool | unlimited | RAG on history, knowledge graphs |

- An LLM is **amnesiac by construction**: any "memory" is an external system re-briefing the model each session.
- Remembering = **extract, store, recall, maintain** — and recall always goes through the desk (so it's paid for).
- **Read your cards**: a memory gets inspected, corrected, pruned — and in a company, governed.
- The most reliable memory remains the one **you** write: your instructions and ADRs are first-class memories.

The Memento colleague copes very well — provided he keeps his notes up to date. Give your tools the same care: a few accurate cards beat a notebook bloated with dubious memories. And that, honestly… is not rocket science.
