---
layout: post
title: "Microsoft.Extensions.AI (1/5) — One interface to rule them all — it's not rocket science!"
date: 2026-09-09 10:00:00
author: AClerbois
ref: meai-one-interface
image: /images/posts/meai-one-interface.png
tags: [dotnet, csharp, AI, meai, architecture]
level: 200
---

You wrote your first LLM call with the OpenAI SDK. Then the customer asked for Azure. Then someone wanted to try Claude, compliance demanded a local model, and AWS showed up with the group's Bedrock deal. Five SDKs, five message types, five ways to stream — and your business logic knitted into every one of them. In .NET we've seen this movie before: we stopped coding against a concrete logger the day `ILogger` arrived. For AI, the interface playing that role exists: **`Microsoft.Extensions.AI`** — MEAI for short.

This five-episode series sets up MEAI from scratch: today the abstractions and the pipeline, then tools and typed outputs, then the multi-cloud splits (Azure AI Foundry, Anthropic, AWS Bedrock), local models (Ollama, Foundry Local), and to close, a production RAG with real-world pitfalls. You'll see: it's not rocket science.

<!--more-->

## Two packages, two interfaces

MEAI consists of two NuGet packages with crisp roles:

| Package | Contents | Who references it |
| --- | --- | --- |
| `Microsoft.Extensions.AI.Abstractions` | the exchange types: `IChatClient`, `IEmbeddingGenerator`, `ChatMessage`… | libraries that *implement* a provider |
| `Microsoft.Extensions.AI` | the middleware: tool invocation, caching, telemetry, DI | your application |

The two interfaces to remember:

- **`IChatClient`** — the conversation: text (or images) in, a response out;
- **`IEmbeddingGenerator<string, Embedding<float>>`** — text becomes vectors, the building block of every RAG (we already used it in [build your RAG in .NET]({{ site.baseurl }}/2026/08/01/build-your-rag-in-dotnet/)).

## First contact — no credit card required

The shortest path to trying it runs through a local model via [Ollama](https://ollama.com/) — `OllamaSharp` implements `IChatClient` natively:

```csharp
using Microsoft.Extensions.AI;
using OllamaSharp;

IChatClient client = new OllamaApiClient(
    new Uri("http://localhost:11434/"), "phi3:mini");

Console.WriteLine(await client.GetResponseAsync("Explain embeddings in one sentence."));
```

And the day that prototype has to run on Azure OpenAI:

```csharp
using Azure.AI.OpenAI;
using Azure.Identity;

IChatClient client = new AzureOpenAIClient(
        new Uri(endpoint), new DefaultAzureCredential())
    .GetChatClient("gpt-5-mini")
    .AsIChatClient();          // ← the bridge into MEAI
```

**Nothing else changes.** Your business logic talks to `IChatClient`; the provider is an injection detail. It's the contract this blog already applied in [the .NET RAG]({{ site.baseurl }}/2026/08/01/build-your-rag-in-dotnet/), and it's what makes the rest of this series possible — every third-party SDK's `AsIChatClient()` is a plug that fits the same socket.

## The conversation, multi-turn edition

`GetResponseAsync` also accepts a full history — you own the state, not the SDK:

```csharp
var messages = new List<ChatMessage>
{
    new(ChatRole.System, "You are a technical docs assistant. Keep answers short."),
    new(ChatRole.User, "What is Microsoft.Extensions.AI?"),
};

var response = await client.GetResponseAsync(messages);
messages.AddRange(response.Messages);       // archive the reply
messages.Add(new(ChatRole.User, "Why not use the OpenAI SDK directly?"));
var followUp = await client.GetResponseAsync(messages);
```

For streaming, `GetStreamingResponseAsync` returns an `IAsyncEnumerable` of updates — one `await foreach` and your UI renders tokens as they arrive, whatever provider sits behind.

## The real superpower: the pipeline

MEAI's philosophy is ASP.NET Core middleware: every `IChatClient` can **decorate** another. The builder assembles the chain:

```csharp
builder.Services.AddChatClient(services =>
    innerClient                       // Ollama, Azure, Anthropic… doesn't matter
        .AsBuilder()
        .UseDistributedCache()        // same questions → served from cache
        .UseFunctionInvocation()      // automatic tool calling (episode 2)
        .UseOpenTelemetry()           // standard GenAI traces
        .Build(services));
```

Caching, telemetry, tool invocation, rate limiting: **cross-cutting** concerns, written once, applied to any model. It's exactly the click we had with `HttpClientFactory` and its handlers — and if you followed [our OpenTelemetry article]({{ site.baseurl }}/2026/08/04/observing-your-agents-opentelemetry/), you already know what `UseOpenTelemetry()` emits: the GenAI semantic conventions, dashboard-ready.

## Why it became THE standard

The decisive argument isn't comfort, it's the **ecosystem**: Semantic Kernel and the [Microsoft Agent Framework]({{ site.baseurl }}/2026/07/11/microsoft-agent-framework-build-your-ai-agent-team/) are built on it, the [MCP C# SDK]({{ site.baseurl }}/2026/07/13/first-mcp-server-dotnet/) plugs straight into it, the `Microsoft.Extensions.AI.Evaluations` library depends on it, and providers now ship the adapter themselves — OpenAI, Azure, Anthropic (official SDK), AWS, OllamaSharp. Code against `IChatClient` and you get all of that for free.

## The map of the series

| # | Date | Episode |
| --- | --- | --- |
| 1 | today | **One interface to rule them all** — you are here |
| 2 | [September 10]({{ site.baseurl }}/2026/09/10/meai-2-tools-typed-outputs-middleware/) | tools, typed outputs and middleware |
| 3 | [September 11]({{ site.baseurl }}/2026/09/11/meai-3-same-code-three-clouds/) | same code, three clouds: Foundry, Anthropic, Bedrock |
| 4 | [September 12]({{ site.baseurl }}/2026/09/12/meai-4-local-ollama-and-foundry-local/) | going local: Ollama and Foundry Local |
| 5 | [September 13]({{ site.baseurl }}/2026/09/13/meai-5-production-rag-and-its-pitfalls/) | production RAG: six pitfalls and their fixes |

## A word of honesty

- An abstraction **always leaks a little**: a provider's exotic options go through raw properties, and a model that can't do tool calling won't learn it by magic because it wears the interface. MEAI unifies the *plumbing*, not the *capabilities*.
- The ecosystem moves fast: this series' examples are verified against MEAI 10.x (summer 2026), but pin your versions and read the release notes — some provider adapters still carry a preview label.

## In short

- `Microsoft.Extensions.AI` = **the `ILogger` of AI**: two interfaces (`IChatClient`, `IEmbeddingGenerator`), one abstractions package, one middleware package.
- The provider becomes an **injection detail**: `AsIChatClient()` and your business logic never moves again.
- The **middleware pipeline** (cache, telemetry, tools…) is written once and applies to every model.
- Semantic Kernel, Agent Framework, MCP, evals: **the whole .NET ecosystem converges** on these interfaces.

Tomorrow we give the model arms: `AIFunctionFactory`, automatic tool invocation, typed responses with `GetResponseAsync<T>` — and the middleware that makes it all observable. And that, honestly… is not rocket science.
