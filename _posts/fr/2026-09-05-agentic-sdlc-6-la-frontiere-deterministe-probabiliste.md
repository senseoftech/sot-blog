---
layout: post
title: "L'Agentic SDLC (6/9) — La frontière déterministe/probabiliste : l'agent propose, la porte dispose — c'est pas sorcier !"
date: 2026-09-05 10:00:00
author: AClerbois
lang: fr
ref: agentic-sdlc-boundary
image: /images/posts/agentic-sdlc-boundary.png
tags: [agentic-sdlc, agents, AI, fiabilite, gouvernance]
level: 300
---

Un agent ouvre une issue GitHub impeccable : titre clair, description structurée, nom du client concerné. Un détail : **le client n'existe pas**. Le nom était plausible, l'API a accepté, l'issue est partie. Personne n'avait placé de contrôle déterministe — « ce client est-il dans le système ? » — entre la proposition de l'agent et l'appel d'API. La leçon du chapitre 16 de l'[Agentic SDLC Handbook](https://danielmeppiel.github.io/agentic-sdlc-handbook/handbook/ch16-deterministic-probabilistic-boundary.html) de Daniel Meppiel tient en une phrase : le correctif n'était pas un meilleur modèle, c'était **un trait à redessiner sur le schéma d'architecture**.

Après [l'économie de l'attention]({{ site.baseurl }}/fr/2026/09/04/agentic-sdlc-5-l-economie-de-l-attention/), voici la décision de conception que le handbook juge la plus importante de tout un système agentique : où passe la **frontière entre le déterministe et le probabiliste**. C'est pas sorcier.

<!--more-->

## Deux ordinateurs dans la même machine

Tout système agentique fait tourner deux ordinateurs côte à côte :

| | Côté déterministe | Côté probabiliste |
| --- | --- | --- |
| **Qui** | I/O fichiers, appels d'outils, validation de schémas, tests, journaux d'audit | le modèle : lire, rédiger, proposer |
| **Comportement** | mêmes entrées → mêmes sorties | mêmes entrées → sorties *similaires* |
| **Échecs** | bruyants et traçables | silencieux : « confiant, plausible, faux » |

Rien de péjoratif pour le côté probabiliste : c'est de là que vient toute la valeur créative. Mais on ne confie pas les opérations à conséquences au composant dont les échecs sont indétectables à l'œil nu.

## La règle : le modèle propose, la porte dispose

Tout effet de bord conséquent — et *a fortiori* irréversible : écrire en production, créer un artefact visible d'un client, modifier une table canonique, déployer — s'exécute **côté déterministe, derrière une porte de validation que l'agent ne peut pas contourner**.

La forme la plus stricte s'appelle *supervised execution* : l'agent n'a **aucun droit d'écriture**. Il produit un artefact tamponné (un JSON, un diff, un plan), et un processus déterministe séparé le valide contre un schéma et une liste d'autorisations avant de l'appliquer. Le principe rejoint ce qu'on écrivait sur [le coding agent GitHub]({{ site.baseurl }}/fr/2026/08/08/coding-agent-github-issue-pull-request/) et [une branche par agent]({{ site.baseurl }}/fr/2026/08/09/une-branche-par-agent-git-a-l-ere-des-agents/) : la PR est exactement ça — une zone tampon avant l'irréversible.

## Deux disciplines contre l'hallucination

Le chapitre refuse de traiter l'hallucination comme un problème de prompt. C'est un problème de **système**, géré par deux disciplines complémentaires :

1. **L'ancrage (grounding)** : charger un contexte spécifique et justifié par décision — pas de l'ambiance — pour réduire l'*incidence* des hallucinations.
2. **La vérification** : partir du principe qu'une hallucination a survécu à l'ancrage, et la rattraper avant externalisation par des contrôles déterministes contre les systèmes de référence — pour réduire le *rayon d'explosion*.

Les deux, toujours. L'ancrage sans vérification laisse passer ; la vérification sans ancrage gaspille.

## La matrice des portes qualité

Quatre types de portes, selon deux axes — programmatique/jugement et interne/externe :

| | Programmatique | Jugement |
| --- | --- | --- |
| **Interne** | types, lint, validation de schéma → attrape les défauts de structure | l'agent se relit contre l'intention initiale → attrape la dérive d'objectif |
| **Externe** | review à froid, contexte frais, avec grille → attrape les défauts structurels | checkpoint humain avant l'irréversible → attrape les décisions de périmètre |

La règle d'appariement du handbook : choisissez la porte qui attrape **votre** mode d'échec — pas celle qui est la plus facile à mettre en place. Un schéma JSON n'attrapera jamais une dérive d'objectif ; un humain fatigué n'attrapera pas une violation de schéma.

## Dans la vraie vie

Le chapitre recense des implémentations concrètes de la couture : les blocs `safe-outputs` des workflows agentiques GitHub (l'agent émet du JSON, une post-étape valide et applique via API) ; le job CI sandboxé **sans droits d'écriture**, doublé d'un processus séparé avec un autre rôle IAM qui applique les changements validés ; le nœud d'approbation dans un DAG de workflow entre « proposer » et « appliquer ». À chaque fois, même géométrie : la couture est **réifiée** dans l'infrastructure, pas promise dans un prompt.

Et trois habitudes à prendre : tracez la frontière **sur le diagramme avant de coder** ; choisissez vos portes **avant** de choisir votre modèle ; et ne donnez jamais un token d'écriture sans avoir documenté pourquoi.

## Le mot d'honnêteté

- Les portes ont un coût : sur du travail à faible risque, sur-gater tue la vélocité. Le handbook assume une logique de **proportionnalité** — autonomie agressive dans les zones réversibles, portes dures devant l'irréversible. Nous y reviendrons côté gouvernance à l'épisode 9.
- Attention à la case « jugement-interne » : un agent qui se relit reste **probabiliste**. C'est une couche utile, pas une garantie — ne la comptez jamais comme telle dans un dossier de conformité.

## En résumé

- Tout système agentique = **deux ordinateurs** : un déterministe (échecs bruyants), un probabiliste (échecs silencieux, « confiant, plausible, faux »).
- La règle d'or : **le modèle propose, la porte dispose** — l'irréversible s'exécute côté déterministe, derrière une validation incontournable.
- Contre l'hallucination : **ancrage** (réduire l'incidence) + **vérification** (réduire le rayon d'explosion).
- Quatre portes qualité (programmatique/jugement × interne/externe) : choisissez selon le mode d'échec à attraper.
- L'emplacement de la couture est **la** décision d'architecture numéro un — avant le choix du modèle, avant la taille de la fenêtre.

Demain, on passe à l'échelle : plusieurs agents, des vagues, des points de contrôle — et le méta-processus qui a permis d'écrire le handbook lui-même avec une flotte de onze agents. Et ça, franchement… c'est pas sorcier.
