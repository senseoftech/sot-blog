---
layout: post
title: "GitHub Copilot: Skills, Instructions, Agents, MCP… it's not rocket science!"
date: 2026-07-02 10:00:00
author: AClerbois
ref: copilot-personnalisation
image: /images/posts/copilot-customization.png
tags: [github, copilot, AI, MCP, skills]
---

GitHub Copilot is no longer the little assistant that finished your lines of code. It has become a real agent, able to read your project, run commands, call external tools and follow your rules. The catch? You can now customize it in **five different ways** — Instructions, Prompts, Skills, Agents, MCP — and everyone gets lost.

So let's take the machine apart, piece by piece. And for each one, we'll answer the awkward question: **when does it get loaded, and what actually enters the model's context?** Because that's the real secret. And you'll see: it's not rocket science.

<!--more-->

## The through-line: picture a brilliant new assistant

To understand all five mechanisms, one image is enough: **Copilot is a brilliant but amnesiac new hire.**

It codes very well, it learns fast… but every morning it has forgotten everything: your conventions, your tools, the way you like to work. Your job is to equip it so that it's productive **without you having to re-explain everything every single time**.

Each customization feature answers a moment in that onboarding:

- the **welcome handbook** (Custom Instructions, and its universal cousin `AGENTS.md`),
- the **ready-made memos** (Prompts),
- the **know-how sheets** filed in a binder (Skills),
- the **specialist hats** (Agents),
- and the **access badges** to your in-house tools (MCP).

And for each one, we'll add a little ⚙️ box that says **when it's loaded** and **what the model actually sees**. Let's take them in order.

## Before we take it apart: frontmatter, the label on the sheet

One last tool before we open the hood, because it shows up in almost every example that follows: **frontmatter**.

**The analogy:** it's the **label stuck on the sheet**. It's not part of the procedure itself — it says *who* the sheet is for, *when* to pull it out and *how* to file it. You can sort the whole binder just by reading the labels, without ever opening the sheets.

**Concretely:** it's a small **YAML** block at the very top of a Markdown file, delimited by two `---` lines:

```markdown
---
name: azure-deploy
description: Deploy the app to Azure App Service.
---

The normal Markdown content starts here…
```

Everything between the two `---` lines is **metadata**, as key-value pairs. Everything after is the actual content.

And that distinction is not cosmetic — it maps exactly onto our favorite question of "who sees what":

- the **frontmatter** is read by the **harness** (VS Code, Copilot CLI…) *before* any call to the model: it's what decides whether the file applies, when to load it and with which settings;
- the **body** is the text meant for the **model**, loaded at the moment the mechanism dictates.

Each mechanism uses its own keys, and you'll recognize them throughout the article:

| Key | Seen in… | It's used to… |
| --- | --- | --- |
| `applyTo` | `*.instructions.md` | Restrict the rules to files matching the glob pattern |
| `mode` | `*.prompt.md` | Pick the prompt's execution mode (e.g. `agent`) |
| `name` / `description` | `SKILL.md`, `*.agent.md` | Identify the sheet — the **always-visible** part of a skill |
| `tools` | `*.agent.md` | Restrict the tools exposed to the agent |
| `model` | `*.agent.md` | Force which model to use |

Two special cases worth noting: `AGENTS.md` has **no frontmatter at all** (that's precisely its promise — plain Markdown understood by every agent), and in a `SKILL.md` the frontmatter plays a starring role: `name` and `description` are **the only thing loaded permanently** — the label the model reads to decide whether to open the sheet.

There's your reading key. Now, let's take it apart.

## 1. Custom Instructions — the welcome handbook

**The analogy:** it's the house rules pinned to the wall. Your assistant reads them *on every task*, without being asked. "Here, we write C#, we test with xUnit, and we answer in English."

**Concretely:** a Markdown file at the root of the repository that gives Copilot the project's permanent context — the stack, the conventions, the preferences.

The main file lives in `.github/copilot-instructions.md`:

```markdown
# Project context

- ASP.NET Core API in C# (.NET 9).
- Use immutable `record` types for DTOs.
- Write tests with xUnit and FluentAssertions.
- In your explanations, answer in English.
```

Need rules **targeted** at certain files? Add `*.instructions.md` files under `.github/instructions/`, with an `applyTo` header that uses a glob pattern:

```markdown
---
applyTo: "**/*.test.ts"
---
- Use Vitest and Testing Library.
- One `describe` block per component.
```

If the file matches, those rules are added on top of the project-wide ones.

> ⚙️ **Loaded when:** on **every** request, automatically. The root file always applies; a `*.instructions.md` is only added when its `applyTo` pattern matches the files in play.
>
> **What enters the context:** the **full text** of the file, injected at the top of the context like a system instruction. It's there on *every* call — which is why you keep it short and sharp.

**When to use it:** **always, and first.** It's the foundation. The moment you catch yourself repeating "in C#, with records, in English…" in every conversation, it's time to write it down here once and for all.

### The universal cousin: `AGENTS.md`

`.github/copilot-instructions.md` is Copilot-specific. But if you juggle several agents (Copilot, but also Cursor, Codex, Jules…), there's a **standard, tool-agnostic** file: `AGENTS.md`, at the root of the repository.

It's a plain Markdown file — a "README for agents" — where you put what would clutter the human README: build commands, how to run the tests, house conventions, gotchas to avoid. No frontmatter, no special syntax: just Markdown.

```markdown
# AGENTS.md

## Build & tests
- Install: `dotnet restore`
- Run tests: `dotnet test`
- Never commit to `main` directly.

## Conventions
- C# / .NET 9, DTOs as immutable `record` types.
```

Two things to remember:

- **It's an open standard**, stewarded by the Agentic AI Foundation (under the Linux Foundation) and adopted by OpenAI Codex, Cursor, Jules (Google), Amp, Factory… and read by the GitHub Copilot coding agent.
- **Nearest wins.** You can drop an `AGENTS.md` at the root *and* `AGENTS.md` files in subfolders: the agent reads the nearest one to the files it's working on. Every subproject can have its own instructions.

> ⚙️ **Loaded when:** automatically, just like Custom Instructions. The root one always applies; a subfolder `AGENTS.md` takes over when the agent works in that folder.
>
> **What enters the context:** the text of the nearest `AGENTS.md`, injected as an instruction. Bonus: the Copilot coding agent also reads `.github/copilot-instructions.md`, `*.instructions.md`, as well as `CLAUDE.md` and `GEMINI.md` — you don't have to duplicate everything.

**Instructions or `AGENTS.md`?** Same idea (the "welcome handbook"), two scopes: `copilot-instructions.md` if you're 100% Copilot, `AGENTS.md` if you want **a single file understood by every agent**.

## 2. Prompts — the ready-made memos

**The analogy:** the sticky note "here's how you prepare a release sheet" stuck on the desk. A shortcut for a task you keep asking for, word for word.

**Concretely:** a *prompt file*, a `.prompt.md` file filed under `.github/prompts/`, that you trigger like a slash command.

```markdown
---
mode: agent
---
Prepare the Pull Request description from the current diff:
a one-sentence summary, the list of changes, and any risks.
```

Saved as `pr.prompt.md`, it's invoked by simply typing `/pr` in chat. No more re-typing the same paragraph of instructions.

> ⚙️ **Loaded when:** only when **you** type `/my-prompt`. Never on its own.
>
> **What enters the context:** the prompt body is inserted at that moment as (part of) your message, along with the files it references. The rest of the time, it takes up **no** space in the context.

**A word of honesty:** you may have heard that prompt files are **"less necessary" today**. That's true — and it's fair. **Agents** (which already carry a role and instructions) and **Skills** (which trigger on their own) cover a good chunk of the need. Still, the prompt file remains the **simplest and fastest** option to turn a recurring paragraph into a one-word command. A knife that still cuts very well, even though food processors now exist.

**When to use it:** for a **simple, personal** shortcut, with no script or special tool. If your need grows into a real multi-step know-how, move up to Skills.

## 3. Skills — the know-how sheets in the binder

**The analogy:** a binder of procedure sheets. Your assistant doesn't read them all the time — it just reads the **title**, and when a task matches, it pulls out the right sheet and follows the procedure (which can even contain scripts and examples).

**Concretely:** an *Agent Skill* is a **folder** containing a `SKILL.md` file (plus, optionally, scripts, templates or examples).

```
.github/skills/
└── azure-deploy/
    ├── SKILL.md
    ├── deploy.sh
    └── examples/
```

The `SKILL.md` starts with a header describing *when* to use it:

```markdown
---
name: azure-deploy
description: Deploy the app to Azure App Service and check the health endpoint.
---

1. Build the image with `docker build ...`
2. Push to the registry with `az acr ...`
3. Deploy with `az webapp up ...`
4. Check `https://.../health` before confirming.
```

> ⚙️ **Loaded when:** through **progressive disclosure**, decided by the model. At first it only "sees" the `name` and the `description`. It loads the body of the `SKILL.md` only if the task matches (or if you invoke it), and opens the scripts only if it needs them.
>
> **What enters the context:** at rest, **just a one-line description** per skill. Then, on demand, the body of the sheet, then the resources. That's exactly why you can have dozens of them without saturating the context.

Another upside: Skills follow an **open standard**. The same sheet works in Copilot inside VS Code, in Copilot CLI and in the cloud agent — and even with other compatible agents.

**When to use it:** for a **reusable, multi-step know-how**, especially if it bundles scripts or resources. "How we deploy", "how we write an in-house integration test": those are skills.

## 4. Agents — the specialist hats

**The analogy:** instead of a generalist assistant, you summon **the right specialist**: the nitpicky reviewer, the architect, the docs writer. Each one has its own character, its allowed tools and its way of working.

**Concretely:** a *custom agent* is a `*.agent.md` file (under `.github/agents/`) that defines a **persona**: its role, its instructions, the tools it's allowed to use, and even the **model** to run.

```markdown
---
name: reviewer
description: Senior code reviewer, demanding about security and tests.
tools: ['search', 'edit']
model: claude-sonnet-5
---
You are a senior reviewer. Focus on:
bugs, security flaws, edge cases and missing tests.
Be direct, propose concrete fixes, don't reword code that's already fine.
```

You then switch to that agent in one click, instead of re-explaining its role in every conversation. It's also the principle behind the **coding agent**, which you can outright assign a GitHub issue to: it works autonomously and opens a Pull Request.

> ⚙️ **Loaded when:** when you **activate** the agent (selecting it in the UI, an `@mention`, or assigning it an issue for the coding agent).
>
> **What enters the context:** its instructions become the active **system prompt**; its `tools` list **restricts** which tools the harness exposes; its `model` picks the model. An agent doesn't just add text: it **reconfigures the session**.

**When to use it:** when you want a **specialized, recurring role**, with its own tools and guardrails. If you juggle between "dev hat" and "review hat", make two agents.

## 5. MCP — the access badges to the outside world

**The analogy:** so far, your assistant only knows your code. MCP is the **badges and sockets** that plug it into the rest of your ecosystem: the database, Jira, your monitoring, a browser, your CRM…

**Concretely:** the *Model Context Protocol* is an **open standard** for connecting an AI agent to external tools and data. You declare MCP servers in an `mcp.json` file (in `.vscode/mcp.json` for a project):

```json
{
  "servers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp"
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@microsoft/mcp-server-playwright"]
    }
  }
}
```

Once plugged in, Copilot can read your GitHub issues, drive a browser, query a database… depending on the tools the server exposes.

> ⚙️ **Loaded when:** as soon as a server is **enabled**, the harness loads the **descriptions of the tools** it exposes (name, role, input schema) — even if you never call them. The **results**, on the other hand, only arrive when a tool is actually called.
>
> **What enters the context:** the **tool definitions** (permanently, as long as the server is active) then the **call results** (on demand). A very concrete consequence: too many MCP servers means a context cluttered by schemas alone. Hence the value of **disabling the ones you don't use**.

**Mind the access badge:** an MCP server is third-party code you're handing the keys to. VS Code asks you to **confirm your trust** before starting it, and lets you sandbox local servers (restricted file/network access). Only plug in what you know — I already wrote about this in my article on [securing MCP servers]({{ site.baseurl }}/2025/02/24/Securing-MCP-Servers-Automated-Whitelist-Scanner/).

**When to use it:** whenever Copilot needs **data or actions that live outside your code**. For anything that's purely "project knowledge and conventions", Instructions and Skills are enough.

## The recap table: when to use what — and when it's loaded?

| Element | It's for… | Where it lives | Loaded into the context | When to use it |
| --- | --- | --- | --- | --- |
| **Custom Instructions** | Permanent project context and conventions | `.github/copilot-instructions.md`, `*.instructions.md` | **Always** — full text, on every request | As soon as you repeat the same rules |
| **`AGENTS.md`** | The same guidance, but for **every** agent | `AGENTS.md` (root + subfolders) | **Always** — the nearest file wins | You use several agents, not just Copilot |
| **Prompts** | Replaying a recurring prompt as a `/command` | `*.prompt.md` in `.github/prompts/` | **On manual invocation** only | A simple, personal shortcut, no script |
| **Skills** | A multi-step know-how (+ scripts) | `SKILL.md` folder in `.github/skills/` | **On demand** — name + description, then the rest | A reusable procedure ("how we deploy") |
| **Agents** | A dedicated role, with its own tools and model | `*.agent.md` in `.github/agents/` | **On activation** — becomes the system prompt | A recurring profile (reviewer, architect…) |
| **MCP** | Plugging Copilot into external tools/data | `mcp.json` (e.g. `.vscode/mcp.json`) | **Schemas** on enable, **results** on call | Need to act outside the code (DB, Jira, browser…) |

## 🎁 The starter tip: have the assistant write its own welcome handbook

Sold on `AGENTS.md`, but stuck on the blank page? Good news: there's a **skill whose only job is to generate your `AGENTS.md`**. Yes, you read that right — you use a know-how sheet (mechanism #3) to produce the welcome handbook (mechanism #1). It's a bit of inception, and above all it's **self-teaching**: the assistant explores your repository and writes, by itself, the document that will serve as its memory in every session.

The skill is called [`create-agentsmd`](https://www.skills.sh/github/awesome-copilot/create-agentsmd) and comes from GitHub's official [awesome-copilot](https://github.com/github/awesome-copilot) repository. One command is all it takes:

```bash
npx skills add https://github.com/github/awesome-copilot --skill create-agentsmd
```

Then simply ask Copilot to "create the AGENTS.md for the project": the skill kicks in, analyzes your repository (stack, build commands, how to run the tests, conventions, structure — monorepos included) and produces an `AGENTS.md` that follows the open standard, ready to be reviewed and committed.

And that's where the loop closes: on the next start, your amnesiac hire **reads the handbook it wrote itself the day before**. Review it, fix what's missing, commit it — and you've just taken the first concrete step to help your agent keep its context from one session to the next.

## The simple rule to remember

If you only take away one thing: **start with Instructions, add the rest only when a need keeps coming back.**

- Repeating **rules**? → Instructions (or `AGENTS.md` if several agents).
- Repeating a **prompt**? → Prompt file.
- Repeating a **procedure**? → Skill.
- Repeating a **role**? → Agent.
- Repeating a **connection** to an external tool? → MCP.

And if you take away *two* things, add the **context** reflex: whatever is "always loaded" (Instructions, `AGENTS.md`, MCP schemas) must stay lightweight, because you pay for it on *every* request; whatever is "on demand" (Prompts, Skills, tool results) can be richer, because it only costs you when it's actually used.

See the logic? Every time you hear yourself say "I already explained this last week…", that's the signal that one of these mechanisms is waiting to be used.

And that, when you get down to it… is not rocket science.
