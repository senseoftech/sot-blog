---
layout: post
title: "La mémoire des IA : comment ChatGPT et Claude se souviennent de vous — c'est pas sorcier !"
date: 2026-07-27 10:00:00
author: AClerbois
lang: fr
ref: ai-memory
image: /images/posts/ai-memory.png
tags: [AI, LLM, memory, context-engineering, privacy]
level: 200
---

« Je te l'ai dit hier ! » — et pourtant non : hier n'existe pas pour un modèle de langage. Ses connaissances sont **figées** à l'entraînement, et sa fenêtre de contexte — [le bureau d'hier]({{ site.baseurl }}/fr/2026/07/26/fenetre-de-contexte-compresser-oublier/) — se vide à chaque nouvelle conversation. Un LLM est, par construction, un **amnésique brillant**.

Et pourtant ChatGPT connaît vos préférences, Claude retient vos projets, Copilot CLI se souvient de vos conventions. Aucune magie : tout ce qui ressemble à de la mémoire est un **système externe**, construit autour du modèle. Aujourd'hui, on démonte ces systèmes — étage par étage. Vous allez voir : c'est pas sorcier.

<!--more-->

## Le collègue Memento

L'image juste, c'est le héros du film *Memento* : incapable de fabriquer des souvenirs, il s'en sort par un **système** — tatouages pour l'essentiel, polaroids annotés, notes partout. Il ne se souvient de rien ; son système se souvient pour lui.

Une IA « qui a de la mémoire », c'est exactement ça. Le modèle reste amnésique — **ses poids ne changent jamais** pendant que vous l'utilisez. Autour de lui, un système extrait, stocke, et **repose les bonnes notes sur le bureau** au début de chaque session. Trois conséquences immédiates :

- La « mémoire » n'est pas de l'apprentissage : le modèle ne devient pas plus intelligent, il est **mieux briefé** (la nuance [fine-tuning vs contexte]({{ site.baseurl }}/fr/2026/07/18/rag-embeddings-expliques-simplement/), encore elle).
- Tout souvenir rappelé **occupe le bureau** : la mémoire consomme du contexte, [avec sa facture]({{ site.baseurl }}/fr/2026/07/05/tokens-llm-envoyes-sortie-cache/).
- Ce qui est stocké peut être **lu, édité, supprimé** — et c'est une excellente nouvelle.

## Étage 1 : la mémoire de travail (déjà vue)

La fenêtre de contexte : tout ce qui est sur le bureau pendant la session. Volatile par nature — c'était [l'article d'hier]({{ site.baseurl }}/fr/2026/07/26/fenetre-de-contexte-compresser-oublier/), avec ses six patterns de compression. Retenez juste qu'elle est le **point de passage obligé** : quelle que soit sa provenance, un souvenir n'agit que s'il finit posé sur le bureau.

## Étage 2 : les fiches utilisateur — la mémoire de ChatGPT et Claude

Le système le plus connu du grand public. Pendant la conversation, un processus discret repère ce qui mérite d'être retenu et l'écrit sous forme de **petites fiches** :

> *« Développe en .NET et Blazor »* · *« Préfère les réponses concises »* · *« Prépare une certification Azure »*

À chaque nouvelle session, les fiches pertinentes sont **réinjectées dans le contexte** — et voilà pourquoi ChatGPT « sait » ce que vous faites dans la vie. Deux mécanismes cohabitent chez OpenAI : les **souvenirs explicites** (les fiches, consultables et supprimables une à une dans les réglages) et la **référence à l'historique** (piocher dans vos anciennes conversations). Claude joue une partition proche avec sa mémoire par projets, activable et **visualisable** — vous pouvez lire ce qu'il a retenu, le corriger, l'effacer.

Le réflexe à prendre : **allez lire vos fiches.** C'est votre profil vu par la machine — et parfois, une fiche périmée (« travaille en Java » depuis 2024…) biaise toutes vos réponses. Une mémoire s'entretient.

## Étage 3 : la mémoire d'outil — le dépôt qui apprend

L'étage qui nous concerne le plus, nous développeurs — vous l'avez croisé dans [l'épisode 2 de la série CLI]({{ site.baseurl }}/fr/2026/07/22/copilot-cli-2-le-quotidien/) :

- **Copilot CLI** entretient une *repository memory* : les conventions découvertes en travaillant (« tests xUnit en triple A », « endpoints via Carter ») sont notées et resservies — plus une mémoire inter-sessions pour retrouver le fil de la semaine passée.
- **Claude Code** tient des **fichiers de mémoire en Markdown** : des notes datées, organisées, versionnables — la forme la plus inspectable qui soit : `git diff` sur la mémoire de votre IA.

Notez la parenté avec *Memento* : dans les deux cas, ce sont **des fichiers texte** que le système relit au démarrage. Pas de boîte noire — des notes.

## Étage 4 : la mémoire écrite par l'humain — vos fondations

Le twist de cet article : vous faites de l'ingénierie de mémoire **depuis le début de cette série**. `AGENTS.md`, les instructions de dépôt, [les ADR]({{ site.baseurl }}/fr/2026/07/14/adr-memoire-decisions-architecture/) — qu'est-ce que c'est, sinon des souvenirs rédigés *par vous*, injectés à chaque session ?

La différence avec l'étage 3 est une différence de **plume** : ici l'humain écrit (fiable, intentionnel, relu en PR), là l'outil apprend (automatique, mais faillible). Les deux se complètent — la formule du [vibe engineering]({{ site.baseurl }}/fr/2026/07/12/vibe-project-fondations-dotnet/) gagne son dernier mot : *le prompt exprime, le dépôt mémorise, l'outillage fait respecter… et l'outil apprend le reste.*

## Étage 5 : la mémoire recherchable — le RAG sur votre passé

Dernier étage, pour les gros volumes : quand les souvenirs se comptent en milliers, on ne peut plus tout réinjecter. On les **indexe** — [embeddings, base vectorielle]({{ site.baseurl }}/fr/2026/07/18/rag-embeddings-expliques-simplement/) — et on ne rappelle que les plus pertinents pour la question du moment. Le bibliothécaire, appliqué à votre propre historique. C'est la mécanique des *context providers* d'[Agent Framework]({{ site.baseurl }}/fr/2026/07/11/microsoft-agent-framework-equipe-agents-ia/), qui poussent l'idée jusqu'aux **graphes de connaissances** : des souvenirs *reliés* (ce client → préfère → livraison express), pas juste empilés.

## Le cycle complet (et ses pièges)

Toute mémoire d'IA vit le même cycle en quatre temps : **extraire** (que retenir ? — après la réponse), **stocker** (fiche, fichier, vecteur), **rappeler** (poser sur le bureau au bon moment), **entretenir** (dédupliquer, mettre à jour, périmer). Et chaque temps a son piège :

- **La mémoire polluée** : une fiche fausse ou périmée est réinjectée *à chaque session* — un biais permanent. D'où l'importance de l'inspectabilité (et l'avantage des mémoires en Markdown : elles se relisent).
- **La vie privée** : ce qui est mémorisé **voyage dans chaque prompt**. En entreprise, la question « que retient l'outil, où, pour qui ? » appartient au même dossier que [la sécurité Copilot]({{ site.baseurl }}/fr/2026/07/10/securiser-github-copilot/) — les modes incognito/mémoire désactivée existent pour de bonnes raisons.
- **Le trop-plein** : mémoriser trop, c'est ressusciter [la dilution d'hier]({{ site.baseurl }}/fr/2026/07/26/fenetre-de-contexte-compresser-oublier/). Une bonne mémoire **oublie** — c'est une fonctionnalité, pas un défaut.

## En résumé

| Étage | Qui écrit | Durée de vie | Exemple |
| --- | --- | --- | --- |
| Fenêtre de contexte | la session | la conversation | le bureau d'hier |
| Fiches utilisateur | l'outil (auto) | des mois | ChatGPT Memory, mémoire Claude |
| Mémoire d'outil | l'outil (auto) | la vie du projet | repository memory de Copilot CLI |
| Fondations écrites | **vous** | la vie du projet | AGENTS.md, ADR, instructions |
| Mémoire indexée | l'outil | illimitée | RAG sur l'historique, graphes |

- Un LLM est **amnésique par construction** : toute « mémoire » est un système externe qui re-briefe le modèle à chaque session.
- Se souvenir = **extraire, stocker, rappeler, entretenir** — et le rappel passe toujours par le bureau (donc se paie).
- **Lisez vos fiches** : une mémoire s'inspecte, se corrige, s'épure — et en entreprise, elle se gouverne.
- La mémoire la plus fiable reste celle que **vous** écrivez : vos instructions et vos ADR sont des souvenirs de première classe.

Le collègue Memento s'en sort très bien — à condition de tenir ses notes à jour. Offrez le même soin à vos outils : quelques fiches justes valent mieux qu'un carnet gonflé de souvenirs douteux. Et ça, franchement… c'est pas sorcier.
