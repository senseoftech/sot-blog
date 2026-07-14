---
layout: post
title: "Prompt caching: pay once, re-read a hundred times — it's not rocket science!"
date: 2026-08-03 10:00:00
author: AClerbois
ref: prompt-caching
image: /images/posts/prompt-caching.png
tags: [AI, LLM, tokens, caching, cost]
level: 300
---

In [the tokens article]({{ site.baseurl }}/2026/07/05/llm-tokens-input-output-cached/), one line of the price table was intriguing: *cached tokens*, billed at a fraction of the normal price. And in [the tool calling loop]({{ site.baseurl }}/2026/08/02/tool-calling-under-the-hood/), one detail should have alarmed you: on every round-trip, **the entire context is resent and re-billed**. An agent chaining thirty tool calls re-reads the same instructions thirty times.

The remedy is called **prompt caching**, and it's probably the best-yield optimization in all of AI engineering: used well, it divides the bill several-fold — provided you understand **one single rule**. You'll see: it's not rocket science.

<!--more-->

## Why it exists: re-reading isn't free

A quick mechanical reminder: before generating a single token, the model must "digest" your whole context — a heavy computation, proportional to prompt size. Yet in a conversation or an agent loop, **the overwhelming majority of the prompt doesn't change from turn to turn**: same system instructions, same tool catalog, same beginning of history. Redoing that computation every turn means paying for a full re-read of a file where only the last page is new.

The cache's idea: the provider **keeps in memory the result of digesting** a prompt prefix. On the next turn, if the same prefix comes back, it resumes the computation where it left off — and bills the re-read at a **reduced rate** (depending on the provider, 2 to 10 times cheaper than normal input; some slightly surcharge the *first* cache write). Latency drops along with the bill: less to digest, faster answers.

## THE rule: everything hinges on the prefix

Engrave this one, everything else follows: **the cache only reuses the longest *strictly identical* prefix of the prompt.** Identical byte for byte, from the very first character. The slightest change at position N invalidates everything after N — even if 99% of the rest is unchanged.

Hence the canonical architecture of a cacheable prompt — **from most stable to most volatile**:

1. **System instructions** (your [base prompt]({{ site.baseurl }}/2026/07/12/vibe-project-dotnet-foundations/), the rules) — never move.
2. **The tool catalog** ([yesterday's JSON Schemas]({{ site.baseurl }}/2026/08/02/tool-calling-under-the-hood/)) — never moves mid-session.
3. **Conversation history** — only *grows at the end* (perfect: the prefix stays stable).
4. **The current turn** — new every time, never cached, that's normal.

A well-structured conversation is thus **cached by construction**: each turn pays full price only for what's new.

## The mistakes that ruin the cache (seen in the wild)

- **The timestamp in the system prompt.** *"It is 07/30/2026, 10:47:23"* on the first line = a different prefix on every request = **zero cache, forever**. Classic mistake number one. If you need the date, it goes at the *end* of the prompt — or rounded to the day.
- **An unstable tool catalog.** Reordering tools, enabling/disabling them dynamically, rewording a description on the fly: everything before the history must be **frozen for the session**.
- **The badly placed session identifier.** A GUID or username inserted early in the prompt fragments the cache per request. Variable data goes as late as possible.
- **And compaction!** The link with [the context window article]({{ site.baseurl }}/2026/07/26/context-window-compress-forget/): summarizing history **rewrites the prefix** — and thus invalidates the cache. It's a real trade-off: compaction shrinks the context durably, but the next turn repays everything at full price. One more reason to compact *at the right moments* (between tasks), not in the middle of a tool loop.

One last mechanical detail: the cache has a **short TTL** — typically a few sliding minutes (refreshed on each reuse), extendable with some providers. An agent chaining its turns stays warm; a conversation resumed an hour later repays the first digestion.

## Who handles it: often not you — but verify

Good news: in everyday tools — Copilot, Claude Code, agent harnesses — **caching is handled for you**, and it's one reason their prompts are so rigidly structured. On the API side:

- **OpenAI**: automatic beyond a prompt-size threshold — nothing to do, everything to structure well.
- **Anthropic (Claude)**: explicit — you set cache *breakpoints* (typically after instructions and tools) and the SDK does the rest.
- In all cases, **the API response tells you what was cached** (`cached_tokens` and equivalents): that's THE metric to watch. A low cache rate on a conversational app = an unstable prefix somewhere — go find the timestamp.

## The order of magnitude that motivates

Take a realistic agent: 20,000 tokens of base (instructions + tools), 30 tool turns in the session. Without cache: ~600,000 full-price input tokens just to re-read the base. With cache: the base is paid **once** at full price, then ~29 re-reads at the reduced rate — depending on the provider, that's **60 to 90% of the input bill evaporating**, plus noticeably faster responses. No other optimization in this series has that effort-to-gain ratio: here, "the effort" is moving a timestamp.

## In summary

- Every turn re-digests and re-bills the whole context — the cache lets you **pay for digestion once** and re-read at a reduced rate.
- **The single rule**: only the longest *byte-for-byte identical* prefix is reused — structure from most stable to most volatile: instructions → tools → history → current turn.
- The cache killers: **leading timestamp**, unstable tool catalog, early identifiers — and **compaction**, to be triggered between tasks.
- OpenAI caches automatically, Anthropic via breakpoints, your daily tools do it for you — but **watch `cached_tokens`**: it's the thermometer.

Pay to read the file once, then pay only for the new pages: prompt caching is AI engineering's photocopier — spectacularly profitable, as long as you don't scribble on the first page. And that, honestly… is not rocket science.
