---
layout: post
title: "Microsoft.Extensions.AI (2/5) — Outils, sorties typées et middlewares — c'est pas sorcier !"
date: 2026-09-10 10:00:00
author: AClerbois
lang: fr
ref: meai-tools-middleware
image: /images/posts/meai-tools-middleware.png
tags: [dotnet, csharp, AI, meai, tool-calling]
level: 200
---

Dans [tool calling : sous le capot]({{ site.baseurl }}/fr/2026/08/02/tool-calling-sous-le-capot/), on avait écrit la boucle à la main : le modèle demande une fonction, on l'exécute, on renvoie le résultat, on rappelle le modèle… Instructif une fois, pénible dès la deuxième. La promesse du jour : avec `Microsoft.Extensions.AI`, cette boucle devient **une ligne de pipeline** — et au passage, on récupère des réponses typées, du cache et des traces. La suite directe de [l'épisode 1]({{ site.baseurl }}/fr/2026/09/09/meai-1-une-interface-pour-les-gouverner-tous/), et toujours pas sorcier.

<!--more-->

## Donner des bras au modèle : `AIFunctionFactory`

N'importe quelle méthode .NET devient un outil exposable au modèle — la factory lit la signature, les types et les descriptions pour générer le schéma JSON automatiquement :

```csharp
using Microsoft.Extensions.AI;
using System.ComponentModel;

[Description("Retourne l'état de stock d'un article")]
static async Task<StockInfo> GetStock(
    [Description("La référence article, ex. ART-1042")] string sku)
    => await inventory.LookupAsync(sku);

var options = new ChatOptions
{
    Tools = [AIFunctionFactory.Create(GetStock)]
};
```

Et côté client, le middleware qui automatise la boucle complète :

```csharp
IChatClient client = innerClient
    .AsBuilder()
    .UseFunctionInvocation()     // détecte l'appel → exécute → renvoie → reboucle
    .Build();

var reponse = await client.GetResponseAsync(
    "Reste-t-il des ART-1042 en stock ?", options);
```

`FunctionInvokingChatClient` gère les appels multiples, les appels en chaîne et l'ajout des résultats à l'historique. Ce que vous écriviez à la main en cinquante lignes tient dans un `Use`.

## Les outils MCP, gratuits

Souvenez-vous de [notre premier serveur MCP]({{ site.baseurl }}/fr/2026/07/13/premier-serveur-mcp-dotnet/) : le SDK MCP C# expose ses outils comme des `AIFunction`. Résultat, brancher un serveur MCP entier sur votre client tient en trois lignes :

```csharp
var mcp = await McpClient.CreateAsync(new HttpClientTransport(
    new() { Endpoint = new("https://learn.microsoft.com/api/mcp") }));

var options = new ChatOptions { Tools = [.. await mcp.ListToolsAsync()] };
```

Vos outils maison et les outils MCP cohabitent dans la même liste — le modèle ne fait pas la différence.

## Les sorties typées : `GetResponseAsync<T>`

Fini le « réponds en JSON s'il te plaît » suivi d'un `JsonSerializer.Deserialize` croisé-doigts. MEAI génère le schéma depuis votre type, l'impose au modèle et désérialise :

```csharp
public record TicketTriage(string Categorie, int Priorite, string[] MotsCles);

var result = await client.GetResponseAsync<TicketTriage>(
    $"Analyse ce ticket support et classe-le : {ticket}");

TicketTriage triage = result.Result;   // typé, validé, prêt à l'emploi
```

Sous le capot, c'est le décodage contraint qu'on avait disséqué dans [sampling et décodage contraint]({{ site.baseurl }}/fr/2026/08/15/sampling-decodage-contraint/) : le fournisseur force la sortie à respecter le schéma. Pour vos pipelines d'ingestion, vos classifieurs, vos extracteurs — c'est l'outil par défaut.

## Le garde-manger de middlewares

| Middleware | Ce qu'il fait | Le piège qu'il évite |
| --- | --- | --- |
| `UseFunctionInvocation()` | la boucle d'outils automatique | la plomberie manuelle |
| `UseDistributedCache()` | cache **exact** des réponses (IDistributedCache) | repayer la même question |
| `UseOpenTelemetry()` | traces et métriques GenAI standard | l'agent boîte noire |
| `UseLogging()` | requêtes/réponses dans `ILogger` | le débogage à l'aveugle |

Deux précisions qui valent de l'or :

- `UseDistributedCache` est un cache **applicatif à correspondance exacte** — rien à voir avec le [prompt caching côté fournisseur]({{ site.baseurl }}/fr/2026/08/03/prompt-caching-sous-le-capot/), qui réduit le prix des préfixes répétés. Les deux se cumulent.
- **L'ordre compte.** `UseDistributedCache` avant `UseFunctionInvocation` : on sert du cache *avant* de déclencher des outils ; l'inverse mettrait en cache des conversations intermédiaires.

Et si le middleware n'existe pas, écrivez-le : héritez de `DelegatingChatClient`, surchargez `GetResponseAsync`, et publiez votre `UseMonTruc()` — dix lignes suffisent pour un rate limiter maison branché sur `System.Threading.RateLimiting`.

## Le mot d'honnêteté

- `UseFunctionInvocation` exécute **votre code sur commande du modèle**. Un modèle qui lit du contenu externe peut être manipulé pour appeler vos outils — relisez [prompt injection : la défense en profondeur]({{ site.baseurl }}/fr/2026/08/13/prompt-injection-defense-en-profondeur/) avant d'exposer autre chose que de la lecture. Validez les arguments comme n'importe quelle entrée utilisateur, et gardez les outils destructeurs derrière une confirmation humaine.
- Sorties typées et tool calling dépendent des **capacités du modèle** : les gros modèles cloud excellent, les petits modèles locaux varient — on y revient à l'épisode 4, et c'est mesurable avec [vos évals]({{ site.baseurl }}/fr/2026/07/20/tester-une-application-ia-les-evals/).

## En résumé

- `AIFunctionFactory.Create(maMethode)` + `UseFunctionInvocation()` : le **tool calling industrialisé** — schéma auto, boucle auto, historique auto.
- Les **outils MCP** se branchent dans la même liste `ChatOptions.Tools` que vos fonctions maison.
- `GetResponseAsync<T>` : des **réponses typées** validées par schéma, sans parsing artisanal.
- Les middlewares (`cache`, `otel`, `logging`) sont **transverses et composables** — et l'ordre du pipeline a du sens.
- Sécurité d'abord : un outil exposé au modèle est une **surface d'attaque**.

Demain, le grand écart : le même code sur **Azure AI Foundry, Anthropic et AWS Bedrock** — trois clouds, trois SDK officiels, une seule interface. Et ça, franchement… c'est pas sorcier.
