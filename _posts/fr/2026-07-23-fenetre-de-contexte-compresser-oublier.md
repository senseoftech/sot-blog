---
layout: post
title: "La fenêtre de contexte : l'art de compresser et d'oublier — c'est pas sorcier !"
date: 2026-07-23 10:00:00
author: AClerbois
lang: fr
ref: context-window
image: /images/posts/context-window.png
tags: [AI, LLM, context-window, tokens, context-engineering]
level: 200
---

Vous discutez avec Claude ou ChatGPT depuis une heure, et quelque chose se dégrade : il « oublie » ce que vous avez dit au début, mélange des consignes, tourne en rond. Pas un bug — une **fenêtre de contexte** qui arrive à saturation, et un outil qui gère ça plus ou moins élégamment.

Dans [l'article sur les tokens]({{ site.baseurl }}/fr/2026/07/05/tokens-llm-envoyes-sortie-cache/), on a vu que tout ce qui est dans le contexte se paie à chaque tour. Aujourd'hui, l'étage au-dessus : **comment les outils compressent, résument et oublient** — les patterns concrets derrière Claude, ChatGPT, Copilot CLI et les autres. Vous allez voir : c'est pas sorcier.

<!--more-->

## Le bureau de travail (et ses deux maladies)

L'image à garder : la fenêtre de contexte est le **bureau** du modèle. Tout ce qu'il sait de votre conversation est posé dessus — vos messages, ses réponses, les fichiers ouverts, les sorties d'outils. Ce qui n'est pas sur le bureau **n'existe pas** pour lui.

Ce bureau a deux maladies :

1. **Le mur.** La fenêtre est finie — 128 000, 200 000, parfois un million de tokens selon les modèles. Pleine, c'est fini : il faut jeter quelque chose pour poser autre chose.
2. **La dilution — la maladie sournoise.** Bien *avant* le mur, la qualité baisse. Un modèle noyé sous 150 000 tokens retrouve moins bien une information qu'à 20 000 — la recherche a même montré que le milieu du contexte est le moins bien retenu (*lost in the middle*). Un grand bureau couvert de papiers n'est pas un bureau efficace.

Corollaire qui pique : **la fenêtre géante n'est pas la solution miracle.** Gemini et sa fenêtre à 1 million de tokens repoussent le mur, pas la dilution — ni [la facture]({{ site.baseurl }}/fr/2026/07/05/tokens-llm-envoyes-sortie-cache/). D'où l'existence de tout un artisanat : le **context engineering**.

## Pattern 1 : la fenêtre glissante — jeter les plus vieux papiers

La méthode primitive : quand le bureau déborde, on jette **les documents les plus anciens**. C'est la *sliding window* des premiers chatbots — et le comportement de base de ChatGPT dans une très longue conversation : le début finit par sortir de la fenêtre, silencieusement.

Simple, mais brutal : les plus vieux papiers sont souvent **les plus importants** — le brief initial, les contraintes posées au départ. C'est exactement le « il a oublié ce que je lui ai dit au début ». Personne ne fait plus *que* ça, mais c'est la brique de base.

## Pattern 2 : la compaction — résumer avant de jeter

Le pattern vedette, celui que vous avez déjà croisé deux fois dans ce blog :

- **Claude Code** fait de l'*auto-compact* : à l'approche de la limite, il **rédige un résumé structuré** de la conversation — décisions prises, fichiers touchés, état de la tâche, prochaines étapes — puis remplace l'historique détaillé par ce résumé. La conversation continue, allégée.
- **Copilot CLI** fait pareil [à 95 % de la jauge]({{ site.baseurl }}/fr/2026/07/19/copilot-cli-2-le-quotidien/), et `/compact` le déclenche à la demande.

L'image : avant de vider le bureau, on rédige **une fiche de synthèse** et on ne garde qu'elle. La subtilité que peu de gens voient : c'est *le modèle lui-même* qui rédige la fiche — et tout l'art est dans ce qu'elle préserve. Les décisions et les contraintes : oui. Les quarante allers-retours pour y arriver : non.

**Le mot d'honnêteté** : un résumé est **une perte choisie**. Le détail que la fiche n'a pas retenu est perdu pour de bon — c'est pour ça qu'après une compaction, un agent peut « oublier » une nuance dite trois heures plus tôt. La compaction gère la saturation ; elle ne l'annule pas.

## Pattern 3 : l'oubli sélectif — jeter les gros blocs périmés

Plus chirurgical : au lieu de tout résumer, on identifie **les blocs volumineux devenus inutiles** et on ne jette qu'eux. Le suspect numéro un : les vieilles **sorties d'outils**. Le listing de 3 000 lignes que l'agent a lu il y a une heure a servi — la décision qui en découle est actée ; le listing lui-même n'est plus que du lest.

C'est le principe du *context editing* de l'API Claude : effacer les anciens résultats d'outils tout en gardant le fil de la conversation. Sur le bureau : on jette les impressions brouillon, on garde les notes prises dessus.

## Pattern 4 : l'externalisation — le post-it plutôt que la mémoire

Le pattern le plus élégant, et le geste réflexe des agents modernes : **écrire hors du contexte**. Plutôt que de garder un plan de 2 000 tokens sur le bureau pendant toute la session, l'agent l'écrit dans un fichier (`TODO.md`, un plan, des notes de travail) et ne garde sur le bureau qu'**un pointeur** — « le plan est dans docs/plan.md ». Besoin du détail ? Il relit le fichier, s'en sert, et le contexte respire à nouveau.

Vous l'avez déjà vu à l'œuvre sans le nommer : Claude Code entretient ses fichiers de mémoire et ses listes de tâches, les agents autonomes prennent des notes de bord. Le disque est infini et gratuit ; le bureau est petit et cher — **ce qui doit durer va sur le disque.**

## Pattern 5 : le chargement à la demande — n'apporter que le dossier utile

Le miroir du précédent : ne jamais *tout* poser sur le bureau au départ. C'est [le RAG et son bibliothécaire]({{ site.baseurl }}/fr/2026/07/15/rag-embeddings-expliques-simplement/) — les trois bons extraits au bon moment — mais aussi la mécanique quotidienne des agents : Copilot CLI ne charge pas votre dépôt entier, il fait des recherches ciblées et n'ouvre que les fichiers pertinents. Le *just-in-time context* : la bonne information, au bon moment, en petite quantité.

Et c'est l'argument caché de [l'architecture en tranches]({{ site.baseurl }}/fr/2026/07/22/vibe-engineering-vertical-slice-architecture/) : une fonctionnalité qui tient dans un dossier, c'est un dossier qui tient sur le bureau.

## Pattern 6 : les bureaux séparés — déléguer pour ne pas encombrer

Le pattern d'équipe : chaque spécialiste travaille sur **son propre bureau**, et ne rapporte au chef que sa conclusion. L'agent *Explore* de [Copilot CLI]({{ site.baseurl }}/fr/2026/07/20/copilot-cli-3-l-equipe-dans-le-terminal/) fouille la codebase dans son coin et revient avec trois paragraphes — les 50 000 tokens d'exploration n'ont **jamais touché** votre contexte principal. Même logique chez [Agent Framework]({{ site.baseurl }}/fr/2026/07/11/microsoft-agent-framework-equipe-agents-ia/) : l'isolation de contexte est une forme de compression.

## Ce que font vos outils, en une image

| Outil | Sa stratégie visible |
| --- | --- |
| **Claude / Claude Code** | auto-compact avec résumé structuré + externalisation (fichiers mémoire) + context editing côté API |
| **ChatGPT** | fenêtre glissante + condensation en longue conversation + sa « memory » séparée (patience : article de demain) |
| **Copilot CLI** | jauge `/context`, auto-compaction à 95 %, `/compact`, sous-agents aux bureaux séparés |
| **Gemini** | la très grande table (1 M tokens) — utile, mais dilution et facture restent |

## En résumé

- La fenêtre de contexte a deux maladies : **le mur** (limite dure) et **la dilution** (qualité qui baisse bien avant) — la grande fenêtre ne soigne que la première.
- Six patterns, du plus brutal au plus fin : **glisser** (jeter le vieux), **compacter** (résumer avant de jeter), **oublier sélectivement** (les gros blocs périmés), **externaliser** (le post-it sur le disque), **charger à la demande** (le bibliothécaire), **séparer les bureaux** (déléguer).
- La compaction est une **perte choisie** : parfois le bon geste reste `/clear` et un brief propre.
- Et la meilleure compression, c'est de **ne pas salir le bureau** : contextes courts, tâches découpées, tranches verticales.

Un bureau bien tenu plutôt qu'un bureau géant : voilà tout le context engineering. Demain, la suite naturelle : si le contexte est la mémoire de travail, jetable par nature… **comment les IA se souviennent-elles de vous ?** D'ici là… c'est pas sorcier.
