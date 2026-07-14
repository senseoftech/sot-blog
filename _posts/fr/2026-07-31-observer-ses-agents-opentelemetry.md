---
layout: post
title: "Observer ses agents : OpenTelemetry pour l'IA — c'est pas sorcier !"
date: 2026-07-31 10:00:00
author: AClerbois
lang: fr
ref: agent-observability
image: /images/posts/agent-observability.png
tags: [dotnet, AI, observability, opentelemetry, aspire]
level: 300
---

« Pourquoi l'agent a-t-il remboursé cette note de frais à 3 h du matin ? » Avec du code classique, vous liriez les logs et la stack trace. Avec un agent, le « pourquoi » est ailleurs : dans **la conversation** — quels outils il a appelés, avec quels arguments, ce qu'il a lu, ce que le modèle a répondu. [Un système non déterministe]({{ site.baseurl }}/fr/2026/07/16/pourquoi-l-ia-hallucine/) ne se débogue pas au `printf`.

La réponse de l'industrie s'appelle **OpenTelemetry** — et [l'article Agent Framework]({{ site.baseurl }}/fr/2026/07/11/microsoft-agent-framework-equipe-agents-ia/) la promettait en une ligne : *« vous rejouez le film au lieu de deviner »*. Aujourd'hui, on installe la salle de projection. Vous allez voir : c'est pas sorcier.

<!--more-->

## OpenTelemetry en 60 secondes

**OTel** est le standard ouvert de l'observabilité — trois signaux : les **logs** (les événements), les **métriques** (les compteurs), et surtout les **traces** : l'histoire complète d'une requête, découpée en **spans** imbriqués. Un span = une opération avec un début, une fin, des attributs. Empilés, ils forment la **timeline** de ce qui s'est réellement passé — qui a appelé quoi, combien de temps, avec quel résultat.

Si vous faites de l'ASP.NET moderne, vous en faites déjà sans le savoir : chaque requête HTTP trace son span. La nouveauté, c'est que **le monde de l'IA a standardisé ses spans à lui**.

## Les conventions GenAI : le vocabulaire commun

OpenTelemetry définit des **conventions sémantiques GenAI** : des noms de spans et d'attributs standards pour les opérations d'IA. Les trois spans qui racontent tout :

| Span | Ce qu'il raconte | Ses attributs clés |
| --- | --- | --- |
| `invoke_agent` | un tour d'agent complet | nom de l'agent, modèle |
| `chat` | un appel au modèle | modèle, **tokens entrée/sortie**, raison d'arrêt |
| `execute_tool` | un appel d'outil | nom de l'outil, arguments |

La conséquence pratique est énorme : comme tout le monde parle ce langage — Agent Framework, les SDK, les backends — **votre outil d'observabilité comprend vos agents sans configuration sur mesure**. Et vous reconnaissez les attributs : les tokens de [la facture]({{ site.baseurl }}/fr/2026/07/05/tokens-llm-envoyes-sortie-cache/), les appels d'outils de [la boucle]({{ site.baseurl }}/fr/2026/07/29/tool-calling-sous-le-capot/) — la théorie de la série devient des colonnes dans un dashboard.

## L'activer dans Agent Framework : trois lignes (ou zéro)

Agent Framework instrumente tout — agents, outils, workflows — dès qu'on le lui demande :

```csharp
// Au démarrage : brancher OTel et exporter en OTLP (vers Aspire, App Insights…)
builder.Services.AddOpenTelemetry()
    .WithTracing(t => t.AddSource("*Microsoft.Agents.AI").AddOtlpExporter())
    .WithMetrics(m => m.AddMeter("*Microsoft.Agents.AI").AddOtlpExporter());
```

Et la version « zéro code » existe : des **variables d'environnement** suffisent à activer l'instrumentation et l'export — précieux pour instrumenter sans redéployer. Un choix conscient reste à faire : par défaut, les traces contiennent la *mécanique* (quels appels, quels tokens, quelles durées) mais **pas le contenu** des prompts et réponses — son activation est un opt-in explicite. Gardez ce réflexe [droit venu de l'article mémoire]({{ site.baseurl }}/fr/2026/07/24/la-memoire-des-ia/) : des données sensibles voyagent dans ces conversations ; en production, tracez la mécanique, échantillonnez le contenu, et gouvernez qui y accède.

## La salle de projection locale : le dashboard Aspire

Pour développer, pas besoin d'un backend cloud : le **dashboard Aspire** est une salle de projection autonome, gratuite, qui tourne en un conteneur :

```bash
docker run --rm -p 18888:18888 -p 4317:18889 \
  mcr.microsoft.com/dotnet/aspire-dashboard
```

Pointez l'export OTLP dessus (`http://localhost:4317`), lancez votre agent, ouvrez `localhost:18888` — et le film apparaît : la timeline de chaque requête, le span `invoke_agent` qui enveloppe trois `chat` et cinq `execute_tool`, les tokens par appel, les durées, les erreurs en rouge. La question « pourquoi a-t-il fait ça ? » devient : *on clique sur le span et on lit.* (Et si votre projet est déjà sous Aspire — [clin d'œil au prompt de base]({{ site.baseurl }}/fr/2026/07/12/vibe-project-fondations-dotnet/) — le dashboard est déjà là, gratuitement.)

En production, même mécanique, autre écran : Application Insights, ou tout backend OTLP — les conventions GenAI font que les vues « IA » s'y allument toutes seules.

## Ce que vous verrez (et que vous ne devinerez plus)

Les découvertes classiques des premières heures d'observabilité d'agent — vécues :

- **La boucle d'outils silencieuse** : l'agent appelle le même outil huit fois avec des variantes d'arguments — invisible dans la réponse finale, éclatant dans la timeline. (Souvent un [message d'erreur muet]({{ site.baseurl }}/fr/2026/07/29/tool-calling-sous-le-capot/) qui ne l'aide pas à se corriger.)
- **Le contexte qui enfle** : les tokens d'entrée qui grimpent de tour en tour — [la dilution]({{ site.baseurl }}/fr/2026/07/23/fenetre-de-contexte-compresser-oublier/) rendue mesurable, et le taux de cache ([`cached_tokens` d'hier]({{ site.baseurl }}/fr/2026/07/30/prompt-caching-sous-le-capot/)) qui s'effondre après une compaction.
- **Le sous-agent lent** : 80 % de la latence dans un seul `invoke_agent` imbriqué — candidat immédiat à un [modèle plus petit]({{ site.baseurl }}/fr/2026/06/25/quel-modele-choisir-github-copilot/).

Et la boucle vertueuse finale, promise par [l'article évals]({{ site.baseurl }}/fr/2026/07/17/tester-une-application-ia-les-evals/) : **les traces de production alimentent le golden dataset**. Le cas qui a déraillé cette nuit, exporté depuis le dashboard, devient l'éval qui empêchera la régression. Observer → comprendre → tester → redéployer : le cycle complet d'une application IA adulte.

## En résumé

- Un agent ne se débogue pas au log : il se **rejoue** — traces et spans OTel racontent qui a appelé quoi, avec quels tokens et quel résultat.
- Les **conventions GenAI** standardisent le vocabulaire (`invoke_agent`, `chat`, `execute_tool`) : vos outils comprennent vos agents sans sur-mesure.
- Agent Framework s'instrumente en **trois lignes** (ou par variables d'environnement) ; le **contenu** des conversations reste un opt-in à gouverner.
- Le **dashboard Aspire** est la salle de projection locale gratuite ; App Insights ou tout backend OTLP prennent le relais en prod.
- Et les traces bouclent la boucle qualité : **l'incident de cette nuit devient l'éval de demain**.

Le film complet de chaque décision de l'agent, à un clic : voilà ce qui sépare « on espère que ça marche » de « on sait ce qui se passe ». Et ça, franchement… c'est pas sorcier.
