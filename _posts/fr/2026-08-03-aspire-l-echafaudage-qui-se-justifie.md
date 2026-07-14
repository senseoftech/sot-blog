---
layout: post
title: "Aspire : l'échafaudage qui se justifie — c'est pas sorcier !"
date: 2026-08-03 10:00:00
author: AClerbois
lang: fr
ref: aspire
image: /images/posts/aspire.png
tags: [dotnet, aspire, cloud, architecture, observability]
level: 200
---

Dans [le prompt de base du vibe engineering]({{ site.baseurl }}/fr/2026/07/12/vibe-project-fondations-dotnet/), une ligne intriguait : *« Si la complexité le justifie : .NET Aspire. Sinon, rester simple. »* Plusieurs lecteurs m'ont demandé le critère — et, au fond, ce qu'Aspire fait *vraiment*.

Alors aujourd'hui : Aspire expliqué par l'image du chantier, le code minimal, et surtout **le test en trois questions** pour savoir si votre projet le justifie. Vous allez voir : c'est pas sorcier.

<!--more-->

## Le problème : le F5 d'une application distribuée

Tant que votre application est un monolithe Blazor avec sa base de données, tout va bien : F5, ça tourne. Puis le projet grandit : une API, un front, un worker de fond, un cache Redis, un Postgres… et votre « démarrage local » devient un rituel : **quatre terminaux, un docker-compose, des chaînes de connexion recopiées dans autant de `appsettings.json`**, et le classique « ça marche chez moi » quand un nouveau arrive sur le projet.

Le problème n'est pas le code — chaque service est propre. C'est **le chantier autour** : qui démarre quoi, dans quel ordre, branché comment. Il manque un échafaudage.

## Aspire : le chef de chantier du développement

**Aspire** (ex-« .NET Aspire », rebaptisé car devenu polyglotte) n'est pas un framework qui s'invite dans votre code métier. C'est une **couche d'orchestration et d'observabilité** autour de vos services, avec quatre pièces :

1. **L'AppHost** : un petit projet C# qui **décrit votre application distribuée** — quels services, quelles dépendances, quels branchements. Votre topologie devient du code : typée, versionnée, relue en PR.
2. **La service discovery** : les services se trouvent **par leur nom logique**. Fini les URL et ports en dur — les câbles se branchent tout seuls.
3. **Les intégrations** : Redis, Postgres, RabbitMQ, Azure… préconfigurés avec health checks, retries et télémétrie inclus — l'outillage sérieux par défaut.
4. **Le dashboard** : la salle de contrôle — logs, traces, métriques de *tous* les services en un seul écran. Vous l'avez déjà rencontré dans [l'article observabilité]({{ site.baseurl }}/fr/2026/07/31/observer-ses-agents-opentelemetry/) : c'est le même, OpenTelemetry en standard.

## Le code : votre topologie en une page

L'AppHost de notre PME ressemble à ceci :

```csharp
var builder = DistributedApplication.CreateBuilder(args);

var cache    = builder.AddRedis("cache");
var postgres = builder.AddPostgres("db").AddDatabase("orders");

var api = builder.AddProject<Projects.Orders_Api>("api")
    .WithReference(postgres)
    .WithReference(cache);

builder.AddProject<Projects.Web_Front>("front")
    .WithReference(api);

builder.Build().Run();
```

Un `aspire run` (ou F5 sur l'AppHost), et **tout démarre** : les conteneurs Redis et Postgres sont provisionnés, les chaînes de connexion injectées, le dashboard ouvert. Le nouveau développeur — ou [l'agent qui débarque sur le dépôt]({{ site.baseurl }}/fr/2026/07/18/copilot-cli-1-sortez-copilot-de-l-ide/) — n'a plus un rituel à apprendre : la topologie **est dans le code**. Et le jour du déploiement, `azd up` lit cette même description pour provisionner Azure Container Apps.

## Le test : la complexité le justifie-t-elle ?

Le critère promis, en trois questions — **un seul oui suffit** :

1. Avez-vous **plusieurs services qui se parlent** (API + front + worker…) ?
2. Avez-vous des **dépendances conteneurisées** en local (base, cache, bus…) ?
3. Avez-vous besoin de **suivre une requête à travers plusieurs services** (traces distribuées) ?

| Votre projet | Verdict |
| --- | --- |
| Monolithe Blazor + une base | **Non** — un docker-compose (voire rien) suffit ; Aspire serait de l'échafaudage autour d'une cabane |
| API + front + cache + worker | **Oui** — c'est exactement le cas nominal |
| Système d'agents multi-services ([RAG]({{ site.baseurl }}/fr/2026/07/28/construire-son-rag-en-dotnet/) + [MCP]({{ site.baseurl }}/fr/2026/07/26/serveur-mcp-en-production/) + API) | **Oui** — et le dashboard trace vos agents gratuitement |

**Le mot d'honnêteté** : Aspire ajoute un projet, des concepts et une courbe d'apprentissage — c'est un coût réel sur un petit projet. Et l'échafaudage ne remplace pas les fondations : Aspire organise le *chantier*, pas le *bâtiment* — [la découpe en tranches]({{ site.baseurl }}/fr/2026/07/22/vibe-engineering-vertical-slice-architecture/) reste votre affaire. Les deux se complètent, ne se substituent pas.

## En résumé

- Aspire = **l'échafaudage du chantier** : AppHost (la topologie en C#), service discovery (les câbles automatiques), intégrations (les dépendances sérieuses par défaut), dashboard (la salle de contrôle OTel).
- Le test en trois questions : **plusieurs services ? dépendances conteneurisées ? traces inter-services ?** — un oui, et l'échafaudage se justifie.
- Un monolithe n'en a pas besoin — et c'est très bien : *rester simple* est une consigne d'architecture, pas un aveu.
- Bonus : la même description alimente le **déploiement** (`azd up` → Container Apps) et [l'observabilité de vos agents]({{ site.baseurl }}/fr/2026/07/31/observer-ses-agents-opentelemetry/).

La ligne du prompt de base a maintenant son mode d'emploi : l'échafaudage quand le bâtiment le mérite, la cabane sans. Et ça, franchement… c'est pas sorcier.
