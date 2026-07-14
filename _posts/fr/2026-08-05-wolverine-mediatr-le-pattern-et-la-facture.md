---
layout: post
title: "Wolverine ou MediatR : le messager, le pattern et la facture — c'est pas sorcier !"
date: 2026-08-05 10:00:00
author: AClerbois
lang: fr
ref: wolverine-mediatr
image: /images/posts/wolverine-mediatr.png
tags: [dotnet, csharp, mediatr, wolverine, architecture]
level: 200
---

Dans [le billet vibe engineering]({{ site.baseurl }}/fr/2026/07/12/vibe-project-fondations-dotnet/), un « mot d'honnêteté » signalait que **MediatR passait sous licence commerciale**, avec cette promesse : *le pattern compte plus que la bibliothèque*. Vous avez été plusieurs à demander la suite — alors la voici : que faire, concrètement, quand le messager de votre architecture met en place un péage ?

Trois options honnêtes, un candidat qui mérite le détour (Wolverine), et un rappel qui vaut de l'or sur ce que [vos tranches]({{ site.baseurl }}/fr/2026/07/22/vibe-engineering-vertical-slice-architecture/) doivent au pattern — pas au package. Vous allez voir : c'est pas sorcier.

<!--more-->

## Le contexte, sans drame

Les faits : MediatR — comme MassTransit et d'autres piliers de l'écosystème — est passé à un **modèle commercial** : gratuit en dessous d'un seuil de revenus, payant au-delà. Et disons-le contre le réflexe ambiant : **ce n'est pas un scandale.** Un mainteneur qui veut vivre de l'outil que la moitié de l'écosystème .NET utilise gratuitement depuis dix ans, c'est plutôt le signe d'un modèle qui cherche sa durabilité. Payer la licence est une option parfaitement légitime — elle est même la première du comparatif.

Mais c'est une **décision d'architecture** qui vous est posée — et [une décision se documente]({{ site.baseurl }}/fr/2026/07/14/adr-memoire-decisions-architecture/). Instruisons le dossier.

## Le rappel : que fait le messager, au juste ?

Dans notre [moule CQRS]({{ site.baseurl }}/fr/2026/07/22/vibe-engineering-vertical-slice-architecture/), le médiateur fait une chose : **l'endpoint remet un message, le bon handler le reçoit** — sans que l'un connaisse l'autre. Plus les *behaviors* transverses (validation, logging) autour du pipeline. C'est utile, c'est propre… et c'est **remarquablement peu de code**. Gardez ça en tête : on ne choisit pas un réacteur nucléaire, on choisit un standard téléphonique interne.

## Option 1 : payer MediatR — la continuité

Votre solution en est pleine, l'équipe le connaît, il est stable et éprouvé : **payer et ne rien changer** est un choix rationnel. Le coût de migration évité paie des années de licence. C'est l'option des dossiers où le messager n'est *pas* le sujet du moment.

## Option 2 : le dispatch maison — la sobriété

À l'autre extrême, pour un mediator *in-process* simple, le pattern tient en une interface et un tour de DI :

```csharp
public interface IHandler<TCommand, TResult>
{
    Task<TResult> Handle(TCommand command, CancellationToken ct);
}

// L'endpoint Carter résout le handler — c'est tout le « médiateur »
app.MapPost("/orders", (CreateOrder cmd, IHandler<CreateOrder, Guid> h, CancellationToken ct)
    => h.Handle(cmd, ct));
```

Zéro dépendance, zéro licence, zéro magie — et pour beaucoup de projets, **c'est assez**. La limite est connue d'avance : le jour où il vous faut des behaviors sophistiqués, des retries, du messaging… vous réinventerez une bibliothèque. La sobriété est un choix, pas un dogme.

## Option 3 : Wolverine — le messager qui voit plus grand

Le candidat sérieux du moment : **[Wolverine](https://wolverinefx.net/)**, de la « Critter Stack » de JasperFx. Trois choses à savoir :

**1. Le modèle est open-core** : le code est **MIT et le reste** — JasperFx vend du support et du conseil, pas le droit d'utiliser la bibliothèque. (Honnêteté oblige : c'est le modèle *d'aujourd'hui* ; l'histoire MediatR rappelle qu'un modèle peut évoluer — d'où l'ADR.)

**2. La philosophie est différente — et va vous rappeler quelque chose.** Pas d'interface `IRequestHandler`, pas de classe de base : un handler Wolverine est **une méthode C# pure**, découverte par convention et câblée par génération de code à la compilation (moins d'allocations, plus rapide que la réflexion) :

```csharp
// MediatR : classe + interface + IRequest<T>
public class CreateOrderHandler : IRequestHandler<CreateOrder, Guid> { /* … */ }

// Wolverine : une méthode. C'est tout.
public static class CreateOrderHandler
{
    public static async Task<Guid> Handle(CreateOrder command, IDocumentSession session)
    { /* … */ }
}
```

Une méthode nue que le framework découvre et outille tout seul… [les habitués des serveurs MCP]({{ site.baseurl }}/fr/2026/07/13/premier-serveur-mcp-dotnet/) sourient : c'est la même philosophie déclarative.

**3. Il dépasse le rôle de médiateur.** Là où MediatR s'arrête à l'in-process, Wolverine continue : **messaging distribué** (RabbitMQ, Azure Service Bus…), **outbox durable** (le message part *si et seulement si* la transaction commite — le problème le plus sous-estimé du distribué), **sagas**, retries, planification. Le standard téléphonique qui devient la poste : si votre trajectoire mène au messaging, migrer vers Wolverine n'est pas un remplacement — c'est une **anticipation**. Un [guide de migration depuis MediatR](https://wolverinefx.net/introduction/from-mediatr) existe, et la cohabitation temporaire est possible.

## Le verdict en tableau

| Votre situation | Le bon réflexe |
| --- | --- |
| Solution pleine de MediatR, il fait le travail | **Payer** — la migration coûterait plus que la licence |
| Besoin simple, projet modeste, zéro messaging en vue | **Dispatch maison** (ou un mediator source-gen gratuit) |
| Nouveau projet, ou trajectoire vers du messaging/outbox/sagas | **Wolverine** — le pattern, plus la suite |

Et dans les trois cas : **ADR-00XX**, contexte, options, décision, conséquences — vous connaissez [le format]({{ site.baseurl }}/fr/2026/07/14/adr-memoire-decisions-architecture/).

## La vraie leçon : vos tranches s'en moquent

Relisez la structure d'une [tranche verticale]({{ site.baseurl }}/fr/2026/07/22/vibe-engineering-vertical-slice-architecture/) : un endpoint mince, un message, un handler testable. Cette forme survit à MediatR, à Wolverine, au dispatch maison — **parce que c'est le pattern qui structure, pas le package.** C'est exactement pour ça que le [prompt de base]({{ site.baseurl }}/fr/2026/07/12/vibe-project-fondations-dotnet/) impose « un endpoint délègue à un handler » plutôt qu'un nom de bibliothèque. Les fondations bien posées rendent les péages négociables.

## En résumé

- MediatR commercial : **pas un drame, une décision** — payer les mainteneurs est un modèle sain, et une option légitime.
- Trois voies : **payer** (continuité), **faire maison** (sobriété in-process), **Wolverine** (MIT open-core, handlers = méthodes pures, et le messaging/outbox/sagas en plus).
- Le critère : votre **trajectoire** — in-process simple ou distribué durable ?
- Et la leçon de fond : **le pattern compte plus que le package** — vos tranches survivent au changement de messager, c'est ça, des fondations.

Le standard téléphonique interne a mis un péage ; la poste d'à côté est ouverte et gratuite ; et vous savez toujours câbler deux bureaux vous-même. L'important : que les messages arrivent. Et ça, franchement… c'est pas sorcier.
