---
layout: post
title: "Why AI hallucinates (and how to live with it) — it's not rocket science!"
date: 2026-07-16 10:00:00
author: AClerbois
ref: ai-hallucinations
image: /images/posts/ai-hallucinations.png
tags: [AI, LLM, hallucinations, reliability]
level: 100
---

A `dotnet add package` for a library that **doesn't exist**. A perfectly named, perfectly documented… perfectly fictional API method. An American lawyer citing case law invented by ChatGPT in court — true story, he was sanctioned for it.

The word has entered everyday language: AI **hallucinates**. But why? Is it a bug that will get fixed? A lie? Neither — and once you understand the mechanism, you know exactly how to protect yourself. Let's take it apart. You'll see: it's not rocket science.

<!--more-->

## The mechanism: a sentence-finishing machine

Let's clear up the main misunderstanding first: an LLM does **not look up** a database of facts to answer. It does one single thing, in a loop: **predict the most plausible next token** given everything that came before ([token by token]({{ site.baseurl }}/2026/07/05/llm-tokens-input-output-cached/), literally).

Picture a **prodigious storyteller**: he has read the entire library, and his job is to always finish his sentences with the most natural continuation possible. Ask him the capital of France: "Paris" is by far the most plausible continuation — he's "right". Ask him for a .NET library for a niche need he's never really seen: the most plausible continuation is a name **that looks like** what exists. `Microsoft.Extensions.SuperJson` sounds perfectly credible. He just made it up — **with the same mechanism, the same confidence and the same tone** as when he tells the truth.

That's the key point: **plausible ≠ true.** Hallucination isn't a system failure — it *is* the system, applied where it doesn't have enough material.

## Why it doesn't say "I don't know"

Because nothing in its construction naturally pushes it there. During training, producing a plausible answer is rewarded; "I don't know" is rarely the most probable continuation of a question. Recent models are clearly improving — trained to decline, to express uncertainty, to search the web — but the underlying mechanism remains: **a plausibility engine, not a truth engine.**

Add **temperature** to that — the setting that doses randomness in the choice of the next token. Low: the model almost always picks the most probable token (repetitive, but safe). High: it allows itself less probable choices (creative, but adventurous). Useful to know: for facts or code, turn it down; for brainstorming, turn it up.

## Why it hits rare cases hardest

The storyteller is solid on what he's read **a thousand times**, fragile on what he's read **three times**. Hence a golden rule that's not known well enough: **the more niche your question, the higher the hallucination risk.** Basic C# syntax: rock solid. The precise API of an obscure library in its version from three months ago: red zone — he *interpolates*, filling the gaps with plausibility.

It's exactly the *slopsquatting* mechanism from [the security article]({{ site.baseurl }}/2026/07/10/securing-github-copilot/): AIs often invent the **same** plausible package names, and attackers publish real malicious packages under those very names. One side's hallucination is the other side's phishing.

And keep the paradox in mind: this flaw is inseparable from the main quality. The ability to generate **new, plausible** text is *also* what writes your drafts, proposes three architectures and rewords your emails. You can't "fix" hallucination without lobotomizing creativity. You **fence it in**.

## How to live with it: the five guardrails

1. **Ground it (the librarian).** That was [yesterday's article]({{ site.baseurl }}/2026/07/15/rag-embeddings-explained-simply/): with RAG, the model answers grounded in **your** documents laid in front of it, instead of drawing on its statistical memory. Hallucination recedes massively as soon as the facts are in the context.

2. **Give it tools (the harness).** An agent that can **compile, test, run** catches its own inventions: the phantom package doesn't survive `dotnet restore`, the fictional method doesn't survive the build. That's the whole argument of [the harness]({{ site.baseurl }}/2026/07/01/the-ai-harness-github-copilot/): the *write → verify → fix* loop turns a storyteller into an engineer.

3. **Demand sources.** "Cite the document and the section" changes everything: a sourced claim can be checked in one click, a bare claim has to be taken on faith. Answers with web search or RAG + citations are structurally safer.

4. **Verify the verifiable — you.** The human reflex remains the last link: a package about to be installed → check it on nuget.org; a case law about to be cited → look it up; a number going to production → cross-check it. Everything verifiable **gets verified**, in proportion to the stakes.

5. **Calibrate the task.** Low temperature and constrained formats for factual work; and for niche questions, prefer a model with access to fresh documentation (search, MCP to your docs) over its memory alone.

## In summary

- An LLM is a **plausibility engine**: it completes with the most credible continuation — which is *often* true, but not *because* it's true.
- Hallucination hits hardest on **rare cases** (niche APIs, recent versions, confidential domains) — precisely where you'd like to trust it.
- It's the flip side of **creativity**: you don't remove it, you **fence it in** — RAG to ground, tools to verify, sources to trace, a human to decide.
- And the series' reminder: a package suggested by an AI gets checked **before** installation.

A brilliant storyteller you never let publish without review and fact-checking: that's the right mental model. The next post tackles the logical follow-up — how to **test** an application whose core never answers the same way twice. Until then, remember: plausible is not true. And that, honestly… is not rocket science.
