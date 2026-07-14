---
layout: post
title: "A2A: when agents exchange business cards — it's not rocket science!"
date: 2026-08-01 10:00:00
author: AClerbois
ref: a2a-protocol
image: /images/posts/a2a-protocol.png
tags: [AI, A2A, agents, MCP, interop]
---

This whole series has built **your** agent company: employees ([Agent Framework]({{ site.baseurl }}/2026/07/11/microsoft-agent-framework-build-your-ai-agent-team/)), their tools ([MCP]({{ site.baseurl }}/2026/07/13/first-mcp-server-dotnet/)), their procedures ([workflows]({{ site.baseurl }}/2026/07/27/agent-framework-workflow-hands-on/)). But a company doesn't live in a vacuum: it has suppliers, carriers, partners — who have their own agents too.

How does your logistics agent ask the carrier's agent where the delivery stands? Answer: **A2A** — the *Agent-to-Agent protocol* — the open standard that makes agents from different systems, vendors and companies talk to each other. You'll see: it's not rocket science.

<!--more-->

## MCP plugs in tools; A2A makes agents converse

The classic confusion first, because the two protocols are cousins:

- **MCP** is the **wall socket**: it plugs *tools* — passive, deterministic — into *your* agent. `GetStock` doesn't think: it answers.
- **A2A** is the **inter-company telephone**: it connects two *agents* — two autonomous systems that reason, ask questions back, and take time to work.

The simple test: if the thing being called executes and returns (a function), it's a tool → MCP. If it **deliberates, asks for clarification and comes back later** (an employee), it's an agent → A2A. And the two compose naturally: the carrier's agent you call over A2A uses, internally, its own MCP tools. The socket in the workshops, the telephone between headquarters.

## The business card: the Agent Card

How does your agent discover what the agent across the street can do? Every A2A agent publishes an **Agent Card** — a JSON document at an agreed address (`/.well-known/agent-card.json`), literally its business card:

```json
{
  "name": "TransExpress Delivery Agent",
  "description": "Tracking and rescheduling of TransExpress deliveries.",
  "url": "https://agents.transexpress.example/a2a",
  "skills": [
    { "id": "track-shipment", "description": "Locates a parcel and estimates arrival." },
    { "id": "reschedule-delivery", "description": "Reschedules a delivery." }
  ],
  "securitySchemes": { "...": "how to authenticate" }
}
```

Who I am, what I can do (my *skills*), where to reach me, how to identify yourself. Your agent reads the card, picks the skill, and starts the conversation — **no custom integration**. It's exactly what MCP did for tools, applied one floor up.

## The purchase order: the task

The second key concept solves the problem of **time**. An agent-to-agent question is not a function call that returns in 200 ms: "reschedule the delivery" may require checks, a human approval on the carrier's side, hours. So A2A models the exchange as a **task** — a purchase order with a lifecycle:

> submitted → working → *(needs clarification?)* → completed / failed

Your agent submits the task, then follows its state (notifications, streamed updates). The agent on the other side can **ask for input** ("which time slot do you prefer?") before resuming. And the final result — text, structured data, documents — arrives as **artifacts**. You recognize the pattern: it's the [workflows' RequestPort]({{ site.baseurl }}/2026/07/27/agent-framework-workflow-hands-on/), extended across organizations — and the same philosophy as the [subagents' work orders]({{ site.baseurl }}/2026/07/25/copilot-subagents-splitting-the-work/): brief, mission, deliverable.

## Opaque by design: you don't tour your supplier's factory

A crucial design choice, and a very "enterprise" one: A2A is **opaque**. The carrier's agent reveals neither its reasoning, nor its internal tools, nor its data — only its advertised skills and its answers. You don't tour your supplier's factory: you place an order at the counter.

That's what makes the protocol viable between companies (trade secrets, compliance, security)… and it's also its most serious consequence: **you're trusting a black box.** Hence the importance of the rest of the protocol — mutual authentication (the card's security schemes) — and of your own reflexes: [trace these exchanges]({{ site.baseurl }}/2026/07/31/observing-your-agents-opentelemetry/) like any outbound call, and [verify what's verifiable]({{ site.baseurl }}/2026/07/16/why-ai-hallucinates/) before acting on a third-party agent's answer.

## Where the ecosystem stands (and Microsoft in it)

A2A, initiated by Google then entrusted to the **Linux Foundation**, has rallied the big names — including Microsoft, which adopted it in **Foundry and Agent Framework**: your .NET agent can *call* a remote A2A agent, and your own agent can *expose itself* over A2A, business card included. The series' Russian-doll loop closes: a workflow becomes an agent, the agent becomes an MCP server for your internal tools… and an **A2A agent for your external partners**.

**The word of honesty**, because it's due: A2A is **young**. The protocol is stable and governed, but the directory of public agents remains embryonic, the inter-company trust models (who certifies the business card? who's liable for a third-party agent's damage?) are under construction, and your first uses will probably be… internal — between your own departments' agents, where trust already exists. It's the classic standards bet: get ready before you need it.

## In summary

- **MCP plugs tools into an agent; A2A makes agents converse** — the socket and the telephone, complementary by construction.
- The **Agent Card**: the published JSON business card (identity, skills, address, authentication) — discovery without custom integration.
- The **task**: a purchase order with a lifecycle — long-running, questions back, artifacts on delivery.
- **Opaque by design**: no reasoning or tools exposed — viable between companies, but a black box to trace and verify.
- Governed by the **Linux Foundation**, adopted by Microsoft in Foundry/Agent Framework — young, but the standard to watch.

Your agents have business cards, purchase orders and a switchboard: the agent economy is starting to look like… an economy. And that, honestly… is not rocket science.
