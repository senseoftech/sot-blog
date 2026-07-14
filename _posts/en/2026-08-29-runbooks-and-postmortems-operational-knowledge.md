---
layout: post
title: "Runbooks and postmortems: the memory of sleepless nights — it's not rocket science!"
date: 2026-08-29 10:00:00
author: AClerbois
ref: runbooks-postmortems
image: /images/posts/runbooks-postmortems.png
tags: [operations, documentation, AI, best-practices]
level: 100
---

3:12 AM. The phone buzzes: *"api-http-5xx — error rate above threshold"*. You open the laptop, the API answers 503, and your brain — asleep four minutes ago — has to reconstruct from memory what your colleague did "last time". What was that command again? The code says how the system works. Nothing says what to do when it *doesn't* anymore.

Yesterday we covered [linters and analyzers]({{ site.baseurl }}/2026/08/28/linters-and-analyzers-conventions-that-enforce-themselves/) — the conventions that enforce themselves. Today, the second-to-last piece of [the artifacts map]({{ site.baseurl }}/2026/08/21/the-artifacts-of-vibe-coding-the-complete-map/): the **runbook** and the **postmortem** — operational knowledge. You'll see: it's not rocket science.

<!--more-->

## The pilot's checklist

When an engine fails mid-flight, the pilot doesn't brainstorm. He pulls out the checklist and **runs it**: step 1, step 2, step 3. Not because he's incompetent — precisely because he's competent: aviation figured out a century ago that a brain under stress is a poor improviser. You think *beforehand*, with a clear head; at 3 AM, you execute.

That's exactly what a runbook is: the checklist written by the calm you of three weeks ago, for the panicked you of tonight. And the postmortem is the post-flight debrief: why it broke, and what we change in the checklist for next time.

## The anatomy of a runbook

A runbook = one Markdown file per known failure, in the repository (`docs/runbooks/`), versioned and reviewed in PRs like everything else. Four sections, always the same:

| Section | The question it answers |
| --- | --- |
| **Symptom** | which alert, which observed behavior? |
| **Diagnosis** | which commands to run, in what order, against what thresholds? |
| **Remediation** | what action restores the service — and how long does it take? |
| **Escalation** | at what point do you wake up whom, on which channel? |

The golden rule: **real commands**, copy-pasteable. "Check the database" is not a runbook step; it's wishful thinking. A runbook step is a command, an expected output, a threshold.

## A concrete example, in full

```markdown
# Runbook — The API answers 503

## Symptom
Alert `api-http-5xx`: more than 5% of responses are 503 over 5 minutes.
Most frequent cause (3 incidents out of 4): SQL connection pool exhausted.

## Diagnosis
1. Confirm:
   curl -s -o /dev/null -w "%{http_code}" https://api.contoso.com/health
   → 503 = incident in progress, continue.
2. Look for the pool signature in the logs:
   kubectl logs deploy/api --since=10m | grep -c "max pool size was reached"
   → > 0: it's the pool. Otherwise, see runbook "API 503 — other causes".
3. Count sleeping connections on the SQL Server side:
   SELECT COUNT(*) FROM sys.dm_exec_sessions
   WHERE program_name LIKE 'api-%' AND status = 'sleeping';
   → threshold: above 80 (Max Pool Size = 100), the pool is leaking.

## Remediation
- kubectl rollout restart deploy/api
  → releases the ghost connections. Back to normal: ~2 min.
- Verify: the 503 rate must drop below 1% within 5 min.

## Escalation
- Recurrence within 30 min → data on-call (#incident-api): it's a
  connection leak in the code, not an infra incident.
- Do NOT raise Max Pool Size in the heat of the moment: it hides
  the leak (see postmortem 2026-05-14).
```

Notice the last line: the runbook knows the **tempting mistake** and explicitly forbids it, with a link to the night we learned it. That's what operational knowledge looks like.

## The postmortem: blameless or nothing

Once the service is restored and the night slept off, you write the **postmortem**: the timeline (who saw what, when), the **root cause** (not "Kevin pushed a bug" — *why* the bug got through and *why* it took production down), and the corrective **actions**. *Blameless*: you hunt for flaws in the system, not for a culprit. A postmortem that points fingers guarantees one thing — next time, people will hide information from you.

And above all, the link that closes the loop: **every postmortem creates or improves a runbook**. The SQL pool incident produced the runbook above; the `Max Pool Size` false-good-idea went in after the second incident. The pilot's checklist is written with the failures of previous flights.

## 2026: the runbook becomes executable

The novelty of the agent era: a runbook in Markdown, with real commands and explicit thresholds, is already — word for word — a procedure an agent can run. Turn it into a [skill or slash command]({{ site.baseurl }}/2026/07/02/github-copilot-skills-instructions-agents-mcp/) (`/diagnose-503`), and the doc the on-call *used to read* becomes the procedure the agent *executes*: it runs the `curl`, counts the SQL sessions, compares against the threshold, and hands you the verdict. The line between documentation and automation has never been thinner.

## Why it's worth double in the AI agent era

1. **During an incident, the agent runs the checklist without panicking — unlike you.** Give it access to `docs/runbooks/`: at 3 AM, it executes the diagnostic steps in order, without skipping step 2 because it "feels like" it's step 4, and reports back the facts. You're still the pilot; it's the copilot reading the checklist out loud.
2. **The agent drafts the postmortem.** Timeline from the logs, the alerts and the Slack thread: that's compilation work, and it excels at it. The human validates the root cause and decides the actions — the series formula, night-shift edition: **the AI proposes, the human decides, the repository remembers**.
3. **Runbook → skill: the full loop.** The incident produces a postmortem, the postmortem improves the runbook, the runbook becomes an executable procedure — with a human in the loop for anything that destroys or modifies. Every sleepless night makes the next one less likely, and shorter.

## The honesty moment

- **A runbook that's never been run is fiction.** Commands age, URLs change, thresholds drift. Test it cold — like a fire extinguisher: you check it works *before* the fire. One "game day" per quarter, where someone runs the procedure against a test environment, is enough.
- **A postmortem without action follow-up is theater.** An emotional meeting, a sincere document, zero actions shipped: the incident will come back. Every action has an **owner** and a **deadline**, tracked like any other ticket.
- **Don't let an agent execute destructive remediations alone.** Running the diagnosis: yes. Proposing the remediation: yes. A `rollout restart` approved with one click: fine. But anything that deletes, truncates or overwrites — a human presses that button. Restart yes, `DROP TABLE` no.

## In summary

- The code says how the system works; the **runbook** says what to do when it doesn't anymore; the **postmortem** says why it broke last time.
- A runbook = **symptom, diagnosis, remediation, escalation** — with real commands and real thresholds, in `docs/runbooks/`, versioned.
- The postmortem is **blameless**, with actions that are **owned and dated** — and every postmortem **improves a runbook**: the operational knowledge loop.
- With agents: the AI **runs the checklist** during the incident, **drafts** the postmortem, and the runbook becomes **executable** — with the human keeping their hand on anything destructive.

You don't think at 3 AM: you run the checklist the well-rested you wrote — the one every incident has made better. And that, honestly… is not rocket science.
