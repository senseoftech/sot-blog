---
layout: post
title: "Microsoft.Extensions.AI (2/5) — Tools, typed outputs and middleware — it's not rocket science!"
date: 2026-09-10 10:00:00
author: AClerbois
ref: meai-tools-middleware
image: /images/posts/meai-tools-middleware.png
tags: [dotnet, csharp, AI, meai, tool-calling]
level: 200
---

In [tool calling: under the hood]({{ site.baseurl }}/2026/08/02/tool-calling-under-the-hood/), we wrote the loop by hand: the model requests a function, we execute it, send the result back, call the model again… Instructive once, painful the second time. Today's promise: with `Microsoft.Extensions.AI`, that loop becomes **one line of pipeline** — and along the way we pick up typed responses, caching and traces. The direct sequel to [episode 1]({{ site.baseurl }}/2026/09/09/meai-1-one-interface-to-rule-them-all/), and still not rocket science.

<!--more-->

## Giving the model arms: `AIFunctionFactory`

Any .NET method becomes a tool the model can call — the factory reads the signature, types and descriptions to generate the JSON schema automatically:

```csharp
using Microsoft.Extensions.AI;
using System.ComponentModel;

[Description("Returns the stock status of an item")]
static async Task<StockInfo> GetStock(
    [Description("The item SKU, e.g. ART-1042")] string sku)
    => await inventory.LookupAsync(sku);

var options = new ChatOptions
{
    Tools = [AIFunctionFactory.Create(GetStock)]
};
```

And on the client side, the middleware that automates the whole loop:

```csharp
IChatClient client = innerClient
    .AsBuilder()
    .UseFunctionInvocation()     // detects the call → executes → returns → loops
    .Build();

var response = await client.GetResponseAsync(
    "Do we still have ART-1042 in stock?", options);
```

`FunctionInvokingChatClient` handles multiple calls, chained calls and appending results to the history. What you used to write by hand in fifty lines fits in one `Use`.

## MCP tools, for free

Remember [our first MCP server]({{ site.baseurl }}/2026/07/13/first-mcp-server-dotnet/)? The MCP C# SDK exposes its tools as `AIFunction` instances. As a result, plugging an entire MCP server into your client takes three lines:

```csharp
var mcp = await McpClient.CreateAsync(new HttpClientTransport(
    new() { Endpoint = new("https://learn.microsoft.com/api/mcp") }));

var options = new ChatOptions { Tools = [.. await mcp.ListToolsAsync()] };
```

Your homegrown tools and MCP tools coexist in the same list — the model doesn't know the difference.

## Typed outputs: `GetResponseAsync<T>`

No more "please answer in JSON" followed by a fingers-crossed `JsonSerializer.Deserialize`. MEAI generates the schema from your type, imposes it on the model and deserializes:

```csharp
public record TicketTriage(string Category, int Priority, string[] Keywords);

var result = await client.GetResponseAsync<TicketTriage>(
    $"Analyze this support ticket and classify it: {ticket}");

TicketTriage triage = result.Result;   // typed, validated, ready to use
```

Under the hood, this is the constrained decoding we dissected in [sampling and constrained decoding]({{ site.baseurl }}/2026/08/15/sampling-and-constrained-decoding/): the provider forces the output to respect the schema. For your ingestion pipelines, classifiers and extractors — this is the default tool.

## The middleware pantry

| Middleware | What it does | The trap it avoids |
| --- | --- | --- |
| `UseFunctionInvocation()` | the automatic tool loop | manual plumbing |
| `UseDistributedCache()` | **exact-match** response cache (IDistributedCache) | paying twice for the same question |
| `UseOpenTelemetry()` | standard GenAI traces and metrics | the black-box agent |
| `UseLogging()` | requests/responses into `ILogger` | debugging blind |

Two clarifications worth gold:

- `UseDistributedCache` is an **application-level exact-match cache** — not to be confused with [provider-side prompt caching]({{ site.baseurl }}/2026/08/03/prompt-caching-under-the-hood/), which discounts repeated prefixes. The two stack.
- **Order matters.** `UseDistributedCache` before `UseFunctionInvocation`: you serve from cache *before* triggering tools; the reverse would cache intermediate conversations.

And if the middleware doesn't exist, write it: inherit from `DelegatingChatClient`, override `GetResponseAsync`, and ship your own `UseMyThing()` — ten lines are enough for a homemade rate limiter built on `System.Threading.RateLimiting`.

## A word of honesty

- `UseFunctionInvocation` executes **your code on the model's command**. A model that reads external content can be manipulated into calling your tools — re-read [prompt injection: defense in depth]({{ site.baseurl }}/2026/08/13/prompt-injection-defense-in-depth/) before exposing anything beyond read-only. Validate arguments like any user input, and keep destructive tools behind a human confirmation.
- Typed outputs and tool calling depend on **model capabilities**: big cloud models excel, small local models vary — we come back to this in episode 4, and it's measurable with [your evals]({{ site.baseurl }}/2026/07/20/testing-an-ai-application-evals/).

## In short

- `AIFunctionFactory.Create(myMethod)` + `UseFunctionInvocation()`: **industrialized tool calling** — auto schema, auto loop, auto history.
- **MCP tools** plug into the same `ChatOptions.Tools` list as your homegrown functions.
- `GetResponseAsync<T>`: **typed responses** validated by schema, no artisanal parsing.
- Middleware (`cache`, `otel`, `logging`) is **cross-cutting and composable** — and pipeline order is meaningful.
- Security first: a tool exposed to the model is an **attack surface**.

Tomorrow, the splits: the same code on **Azure AI Foundry, Anthropic and AWS Bedrock** — three clouds, three official SDKs, one interface. And that, honestly… is not rocket science.
