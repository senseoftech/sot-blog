---
layout: post
title: "Inside the 30 milliseconds of a token: attention and the KV cache — it's not rocket science!"
date: 2026-08-08 10:00:00
author: AClerbois
ref: kv-cache-400
image: /images/posts/kv-cache-400.png
tags: [AI, LLM, attention, kv-cache, performance]
level: 400
---

Level 400, episode 2. Since the start of the series, we've laid down rules of thumb: *the context is paid on every turn*, *the cache only reuses the identical prefix*, *the middle of the context is poorly retained*. They work. But an architect wants the **causal why** — the mechanism under the abstractions.

So let's open the hood and look at what happens *physically* in the few tens of milliseconds where the model produces one token. Three concepts — **attention, quadratic cost, KV cache** — and all your rules of thumb become theorems. You'll see: it's not rocket science.

<!--more-->

## Attention: every token looks at all the others

A language model is made of layers, and the heart of each layer is called **attention**. The idea, stripped of the math: to "understand" a token, the model lets it **look at all the preceding tokens** and weight their importance. The word "she" looks back, finds "Marie" ten tokens earlier, and gives her a strong weight. That's attention — a mechanism for relating each position to all the others.

Technically, each token produces three vectors — a **Query** (what I'm looking for), a **Key** (what I offer as an anchor point), a **Value** (the information I carry). The attention weight between two tokens is the product of one's Query and the other's Key; the output is the sum of the Values, weighted by those weights. Remember the names **Key** and **Value**: they come back in two minutes, and they explain everything.

## Quadratic cost: where dilution comes from

Here's the consequence that hurts. If each token looks at all the others, then for a sequence of N tokens, there are **N × N pairs** to evaluate. Double the context, **quadruple** the attention computation. It's the famous **quadratic** cost (O(N²)) — and it's not incidental, it's the central physical constraint of LLMs.

Two of your rules of thumb fall out of it, proven:

- **Why the giant window costs so much** — not linearly, but quadratically. A 200k-token context isn't "twice" a 100k one, it's **four times** the attention computation. [The bill]({{ site.baseurl }}/2026/07/05/llm-tokens-input-output-cached/) and [the latency]({{ site.baseurl }}/2026/07/23/context-window-compress-forget/) have their cause here.
- **Why *lost in the middle*** — the attention budget is finite and dilutes across N² pairs. The bigger N grows, the thinner the attention paid to each individual token — hence the degradation, and the middle, less anchored than the beginning (the instruction) and the end (the recent question), takes the biggest hit.

The well-kept desk of [the context article]({{ site.baseurl }}/2026/07/23/context-window-compress-forget/) wasn't a comfort metaphor: it's a **quadratic necessity**.

## The KV cache: what prompt caching really caches

Now, the jewel — and the true nature of [prompt caching]({{ site.baseurl }}/2026/07/30/prompt-caching-under-the-hood/). Generation happens **token by token**: to produce token 501, the model needs the Keys and Values of all tokens 1 through 500. Naively, it would recompute them for each new token — a colossal waste, since the Key and Value of token 12 **never change** once it's written.

Hence the **KV cache**: you keep in memory (in the GPU's VRAM) the already-computed Keys and Values, and each new token computes *only its own*. That's what makes generation practical. And here's the revelation that closes the series:

**Prompt caching is the persistence of the KV cache between two requests.** When the provider "caches your prefix", it literally keeps the already-computed Keys/Values for those tokens. And now, THE prefix rule explains itself: a token's Key/Value depends on **everything that precedes it** (attention looks backward). Change the token at position 3, and the K/V of positions 4, 5, 6… are invalidated — they were computed "looking at" the old token 3. **The identical prefix isn't an arbitrary convention: it's the only portion whose Keys and Values remain mathematically valid.** The [cache-killing timestamp]({{ site.baseurl }}/2026/07/30/prompt-caching-under-the-hood/) invalidates everything after it because it changes what each following token looked at.

## What understanding this unlocks

- **The KV cache lives in VRAM, and it grows with the context.** It's *the* memory item that limits the number of simultaneous conversations on a GPU — the thread [the inference economics article]({{ site.baseurl }}/2026/07/30/prompt-caching-under-the-hood/) will pull. "Long context" = "GPU memory consumed", not just "tokens billed".
- **Attention optimizations** (GQA, sliding window, MLA…) you see in model cards aren't folklore: they're direct attacks on the quadratic cost and the KV cache size. You now know *which* problem they solve.
- **The first token is slow, the following ones fast.** "Prefill" (digesting the whole prompt) is the big quadratic computation; "decode" (generating the continuation) benefits from the KV cache. TTFT vs tokens/second, two physically distinct regimes.

## In summary

- **Attention** relates each token to all the previous ones via **Query/Key/Value** — the heart of each layer.
- The cost is **quadratic** (N²): the giant window costs four times, not two; and the dilution of the attention budget *is* the *lost in the middle* — two rules of thumb, now proven.
- The **KV cache** keeps the already-computed Keys/Values; **prompt caching is its cross-request persistence**, and that's why only the **identical prefix** is reusable (K/V depend on everything before).
- And it opens what's next: the KV cache in VRAM is the memory constraint of inference at scale.

Three letters — Q, K, V — and the whole series stands as one block: the bill, the dilution, the prefix rule, the slow first token. Level 400 is seeing the mechanism where level 100 saw the rule. And that, honestly… is not rocket science.
