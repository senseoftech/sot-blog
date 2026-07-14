---
layout: post
title: "Reliability of long-running agents: idempotency, compensation and the crash at the worst moment — it's not rocket science!"
date: 2026-08-17 10:00:00
author: AClerbois
ref: agent-reliability-400
image: /images/posts/agent-reliability-400.png
tags: [AI, agents, reliability, distributed-systems, workflows]
level: 400
---

Level 400, episode 5. In [the workflows article]({{ site.baseurl }}/2026/07/31/agent-framework-workflow-hands-on/), checkpointing let the "loan application" survive a restart. I glossed over a question that haunts every distributed system and that AI makes urgent: **what happens when the agent resumes after a crash, and replays an action it had already started?**

Refunding twice. Sending the email in duplicate. Ordering 100 units instead of 50. Today, we equip the reliability of agents that live for hours or days — with the proven patterns of distributed systems, adapted to non-determinism. You'll see: it's not rocket science.

<!--more-->

## The problem: a long agent is a distributed system in denial

Add up what the series has established: an agent [calls tools in a loop]({{ site.baseurl }}/2026/08/02/tool-calling-under-the-hood/), [resumes on a checkpoint]({{ site.baseurl }}/2026/07/31/agent-framework-workflow-hands-on/), [delegates to subagents]({{ site.baseurl }}/2026/07/29/copilot-subagents-splitting-the-work/), and is [never deterministic]({{ site.baseurl }}/2026/08/15/sampling-and-constrained-decoding/). You don't have an "AI script": you have a **distributed, asynchronous, partially failing system** — with, as a bonus, a component that improvises.

The three failure modes waiting for you in production:

1. **The crash between the action and its recording.** The agent calls `RefundCustomer(€500)`, the payment goes out… and the process dies before noting "done". On resume, it replays — **double refund**.
2. **The retry on timeout.** The tool doesn't answer in time; the agent (or the harness) retries. But the first attempt *maybe* succeeded — the network just swallowed the response.
3. **The model's own doubt.** Non-deterministic, it may decide to call the same tool twice "to be sure". Which, on an irreversible action, is a polite catastrophe.

The common thread of all three: **distributed systems guarantee at best "at least once". Your actions must therefore survive being executed several times.**

## Pillar 1: idempotency — the seatbelt

An operation is **idempotent** if running it ten times gives the same result as running it once. It's THE property that neutralizes modes 1, 2 and 3 at once. The canonical pattern: the **idempotency key**. The agent generates a unique identifier *per intent*, the tool remembers it, and a replay = a no-op:

```csharp
[McpServerTool, Description("Refunds a customer. Idempotent via idempotencyKey.")]
public async Task<RefundResult> RefundCustomer(
    string customerId, decimal amount,
    [Description("Unique key for THIS refund intent.")] string idempotencyKey)
{
    // Seen this key before? Return the stored result, don't refund twice.
    if (await _store.TryGet(idempotencyKey) is { } prior) return prior;

    var result = await _paymentGateway.Refund(customerId, amount);
    await _store.Save(idempotencyKey, result);   // atomic with the payment, ideally
    return result;
}
```

The crucial, counterintuitive architecture point: **responsibility for idempotency belongs to the tool, not the agent.** You don't *trust* the model not to replay — [it's a gullible intern]({{ site.baseurl }}/2026/08/13/prompt-injection-defense-in-depth/) — you make the replay **harmless** at the MCP server level. Design your sensitive tools as idempotent endpoints, exactly like a good payment API.

## Pillar 2: compensation — when you can't undo

Not all actions are idempotent, and many aren't *reversible*. The sent email can't be un-sent; the completed transfer doesn't come back with a `rollback`. For those cases, the **saga** pattern: instead of a single transaction (impossible across heterogeneous systems), a sequence of steps, **each with its compensating action**.

Reserve stock → charge the card → ship. If shipping fails, you don't "rollback" — you **compensate**: refund the card, release the stock. Compensation doesn't erase history (the charge existed), it **corrects it with an inverse action**. It's the [workflows' RequestPort/checkpoint]({{ site.baseurl }}/2026/07/31/agent-framework-workflow-hands-on/) taking on its full meaning: every crossed step is a resume point *and* a possible compensation point.

## Pillar 3: the human as circuit breaker

Some decisions must never be left to a non-deterministic component alone. [Tool approval]({{ site.baseurl }}/2026/07/11/microsoft-agent-framework-build-your-ai-agent-team/) isn't just an anti-injection guard — it's a **reliability pattern**: beyond a threshold (amount, irreversibility, low confidence), the agent *prepares* and **escalates to a human**. Define those thresholds explicitly: below, autonomy; above, signature. The circuit breaker that protects against runaways — whether from a hallucination, an injection, or a simple loop.

## Pillar 4: measure reliability (agent SLOs)

You only steer what you measure. A production agent has its own **SLOs**, beyond classic uptime:

- **Task completion rate** — what fraction finishes without intervention?
- **Human intervention rate** — how many escalate, and is it the right level?
- **Replay / duplicate-action rate** — the thermometer of your pillars 1-2.
- **Cost and latency per task** — are they drifting?

This is where [OTel observability]({{ site.baseurl }}/2026/08/04/observing-your-agents-opentelemetry/) becomes vital: traces are the raw material of those SLOs, and [last night's incident becoming tomorrow's eval]({{ site.baseurl }}/2026/07/20/testing-an-ai-application-evals/) closes the quality loop. A system you don't observe is a system whose failures you discover through your customers.

## In summary

- A long-running agent **is a non-deterministic distributed system**: crash between action and log, retry on timeout, replay by the model — "at least once" is the rule.
- **Idempotency** (idempotency key, responsibility of *the tool*): make replay harmless rather than hoping it won't happen.
- **Compensation** (sagas) for the irreversible: correct with an inverse action, since you can't undo.
- **Human-circuit-breaker** above a threshold, and **agent SLOs** (completion, escalation, replay, cost) fed by traces.

The question isn't "what if the agent is wrong?" but "when it replays, does it hurt?". Design for replay, compensate the irreversible, keep the human on the big red button — and your agents survive the real world. And that, honestly… is not rocket science.
