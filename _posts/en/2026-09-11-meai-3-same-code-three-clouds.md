---
layout: post
title: "Microsoft.Extensions.AI (3/5) — Same code, three clouds: Foundry, Anthropic, Bedrock — it's not rocket science!"
date: 2026-09-11 10:00:00
author: AClerbois
ref: meai-cloud-providers
image: /images/posts/meai-cloud-providers.png
tags: [dotnet, csharp, AI, meai, azure, aws]
level: 200
---

The scenario is anything but theoretical: your product runs on Azure, a large customer imposes their AWS infrastructure, and the data team wants Claude for the quality of its long-form answers. Without an abstraction, that's three codebases. With `Microsoft.Extensions.AI`, it's **three lines of configuration** — because all three providers now ship their own `IChatClient` adapter.

After [tools and middleware]({{ site.baseurl }}/2026/09/10/meai-2-tools-typed-outputs-middleware/), here is the multi-cloud episode: Azure AI Foundry, Anthropic and AWS Bedrock, plugged into the same socket. Not rocket science.

<!--more-->

## The contract: one business core, several adapters

The whole value of this episode fits in this signature:

```csharp
// Your application knows ONLY this:
async Task<string> AnalyzeOrder(IChatClient client, Order order)
{
    var result = await client.GetResponseAsync<OrderAnalysis>(
        $"Analyze this order and flag anomalies: {order.ToJson()}");
    return result.Result.Summary;
}
```

The rest of the article merely builds different `IChatClient` instances for that same function.

## Azure AI Foundry: the mothership

The standard path goes through `Azure.AI.OpenAI` and — non-negotiable best practice — **keyless Entra ID** authentication:

```csharp
using Azure.AI.OpenAI;
using Azure.Identity;
using Microsoft.Extensions.AI;

IChatClient foundry = new AzureOpenAIClient(
        new Uri("https://my-project.openai.azure.com"),
        new DefaultAzureCredential())
    .GetChatClient("gpt-5-mini")          // the name of YOUR deployment
    .AsIChatClient();
```

A detail that changes the game in 2026: the same Foundry resource also serves the **Foundry Models catalog** — DeepSeek, Llama, Mistral and even Claude can be deployed behind the same OpenAI-compatible endpoint. One Azure entry point, several model families.

## Anthropic: the official SDK

Since 2026, Anthropic maintains an official C# SDK — the [`Anthropic`](https://www.nuget.org/packages/Anthropic) NuGet package (careful: versions ≤ 3.x of that name were a community package, since relocated to `tryAGI.Anthropic`). MEAI integration is built in:

```csharp
using Anthropic;
using Microsoft.Extensions.AI;

// Reads ANTHROPIC_API_KEY from the environment
IChatClient claude = new AnthropicClient()
    .AsIChatClient("claude-opus-4-8")
    .AsBuilder()
    .UseFunctionInvocation()
    .Build();
```

Cross-cloud cherry on top: the SDK ships `Anthropic.Foundry`, `Anthropic.Bedrock` and `Anthropic.Vertex` flavors — the same Claude, consumed through whichever cloud your IT department already signed off on.

## AWS Bedrock: the official AWS adapter

AWS publishes `AWSSDK.Extensions.Bedrock.MEAI`, which lays the MEAI interface directly on the Bedrock Runtime client (Converse API underneath, IAM for authentication):

```csharp
using Amazon;
using Amazon.BedrockRuntime;
using Microsoft.Extensions.AI;

IChatClient bedrock = new AmazonBedrockRuntimeClient(RegionEndpoint.EUCentral1)
    .AsIChatClient();   // model picked via ChatOptions.ModelId,
                        // e.g. "anthropic.claude-sonnet-4-5-v1:0" or "amazon.nova-pro-v1:0"
```

## The switch: configuration, not code

Assembled in DI, the provider choice becomes one line of `appsettings.json`:

```csharp
builder.Services.AddChatClient(services =>
{
    IChatClient inner = config["AI:Provider"] switch
    {
        "foundry"   => BuildFoundryClient(config),
        "anthropic" => BuildAnthropicClient(config),
        "bedrock"   => BuildBedrockClient(config),
        _           => throw new InvalidOperationException("Unknown AI:Provider")
    };
    return inner.AsBuilder()
        .UseDistributedCache()
        .UseFunctionInvocation()
        .UseOpenTelemetry()
        .Build(services);
});
```

Note what the switch **preserves**: the entire pipeline from [episode 2]({{ site.baseurl }}/2026/09/10/meai-2-tools-typed-outputs-middleware/) — tools, caching, telemetry — applies to all three clouds without one extra line. Need several providers *simultaneously* (one for cheap triage, another for deep analysis)? .NET keyed services do the job: `AddKeyedChatClient("triage", …)`.

## What leaks anyway

The interface unifies the call, not the operating context:

| What changes | Consequence |
| --- | --- |
| **Model identifiers** | `gpt-5-mini` (deployment) vs `claude-opus-4-8` vs `anthropic.claude-…-v1:0` — externalize them into config |
| **Model behavior** | a prompt tuned for GPT isn't tuned for Claude or Nova — re-run [your evals]({{ site.baseurl }}/2026/07/20/testing-an-ai-application-evals/) on every switch |
| **Price and quotas** | [the price is per token]({{ site.baseurl }}/2026/07/05/llm-tokens-input-output-cached/) and varies tenfold |
| **Proprietary options** | exotic settings go through `RawRepresentationFactory` — you still need an eye on the provider's docs |
| **Data residency** | region, compliance, DPAs: legal doesn't abstract away |

## A word of honesty

- "Same code" doesn't mean "same behavior": MEAI portability is **syntactic**. *Semantic* portability — equivalent quality from one model to the next — is earned with an eval suite, not an interface.
- The Anthropic C# SDK is official but **still labeled beta** (versions 10+): pin the version and read the release notes before upgrading.

## In short

- Three clouds, three **official** adapters: `Azure.AI.OpenAI` (+ Entra ID), `Anthropic` (official SDK, `AsIChatClient`), `AWSSDK.Extensions.Bedrock.MEAI`.
- Switching providers = **one configuration entry**; the middleware pipeline stays identical.
- One Azure AI Foundry resource also serves **DeepSeek, Llama, Mistral, Claude** through the same endpoint; Claude also comes in Foundry/Bedrock/Vertex flavors.
- What leaks: **model names, behaviors, prices, options, compliance** — manage them with config and evals.

Tomorrow we cut the cord: **Ollama and Foundry Local**, or how to run everything we've seen on your own machine — zero cloud, zero API key, and the awkward question: how much VRAM? And that, honestly… is not rocket science.
