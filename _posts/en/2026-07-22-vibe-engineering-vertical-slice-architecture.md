---
layout: post
title: "Vibe engineering: why your AI agents deserve a sliced architecture — it's not rocket science!"
date: 2026-07-22 10:00:00
author: AClerbois
ref: vibe-vsa
image: /images/posts/vibe-vsa.png
tags: [dotnet, AI, vibe-engineering, architecture, vertical-slice, best-practices]
---

In [the vibe engineering post]({{ site.baseurl }}/2026/07/12/vibe-project-dotnet-foundations/), my base prompt imposed an architecture — CQRS, Minimal API, Carter, one handler per use case — promising it would serve as a "mold" for the AI. Several readers asked the right question: **why that one?**

Today's answer: because it's a **Vertical Slice Architecture** — and of all the solid architectures, it's the one that best matches how an AI agent actually works. This is not a matter of taste: in vibe engineering, **the architecture choice is a tooling choice for your agents**. Let's take it apart. You'll see: it's not rocket science.

<!--more-->

## The one-sentence recap

Vibe engineering means letting the AI write the code **within an engineering frame you've set**: *the prompt expresses the decisions, the repo remembers them, the tooling enforces them.* One question remained open: among the clean architectures, **which one should you feed to your agents?** Because they are not equal — not by this criterion.

## The problem with layers: a feature scattered everywhere

Classic layered architecture (controllers, services, repositories…) organizes code **by technical trade**. The company image, once again: it's putting all the accountants on the 3rd floor, all the lawyers on the 5th, all the sales people on the 7th. Coherent from the org chart's point of view… but follow a **customer file**: it crosses every floor.

Code translation: "add a field to the order" = touching the controller, the DTO, the mapper, the service, the repository, the entity — **six files in six folders**, plus shared files that other features also use. For a human who knows the house, it's gymnastics. For an AI agent, it's three structural problems:

1. **The context explodes.** To modify one feature, the agent must load files scattered everywhere — and [everything that enters the context is paid for]({{ site.baseurl }}/2026/07/05/llm-tokens-input-output-cached/), in tokens and in attention quality.
2. **The blast radius is maximal.** `OrderService` serves twelve features? A change for the thirteenth can break the other twelve. The agent doesn't know — it doesn't see the other twelve.
3. **The mold is blurry.** "Where does the new code go?" has six answers. Six opportunities to drift.

## The vertical slice: what changes together, lives together

**Vertical Slice Architecture** flips the filing system: you no longer organize by technical layer, but **by feature**. A slice = one use case end to end — the endpoint, the validation, the handler, the data access — in **a single folder**:

```
Features/
  Orders/
    CreateOrder/
      CreateOrderEndpoint.cs     ← the Carter module
      CreateOrderCommand.cs      ← the command
      CreateOrderHandler.cs      ← the logic
      CreateOrderValidator.cs    ← the validation
      CreateOrderHandlerTests.cs ← the tests, right next to it
    GetOrderById/
      ...
```

You recognize the base prompt's mold: **CQRS provides the slice's format** (a command *or* a query + its handler), Carter and Minimal API provide the packaging. The complete customer file on one floor, with its multidisciplinary team.

The guiding principle, phrased by Jimmy Bogard (the author of MediatR — you can't make this up): **maximize cohesion within the slice, minimize coupling between slices.** What changes together, lives together.

## Why AI agents love slices

This is where the choice becomes strategic. Point by point:

**The slice fits in the context.** "Modify CreateOrder" = loading one folder of five short files. Everything is there, nothing is missing, nothing overflows — the exact definition of *good* context: the smallest that does the job. [Copilot CLI's `/context`]({{ site.baseurl }}/2026/07/19/copilot-cli-2-the-daily-routine/) stays green.

**The blast radius is bounded.** The agent works in `CreateOrder/`? The worst possible accident breaks… CreateOrder. Other slices don't share a mutualized service that propagates the damage. In vibe engineering, where you review code *after the fact* that you didn't type, **bounding what one session can break** is worth all the audits.

**The mold is photocopiable.** "Add AddOrderNote" = "copy CreateOrder's structure". And an LLM is *literally* a pattern-reproduction machine — give it three exemplary slices, and the fourth comes out conforming. It's the base prompt's mold, concrete edition: the best instruction isn't a directive, it's **an example in the repo**.

**Slices parallelize.** Three features = three slices = three disjoint folders. Three [worktrees, three agents]({{ site.baseurl }}/2026/07/21/copilot-cli-4-delegate-and-automate/) — and **zero merge conflicts**, since nobody touches the same files. Layered architecture makes that nearly impossible: everyone goes through `OrderService.cs`.

**Review becomes readable again.** One PR = one slice = a diff that reads top to bottom like a story. The grader — human or [code-review agent]({{ site.baseurl }}/2026/07/20/copilot-cli-3-the-team-in-the-terminal/) — evaluates a whole feature, not confetti scattered across six layers.

## And what about SOLID?

The "S" in SOLID — *a single reason to change* — is precisely what the slice applies **at the architectural scale**: one slice = one feature = one reason to change. Where a 2,000-line `OrderService` violates the principle by construction, the slice honors it by construction.

And the other principles live very well *inside* the slice — better, even: it's much easier for an agent (and for you) to keep an 80-line handler open for extension and clean about its dependencies than a shared god-service. **A solid architecture isn't the one that stacks abstractions; it's the one whose boundaries make the principles easy to honor.**

## The word of honesty: the real objections

- **"It duplicates code between slices."** Yes — a little, and it's **owned**. Two slices that look alike today will diverge tomorrow; coupling them prematurely to save ten lines recreates the god-service. The rule of three: tolerate two repetitions, extract at the third — into a minimal `Common/` folder, and [record that choice in an ADR]({{ site.baseurl }}/2026/07/14/adr-memory-of-architecture-decisions/).
- **"What about cross-cutting concerns?"** Authentication, logging, generic validation: they have their place — pipeline *behaviors* (MediatR or equivalent), ASP.NET middlewares. The company policy frames all slices without living in any of them.
- **"Is VSA the only right answer?"** No. A clean architecture held with discipline works too — the essence of vibe engineering is having **an explicit, repeatable mold expressed in the repo**. But mold for mold, the slice has the decisive advantage of **locality**: reduced context, bounded breakage, free parallelization. It's the architecture that thinks the way an agent works.

## The lines to add to your base prompt

Concretely, the [base prompt]({{ site.baseurl }}/2026/07/12/vibe-project-dotnet-foundations/) gains a few lines in its Architecture section:

```markdown
# Architecture
- Vertical Slice Architecture: code is organized by feature
  (Features/<Domain>/<UseCase>/), never by technical layer.
- Each slice contains endpoint, command/query, handler, validation
  and tests, colocated.
- For any new feature: take the closest existing slice as a model
  and reproduce its structure.
- Duplication between slices is tolerated up to 3 occurrences;
  beyond that, propose an extraction and record it in an ADR.
```

And the project's first ADR writes itself: *"ADR-0001: Vertical Slice Architecture — context: project developed mostly by AI agents…"*

## In summary

- In vibe engineering, architecture isn't just taste: it's **your agents' working equipment**.
- Layers scatter a feature everywhere: obese context, propagated breakage, blurry mold — three poisons for an agent.
- The **vertical slice** flips everything: the whole feature in one folder — **minimal context, bounded blast radius, photocopiable mold, free parallelization, readable review**.
- SOLID wins too: one slice = one reason to change, by construction.
- Duplication is tolerated (rule of three), cross-cutting concerns go in the pipeline, and the choice gets carved into an **ADR**.

A company where every customer file has its complete team on one floor, rather than twelve round-trips between departments: that's the architecture your agents need. And that, honestly… is not rocket science.
