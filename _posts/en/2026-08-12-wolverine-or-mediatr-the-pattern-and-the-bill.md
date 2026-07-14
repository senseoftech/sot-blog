---
layout: post
title: "Wolverine or MediatR: the messenger, the pattern and the bill — it's not rocket science!"
date: 2026-08-12 10:00:00
author: AClerbois
ref: wolverine-mediatr
image: /images/posts/wolverine-mediatr.png
tags: [dotnet, csharp, mediatr, wolverine, architecture]
level: 200
---

In [the vibe engineering post]({{ site.baseurl }}/2026/07/12/vibe-project-dotnet-foundations/), a "word of honesty" flagged that **MediatR was moving to a commercial license**, with this promise: *the pattern matters more than the library*. Several of you asked for the follow-up — so here it is: what do you actually do when your architecture's messenger sets up a tollbooth?

Three honest options, one candidate worth the detour (Wolverine), and a golden reminder about what [your slices]({{ site.baseurl }}/2026/07/25/vibe-engineering-vertical-slice-architecture/) owe to the pattern — not the package. You'll see: it's not rocket science.

<!--more-->

## The context, without drama

The facts: MediatR — like MassTransit and other ecosystem pillars — moved to a **commercial model**: free below a revenue threshold, paid above. And let's say it against the ambient reflex: **this is not a scandal.** A maintainer wanting to make a living from a tool half the .NET ecosystem has used for free for ten years is rather the sign of a model seeking sustainability. Paying the license is a perfectly legitimate option — it's even first in the comparison.

But it *is* an **architecture decision** being put to you — and [a decision gets documented]({{ site.baseurl }}/2026/07/14/adr-memory-of-architecture-decisions/). Let's build the file.

## The reminder: what does the messenger actually do?

In our [CQRS mold]({{ site.baseurl }}/2026/07/25/vibe-engineering-vertical-slice-architecture/), the mediator does one thing: **the endpoint hands over a message, the right handler receives it** — without either knowing the other. Plus the cross-cutting *behaviors* (validation, logging) around the pipeline. It's useful, it's clean… and it's **remarkably little code**. Keep that in mind: you're not choosing a nuclear reactor, you're choosing an internal switchboard.

## Option 1: pay for MediatR — continuity

Your solution is full of it, the team knows it, it's stable and battle-tested: **paying and changing nothing** is a rational choice. The avoided migration cost pays for years of licensing. It's the option for the files where the messenger is *not* today's topic.

## Option 2: the homemade dispatch — sobriety

At the other extreme, for a simple *in-process* mediator, the pattern fits in one interface and a DI resolution:

```csharp
public interface IHandler<TCommand, TResult>
{
    Task<TResult> Handle(TCommand command, CancellationToken ct);
}

// The Carter endpoint resolves the handler — that's the whole "mediator"
app.MapPost("/orders", (CreateOrder cmd, IHandler<CreateOrder, Guid> h, CancellationToken ct)
    => h.Handle(cmd, ct));
```

Zero dependencies, zero license, zero magic — and for many projects, **that's enough**. The limit is known in advance: the day you need sophisticated behaviors, retries, messaging… you'll be reinventing a library. Sobriety is a choice, not a dogma.

## Option 3: Wolverine — the messenger that thinks bigger

The serious candidate of the moment: **[Wolverine](https://wolverinefx.net/)**, from JasperFx's "Critter Stack". Three things to know:

**1. The model is open-core**: the code is **MIT and stays that way** — JasperFx sells support and consulting, not the right to use the library. (Honesty requires: that's *today's* model; the MediatR story reminds us a model can evolve — hence the ADR.)

**2. The philosophy is different — and will remind you of something.** No `IRequestHandler` interface, no base class: a Wolverine handler is **a pure C# method**, discovered by convention and wired by compile-time code generation (fewer allocations, faster than reflection):

```csharp
// MediatR: class + interface + IRequest<T>
public class CreateOrderHandler : IRequestHandler<CreateOrder, Guid> { /* … */ }

// Wolverine: a method. That's it.
public static class CreateOrderHandler
{
    public static async Task<Guid> Handle(CreateOrder command, IDocumentSession session)
    { /* … */ }
}
```

A bare method that the framework discovers and equips on its own… [MCP server regulars]({{ site.baseurl }}/2026/07/13/first-mcp-server-dotnet/) will smile: same declarative philosophy.

**3. It outgrows the mediator role.** Where MediatR stops at in-process, Wolverine keeps going: **distributed messaging** (RabbitMQ, Azure Service Bus…), a **durable outbox** (the message leaves *if and only if* the transaction commits — the most underestimated problem in distributed systems), **sagas**, retries, scheduling. The switchboard that becomes the post office: if your trajectory leads to messaging, migrating to Wolverine isn't a replacement — it's an **anticipation**. A [migration guide from MediatR](https://wolverinefx.net/introduction/from-mediatr) exists, and temporary cohabitation is possible.

## The verdict as a table

| Your situation | The right reflex |
| --- | --- |
| Solution full of MediatR, it does the job | **Pay** — migration would cost more than the license |
| Simple need, modest project, no messaging in sight | **Homemade dispatch** (or a free source-gen mediator) |
| New project, or a trajectory toward messaging/outbox/sagas | **Wolverine** — the pattern, plus what comes next |

And in all three cases: **ADR-00XX**, context, options, decision, consequences — you know [the format]({{ site.baseurl }}/2026/07/14/adr-memory-of-architecture-decisions/).

## The real lesson: your slices don't care

Re-read the structure of a [vertical slice]({{ site.baseurl }}/2026/07/25/vibe-engineering-vertical-slice-architecture/): a thin endpoint, a message, a testable handler. That shape survives MediatR, Wolverine, the homemade dispatch — **because the pattern structures, not the package.** That's exactly why the [base prompt]({{ site.baseurl }}/2026/07/12/vibe-project-dotnet-foundations/) mandates "an endpoint delegates to a handler" rather than a library name. Well-laid foundations make tollbooths negotiable.

## In summary

- Commercial MediatR: **not a drama, a decision** — paying maintainers is a healthy model, and a legitimate option.
- Three paths: **pay** (continuity), **build your own** (in-process sobriety), **Wolverine** (MIT open-core, handlers = pure methods, plus messaging/outbox/sagas).
- The criterion: your **trajectory** — simple in-process, or durable distributed?
- And the deeper lesson: **the pattern matters more than the package** — your slices survive a messenger change; that's what foundations are.

The internal switchboard set up a tollbooth; the post office next door is open and free; and you still know how to wire two desks yourself. What matters: that the messages arrive. And that, honestly… is not rocket science.
