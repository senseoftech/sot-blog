---
layout: post
title: "Construire son RAG en .NET : le bibliothécaire prend forme — c'est pas sorcier !"
date: 2026-08-01 10:00:00
author: AClerbois
lang: fr
ref: rag-dotnet
image: /images/posts/rag-dotnet.png
tags: [dotnet, AI, RAG, embeddings, csharp]
level: 300
---

Dans [l'article RAG et embeddings]({{ site.baseurl }}/fr/2026/07/18/rag-embeddings-expliques-simplement/), on a compris la théorie : la carte des idées, la bibliothèque rangée par sens, le bibliothécaire qui pose trois extraits sur le bureau de l'expert. Aujourd'hui, on l'embauche pour de vrai : **un RAG complet en C#**, avec les abstractions officielles `Microsoft.Extensions.AI` — le même genre d'interface standard que `ILogger`, mais pour l'IA.

Cinq étapes, cinq bouts de code courts. Vous allez voir : c'est pas sorcier.

<!--more-->

## L'architecture minimale (et honnête)

Un RAG, côté plomberie, c'est **deux pipelines** :

- **L'ingestion** (à chaque changement de documents) : découper → calculer les embeddings → stocker.
- **La question** (à chaque requête) : embedder la question → chercher les voisins → les coller dans le prompt → générer avec citations.

Toute la qualité se joue dans le premier — celui qu'on bâcle en général.

## Étape 1 : le découpage (chunking)

Pas de bibliothèque magique nécessaire : la stratégie pragmatique est de découper **le long de la structure du document** — titres, puis paragraphes — avec un léger chevauchement pour ne pas couper une idée en deux :

```csharp
public static IEnumerable<string> Chunk(string markdown, int maxChars = 1500, int overlap = 200)
{
    var sections = markdown.Split("\n## ");         // découpe par titres d'abord
    foreach (var section in sections)
    {
        if (section.Length <= maxChars) { yield return section; continue; }
        for (var i = 0; i < section.Length; i += maxChars - overlap)
            yield return section.Substring(i, Math.Min(maxChars, section.Length - i));
    }
}
```

Les deux erreurs classiques, [déjà nommées]({{ site.baseurl }}/fr/2026/07/18/rag-embeddings-expliques-simplement/) : trop gros (le passage noie l'info dans du bruit), trop petit (le passage perd son contexte). 1 000 à 2 000 caractères par morceau est un point de départ sain — *un point de départ* : on ajuste en mesurant (étape 5).

## Étape 2 : les embeddings avec Microsoft.Extensions.AI

L'abstraction clé s'appelle `IEmbeddingGenerator` — l'interface standard derrière laquelle se branche n'importe quel fournisseur (Azure OpenAI, OpenAI, Ollama en local…) :

```csharp
using Microsoft.Extensions.AI;

IEmbeddingGenerator<string, Embedding<float>> generator =
    new AzureOpenAIClient(endpoint, credential)
        .GetEmbeddingClient("text-embedding-3-small")
        .AsIEmbeddingGenerator();

var embeddings = await generator.GenerateAsync(chunks);   // texte → coordonnées
```

C'est tout : vos morceaux de texte deviennent des points sur la carte. Et grâce à l'interface, changer de fournisseur demain — ou passer en local — ne change pas votre code.

## Étape 3 : la bibliothèque (le vector store)

Même philosophie côté stockage : `Microsoft.Extensions.VectorData` définit l'abstraction, et les connecteurs se branchent derrière — en mémoire pour démarrer, puis Azure AI Search, SQL Server (type `vector` natif), Qdrant, Postgres…

```csharp
using Microsoft.Extensions.VectorData;

public class DocChunk
{
    [VectorStoreKey] public required string Id { get; set; }
    [VectorStoreData] public required string Text { get; set; }
    [VectorStoreData] public required string Source { get; set; }   // pour les citations !
    [VectorStoreVector(1536)] public ReadOnlyMemory<float> Vector { get; set; }
}

var collection = vectorStore.GetCollection<string, DocChunk>("docs");
await collection.EnsureCollectionExistsAsync();
await collection.UpsertAsync(chunkRecords);
```

Notez le champ `Source` : le fichier et la section d'origine voyagent **avec** chaque morceau. C'est lui qui permettra les citations — non négociable depuis [l'article hallucinations]({{ site.baseurl }}/fr/2026/07/19/pourquoi-l-ia-hallucine/).

## Étape 4 : la question — retrieve, augment, generate

```csharp
// 1. La question devient un point sur la même carte
var queryVector = await generator.GenerateAsync(question);

// 2. Retrieve : les 5 voisins les plus proches
var results = collection.SearchAsync(queryVector, top: 5);

// 3. Augment + generate : le bibliothécaire pose les extraits sur le bureau
var extraits = string.Join("\n---\n",
    await results.Select(r => $"[{r.Record.Source}] {r.Record.Text}").ToListAsync());

var reponse = await chatClient.GetResponseAsync(
    $"""
    Réponds à la question en t'appuyant UNIQUEMENT sur les extraits ci-dessous.
    Cite la source [entre crochets] après chaque affirmation.
    Si les extraits ne suffisent pas, dis-le explicitement.

    Extraits :
    {extraits}

    Question : {question}
    """);
```

Les trois lignes du prompt final sont vos meilleurs garde-fous : **uniquement les extraits** (l'ancrage), **cite la source** (la vérifiabilité), **dis si ça ne suffit pas** (la porte de sortie honnête, plutôt qu'une broderie plausible).

## Étape 5 : mesurer — le RAG est un système, pas un one-shot

Le moment où [l'article évals]({{ site.baseurl }}/fr/2026/07/20/tester-une-application-ia-les-evals/) rejoint celui-ci : la qualité d'un RAG se règle **en mesurant la recherche**, pas en changeant de modèle. Le golden dataset minimal : vingt questions réelles, et pour chacune, le morceau qui *devrait* remonter :

```
evals/rag-001.json  { "question": "délai de remboursement des frais ?",
                      "doit_remonter": "politique-frais.md#remboursements" }
```

La métrique de départ tient en une phrase : *le bon morceau est-il dans le top 5 ?* Si non — ajustez le chunking, la taille, le nombre de voisins… et rejouez. C'est exactement la boucle de régression des évals, appliquée à la bibliothèque. (Le niveau au-dessus — recherche hybride sémantique + mots-clés, re-ranking — existe et aide ; commencez par mesurer, vous saurez si vous en avez besoin.)

## En résumé

- Un RAG .NET = **deux pipelines** : ingestion (chunk → embed → store) et question (embed → search → prompt cité).
- `Microsoft.Extensions.AI` et `Microsoft.Extensions.VectorData` : des **abstractions standard** — le fournisseur d'embeddings et la base vectorielle se changent sans réécrire l'application.
- Le **chunking** suit la structure du document ; la **source voyage avec chaque morceau** (citations obligatoires).
- Le prompt d'assemblage : *uniquement les extraits, cite, avoue si ça manque*.
- Et la vraie différence entre un démo et un produit : **le golden dataset de recherche** — vingt questions, une métrique, une boucle d'amélioration.

Le bibliothécaire est embauché : une interface d'embeddings, une bibliothèque rangée par sens, un prompt discipliné et vingt questions de contrôle. Et ça, franchement… c'est pas sorcier.
