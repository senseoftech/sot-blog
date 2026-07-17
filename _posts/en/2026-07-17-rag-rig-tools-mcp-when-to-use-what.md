---
layout: post
title: "RAG, RIG, tools, MCP: when to use what to augment your LLM — it's not rocket science!"
date: 2026-07-17 16:00:00
author: AClerbois
ref: llm-augmentation-guide
image: /images/posts/llm-augmentation-guide.png
tags: [AI, RAG, MCP, tool-calling, architecture]
level: 200
---

An LLM fresh out of the box is a brilliant colleague… amnesiac, cut off from the world, and frozen at its training date. It knows neither your documents, nor your database, nor this morning's weather — and it *does* nothing: talking is all it has. All of AI application engineering consists of filling those gaps. The problem is the shelf: RAG, RIG, tool calling, MCP, fine-tuning, long context, memory… too often we pick the technology by buzz rather than by need — and end up with a vector database to query three SQL tables.

This guide puts each tool back in front of the gap it fills, with a decision table and — a first on this blog — an **interactive box** to walk you through the choice. Not rocket science.

<!--more-->

## The right question: which gap are you filling?

Everything gets simpler when you sort technologies by **gap filled** rather than popularity. An LLM has four gaps, and each family of tools targets one:

| The gap | The question to ask | The remedies |
| --- | --- | --- |
| **Knowing** | "it doesn't know my data" | direct context, RAG, RIG |
| **Acting** | "it can't execute anything" | tool calling, MCP |
| **Being** | "it doesn't talk the way it should" | prompt engineering, fine-tuning |
| **Remembering** | "it forgets everything between sessions" | conversational memory |

The classic — and costly — mistake is crossing the columns: fine-tuning to inject knowledge (stale at the first change), or vectorizing data that deserved a SQL query.

## Filling the "knowing" gap: three tools, three situations

**Direct context — the simplest thing that works.** Your corpus is small and stable (a product doc, an FAQ, a policy)? Paste it wholesale into the system prompt. With today's windows and [prompt caching]({{ site.baseurl }}/2026/08/03/prompt-caching-under-the-hood/) making repeated prefixes nearly free (some call it *cache-augmented generation*), this "dumb" approach beats a badly tuned RAG nine times out of ten. Its limits: corpus size and the model's diluting attention.

**RAG — the library with a librarian.** Large document base, moving content, open questions: you chunk, embed, and retrieve the relevant passages at question time. It's the standard for knowledge bases — we take it apart tomorrow in [RAG and embeddings explained simply]({{ site.baseurl }}/2026/07/18/rag-embeddings-explained-simply/), then in code form on August 1.

**RIG — the live fact-checker.** Lesser known: *Retrieval-Interleaved Generation*. Where RAG retrieves **once before** generating, RIG lets the model **query the source while it generates**: it emits a mini-query at the moment of writing a number, and the real value replaces its estimate. It's the approach popularized by DataGemma (Google) wired to Data Commons, and it targets one precise problem: the statistics and numeric values a classic RAG cites poorly. Promising, but young — little ready-made tooling.

## Filling the "acting" gap: tools, and the socket that distributes them

**Tool calling** gives the model arms: you declare functions (SQL query, API call, computation, sending mail), the model picks which to call and with which arguments, your code executes. It's also the remedy for *exact* questions: "customer X's orders in March" is not a semantic question, it's a `WHERE` — a structured question deserves a structured answer, not five approximate vector excerpts.

**MCP is not one more capability — it's a standard socket.** The Model Context Protocol doesn't make your model smarter: it **packages** your tools (and resources, and prompts) behind a protocol every client understands — IDEs, chatbots, agents. The decision rule is simple: a tool for **one** application → a native function is enough; the same tool for **several** clients or teams → an MCP server, written once, plugged in everywhere. We already [built an MCP server in .NET]({{ site.baseurl }}/2026/07/13/first-mcp-server-dotnet/), and its production version lands on July 30.

## Filling the "being" and "remembering" gaps

**Style, tone and format** are not fixed with a vector database. The staircase: first a structured system prompt and a few well-chosen examples (few-shot); if — and only if — that fails to hold a format or a very specific domain jargon, **fine-tuning** enters the scene. Remember its golden rule: it teaches the model *how* to talk, not *what* to know — knowledge injected by fine-tuning goes stale and can't be cited.

**Memory**, finally, fixes the amnesia between sessions: conversation summaries, user preferences, note files the agent re-reads. It's a topic of its own — we devote the July 27 article to it.

## The decision table

| Situation | The right reflex | Complexity |
| --- | --- | --- |
| Corpus < ~100 pages, stable | everything in context + cache | ★ |
| Large doc base, open questions | RAG | ★★★ |
| Structured data (SQL, API) | tool calling | ★★ |
| Numbers/stats to cite precisely | RIG (watch this space) | ★★★ |
| The model must *act* | tool calling | ★★ |
| Tools shared across several apps | MCP | ★★ |
| Stubborn tone, format, jargon | prompt first, then fine-tuning | ★★★★ |
| Forgetting between sessions | memory | ★★ |

## Your turn: the interactive guide

Answer two questions and the box suggests a starting point — with the link to dig deeper.

<div class="llm-widget" id="llm-widget">
  <style>
    .llm-widget { border: 1px solid var(--border); background: var(--bg-subtle); border-radius: 12px; padding: 1.2rem 1.4rem; margin: 1.5rem 0; }
    .llm-widget h4 { margin: 0 0 .35rem; font-size: 1rem; color: var(--text); }
    .llm-widget .llm-q { margin-bottom: 1rem; }
    .llm-widget .llm-opts { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .55rem; }
    .llm-widget .llm-opts input { position: absolute; opacity: 0; pointer-events: none; }
    .llm-widget .llm-opts label { border: 1px solid var(--border); background: var(--bg); color: var(--text); border-radius: 999px; padding: .35rem .85rem; font-size: .85rem; cursor: pointer; transition: border-color .15s, background .15s; user-select: none; }
    .llm-widget .llm-opts label:hover { border-color: var(--accent); }
    .llm-widget .llm-opts input:checked + label { border-color: var(--accent); background: var(--accent-bg); color: var(--accent-strong); font-weight: 600; }
    .llm-widget .llm-opts input:focus-visible + label { outline: 2px solid var(--accent); outline-offset: 2px; }
    .llm-widget .llm-result { border: 1px solid var(--accent); background: var(--accent-bg); border-radius: 10px; padding: .9rem 1.1rem; margin-top: 1rem; }
    .llm-widget .llm-result strong { color: var(--accent-strong); }
    .llm-widget .llm-result p { margin: .3rem 0 0; font-size: .92rem; color: var(--text); }
    .llm-widget .llm-result .llm-combo { font-size: .84rem; color: var(--text-muted); margin-top: .45rem; }
    .llm-widget .llm-hint { color: var(--text-muted); font-size: .85rem; margin: 0 0 .8rem; }
  </style>
  <p class="llm-hint">🧭 Two answers are enough — the recommendation updates by itself.</p>
  <div class="llm-q">
    <h4>1. What is your LLM missing?</h4>
    <div class="llm-opts" id="llm-q1">
      <input type="radio" name="llm-need" id="llm-n-know" value="know"><label for="llm-n-know">📚 Knowledge</label>
      <input type="radio" name="llm-need" id="llm-n-act" value="act"><label for="llm-n-act">🦾 The ability to act</label>
      <input type="radio" name="llm-need" id="llm-n-style" value="style"><label for="llm-n-style">🎭 A specific tone / format</label>
      <input type="radio" name="llm-need" id="llm-n-memory" value="memory"><label for="llm-n-memory">🧠 Memory</label>
    </div>
  </div>
  <div class="llm-q" id="llm-q2-know" hidden>
    <h4>2. What does that knowledge look like?</h4>
    <div class="llm-opts">
      <input type="radio" name="llm-know" id="llm-k-small" value="small"><label for="llm-k-small">📄 Small, stable corpus</label>
      <input type="radio" name="llm-know" id="llm-k-big" value="big"><label for="llm-k-big">🗄️ Large, moving base</label>
      <input type="radio" name="llm-know" id="llm-k-sql" value="sql"><label for="llm-k-sql">🧮 Structured data (SQL/API)</label>
      <input type="radio" name="llm-know" id="llm-k-stats" value="stats"><label for="llm-k-stats">📊 Numbers to cite precisely</label>
    </div>
  </div>
  <div class="llm-q" id="llm-q2-act" hidden>
    <h4>2. Who will consume these tools?</h4>
    <div class="llm-opts">
      <input type="radio" name="llm-act" id="llm-a-one" value="one"><label for="llm-a-one">🎯 A single application</label>
      <input type="radio" name="llm-act" id="llm-a-many" value="many"><label for="llm-a-many">🔌 Several apps / clients</label>
    </div>
  </div>
  <div class="llm-q" id="llm-q2-style" hidden>
    <h4>2. Have you already pushed prompting to the max (system + examples)?</h4>
    <div class="llm-opts">
      <input type="radio" name="llm-style" id="llm-s-no" value="no"><label for="llm-s-no">🤔 Not yet</label>
      <input type="radio" name="llm-style" id="llm-s-yes" value="yes"><label for="llm-s-yes">😤 Yes, and it's not enough</label>
    </div>
  </div>
  <div class="llm-result" id="llm-result" hidden></div>
  <script>
    (function () {
      var widget = document.getElementById('llm-widget');
      var results = {
        'know-small': { t: 'Everything in context + prompt caching', d: 'Paste the corpus into the system prompt: with caching, repeated prefixes cost next to nothing. The simplest thing that works — start here.', c: 'Move to RAG the day the corpus grows or churns too much.' },
        'know-big': { t: 'RAG (retrieval augmented generation)', d: 'Chunking, embeddings, retrieving the relevant passages at question time. The standard for living knowledge bases — full guide in the July 18 article, .NET code version on August 1.', c: 'Combine with a SQL tool for exact questions (hybrid).' },
        'know-sql': { t: 'Tool calling into your SQL / API', d: 'A structured question deserves a structured answer: declare a query function, the model supplies the filters, your code executes. Zero vectors, zero noise.', c: 'Add RAG only when genuinely open questions arrive.' },
        'know-stats': { t: 'RIG (retrieval interleaved generation)', d: 'The model queries the data source at the very moment it writes each number — the real value replaces its estimate. Built for statistics (see DataGemma + Data Commons).', c: 'Still young: meanwhile, a query tool + review does the same job.' },
        'act-one': { t: 'Native tool calling', d: 'Declare your functions inside your application (the August 2 article dissects them): the model chooses, your guardrails execute. No protocol needed for a single app.', c: 'Keep destructive actions behind a human confirmation.' },
        'act-many': { t: 'An MCP server', d: 'Write the tool once, plug it in everywhere: IDEs, chatbots, agents. We built one in .NET on July 13 — production version on July 30.', c: 'MCP tools are still tool calling: same security rules.' },
        'style-no': { t: 'Prompt engineering first', d: 'A structured system prompt + three good examples (few-shot) settle the vast majority of tone and format issues. Free, reversible, immediate.', c: 'Measure before/after on a few real cases — the July 20 evals article will equip you.' },
        'style-yes': { t: 'Fine-tuning', d: 'For a format or jargon that prompting cannot hold, adjusting the model is legitimate. Golden rule: it learns how to talk, not what to know.', c: 'Knowledge stays on the RAG/tools side — fine-tuning does not update, it retrains.' },
        'memory': { t: 'Conversational memory', d: 'Session summaries, preferences, note files re-read at startup: amnesia is cured by architecture, not by the model. Dedicated article on July 27.', c: 'Memory consumes context: summarize, do not store raw transcripts.' }
      };
      function val(name) {
        var el = widget.querySelector('input[name="' + name + '"]:checked');
        return el ? el.value : null;
      }
      function refresh() {
        var need = val('llm-need');
        widget.querySelector('#llm-q2-know').hidden = need !== 'know';
        widget.querySelector('#llm-q2-act').hidden = need !== 'act';
        widget.querySelector('#llm-q2-style').hidden = need !== 'style';
        var key = null;
        if (need === 'know' && val('llm-know')) key = 'know-' + val('llm-know');
        if (need === 'act' && val('llm-act')) key = 'act-' + val('llm-act');
        if (need === 'style' && val('llm-style')) key = 'style-' + val('llm-style');
        if (need === 'memory') key = 'memory';
        var box = widget.querySelector('#llm-result');
        if (!key) { box.hidden = true; return; }
        var r = results[key];
        box.innerHTML = '<strong>👉 ' + r.t + '</strong><p>' + r.d + '</p><p class="llm-combo">💡 ' + r.c + '</p>';
        box.hidden = false;
      }
      widget.addEventListener('change', refresh);
    })();
  </script>
</div>

## And in real life: you combine

Serious applications almost always stack several bricks: a RAG **plus** a SQL tool for exact questions, direct context **plus** memory, a light fine-tune **plus** a RAG for facts. The golden rule remains the staircase of simplicity: prompt → context → RAG or tools → fine-tuning, climbing one step only when the previous one has proven its limits — with numbers to show for it (evals arrive in the July 20 article). And when several bricks need orchestrating, that's the job of agents — we laid the groundwork with the [Microsoft Agent Framework]({{ site.baseurl }}/2026/07/11/microsoft-agent-framework-build-your-ai-agent-team/).

## A word of honesty

- **RIG** is the youngster of the list: solid concept, still-confidential tooling. I present it so the term doesn't ambush you in a meeting — not as a default choice in 2026.
- The borders are **porous**: an "agentic RAG" is just a RAG driven by tool calling, web search is just one more tool. Don't fight over labels, fight over the gap to fill.
- The interactive box gives a **starting point**, not an architect's verdict: your volumes, your budget and your evals always have the last word.

## In short

- Sort by **gap filled**: knowing (context, RAG, RIG), acting (tools, MCP), being (prompt, fine-tuning), remembering (memory).
- **Small stable corpus → context + cache**; large living base → **RAG**; structured data → **SQL via tool calling**; inline stats → **RIG** (watch this space).
- **MCP** doesn't make the model more capable: it **standardizes the socket** — reserve it for shared tools.
- **Fine-tuning** teaches *how* to talk, never *what* to know.
- Climb the **staircase of simplicity** one step at a time, evals in hand — and combine without guilt.

Tomorrow morning, we dive into the most-used step of that staircase: RAG and its embeddings, explained simply. And that, honestly… is not rocket science.
