---
layout: post
title: "Microsoft Agent Framework : montez votre équipe d'agents IA — c'est pas sorcier !"
date: 2026-07-11 10:00:00
author: AClerbois
lang: fr
ref: agent-framework
image: /images/posts/agent-framework.png
tags: [dotnet, AI, agents, agent-framework, MCP, microsoft]
level: 200
---

Vous avez peut-être croisé le nom : **Microsoft Agent Framework**. C'est le nouveau framework open source de Microsoft pour construire des agents IA — le successeur officiel de **Semantic Kernel** et d'**AutoGen**, réunis en un seul projet, disponible en **.NET et en Python**.

Le sujet a l'air intimidant : orchestration multi-agents, workflows typés, checkpointing, MCP… Alors on va tout reprendre avec une seule image en tête : **vous montez une petite entreprise, et vos agents sont vos employés.** Une fois cette image posée, chaque fonctionnalité du framework devient évidente. Vous allez voir : c'est pas sorcier.

<!--more-->

## D'où ça sort ?

Deux équipes chez Microsoft exploraient le sujet depuis des années : **Semantic Kernel** (l'approche « entreprise » : robuste, typée, télémétrie) et **AutoGen** (l'approche « recherche » : des agents qui collaborent simplement). Agent Framework est leur **successeur commun**, créé par les mêmes équipes : les abstractions simples d'AutoGen, les fondations solides de Semantic Kernel, et par-dessus, des **workflows** pour garder le contrôle.

Côté modèles, il est agnostique : Microsoft Foundry, Azure OpenAI, OpenAI, Anthropic, Ollama en local… Vous changez de fournisseur sans réécrire vos agents.

## L'employé : c'est quoi, un agent ?

Un agent, dans ce framework, c'est trois choses :

- un **cerveau** : le modèle de langage (LLM) ;
- une **fiche de poste** : les instructions (« tu es un conseiller de voyage, tu réponds en français… ») ;
- des **outils** : ce qu'il a le droit de faire au-delà de parler.

Et le code ressemble vraiment à ça — voici un agent complet en C# :

```csharp
AIAgent agent = chatClient.CreateAIAgent(
    instructions: "Tu es un conseiller de voyage. Réponds en français, sois concret.",
    tools: [AIFunctionFactory.Create(GetWeather)]);

var reponse = await agent.RunAsync("Que faire à Lisbonne un week-end de mars ?");
```

C'est tout. Le framework gère la boucle : le modèle réfléchit, appelle un outil si besoin, lit le résultat, recommence, puis répond.

## La règle d'or avant d'embaucher

La documentation officielle le dit elle-même, et c'est assez rare pour être encadré : **si une simple fonction peut faire le travail, écrivez une fonction.** Pas d'agent.

| Embauchez un agent quand… | Écrivez un workflow quand… |
| --- | --- |
| la tâche est ouverte, conversationnelle | le processus a des étapes bien définies |
| il faut de l'autonomie et de l'improvisation | vous voulez contrôler l'ordre d'exécution |
| un LLM (avec des outils) suffit | plusieurs agents/fonctions doivent se coordonner |

Un agent, c'est puissant mais non déterministe — il improvise. Un workflow, c'est une procédure — ça s'audite. Le framework vous donne les deux, et l'art consiste à les combiner.

## Les outils : l'équipement de l'employé

Un employé sans outils ne fait que discuter. Agent Framework en fournit trois familles :

- **Les function tools** — l'outillage maison. Vos propres méthodes C# ou Python, exposées à l'agent : elles tournent **dans votre application**, avec votre logique métier, vos accès, vos tests. C'est par là que commencent la plupart des agents.
- **Les outils hébergés** — l'équipement fourni avec le poste de travail. Code interpreter (un bac à sable pour exécuter du code), web search, file search : ils s'exécutent **chez le fournisseur du modèle**, rien à installer, rien à maintenir.
- **Les serveurs MCP** — la **prise universelle**. Tout serveur [MCP]({{ site.baseurl }}/fr/2026/07/02/github-copilot-skills-instructions-agents-mcp/) existant (GitHub, bases de données, outils internes…) se branche sur votre agent, en local ou hébergé.

### MCP ou outil intégré : quelle différence ?

La question revient à chaque fois : si le framework sait déjà déclarer des outils, pourquoi passer par MCP ?

Un **function tool**, c'est une compétence apprise à *cet* employé, dans *cette* entreprise. La méthode vit dans votre application, elle est écrite pour cet agent et ne sert qu'à lui. C'est rapide, typé, testable — mais c'est privé.

Un **serveur MCP**, c'est un prestataire externe avec son propre catalogue de services. Il tourne dans un **processus séparé** (sur votre machine ou à distance) et expose ses outils via un **protocole standard et ouvert**. Conséquence directe : le même serveur MCP GitHub sert à vos agents Agent Framework, à GitHub Copilot, à Claude, à VS Code… **Écrit une fois, branché partout.** Et quand le serveur s'enrichit de nouveaux outils, tous les agents branchés en profitent sans redéploiement.

| | Function tool (intégré) | Serveur MCP |
| --- | --- | --- |
| **Qui écrit le code** | vous, dans votre appli | le fournisseur du serveur (vous ou un tiers) |
| **Où ça s'exécute** | dans votre processus | dans un processus séparé, local ou distant |
| **Réutilisable ailleurs** | non — lié à votre appli | oui — même serveur pour Copilot, Claude, vos agents… |
| **Le bon réflexe** | logique métier propre à l'appli | intégration existante, ou partagée entre plusieurs outils IA |

Le réflexe simple : **votre logique métier → function tool ; une intégration qui existe déjà ou doit servir à plusieurs agents → MCP.** Petit avertissement au passage : un serveur MCP tiers, c'est du code externe à qui vous confiez des données — les mêmes réflexes de prudence que dans [l'article sécurité]({{ site.baseurl }}/fr/2026/07/10/securiser-github-copilot/) s'appliquent.

Et le pont fonctionne dans les deux sens : un agent Agent Framework peut lui-même être **exposé comme serveur MCP**. Votre agent devient alors un outil branchable dans VS Code ou n'importe quel client compatible.

Quelle que soit la famille — maison, hébergé ou MCP — une fonctionnalité rassure : le **tool approval**. Vous pouvez marquer n'importe quel outil comme « soumis à approbation » : l'agent prépare l'action, **tout s'arrête**, un humain valide (ou pas), et ça repart. Le stagiaire remplit le bon de commande, mais c'est le manager qui signe.

## La mémoire : le fil de la conversation et le dossier client

Deux mécanismes distincts, deux besoins différents :

**Les sessions**, c'est la mémoire de la conversation en cours : l'agent se souvient de ce que vous avez dit trois messages plus tôt. Le framework gère cet état pour vous, y compris pour des processus longs côté serveur.

**Les context providers**, c'est plus malin : ce sont des composants qui s'exécutent **avant chaque réponse** pour poser sous les yeux de l'agent ce dont il a besoin — le profil du client, ses préférences, des documents pertinents extraits d'une base de connaissances (le fameux RAG). La nuance est importante : un outil, l'agent doit *penser* à l'utiliser ; un context provider, c'est le dossier **déjà posé sur son bureau** avant la réunion. Après la réponse, le provider peut aussi **extraire et stocker** ce qu'il faut retenir (« ce client est végétarien ») pour les prochaines fois.

Petit rappel au passage : tout ce que vous injectez dans le contexte, ce sont des [tokens envoyés à chaque tour]({{ site.baseurl }}/fr/2026/07/05/tokens-llm-envoyes-sortie-cache/) — le framework propose d'ailleurs des stratégies de **compaction** pour résumer l'historique quand il devient trop long.

## Le middleware : le règlement intérieur

Le **middleware** s'insère autour de chaque action de l'agent : avant/après chaque appel au modèle, chaque appel d'outil. C'est là que vivent les préoccupations transversales : **journaliser** ce que fait l'agent, **filtrer** les entrées et sorties (garde-fous, données sensibles), **mesurer**, **bloquer** au besoin. L'agent travaille ; le règlement intérieur encadre — sans toucher à sa fiche de poste.

## Agents as tools : le généraliste qui appelle le spécialiste

À mesure qu'un agent accumule des outils et des responsabilités, il devient moins bon — trop d'outils, il choisit mal ; une fiche de poste trop large, il perd le fil. La réponse du framework : **un agent peut appeler un autre agent comme s'il était un simple outil.**

Votre assistant généraliste garde un rôle clair, et quand la question touche à la réservation de vols, il **délègue** à l'agent voyage — qui a ses propres instructions, ses propres outils, et éventuellement… un modèle différent. Un petit modèle rapide pour les tâches simples, un gros pour le raisonnement. Comme dans une vraie équipe : chacun sa spécialité.

## Les workflows : la procédure d'entreprise

Jusqu'ici, un agent décide seul de sa route. Pour un processus métier, on veut l'inverse : **des étapes explicites, dans un ordre maîtrisé**. C'est le rôle des workflows : un **graphe** dont les nœuds sont des agents ou de simples fonctions, reliés par des arêtes typées — avec routage conditionnel, exécution parallèle, et validation des types entre les étapes.

Deux fonctionnalités valent le détour :

- **Le checkpointing** : l'état du workflow est sauvegardé à des points de passage. Un processus de plusieurs heures (ou jours) peut s'interrompre et **reprendre où il en était** — indispensable dès qu'un humain entre dans la boucle.
- **Human-in-the-loop** : le workflow peut se mettre en pause pour demander une information ou une validation à un humain, puis reprendre. Le dossier de prêt s'instruit automatiquement, mais l'accord final reste une signature humaine.

Cerise sur le gâteau : un workflow peut être **exposé comme un agent**. De l'extérieur, on lui parle comme à un agent ordinaire — sans savoir qu'une procédure complète tourne derrière.

## Les cinq façons d'organiser l'équipe

C'est le morceau le plus connu du framework : les **orchestrations** intégrées, cinq patterns prêts à l'emploi pour faire collaborer plusieurs agents.

| Pattern | L'image | Cas concret |
| --- | --- | --- |
| **Sequential** | La chaîne de montage : chacun passe le relais au suivant | Rédiger → relire → traduire → publier |
| **Concurrent** | Le brainstorming : tous planchent en parallèle sur le même sujet | Analyser un contrat sous l'angle juridique, financier et technique à la fois |
| **Handoff** | Le standard téléphonique : on vous transfère au bon service | Support client : facturation, technique ou commercial selon la question |
| **Group Chat** | La réunion d'équipe : tout le monde débat dans le même fil | Un rédacteur et un critique qui itèrent jusqu'à un texte final |
| **Magentic** | Le chef de projet : il découpe, distribue, ajuste le plan en temps réel | Problème ouvert dont on ne connaît pas le chemin à l'avance |

Le choix n'est pas cosmétique. **Sequential** quand les étapes dépendent l'une de l'autre. **Concurrent** quand elles sont indépendantes (et que la latence compte). **Handoff** pour router vers des spécialistes. **Group Chat** pour la confrontation d'idées. **Magentic** — inspiré du système Magentic-One d'AutoGen — pour les tâches ouvertes : un agent-manager planifie et coordonne les spécialistes selon l'avancement. C'est le plus flexible… et le plus coûteux en tokens ; si une coordination simple suffit, la doc elle-même conseille de rester sur Group Chat.

## L'observabilité : le tableau de bord

Un agent qui improvise, ça se surveille. Le framework intègre **OpenTelemetry** en standard : traces des appels au modèle, des outils invoqués, des étapes de workflow — jusqu'au « zéro code » via des variables d'environnement. Quand un agent part en vrille à 3 h du matin, vous rejouez le film au lieu de deviner.

## Par où commencer ?

```bash
# .NET
dotnet add package Microsoft.Agents.AI.Foundry --prerelease

# Python
pip install agent-framework
```

Le point d'entrée officiel : [learn.microsoft.com/agent-framework](https://learn.microsoft.com/agent-framework/overview/). Si vous venez de Semantic Kernel ou d'AutoGen, des guides de migration dédiés existent. Et les [exemples du dépôt GitHub](https://github.com/microsoft/agent-framework) couvrent chaque fonctionnalité de cet article.

Mon conseil pour débuter : **un seul agent, deux ou trois function tools, une session.** C'est déjà utile en production. Les orchestrations multi-agents viendront quand un vrai besoin les justifiera — pas avant.

## En résumé

- **Agent Framework** = le successeur open source de Semantic Kernel + AutoGen, en .NET et Python, agnostique côté modèles.
- Un **agent** = un cerveau (LLM) + une fiche de poste (instructions) + des outils (fonctions, MCP, code interpreter…).
- La règle d'or : **si une fonction suffit, écrivez une fonction.** Agent pour l'ouvert, workflow pour le procédural.
- **Sessions** et **context providers** donnent la mémoire ; le **middleware** encadre ; le **tool approval** et le **human-in-the-loop** gardent l'humain aux commandes.
- Cinq orchestrations pour l'équipe : **chaîne de montage, brainstorming, standard téléphonique, réunion, chef de projet.**

Monter une équipe d'agents IA, finalement, c'est comme monter une équipe tout court : des fiches de poste claires, les bons outils, un règlement intérieur, et un manager qui signe les bons de commande. Et ça, franchement… c'est pas sorcier.
