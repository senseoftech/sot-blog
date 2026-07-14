---
layout: post
title: "Tool calling: how an LLM really calls your functions — it's not rocket science!"
date: 2026-07-29 10:00:00
author: AClerbois
ref: tool-calling
image: /images/posts/tool-calling.png
tags: [AI, LLM, tool-calling, function-calling, MCP]
---

This whole blog rests on one little phrase repeated everywhere: *"the agent calls a tool"*. Copilot runs your tests, [your MCP server]({{ site.baseurl }}/2026/07/13/first-mcp-server-dotnet/) answers the model, [Agent Framework]({{ site.baseurl }}/2026/07/11/microsoft-agent-framework-build-your-ai-agent-team/) executes your function tools… But concretely, **how** does a model that can only produce text "call" a C# function?

Short answer, and it's today's revelation: **it doesn't.** It asks politely. Let's take the mechanism apart — the missing link of the whole series. You'll see: it's not rocket science.

<!--more-->

## The revelation: the model executes nothing

An LLM produces tokens, [nothing else]({{ site.baseurl }}/2026/07/05/llm-tokens-input-output-cached/). When we say it "calls GetStock", here's what actually happens:

1. The model **writes a special, structured message**: *"I would like to call `GetStock` with `{"reference": "SKU-1234"}`"*.
2. **Your code** (the harness, the SDK, Copilot…) reads that message, executes the real function, and collects the result.
3. The result is **sent back to the model as a new message**, and the conversation continues.

The series' employee never had the workshop keys: he fills in **purchase orders**, and the harness delivers. The entire security of the system lives in that separation — it's *your* code that executes, so it's your code that can [ask for approval]({{ site.baseurl }}/2026/07/11/microsoft-agent-framework-build-your-ai-agent-team/), refuse, or validate.

## The contract: a JSON Schema (you're already writing it)

How does the model know which tools exist and how to fill them in? With every request, it receives **the catalog**: for each tool, a name, a description, and a **JSON Schema** describing the parameters. You already write these without knowing it:

```csharp
[McpServerTool, Description("Returns the stock level of a product from its reference.")]
public static int GetStock(
    [Description("The product reference, for example SKU-1234.")] string reference)
```

…becomes, on the wire:

```json
{
  "name": "GetStock",
  "description": "Returns the stock level of a product from its reference.",
  "parameters": {
    "type": "object",
    "properties": { "reference": { "type": "string", "description": "The product reference…" } },
    "required": ["reference"]
  }
}
```

Hence two truths we've already met, which now make full sense: the **`[Description]`s are the shop window** (it's *literally* what the model reads to choose), and **the catalog is paid in tokens on every turn** — forty verbose tools is thousands of tokens before your question even starts. MCP, function tools, Copilot: they all speak this same language under the hood.

## The full loop

A question like "what's the stock for SKU-1234, and order 50 if we're under the threshold" unrolls the mechanism in a loop:

> model → *call GetStock(SKU-1234)* → harness executes → *result: 12* → model → *call GetThreshold(SKU-1234)* → harness executes → *result: 20* → model → *call CreateOrder(SKU-1234, 50)* → **human approval** → execution → model → final written answer.

Every arrow is a message round-trip. It's [the harness]({{ site.baseurl }}/2026/07/01/the-ai-harness-github-copilot/), under the microscope — and that's why an agent "thinks" in steps: it can do nothing but read results and write what comes next.

## Why it goes wrong (and the remedies)

**Hallucinated parameters.** The model writes its purchase orders [the way it writes everything: plausibly]({{ site.baseurl }}/2026/07/16/why-ai-hallucinates/). An invented reference, an approximate enum (`"Urgent"` instead of `"High"`), a date in the wrong format. Remedies: **strict types** in the schema (enums, formats, bounds — the SDK generates them from your typed C# signatures), and a tool that **revalidates everything** at execution ([rule already set]({{ site.baseurl }}/2026/07/26/mcp-server-in-production/)).

**The obese catalog.** Forty tools, and the model chooses badly — [Agent Framework's docs say it bluntly]({{ site.baseurl }}/2026/07/11/microsoft-agent-framework-build-your-ai-agent-team/): tool selection degrades as the count grows. Remedies: fewer, better-described tools, and [specialized subagents]({{ site.baseurl }}/2026/07/25/copilot-subagents-splitting-the-work/) that each carry only their own kit.

**The mute error.** The tool fails with `Exception of type 'System.Exception' was thrown` — and the model, which *reads* results, can do nothing with it. Return **errors written for a reader**: *"unknown reference; valid references look like SKU-1234"* — and the model corrects itself on the next turn. A useful error is a steering instrument.

## "Answer in JSON" vs structured outputs: the prayer and the contract

Last floor, often confused with tool calling: getting **structured output** from the model (for your screens, imports, pipelines).

- **The prayer**: writing "answer only in JSON" in the prompt. It works… often. And one day, a wrapping ` ```json `, a trailing comma, a renamed field — and your parser breaks.
- **The contract**: **structured outputs**. You provide the schema, and the provider **constrains generation itself**: at each token, only tokens compatible with the schema are allowed. It's no longer an instruction, it's a grammar — the JSON is valid *by construction*.

In .NET, that's the response-format parameter of the SDKs (and `GetResponseAsync<T>` in `Microsoft.Extensions.AI`, which deserializes straight into your type). The rule: **the shape by contract, the substance by [evals]({{ site.baseurl }}/2026/07/17/testing-an-ai-application-evals/)** — the schema guarantees valid JSON, not true JSON.

## In summary

- The model **never executes anything**: it writes call requests, your harness executes — all the security lives in that separation.
- The contract is a **JSON Schema** generated from your signatures: the `[Description]`s are read by the model, and the catalog is paid on every turn.
- The classic failures: plausible-but-wrong parameters (**strict types + revalidation**), obese catalog (**fewer tools, better described**), mute errors (**write them for a reader**).
- For structured output: the **contract** (structured outputs) rather than the **prayer** ("answer in JSON") — valid by construction, true only after verification.

The employee fills in purchase orders, the harness delivers, and the schema acts as the pre-printed form: that's all of tool calling. The missing link is in place. And that, honestly… is not rocket science.
