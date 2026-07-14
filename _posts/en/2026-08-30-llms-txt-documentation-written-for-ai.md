---
layout: post
title: "llms.txt: documentation written for machines — it's not rocket science!"
date: 2026-08-30 10:00:00
author: AClerbois
ref: llms-txt
image: /images/posts/llms-txt.png
tags: [documentation, llms-txt, AI, best-practices]
level: 100
---

You publish a .NET library. Somewhere, a developer you'll never meet types: "add Contoso.Payments and make a first payment". Their AI agent visits your documentation site and finds… a mega-menu, a cookie banner, a carousel, three tracking scripts — and the content, drowned at the bottom. So it does what LLMs do when starved for context: it improvises. It invents `client.Charge()`, a method that never existed. The next morning, the issue lands in your tracker: "your library doesn't work".

Yesterday, [runbooks and postmortems]({{ site.baseurl }}/2026/08/29/runbooks-and-postmortems-operational-knowledge/) closed the chapter on operational knowledge. Today, last stop on [the map]({{ site.baseurl }}/2026/08/21/the-artifacts-of-vibe-coding-the-complete-map/) — and we switch sides. Every artifact in this series lived *inside* your repository, for *your* agents. This one lives on your website, for **other people's** agents: your users who code with an AI. It's called `llms.txt`. You'll see: it's not rocket science.

<!--more-->

## robots.txt, inverted

Since 1994, there's been a contract between websites and machines: `robots.txt`, a file at the root that tells robots **where not to go**. A no-entry sign.

`llms.txt` is exactly the opposite: a file at the root that tells AI agents **where to go, and what to read first**. A signpost. And it answers a real problem: modern HTML is *hostile* to LLMs. Navigation, banners, JavaScript that loads content after the fact, ads — a human with eyes filters all of that out unconsciously. For a model with a limited context window, every byte of noise is a byte stolen from the substance. Markdown, on the other hand, is dense in useful tokens: all content, zero chrome.

## The standard: one markdown page at the root

The format, proposed by Jeremy Howard (llmstxt.org), is disarmingly simple: a markdown file served at `/llms.txt`, with a fixed structure — an `H1` title (the project name), a summary in a *blockquote*, then sections of **curated links** to the pages that matter, each with a one-line description. A special section, `## Optional`, lists what an agent in a hurry can skip.

The important word is *curated*. It's not an inventory, it's a selection — the selectivity value that runs through this whole series: ten important links beat a hundred exhaustive ones. For exhaustive, there are the neighbors down the hall:

| Root file | Audience | Message |
| --- | --- | --- |
| `robots.txt` | crawlers | "don't go there" |
| `sitemap.xml` | search engines | "here's everything that exists" |
| `llms.txt` | AI agents | "here's what matters, read this first" |
| `llms-full.txt` | AI agents | "here's the entire docs, concatenated into one markdown file" |

The `llms-full.txt` variant — the whole documentation in a single file — suits agents that prefer to swallow everything at once; the proposal also suggests serving each docs page as raw markdown (the same URL with `.md` appended).

## A concrete example, in full

For a realistic .NET library:

```markdown
# Contoso.Payments

> .NET payment processing SDK: API client, webhooks,
> reconciliation. Targets .NET 8+, distributed via NuGet.

## Documentation

- [Quickstart](https://docs.contoso.dev/quickstart.md):
  installation, first payment in ten lines
- [API reference](https://docs.contoso.dev/api-reference.md):
  every public class, exact signatures
- [Webhooks](https://docs.contoso.dev/webhooks.md): signature
  verification, idempotency, retry policy

## Examples

- [Complete scenarios](https://docs.contoso.dev/examples.md):
  payment, refund, subscription — copy-pastable code

## Optional

- [Changelog](https://docs.contoso.dev/changelog.md)
- [Migration guide v2 → v3](https://docs.contoso.dev/migration-v3.md)
```

Reread it with an agent's eyes: in thirty lines, it knows what the library is, where the exact signatures live (goodbye, invented `client.Charge()`), and what it can safely ignore. It's your AI's [onboarding guide]({{ site.baseurl }}/2026/08/22/agents-md-your-ai-onboarding-guide/) — public edition, for other people's AI.

## The signpost and the counter

If you've read [the article on MCP servers in production]({{ site.baseurl }}/2026/07/30/mcp-server-in-production/), a question comes up: why a static file when you can expose a server? Because the two don't play the same role. `llms.txt` is **passive and static**: a signpost any agent can read without installing anything. MCP is **interactive**: a counter where the agent asks questions, searches, executes. The signpost costs an hour and serves everyone; the counter costs a project and serves those who connect to it. They're complements, not competitors.

On the adoption side, the standard is making its way: documentation frameworks like Mintlify or Fumadocs generate the file automatically from your existing docs. If your docs site is generated, there's a good chance the option is one line of config away.

## Why it's worth double in the AI agent era

Three reasons — and this time, the loop closes:

1. **Your users already code with an AI.** When their agent doesn't know your library well, it hallucinates your API — and *your* issue tracker takes the hit, *your* reputation foots the bill. Machine-readable docs are no longer a bonus: they're the developer experience of half your user base.
2. **Curated markdown is concentrated context.** Every token spent on nav, cookie banners or JavaScript is stolen from the content. A well-kept `llms.txt` is your documentation compressed into useful tokens — the agent reads more, understands better, invents less.
3. **The repository that talks… publishes.** The whole series fit in one formula: *the AI proposes, the human decides, the repository remembers*. Here's the last link in the chain: the repository **publishes** — and what you memorized for your own agents becomes context for agents everywhere.

## The honesty moment

- **The standard is young and adoption is uneven.** There's no guarantee crawlers and agents read it: some providers honor it, others ignore it entirely. It's a cheap bet — an hour of work — not a certainty.
- **An llms.txt pointing at chaos is still chaos, with directions.** The file doesn't replace good documentation; it makes it *accessible*. If your pages are wrong or empty, you've just helped machines find out faster.
- **It needs maintenance, like everything else.** A dead link, a renamed page, a vanished API — a stale `llms.txt` **lies to machines**, and machines don't ask for confirmation. Same rule as the glossary: one line in the release checklist.

## In summary

- Modern HTML is **hostile to LLMs** — nav, banners, JS: content drowned in noise; markdown is **dense in useful tokens**.
- `llms.txt` = **robots.txt inverted**: a markdown file at the site root telling agents **where to go and what to read first** — title, summary, curated links, an `Optional` section; `llms-full.txt` for the full-text version.
- **Complementary to MCP**: the file is the signpost (passive, free, universal), the server is the counter (interactive). One doesn't exclude the other.
- A **young** standard: uneven adoption, no guarantee anyone reads it — but one hour of effort to make your docs readable by half your future users.

And there it is: [the map]({{ site.baseurl }}/2026/08/21/the-artifacts-of-vibe-coding-the-complete-map/) is complete. From ADRs to runbooks, everything your repository remembers for your agents — and to finish, the signpost at the root of your site that opens that memory to everyone else's agents. Ten artifacts, one idea: write down what matters, where it gets read. And that, honestly… is not rocket science.
