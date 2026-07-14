---
layout: post
title: "Testing an AI application: welcome to evals — it's not rocket science!"
date: 2026-07-20 10:00:00
author: AClerbois
ref: ai-evals
image: /images/posts/ai-evals.png
tags: [AI, LLM, testing, evals, quality]
level: 200
---

You followed [the base prompt]({{ site.baseurl }}/2026/07/12/vibe-project-dotnet-foundations/): triple A, 80% coverage, everything green. Then you add the AI feature — automatic ticket summarization — and you naively write:

```csharp
Assert.Equal("The customer reports a display bug.", summary);
```

Red. You rerun: red again, but **differently** — the model rephrased. Same input, different output, [that's its nature]({{ site.baseurl }}/2026/07/19/why-ai-hallucinates/). So how do you test a component that never answers the same way twice? Welcome to the world of **evals**. You'll see: it's not rocket science.

<!--more-->

## Changing glasses: from machine to employee

A classic unit test verifies a **machine**: same inputs → same outputs, true or false, green or red. An LLM isn't tested like a machine — it's evaluated like an **employee**: you don't ask whether its answer is *identical to the model answer*, you ask whether it's **good**.

The right mental model is the **exam**: a paper isn't "true" or "false" — it scores 14/20 against a rubric. Evals are exactly that: making your AI feature sit regular exams, with a grading rubric and a passing grade.

But before the exam room, some sorting is needed.

## Step 0: isolate the non-determinism

Not all your code needs evals — **most of it remains ordinary code**: the part that builds the prompt, calls the API, parses the response, triggers the tools, handles errors. All of that is deterministic and gets tested in triple A, as usual (mock the LLM, verify the plumbing). The [harness]({{ site.baseurl }}/2026/07/01/the-ai-harness-github-copilot/) is tested classically; only the **brain** needs an exam.

First piece of good news, then: your 80% coverage keeps all its meaning — it just stops at the model's door.

## The golden dataset: the book of past exam papers

The centerpiece of an eval system: a **set of reference cases** — say 50 to 200 representative examples, versioned in the repository like code:

```
evals/
  case-001.json  { "ticket": "The payment screen crashes since the update...",
                   "expected": { "category": "bug", "priority": "high",
                                 "must_mention": ["payment", "update"] } }
```

Where do the cases come from? From reality: typical tickets, edge cases that already caused trouble, known traps (irony, multilingual input, empty ticket…). The book **grows with every incident** — exactly like adding a regression test after a bug.

## The three levels of grading

**Level 1 — deterministic assertions (the multiple choice).** Before judging style, verify the verifiable, the old way: is the output valid JSON? Is the category in the allowed list? Does the summary mention "payment"? Does it contain no personal data? Was the right tool called? Fast, reliable, free — catch as many failures as possible at this level.

**Level 2 — the LLM judge (the grader).** For what remains subjective — faithfulness, tone, completeness — you employ… another model, armed with an **explicit rubric**: *"Score 1 to 5: is the summary faithful to the ticket, with no invented information? Justify."* That's the **LLM-as-judge** pattern, the industry standard for evaluating at scale.

**The word of honesty**, obviously: the judge is an LLM — it can be wrong, [like the others]({{ site.baseurl }}/2026/07/19/why-ai-hallucinates/). So you **calibrate** it: on a sample, a human grades too, you compare, and you adjust the rubric until judge and human agree. A grader gets trained before grading alone.

**Level 3 — production (continuous assessment).** The exam doesn't stop at deployment: user thumbs up/down, manual-rework rate, observability traces ([OpenTelemetry, already met with Agent Framework]({{ site.baseurl }}/2026/07/11/microsoft-agent-framework-build-your-ai-agent-team/)). Production failures feed the book of past papers — the loop is closed.

## The prompt is code: eval regression

The moment everything clicks: you "improve" a prompt — three words changed. Without evals, you just modified production behavior **blindly**. With evals: you replay the suite, and the verdict falls — 94% → 96%, ship it; 94% → 71%, you just avoided an incident.

Hence the natural home of evals: **in CI**, like tests. Every change to a prompt, a model or a temperature triggers the suite, with a **passing threshold** — the AI equivalent of your 80% coverage:

- A minimum pass rate (for example ≥ 90% of the golden dataset).
- Not 100%: non-determinism remains, you manage **thresholds**, not certainties.
- Critical cases (security, personal data): those, at 100%, non-negotiable.

## In summary

| Classic test | Eval |
| --- | --- |
| true / false | score / threshold |
| `Assert.Equal` | grading rubric |
| sample = 1 run | sample = a dataset |
| protects the plumbing | protects the behavior |

- **Isolate**: the plumbing around the LLM is tested in triple A as before; only the brain sits exams.
- **Golden dataset** versioned, enriched at every incident — your past papers.
- Three graders: **deterministic assertions** first, a **calibrated LLM judge** next, **production feedback** continuously.
- **A prompt is code**: every change replays the evals in CI, with thresholds — 100% reserved for critical cases.

Your AI application deserves the same rigor as your code — just with the right instruments: a rubric instead of an `Assert.Equal`, thresholds instead of green/red. Testing an employee rather than a machine, in the end… is not rocket science.
