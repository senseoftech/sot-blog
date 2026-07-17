---
layout: post
title: "Microsoft.Extensions.AI (1/5) — Une interface pour les gouverner tous — c'est pas sorcier !"
date: 2026-09-09 10:00:00
author: AClerbois
lang: fr
ref: meai-one-interface
image: /images/posts/meai-one-interface.png
tags: [dotnet, csharp, AI, meai, architecture]
level: 200
---

Vous avez écrit votre premier appel LLM avec le SDK OpenAI. Puis le client a demandé Azure. Puis quelqu'un a voulu tester Claude, la conformité a exigé un modèle local, et AWS est arrivé avec l'offre Bedrock du groupe. Cinq SDK, cinq types de messages, cinq façons de streamer — et votre logique métier tricotée dans chacun. En .NET, on a déjà vécu ce film : on ne code plus contre un logger concret depuis `ILogger`, ni contre une base depuis EF. Pour l'IA, l'interface qui joue ce rôle existe : **`Microsoft.Extensions.AI`** — MEAI pour les intimes.

Cette série en cinq épisodes installe MEAI de zéro : aujourd'hui les abstractions et le pipeline, puis les outils et sorties typées, puis le grand écart multi-cloud (Azure AI Foundry, Anthropic, AWS Bedrock), le local (Ollama, Foundry Local), et en clôture un RAG de production avec les pièges du terrain. Vous allez voir : c'est pas sorcier.

<!--more-->

## Deux paquets, deux interfaces

MEAI se compose de deux paquets NuGet au rôle net :

| Paquet | Contenu | Qui le référence |
| --- | --- | --- |
| `Microsoft.Extensions.AI.Abstractions` | les types d'échange : `IChatClient`, `IEmbeddingGenerator`, `ChatMessage`… | les bibliothèques qui *implémentent* un fournisseur |
| `Microsoft.Extensions.AI` | les middlewares : invocation d'outils, cache, télémétrie, DI | votre application |

Les deux interfaces à retenir :

- **`IChatClient`** — la conversation : du texte (ou des images) entre, une réponse sort ;
- **`IEmbeddingGenerator<string, Embedding<float>>`** — le texte devient vecteurs, la brique de tout RAG (on l'a déjà employée dans [construire son RAG en .NET]({{ site.baseurl }}/fr/2026/08/01/construire-son-rag-en-dotnet/)).

## Premier contact — sans carte de crédit

Le plus court chemin pour essayer passe par un modèle local via [Ollama](https://ollama.com/) — `OllamaSharp` implémente `IChatClient` nativement :

```csharp
using Microsoft.Extensions.AI;
using OllamaSharp;

IChatClient client = new OllamaApiClient(
    new Uri("http://localhost:11434/"), "phi3:mini");

Console.WriteLine(await client.GetResponseAsync("Explique-moi les embeddings en une phrase."));
```

Et le jour où ce prototype doit tourner sur Azure OpenAI :

```csharp
using Azure.AI.OpenAI;
using Azure.Identity;

IChatClient client = new AzureOpenAIClient(
        new Uri(endpoint), new DefaultAzureCredential())
    .GetChatClient("gpt-5-mini")
    .AsIChatClient();          // ← le pont vers MEAI
```

**Rien d'autre ne change.** Votre logique métier parle à `IChatClient` ; le fournisseur est un détail d'injection. C'est le contrat que ce blog appliquait déjà dans [le RAG .NET]({{ site.baseurl }}/fr/2026/08/01/construire-son-rag-en-dotnet/), et c'est lui qui rend le reste de la série possible — chaque `AsIChatClient()` d'un SDK tiers est une prise qui rentre dans la même fiche.

## La conversation, version multi-tours

`GetResponseAsync` accepte aussi un historique complet — c'est vous qui possédez l'état, pas le SDK :

```csharp
var messages = new List<ChatMessage>
{
    new(ChatRole.System, "Tu es un assistant de doc technique, réponses courtes."),
    new(ChatRole.User, "C'est quoi Microsoft.Extensions.AI ?"),
};

var response = await client.GetResponseAsync(messages);
messages.AddRange(response.Messages);       // on archive la réponse
messages.Add(new(ChatRole.User, "Et pourquoi pas le SDK OpenAI directement ?"));
var suite = await client.GetResponseAsync(messages);
```

Pour le streaming, `GetStreamingResponseAsync` renvoie un `IAsyncEnumerable` d'updates — un `await foreach` et votre UI affiche les tokens au fil de l'eau, quel que soit le fournisseur derrière.

## Le vrai super-pouvoir : le pipeline

La philosophie de MEAI est celle des middlewares ASP.NET Core : chaque `IChatClient` peut en **décorer** un autre. Le builder assemble la chaîne :

```csharp
builder.Services.AddChatClient(services =>
    innerClient                       // Ollama, Azure, Anthropic… peu importe
        .AsBuilder()
        .UseDistributedCache()        // mêmes questions → réponse servie du cache
        .UseFunctionInvocation()      // tool calling automatique (épisode 2)
        .UseOpenTelemetry()           // traces GenAI standard
        .Build(services));
```

Cache, télémétrie, invocation d'outils, limitation de débit : des préoccupations **transverses**, écrites une fois, appliquées à n'importe quel modèle. C'est exactement le déclic qu'on avait eu avec `HttpClientFactory` et ses handlers — et si vous avez suivi [notre article OpenTelemetry]({{ site.baseurl }}/fr/2026/08/04/observer-ses-agents-opentelemetry/), vous savez déjà ce que `UseOpenTelemetry()` émet : les conventions sémantiques GenAI, prêtes pour vos dashboards.

## Pourquoi c'est devenu LE standard

L'argument décisif n'est pas le confort, c'est l'**écosystème** : Semantic Kernel et le [Microsoft Agent Framework]({{ site.baseurl }}/fr/2026/07/11/microsoft-agent-framework-equipe-agents-ia/) sont bâtis dessus, le [SDK MCP C#]({{ site.baseurl }}/fr/2026/07/13/premier-serveur-mcp-dotnet/) s'y branche directement, la bibliothèque d'évaluation `Microsoft.Extensions.AI.Evaluations` en dépend, et les fournisseurs livrent désormais l'adaptateur eux-mêmes — OpenAI, Azure, Anthropic (SDK officiel), AWS, OllamaSharp. Écrire contre `IChatClient`, c'est brancher tout ça gratuitement.

## La carte de la série

| # | Date | Épisode |
| --- | --- | --- |
| 1 | aujourd'hui | **Une interface pour les gouverner tous** — vous êtes ici |
| 2 | [10 septembre]({{ site.baseurl }}/fr/2026/09/10/meai-2-outils-sorties-typees-middlewares/) | outils, sorties typées et middlewares |
| 3 | [11 septembre]({{ site.baseurl }}/fr/2026/09/11/meai-3-le-meme-code-trois-clouds/) | le même code, trois clouds : Foundry, Anthropic, Bedrock |
| 4 | [12 septembre]({{ site.baseurl }}/fr/2026/09/12/meai-4-en-local-ollama-et-foundry-local/) | en local : Ollama et Foundry Local |
| 5 | [13 septembre]({{ site.baseurl }}/fr/2026/09/13/meai-5-le-rag-de-production-et-ses-pieges/) | le RAG de production : six pièges et leurs parades |

## Le mot d'honnêteté

- Une abstraction **fuit toujours un peu** : les options exotiques d'un fournisseur passent par des propriétés brutes, et un modèle qui ne sait pas faire de tool calling ne l'apprendra pas par magie parce qu'il porte l'interface. MEAI unifie la *plomberie*, pas les *capacités*.
- L'écosystème bouge vite : les exemples de cette série sont vérifiés sur MEAI 10.x (été 2026), mais épinglez vos versions et relisez les notes de release — certains adaptateurs fournisseurs sont encore étiquetés préversion.

## En résumé

- `Microsoft.Extensions.AI` = **le `ILogger` de l'IA** : deux interfaces (`IChatClient`, `IEmbeddingGenerator`), un paquet d'abstractions, un paquet de middlewares.
- Le fournisseur devient un **détail d'injection** : `AsIChatClient()` et votre logique métier ne bouge plus.
- Le **pipeline de middlewares** (cache, télémétrie, outils…) s'écrit une fois et s'applique à tous les modèles.
- Semantic Kernel, Agent Framework, MCP, évals : **tout l'écosystème .NET converge** vers ces interfaces.

Demain, on donne des bras au modèle : `AIFunctionFactory`, l'invocation d'outils automatique, les réponses typées `GetResponseAsync<T>` — et les middlewares qui rendent tout ça observable. Et ça, franchement… c'est pas sorcier.
