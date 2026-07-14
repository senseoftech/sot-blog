---
layout: post
title: "Le fine-tuning, quand c'est vraiment la réponse — c'est pas sorcier !"
date: 2026-08-20 10:00:00
author: AClerbois
lang: fr
ref: fine-tuning-400
image: /images/posts/fine-tuning-400.png
tags: [AI, LLM, fine-tuning, lora, training]
level: 400
---

Niveau 400, épisode 8 — le dernier de la série, et une réhabilitation. Dans [l'article RAG]({{ site.baseurl }}/fr/2026/07/18/rag-embeddings-expliques-simplement/), j'écartais le fine-tuning d'un revers de main : *« coûteux, lent, figé — préférez le contexte »*. C'était vrai **au niveau 100**, pour le problème d'alors (donner des connaissances fraîches). Mais c'était une demi-vérité, et un architecte mérite l'autre moitié.

Aujourd'hui : *quand* le fine-tuning est la bonne réponse — et il l'est parfois, franchement — sans les mathématiques lourdes. LoRA, SFT vs DPO, l'oubli catastrophique, et le calcul de bascule. Vous allez voir : c'est pas sorcier.

<!--more-->

## La distinction fondatrice : la connaissance vs le comportement

Le malentendu qui fait tout rater. On classe mal le fine-tuning parce qu'on lui demande la mauvaise chose. La règle en une ligne :

> **Le RAG apprend au modèle *ce qu'il faut savoir*. Le fine-tuning lui apprend *comment se comporter*.**

Vous voulez qu'il connaisse votre politique de remboursement à jour ? [RAG]({{ site.baseurl }}/fr/2026/08/01/construire-son-rag-en-dotnet/) — la connaissance change, on ne la grave pas. Vous voulez qu'il réponde *toujours* dans le format JSON exact de votre système, avec le ton de votre marque, en suivant un raisonnement métier spécifique que trois pages de prompt n'arrivent pas à imposer de façon fiable ? **Là**, le fine-tuning gagne. On ne lui injecte pas des faits, on lui façonne un **réflexe**.

Le signal qui doit vous faire y penser : votre [prompt système]({{ site.baseurl }}/fr/2026/07/12/vibe-project-fondations-dotnet/) a gonflé à deux mille tokens d'exemples et de règles de style, vous le [payez à chaque tour]({{ site.baseurl }}/fr/2026/08/03/prompt-caching-sous-le-capot/), et il « déraille » encore une fois sur dix. C'est le moment où déplacer le comportement du prompt *vers les poids* devient rentable.

## LoRA : le fine-tuning sans réentraîner le monde

Pourquoi le fine-tuning avait sa réputation de « coûteux » : réentraîner **tous** les poids d'un modèle de 70 milliards de paramètres demande une ferme de GPU. La révolution, c'est **LoRA** (*Low-Rank Adaptation*) et sa variante **QLoRA**.

L'idée, en image : au lieu de repeindre tout le bâtiment, on **ajoute une fine couche d'adaptateurs** — de petites matrices greffées sur le modèle, qui représentent une infime fraction des paramètres. On gèle le modèle d'origine, on n'entraîne que ces adaptateurs. Conséquences décisives :

- **Accessible** : un fine-tuning LoRA tient souvent sur **une seule carte** (QLoRA ajoute la [quantization]({{ site.baseurl }}/fr/2026/08/16/economie-de-l-inference/) pour descendre encore la mémoire). Plus une ferme, un GPU.
- **Léger à déployer** : l'adaptateur pèse quelques mégaoctets, se branche sur le modèle de base, se change à chaud. Vous pouvez en avoir *plusieurs* (un par tâche) sur le même modèle.

LoRA a transformé le fine-tuning d'un projet d'infrastructure en une opération d'équipe produit. C'est ce qui rend cet article pertinent en 2026 et pas en 2022.

## SFT et DPO : montrer, ou faire préférer

Deux façons d'enseigner un comportement, à ne pas confondre :

- **SFT** (*Supervised Fine-Tuning*) : on montre des **exemples de bonnes réponses**. « Voici 500 tickets, voici le résumé idéal de chacun. » Le modèle apprend à imiter. C'est la voie principale, celle par laquelle on commence.
- **DPO** (*Direct Preference Optimization*) : on montre des **paires** — « pour cette entrée, cette réponse est *meilleure* que celle-là ». Le modèle apprend une préférence, un jugement de qualité. Utile quand « bon » est plus facile à *comparer* qu'à *écrire* — le ton, la diplomatie, l'évitement d'un travers.

Le réflexe : **SFT pour installer le comportement, DPO pour l'affiner** sur les nuances que l'exemple seul capture mal. Et la qualité de tout ça se joue, comme toujours, dans la donnée.

## Le mot d'honnêteté : les trois pièges

- **L'oubli catastrophique.** En apprenant votre tâche, le modèle peut **désapprendre** des capacités générales — le prix d'une spécialisation trop étroite. On le surveille avec [des évals]({{ site.baseurl }}/fr/2026/08/18/ingenierie-des-evals-la-rigueur-statistique/) qui couvrent *aussi* les compétences qu'on veut préserver, pas seulement la nouvelle tâche.
- **La donnée est tout le travail.** 90 % de l'effort d'un fine-tuning réussi, c'est **curer le dataset** : des centaines à milliers d'exemples propres, représentatifs, cohérents. Un dataset médiocre grave des défauts dans les poids — bien plus dur à corriger qu'un prompt raté.
- **Le figé, encore.** Un modèle fine-tuné est un artefact **versionné** : nouveau besoin, nouveau tour d'entraînement, nouvelle éval, nouveau déploiement. Un cycle de type MLOps, pas une édition de prompt. C'est [un ADR]({{ site.baseurl }}/fr/2026/07/14/adr-memoire-decisions-architecture/) à part entière.

## Le calcul de bascule

L'ordre d'essai, du moins engageant au plus lourd — **ne sautez jamais une marche** :

1. **Prompt engineering** — gratuit, instantané, réversible. Épuisez-le d'abord, toujours.
2. **RAG** — quand il manque des *connaissances* fraîches ou privées.
3. **Fine-tuning** — quand le *comportement* résiste au prompt, à volume suffisant pour amortir le cycle MLOps, et souvent **en complément** du RAG (un modèle fine-tuné pour le format + du RAG pour les faits : le combo gagnant).

La règle honnête, symétrique de celle de juin : **si le prompt suffit, ne fine-tunez pas.** Mais quand un comportement doit être *fiable*, *compact* (hors du prompt payé à chaque tour) et *répétable*, alors graver dans les poids n'est pas un luxe — c'est la bonne architecture.

## En résumé

- **RAG = connaissance, fine-tuning = comportement.** Le mauvais classement est la cause de 90 % des déceptions.
- **LoRA/QLoRA** ont rendu le fine-tuning accessible (une carte, un adaptateur de quelques Mo) — d'où sa réhabilitation en 2026.
- **SFT** (imiter des exemples) puis **DPO** (apprendre des préférences) — la donnée curée est 90 % du travail.
- Les pièges : **oubli catastrophique** (évals de non-régression), **cycle MLOps** figé (ADR), et l'ordre d'essai **prompt → RAG → fine-tuning**, jamais sauté.

Le fine-tuning n'est pas le repoussoir du niveau 100 : c'est l'outil qu'on sort quand le comportement doit être gravé, pas récité. Réhabilité, cadré, et à sa juste place — la dernière marche, celle qu'on monte en connaissance de cause. Et ça, franchement… c'est pas sorcier.
