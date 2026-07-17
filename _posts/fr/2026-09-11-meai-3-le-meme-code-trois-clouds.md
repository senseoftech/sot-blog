---
layout: post
title: "Microsoft.Extensions.AI (3/5) — Le même code, trois clouds : Foundry, Anthropic, Bedrock — c'est pas sorcier !"
date: 2026-09-11 10:00:00
author: AClerbois
lang: fr
ref: meai-cloud-providers
image: /images/posts/meai-cloud-providers.png
tags: [dotnet, csharp, AI, meai, azure, aws]
level: 200
---

Le scénario n'a rien de théorique : votre produit tourne sur Azure, un client grand compte impose son infrastructure AWS, et l'équipe data veut Claude pour la qualité de ses réponses longues. Sans abstraction, c'est trois bases de code. Avec `Microsoft.Extensions.AI`, c'est **trois lignes de configuration** — parce que les trois fournisseurs livrent désormais eux-mêmes leur adaptateur `IChatClient`.

Après [les outils et middlewares]({{ site.baseurl }}/fr/2026/09/10/meai-2-outils-sorties-typees-middlewares/), voici l'épisode multi-cloud : Azure AI Foundry, Anthropic et AWS Bedrock, branchés sur la même fiche. C'est pas sorcier.

<!--more-->

## Le contrat : un cœur métier, des adaptateurs

Toute la valeur de l'épisode tient dans cette signature :

```csharp
// Votre application ne connaît QUE ça :
async Task<string> AnalyserCommande(IChatClient client, Commande cmd)
{
    var result = await client.GetResponseAsync<AnalyseCommande>(
        $"Analyse cette commande et détecte les anomalies : {cmd.ToJson()}");
    return result.Result.Resume;
}
```

Le reste de l'article ne fait que fabriquer des `IChatClient` différents pour cette même fonction.

## Azure AI Foundry : la maison mère

Le chemin standard passe par `Azure.AI.OpenAI` et — bonne pratique non négociable — l'authentification **Entra ID sans clé** :

```csharp
using Azure.AI.OpenAI;
using Azure.Identity;
using Microsoft.Extensions.AI;

IChatClient foundry = new AzureOpenAIClient(
        new Uri("https://mon-projet.openai.azure.com"),
        new DefaultAzureCredential())
    .GetChatClient("gpt-5-mini")          // le nom de VOTRE déploiement
    .AsIChatClient();
```

Détail qui change la donne en 2026 : la même ressource Foundry sert aussi le **catalogue Foundry Models** — DeepSeek, Llama, Mistral, et même Claude y sont déployables derrière le même endpoint compatible OpenAI. Un seul point d'entrée Azure, plusieurs familles de modèles.

## Anthropic : le SDK officiel

Depuis 2026, Anthropic maintient un SDK C# officiel — le paquet NuGet [`Anthropic`](https://www.nuget.org/packages/Anthropic) (attention, les versions ≤ 3.x de ce nom étaient un paquet communautaire, depuis déménagé sous `tryAGI.Anthropic`). L'intégration MEAI est fournie :

```csharp
using Anthropic;
using Microsoft.Extensions.AI;

// Lit ANTHROPIC_API_KEY dans l'environnement
IChatClient claude = new AnthropicClient()
    .AsIChatClient("claude-opus-4-8")
    .AsBuilder()
    .UseFunctionInvocation()
    .Build();
```

Cerise cross-cloud : le SDK publie des déclinaisons `Anthropic.Foundry`, `Anthropic.Bedrock` et `Anthropic.Vertex` — le même Claude, consommé via le cloud que votre DSI a déjà validé.

## AWS Bedrock : l'adaptateur AWS officiel

AWS publie `AWSSDK.Extensions.Bedrock.MEAI`, qui pose l'interface MEAI directement sur le client Bedrock Runtime (API Converse en dessous, IAM pour l'authentification) :

```csharp
using Amazon;
using Amazon.BedrockRuntime;
using Microsoft.Extensions.AI;

IChatClient bedrock = new AmazonBedrockRuntimeClient(RegionEndpoint.EUCentral1)
    .AsIChatClient();   // modèle choisi via ChatOptions.ModelId,
                        // ex. "anthropic.claude-sonnet-4-5-v1:0" ou "amazon.nova-pro-v1:0"
```

## La bascule : de la config, pas du code

Assemblé en DI, le choix du fournisseur devient une ligne d'`appsettings.json` :

```csharp
builder.Services.AddChatClient(services =>
{
    IChatClient inner = config["AI:Provider"] switch
    {
        "foundry"  => BuildFoundryClient(config),
        "anthropic"=> BuildAnthropicClient(config),
        "bedrock"  => BuildBedrockClient(config),
        _          => throw new InvalidOperationException("AI:Provider inconnu")
    };
    return inner.AsBuilder()
        .UseDistributedCache()
        .UseFunctionInvocation()
        .UseOpenTelemetry()
        .Build(services);
});
```

Notez ce que la bascule **préserve** : tout le pipeline de [l'épisode 2]({{ site.baseurl }}/fr/2026/09/10/meai-2-outils-sorties-typees-middlewares/) — outils, cache, télémétrie — s'applique aux trois clouds sans une ligne de plus. Besoin de plusieurs fournisseurs *simultanément* (l'un pour le triage bon marché, l'autre pour l'analyse fine) ? Les services keyed de .NET font l'affaire : `AddKeyedChatClient("triage", …)`.

## Ce qui fuit quand même

L'interface unifie l'appel, pas le contexte d'exploitation :

| Ce qui change | Conséquence |
| --- | --- |
| **Identifiants de modèles** | `gpt-5-mini` (déploiement) vs `claude-opus-4-8` vs `anthropic.claude-…-v1:0` — externalisez-les en config |
| **Comportement des modèles** | un prompt réglé pour GPT n'est pas réglé pour Claude ou Nova — rejouez [vos évals]({{ site.baseurl }}/fr/2026/07/20/tester-une-application-ia-les-evals/) à chaque bascule |
| **Prix et quotas** | [le prix se joue au token]({{ site.baseurl }}/fr/2026/07/05/tokens-llm-envoyes-sortie-cache/) et varie du simple au décuple |
| **Options propriétaires** | les réglages exotiques passent par `RawRepresentationFactory` — un œil sur la doc du fournisseur reste nécessaire |
| **Résidence des données** | région, conformité, DPA : le juridique ne s'abstrait pas |

## Le mot d'honnêteté

- « Même code » ne veut pas dire « même comportement » : la portabilité MEAI est **syntaxique**. La portabilité *sémantique* — la qualité équivalente d'un modèle à l'autre — se gagne avec un jeu d'évals, pas avec une interface.
- Le SDK Anthropic C# est officiel mais **encore étiqueté bêta** (versions 10+) : épinglez la version et lisez les notes de release avant de monter.

## En résumé

- Trois clouds, trois adaptateurs **officiels** : `Azure.AI.OpenAI` (+ Entra ID), `Anthropic` (SDK officiel, `AsIChatClient`), `AWSSDK.Extensions.Bedrock.MEAI`.
- La bascule fournisseur = **une entrée de configuration** ; le pipeline de middlewares reste identique.
- Une ressource Azure AI Foundry sert aussi **DeepSeek, Llama, Mistral, Claude** via le même endpoint ; Claude existe aussi en flavours Foundry/Bedrock/Vertex.
- Ce qui fuit : **noms de modèles, comportements, prix, options, conformité** — gérez-les en config et en évals.

Demain, on coupe le cordon : **Ollama et Foundry Local**, ou comment faire tourner tout ce qu'on vient de voir sur votre machine — zéro cloud, zéro clé d'API, et la question qui fâche : combien de VRAM ? Et ça, franchement… c'est pas sorcier.
