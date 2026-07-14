---
layout: post
title: "The runbook: the manual your agent is waiting for — it's not rocket science!"
date: 2026-08-05 10:00:00
author: AClerbois
ref: runbook
image: /images/posts/runbook.png
tags: [documentation, runbook, operations, AI, best-practices]
level: 200
---

"It should work." If that sentence from an AI agent makes your skin crawl as much as mine, ask yourself the uncomfortable question: did the agent have **the means to verify**? Did it know how to launch the application, with which environment variables, which command runs the integration tests, where to look at the logs? If the answer lives only in your head, the agent could do nothing *but* assume.

[Yesterday we learned to observe our agents]({{ site.baseurl }}/2026/08/04/observing-your-agents-opentelemetry/) — traces say *what* happened. Today, the document that says *what to do*: the **runbook**, the project's operational manual. An inheritance from the SRE world that, in the agent era, becomes a centerpiece of the repository that talks. You'll see: it's not rocket science.

<!--more-->

## Operational knowledge: the most tribal of all

Every team has its folklore: "to run locally, start docker-compose first *then* apply the migrations, or it crashes", "the integration tests require the `TESTCONTAINERS_HOST` variable", "if the API returns cascading 502s, it's almost always the Redis pool — restart the worker first". This knowledge is written nowhere: it's passed over shoulders, lost with every departure, and rediscovered at 3 am during an incident.

The runbook captures that folklore in the repository: `docs/runbook.md` (or a `docs/runbooks/` folder as it grows), versioned, reviewed in PRs — the same reflex as for [ADRs]({{ site.baseurl }}/2026/07/14/adr-memory-of-architecture-decisions/), applied to operations.

## What goes in: four sections

| Section | The question it answers |
| --- | --- |
| **Start** | how to run locally, in what order, with what prerequisites? |
| **Verify** | how to know it works — test commands, health check URLs? |
| **Diagnose** | where are the logs, dashboards, traces? Which symptoms → which causes? |
| **Repair** | the known procedures: clean restart, rollback, cache purge, feature flag to kill |

One excerpt is worth a thousand descriptions:

```markdown
## Symptom: cascading 502s on /api/orders

1. Check the Redis pool: `docker exec redis redis-cli INFO clients`
   → if `connected_clients` > 95, it's the known leak (see ADR-0021).
2. Restart THE WORKER first (never the API first — it would
   refill the pool immediately): `docker restart worker`
3. Confirm: `curl -s localhost:8080/health` must answer `Healthy`
   in < 2 s. Otherwise escalate — do NOT restart Redis (active
   sessions would be lost).
```

Notice the three markers of a good runbook: **copy-pasteable commands** (not "check Redis", but *the* command), **concrete thresholds** (> 95, < 2 s), and the **forbidden moves with their reason** ("don't restart Redis, sessions lost"). The Chesterton's fences of operations.

## Why it's worth double in the AI-agent era

1. **It's what turns "it should work" into "it works".** An agent that has the runbook can loop: code → run → **verify with the runbook's commands** → fix. Without it, the loop stops at "code" — and you inherit the verification. The runbook is the missing link of autonomy.
2. **It's the perfect brief for diagnosis.** "The API is returning 502s, read `docs/runbook.md` and diagnose": the agent follows the procedure like a disciplined on-call operator, pastes command outputs, and stops at the forbidden moves. Your incident procedures become executable in natural language.
3. **The AI drafts it from your incidents.** Last night's post-mortem is in the chat, the Teams channel or [the OTel traces]({{ site.baseurl }}/2026/08/04/observing-your-agents-opentelemetry/)? "Write the runbook entry for this incident" — the human validates the thresholds and the forbidden moves, the repository remembers. Every incident pays its debt in documentation.

And the link to tooling: the "Start" and "Verify" sections are exactly what you carve into agent configuration files (`copilot-setup-steps.yml`, build scripts). The runbook is the **prose version** — the one that explains order and traps; the tooling is the executable version. Each validates the other.

## Start small: the afternoon test

Don't write the exhaustive runbook — write the three pages that get used:

1. **Local startup**: shadow a newcomer (or ask an agent to try from scratch) and note every snag. Every snag is a runbook line.
2. **The last incident**: its diagnostic procedure, while it's fresh.
3. **The scary procedure**: the one only "the person who knows" dares to run — rollback, manual migration, purge. It's the most urgent to write down.

## The honest word

- **A stale runbook is dangerous** — more than a stale glossary: it gets executed during an incident, under stress. The guardrail: date every procedure ("verified 2026-08-05") and replay the critical ones calmly, ideally by asking an agent to walk through them in a test environment. A runbook nobody replays is an urban legend.
- **Never secrets inside.** The runbook says *where* to find credentials ("vault, path `apps/orders`"), never their value. It will be read by humans, by agents, and one day by [an attacker via an injection]({{ site.baseurl }}/2026/07/10/securing-github-copilot/) — write it knowing that.
- **It doesn't replace automation.** A procedure executed three times deserves a script; the runbook then documents *when* to run the script and how to check it succeeded. Prose recedes as tooling advances — that's the goal.

## In summary

- Operational knowledge — start, verify, diagnose, repair — is the most **tribal** of all; the runbook captures it in the repository, versioned and reviewed like everything else.
- A good runbook has **copy-pasteable commands, concrete thresholds and motivated forbidden moves** — not generalities.
- For an agent, it's the missing link of autonomy: it turns "it should work" into a **verified loop**, and your incident procedures into executable diagnostics.
- Start with **three pages**: local startup, the last incident, the scary procedure. And have the AI draft the next ones after each incident — the human validates, the repository remembers.

Next time an agent tells you "it should work", you'll know what to answer: "the runbook is in docs/ — verify." And that, honestly… it's not rocket science.
