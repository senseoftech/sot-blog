---
layout: post
title: "The postmortem: the memory of incidents — it's not rocket science!"
date: 2026-08-29 10:00:00
author: AClerbois
ref: postmortems
image: /images/posts/postmortems.png
tags: [operations, documentation, postmortem, AI, best-practices]
level: 100
---

March 14, 3 a.m.: the SQL connection pool runs dry, the API goes down, two hours of incident. September 22, 3 a.m.: the SQL connection pool runs dry, the API goes down, two hours of incident. Six months apart — and only one difference: it's not the same person on call. The first one understood everything, fixed everything… and kept all of it in their head. The organization learned nothing.

Yesterday we covered [linters and analyzers]({{ site.baseurl }}/2026/08/28/linters-and-analyzers-conventions-that-enforce-themselves/); and [the runbook already had its own episode]({{ site.baseurl }}/2026/08/05/the-runbook-the-manual-your-agent-is-waiting-for/) — the checklist you walk through during the outage. Today, the second-to-last piece of [the artifact map]({{ site.baseurl }}/2026/08/21/the-artifacts-of-vibe-coding-the-complete-map/): the **postmortem**, the document written *afterwards* — so the same outage never costs you twice. You'll see: it's not rocket science.

<!--more-->

## The post-flight debriefing

Aviation, again. The runbook was the checklist you run through mid-flight when an engine quits. The postmortem is the **debriefing** on the ground: black box analyzed, timeline reconstructed, and one question that is never "who made the mistake?" but always "**what allowed the mistake to get this far?**". That discipline is what made the airplane safer than the staircase — not perfect pilots.

A production incident is expensive: sleep, customers, trust. The postmortem is the only way to recover something from it: the outage becomes an asset — **if** you write it down, and **if** you do something with it.

## The anatomy: five sections, one page

A postmortem = one Markdown file per incident, in the repository (`docs/postmortems/2026-03-14-sql-pool.md`), versioned like everything else:

| Section | The question it answers |
| --- | --- |
| **Impact** | who was affected, for how long, at what cost? |
| **Timeline** | who saw what, when — from first alert to back-to-normal? |
| **Root cause** | *why*, digging deep — not the symptom, the mechanism? |
| **What went well** | which defenses held? (everyone forgets this one) |
| **Actions** | what to change, **who** owns it, by **when**? |

The queen section is the root cause, and its simplest technique is still the **five whys**: the API went down — why? The SQL pool was exhausted — why? A query wasn't releasing its connection — why? A forgotten `using` in a handler — why? The review didn't catch it and no analyzer checks for it — *ah.* There's the real cause: not the `using`, the **hole in the net**. The code fix takes ten minutes; the postmortem's action is the analyzer that makes the mistake impossible ([conventions that enforce themselves]({{ site.baseurl }}/2026/08/28/linters-and-analyzers-conventions-that-enforce-themselves/), yesterday's episode).

## Blameless, or nothing

The non-negotiable rule: **you look for flaws in the system, not for a culprit.** "Kevin pushed a bug" is not a root cause — *everyone* pushes bugs; the question is why this one made it through review, tests, and deployment without tripping a single alarm.

This isn't decorative kindness, it's mechanical: a postmortem that points at someone guarantees that during the next incident, people will **hide information from you**. The timeline will get vague, the "I saw something weird at 2:40" will disappear — and your memory of incidents will become polite fiction. The honesty of postmortems is paid for in psychological safety, and it's lost in a single courtroom session.

## The loop: every postmortem feeds another artifact

A postmortem that ends up in a folder is a report. A useful postmortem **changes the repository** — that's the test:

- The incident was diagnosable? → it creates or improves a **[runbook]({{ site.baseurl }}/2026/08/05/the-runbook-the-manual-your-agent-is-waiting-for/)** (the tempting bad idea tried at 3 a.m. goes in as an explicit prohibition).
- The root cause is an uncovered behavior? → it creates a **[regression test]({{ site.baseurl }}/2026/08/26/tests-the-executable-spec/)** that replays the incident on every build.
- The outage exposes an architecture choice to revisit? → it triggers an **[ADR]({{ site.baseurl }}/2026/07/14/adr-memory-of-architecture-decisions/)** — and the postmortem is the best "Context" section it will ever have.

It's the pattern of the whole series: the incident is ephemeral, the artifact remains.

## Why it's worth double in the AI agent era

1. **The agent writes the draft — and it's good at it.** The timeline is scattered across logs, alerts, the Slack thread, and the deployment history: tedious compilation work where the agent excels. It proposes the timeline and a cause hypothesis; the human validates the root cause and decides the actions. **The AI proposes, the human decides, the repo remembers.**
2. **A debugging agent reads your old postmortems.** `docs/postmortems/` is golden context for a debugging session: the agent that finds "March 14 incident: SQL pool exhausted, cause: connections not released" checks that lead *first*. Without it, it starts from scratch — like your on-call engineer on September 22.
3. **The agent sees the patterns fatigue hides.** "Read all the postmortems and list the recurring causes": three incidents in one year on the same connection pool is no longer an outage, it's a structural problem that deserves its ADR. Cross-incident synthesis is exactly what an on-call human never has time to do.

## The honesty moment

- **A postmortem without action follow-up is theater.** An emotional meeting, a sincere document, zero actions delivered: the incident will come back. Every action has a **named owner** and a **deadline**, tracked like any ticket — and you reopen the postmortem next sprint to check.
- **Blameless dies in one session.** It takes a single manager asking "but concretely, who was it?" for the next six postmortems to be written in corporate fog. The culture is protected actively, by the example of whoever runs the review.
- **Don't write one for everything.** The full postmortem has to be earned: customer-facing incident, data loss, recurrence. For the rest, three lines in the team journal are enough — a hundred bureaucratic postmortems kill the ten that matter.

## In summary

- The outage that costs you twice is the one **nobody wrote down**: the postmortem turns the incident into an asset — impact, timeline, **root cause** (five whys), actions **owned and dated**.
- **Blameless, or nothing**: you fix the system, not the people — that's the condition for the truth to keep reaching the document.
- A useful postmortem **changes the repository**: an improved runbook, a regression test, an ADR — otherwise it's a report that sleeps.
- With agents: the AI **compiles the timeline**, **re-reads your old incidents** while debugging, and **spots recurring patterns** — the human keeps the root cause and the decisions.

Next time production goes down at 3 a.m., the real question won't be "who fixes it?" but "what do we keep from it?". Tomorrow, last stop on the map: llms.txt, documentation written for machines. And that, honestly… it's not rocket science.
