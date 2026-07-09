---
layout: post
title: "From vibe coding to vibe engineering: lay the foundations — it's not rocket science!"
date: 2026-07-12 10:00:00
author: AClerbois
ref: vibe-foundations
image: /images/posts/vibe-foundations.png
tags: [dotnet, AI, vibe-coding, architecture, blazor, best-practices]
---

Starting a project from scratch with an AI is exhilarating: a few sentences, and code pours out. But it pours out **in the direction you set** — or in whatever direction the AI picks by default if you said nothing. And then, good luck straightening the building at sprint 4.

That's the whole difference between two practices people mix up: **vibe coding** — you accept what comes out without reading it, you test by feel, perfect for a throwaway prototype — and **vibe engineering** — the AI still writes the code, but within an engineering frame set from the start.

My answer to stay on the right side: a **base prompt**, the same one for every new project. A good starting architecture structures the project and makes it evolve in the right direction — exactly like foundations. Let me walk you through mine, line by line, for a .NET project — with a copy-ready version at the end of the article. You'll see: it's not rocket science.

<!--more-->

## Why a base prompt?

Remember one thing: **every decision you don't express will be made for you.** The AI will pick a framework version (not necessarily the latest), a solution layout (generic), a testing strategy (often none), an architecture (whatever tutorial it saw most).

Each of these defaults is reasonable in isolation. Their sum is a project with no backbone — one that stands up for the demo and collapses at the first serious evolution. The base prompt is the **architect's brief**: short, but every line commits the structure of the building.

Let's go through mine, and above all the **why** of each line.

## The stack: .NET 10, Blazor and Fluent UI

> *".NET 10 application, Blazor with Fluent UI. If complexity is significant, use .NET Aspire."*

Naming the stack **explicitly, versions included**, avoids the first vibe-coding trap: the AI learned from years of code, and without guidance it happily serves you patterns from three versions ago. `.NET 10` sets the frame; Blazor + [Fluent UI](https://www.fluentui-blazor.net/) gives a consistent UI without reinventing a design system.

And the important nuance: **Aspire only if complexity justifies it.** Several services, observability, orchestrated dependencies → Aspire brings a lot. A monolithic CRUD → it's useless scaffolding. Giving the AI the decision criterion, rather than an absolute order, is already architecture.

## The architecture: CQRS, Minimal API, Carter and MediatR

> *"CQRS architecture, with a Minimal API + Carter and MediatR approach."*

The heart of the foundations. **CQRS** (Command Query Responsibility Segregation) separates what **changes** state (commands) from what **reads** it (queries). For an AI, it's a golden instruction: every feature becomes a command/query pair + handler — a mold it fills without drifting.

- **Minimal API**: thin endpoints, without the controller ceremony.
- **[Carter](https://github.com/CarterCommunity/Carter)**: organizes those endpoints into clean modules — no more 400-line `Program.cs`.
- **MediatR**: each endpoint only delegates to a handler. The endpoint stays dumb, the handler stays testable.

A **word of honesty**, true to the series: MediatR moved to a **commercial license** (free only below a certain revenue threshold). The pattern matters more than the library: [Wolverine](https://wolverinefx.net/) does the same job, and a homemade dispatch through dependency injection is often enough. What matters is the instruction "an endpoint delegates to a handler" — not the package name.

The day-to-day benefit is huge: when you ask "add feature X" at sprint 12, the AI will know **exactly where to put it**. A clear mold produces regular bricks.

## The molecular breakdown: components, not monoliths

> *"Always use a molecular breakdown."*

On the UI side, I impose the [atomic design](https://bradfrost.com/blog/post/atomic-web-design/) principle: **atoms** (a button, a field), assembled into **molecules** (a search bar), assembled into **organisms** (a complete header). Without this instruction, the AI has a well-known habit: the 800-line Blazor page that does everything.

The molecular breakdown forces components that are **small, reusable, testable** — and it makes every subsequent conversation simpler: "modify the SearchBar molecule" is a surgical order; "modify the search in the big page" is an invitation to breakage.

## Tests: triple A and the 80% — but not right away

> *"Unit tests with triple A, at least 80% coverage. However, during the startup phase, don't do it immediately: first a draft the user can verify."*

Two instructions in one, and the second is my favorite.

First the standard: **triple A** (Arrange, Act, Assert) — set up, act, verify — and a floor of **80% coverage**. The AI writes tests willingly; they might as well be readable and plentiful.

Then the **sequencing**, and this is where vibe coding has its own logic: **no tests on the first draft.** Why? Because at the very beginning, risk number one isn't regression — it's building *the wrong thing*. I want a prototype **verifiable by a human** as fast as possible: I click, I validate the direction, *then* we lock it in with tests. Writing 80% coverage on a first draft you'll half throw away is pouring concrete around walls you haven't decided to keep.

It's the same reflex as in [the Copilot modes article]({{ site.baseurl }}/2026/07/04/copilot-modes-ask-edit-agent-plan/): the human feedback loop first, consolidation second.

## Modern tooling: CPM and slnx

> *"Use the latest .NET and C# standards, NuGet Central Package Management and the slnx format."*

The details that reveal a well-kept project:

- **Central Package Management**: all NuGet package versions in a single `Directory.Packages.props`. No more versions drifting between projects — one source of truth.
- **The `.slnx` format**: the new solution format, readable XML instead of the ancient diff-hostile `.sln`.
- **The latest C# standards**: primary constructors, collection expressions, modern pattern matching… Without the instruction, the AI falls back into the C# of its old readings.

None of these points changes functionality. All of them change **maintainability** — and that's precisely the stated goal in my prompt: *code as maintainable as if an expert developer had written it.* That sentence looks decorative; it actually reframes every micro-choice of the AI toward readability rather than cleverness.

## Documentation: ADRs, and understanding before building

> *"Add a docs folder with ADRs. Always understand the need properly and align on the architecture choices before starting the design plan."*

The most important instruction is the last one, and it's not about code: **understand the need, align, then plan.** Concretely, I expect the AI to ask me questions and submit its architecture choices **before** the first line of code. Vibe coding without that step is a mason pouring the slab while you're still describing the house.

And **ADRs** (Architecture Decision Records) keep the trace: one small file per structural decision — the context, the options, the choice, the consequences. In an AI-driven project it's doubly valuable: ADRs document for humans, and **re-contextualize the AI** at every session. A conversation gets forgotten; a `docs/adr/` folder gets re-read — including by next sprint's agent.

## The prompt bootstraps, the repo makes it last

A prompt, however good, has the lifespan of a conversation. Vibe engineering starts when these foundations **leave the chat and enter the repository**:

- **Carve the prompt into instruction files**: `copilot-instructions.md`, `AGENTS.md` or the equivalent for your tool. Every future session — yours, a colleague's, an agent's — inherits the foundations without being asked again. It's exactly the mechanism detailed in [the Copilot customization article]({{ site.baseurl }}/2026/07/02/github-copilot-skills-instructions-agents-mcp/).
- **Back the prose with tooling.** "Use the latest C# standards" is an instruction the AI can forget at sprint 12. An `.editorconfig`, Roslyn analyzers, `TreatWarningsAsErrors` and a coverage threshold in CI never forget: the build fails, the agent fixes.

The formula to remember: **the prompt expresses the decisions, the repo remembers them, the tooling enforces them.**

## The revisited prompt, ready to copy

Here is my base prompt, rephrased and structured. Take it as a **template**: swap the stack for yours — what matters is that every structural decision is *expressed*.

```markdown
# Mission
You are starting a .NET 10 application from scratch.
Goal: code as maintainable as if written by an expert developer.

# Before coding
- Start by understanding the need: ask me your questions.
- Propose the architecture choices and wait for my alignment.
- Then write a design plan; we implement only after that.

# Tech stack
- .NET 10, latest C# version — use the most recent language standards.
- Front end: Blazor with Fluent UI.
- If complexity justifies it (several services, observability, orchestration):
  .NET Aspire. Otherwise, keep it simple.

# Architecture
- CQRS: separate commands (writes) from queries (reads).
- Minimal API endpoints, organized into modules with Carter, dispatched via MediatR.
- UI with a molecular breakdown: atoms → molecules → organisms.
  Every component: small, reusable, testable.

# Quality & tooling
- Solution in .slnx format.
- NuGet Central Package Management (Directory.Packages.props).
- Set up an .editorconfig and Roslyn analyzers; treat warnings as errors.
- Explicit naming, short methods, no cleverness at the expense of readability.
- Carry these conventions into a repository instruction file
  (copilot-instructions.md / AGENTS.md) for future sessions.

# Tests
- Unit tests in Arrange-Act-Assert, target: at least 80% coverage.
- EXCEPTION — startup phase: do not start with the tests.
  First deliver a working draft I can verify;
  we consolidate coverage immediately after my validation.

# Documentation
- docs/ folder with ADRs (Architecture Decision Records):
  one structural decision = one ADR (context, options, choice, consequences).
```

## In summary

- In vibe coding, **every unexpressed decision is made by the AI** — and rarely the way you would have made it.
- A **base prompt** sets the foundations: explicit stack (versions included), architecture as a mold (CQRS + Carter + MediatR), molecular UI breakdown.
- Tests: **triple A and 80%**, but *after* the first verifiable draft — validate the direction before pouring concrete.
- **Understand, align, plan** before coding — and record every choice in **ADRs** that will re-contextualize the AI in future sessions.
- The prompt starts the session; **repository instruction files and tooling** (analyzers, CI) make it last. That's the shift from vibe coding to **vibe engineering**.

A good base prompt fits on one page, but it's what decides whether your Sunday-evening project becomes software that evolves — or a prototype you rewrite. Foundations before walls, a plan before the slab. And that, honestly… is not rocket science.
