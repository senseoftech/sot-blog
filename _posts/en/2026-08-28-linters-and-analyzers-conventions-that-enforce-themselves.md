---
layout: post
title: "Linters and analyzers: conventions that enforce themselves — it's not rocket science!"
date: 2026-08-28 10:00:00
author: AClerbois
ref: automated-conventions
image: /images/posts/automated-conventions.png
tags: [dotnet, code-quality, analyzers, AI, best-practices]
level: 100
---

Pull request review, Tuesday morning. Nineteen comments, fourteen of which boil down to: "use `var` here", "unused using", "interface without the `I` prefix — we agreed on this". The new developer takes it politely, fixes, pushes again. Next week, same remarks — on code written by an AI agent this time. Nobody actually reviewed the *meaning* of the PR: the entire attention budget went into form.

Yesterday, [schemas and contracts]({{ site.baseurl }}/2026/08/27/schemas-and-contracts-machine-verifiable-context/) introduced a powerful idea: the rule the machine enforces itself. Today, same family, applied to your coding conventions: **linters and analyzers**. The best convention is the one you no longer need to explain — not to the newcomer, not to the agent. You'll see: it's not rocket science.

<!--more-->

## Guardrails

You don't brief every driver on the layout of the road. You don't stick a post-it saying "careful, left turn at mile 12" on every windshield. You install a **guardrail**: it's there, all the time, for everyone, and it catches the seasoned driver, the Sunday driver — and the self-driving car — exactly the same way.

Your coding conventions deserve the same treatment. There's a ladder, and each rung is worth ten times the previous one:

- **The oral convention** — "we agreed in that meeting that…". It dies with turnover, and the AI agent never heard it.
- **The written convention** — a wiki page, a line in [AGENTS.md]({{ site.baseurl }}/2026/08/22/agents-md-your-ai-onboarding-guide/). Better: it can be read. But nothing forces anyone to follow it.
- **The enforced convention** — a tool checks it on every build. No more explaining: the guardrail catches everyone the same, human or AI.

In [the complete map of vibe coding artifacts]({{ site.baseurl }}/2026/08/21/the-artifacts-of-vibe-coding-the-complete-map/), this is the most profitable family: the one you configure once and that works on every commit.

## The .NET arsenal

Good news for .NET devs: everything is already in the box. Five tools, five moments where the guardrail catches you:

| Tool | What it does | Where it catches you |
| --- | --- | --- |
| **`.editorconfig`** | declares the style *and* each rule's severity | in the IDE, as you type |
| **Roslyn analyzers** | `CAxxxx` rules + package analyzers (xUnit, EF Core…) | at compile time |
| **`dotnet format`** | doesn't report: **fixes** | before the commit |
| **`TreatWarningsAsErrors`** | turns the warning into a wall | at build time |
| **Pre-commit hook + CI** | the last net, non-negotiable | before the merge |

The key point: since .NET 5, Roslyn analyzers ship with the SDK, and the `.editorconfig` drives their severity. A single file, versioned at the root of the repo, reviewed in PRs like everything else.

## A concrete example, in full

A realistic `.editorconfig` excerpt — each rule is a review comment that will never exist again:

```ini
root = true

[*.cs]
# var when the type is apparent — the review debate is over
csharp_style_var_when_type_is_apparent = true:warning

# An unused using does not pass the build
dotnet_diagnostic.IDE0005.severity = error

# System.* first in usings, always
dotnet_sort_system_directives_first = true

# Interface without the I prefix = build error, not a post-it
dotnet_naming_rule.interfaces_prefixed.symbols  = interface_group
dotnet_naming_rule.interfaces_prefixed.style    = prefix_i
dotnet_naming_rule.interfaces_prefixed.severity = error
dotnet_naming_symbols.interface_group.applicable_kinds = interface
dotnet_naming_style.prefix_i.required_prefix    = I
dotnet_naming_style.prefix_i.capitalization     = pascal_case

# Nullable doesn't forgive: possible dereference = error
dotnet_diagnostic.CS8602.severity = error
dotnet_diagnostic.CS8618.severity = error
```

And the project-side lock, three lines in the `.csproj` (or better, a `Directory.Build.props` for the whole solution):

```xml
<PropertyGroup>
  <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
  <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>
  <AnalysisLevel>latest-recommended</AnalysisLevel>
</PropertyGroup>
```

From there, the math is simple: **every automated rule is one line less in your [AGENTS.md]({{ site.baseurl }}/2026/08/22/agents-md-your-ai-onboarding-guide/) and one comment less in review**. The instructions file keeps what requires judgment; the guardrail handles the rest.

## Why it's worth double in the AI agent era

Three reasons, and the first one is the most beautiful:

1. **The feedback loop corrects the agent without a single token.** The agent generates code, compiles, reads the warning-turned-error (`CS8602: possible null dereference`), and fixes itself — alone, in the same session, without you writing a word. A build error message is the most efficient prompt in the world: precise, contextual, free.
2. **The agent respects the `.editorconfig` it detects.** Modern agents read that file the way they read your code: they see your style preferences in it and adopt them from the very first generation. An enforced convention is also a *readable* convention — machine-verifiable and machine-understandable, just like yesterday's contracts.
3. **Human review is freed from form to judge substance.** When the agent produces in an hour what a dev used to write in a week, fourteen style comments become untenable. The linter absorbs all of them; the human keeps the five that talk about architecture and meaning. The series formula, pushed one notch further: **the AI proposes, the rule decides, the human only arbitrates what's worth arbitrating**.

## The honesty moment

- **The linter checks form, never meaning.** Perfectly formatted code can be perfectly wrong. Zero warnings says nothing about the business logic — that's the job of [tests]({{ site.baseurl }}/2026/08/26/tests-the-executable-spec/), reviews and specs. The guardrail keeps you from leaving the road; it doesn't tell you whether you're driving in the right direction.
- **2,000 ignored warnings = noise that drowns everyone.** A build that spits out two thousand "usual" warnings teaches humans to stop reading — and drowns the agent in useless context where the important warning becomes invisible. The only sustainable policy: **zero warnings, or nothing**. Hence `TreatWarningsAsErrors`.
- **Turning on 200 rules at once on a legacy codebase = guaranteed pain.** The build goes red for three days and the team hates the tool before ever seeing its value. Go **in waves**: a handful of rules as `error`, the rest as `suggestion`, then raise the severity wave after wave — with `dotnet format` mopping up the existing code at each step.

## In summary

- The convention ladder: **oral < written < enforced** — the best one no longer needs explaining, because a guardrail enforces it, for the human and the agent alike.
- The .NET arsenal is already in the SDK: **`.editorconfig` + Roslyn analyzers + `dotnet format` + `TreatWarningsAsErrors` + a CI that blocks**.
- Every automated rule = **one line less in AGENTS.md, one comment less in review** — the docs keep the judgment, the tool keeps the form.
- With agents: **the build-error-fix loop steers the AI without a single token**, and human review finally focuses on meaning — critical when the volume of generated code explodes.

A guardrail doesn't make small talk, doesn't get tired, doesn't let anything slide on a Friday at 5 pm. Configure it once, and your conventions enforce themselves — on the sprint-24 dev and on tonight's agent alike. And that, honestly… is not rocket science.
