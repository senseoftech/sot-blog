---
layout: post
title: "L'Agentic SDLC (4/9) — PROSE : cinq contraintes pour des agents fiables — c'est pas sorcier !"
date: 2026-09-03 10:00:00
author: AClerbois
lang: fr
ref: agentic-sdlc-prose
image: /images/posts/agentic-sdlc-prose.png
tags: [agentic-sdlc, agents, AI, prose, architecture, best-practices]
level: 200
---

REST n'a jamais prescrit un langage, un framework ou un format. Il a posé des **contraintes** — sans état, interface uniforme, cache — et ces contraintes ont *induit* les propriétés qu'on voulait : un web qui scale et qui évolue morceau par morceau. Le pari central de l'[Agentic SDLC Handbook](https://danielmeppiel.github.io/agentic-sdlc-handbook/handbook/ch13-the-prose-specification.html) de Daniel Meppiel, c'est de refaire exactement ce geste pour les agents IA. Ça s'appelle **PROSE**, et c'est le chapitre 13 — le cœur du livre.

Après [la machine agentique]({{ site.baseurl }}/fr/2026/09/01/agentic-sdlc-2-la-machine-agentique/) et [les sept primitives]({{ site.baseurl }}/fr/2026/09/02/agentic-sdlc-3-le-depot-instrumente/), voici donc la grammaire qui les fait tenir ensemble. Cinq contraintes, cinq anti-patterns tués, une checklist. C'est pas sorcier.

<!--more-->

## Les cinq contraintes en une table

| Lettre | Contrainte | La règle | L'anti-pattern qu'elle tue |
| --- | --- | --- | --- |
| **P** | Progressive Disclosure | le contexte arrive **just-in-time**, pas just-in-case | le déversement de contexte |
| **R** | Reduced Scope | la tâche est taillée à la capacité du contexte | la dérive de périmètre |
| **O** | Orchestrated Composition | des primitives petites et chaînables, pas de monolithe | le prompt monolithique |
| **S** | Safety Boundaries | outils, connaissances et autorité explicitement bornés | l'agent débridé |
| **E** | Explicit Hierarchy | des règles en arbre, du global au local | les instructions à plat |

Remarquez la correspondance avec [l'épisode 1]({{ site.baseurl }}/fr/2026/08/31/agentic-sdlc-1-la-falaise-du-vibe-coding/) : chaque contrainte répond à une propriété structurelle des LLM — contexte fini (P, R), sortie probabiliste (S), besoin de composition et de résolution claire (O, E).

## Un tour rapide, avec les gestes concrets

- **Progressive Disclosure.** L'attention se dégrade sous la charge, donc on optimise le rapport signal/bruit, pas le volume. Geste : des **liens Markdown avec libellés descriptifs** plutôt que du contenu inliné — l'agent charge quand c'est pertinent.
- **Reduced Scope.** L'heuristique de dimensionnement est brillante de simplicité : une tâche bien taillée est une tâche que l'agent finit **sans poser de question**. Si vous ajoutez du contexte en cours de session, le périmètre était faux au départ.
- **Orchestrated Composition.** Le prompt de 3 000 mots qui couvre rôle, standards, erreurs, tests et sécurité est imprévisible : tout interagit avec tout. Geste : un fichier = une responsabilité, et des workflows qui **référencent** au lieu de copier-coller.
- **Safety Boundaries.** Trois frontières par agent : **capacité** (quels outils), **connaissance** (quel contexte), **autorité** (quoi valider par un humain). Le chapitre fournit quatre rôles types — rédacteur de code, relecteur, exécuteur de tests, déployeur — chacun avec ses gates « STOP ». Écho direct à [sécuriser GitHub Copilot]({{ site.baseurl }}/fr/2026/07/10/securiser-github-copilot/).
- **Explicit Hierarchy.** Un `AGENTS.md` racine pour le socle, des fichiers scopés pour les domaines : l'agent résout du plus spécifique au plus général — et on peut ajouter des règles à un module **sans toucher aux parents**.

## Indépendantes sur le papier, interdépendantes en pratique

Le passage le plus utile du chapitre, ce sont ses trois histoires d'échec — appliquer quatre contraintes sur cinq ne suffit pas :

1. **Hiérarchie sans Progressive Disclosure** : un bel arbre de fichiers… auto-suffisants et obèses. L'agent reçoit tout d'un coup et ne distingue plus ce qui s'applique à sa tâche.
2. **Reduced Scope sans Composition** : des tâches bien taillées mais du guidage copié-collé partout. Le standard change, et chaque service dérive avec sa copie périmée.
3. **Safety Boundaries sans Reduced Scope** : des gates stricts noyés sous 40 000 tokens d'implémentation — l'agent a *oublié* les contraintes chargées en début de session.

## Sur le terrain : le JWT en cinq sessions

L'exemple filé du chapitre — ajouter l'authentification JWT à une app Express — montre le système complet : hiérarchie d'instructions (racine → backend → règles auth avec gates STOP sur la logique de tokens), persona borné (édite `src/auth/` et `tests/auth/`, pas de déploiement), et découpage en **cinq sessions à contexte frais** (schéma de tokens, middleware, endpoint de refresh, tests d'intégration, frontend par un *autre* agent). Moment savoureux : en session 2, l'agent backend tente de modifier le client API du frontend — **sa frontière d'outils l'en empêche**, il le signale, et le spécialiste frontend le traite en session 5 avec le bon contexte. La contrainte n'a pas bridé le système ; elle a routé l'information.

## La checklist de conformité

Onze questions binaires pour auditer votre installation — j'en retiens l'ossature : vos fichiers **lient-ils** au lieu d'inliner ? chaque tâche tient-elle **en une phrase** ? chaque fichier a-t-il **une seule responsabilité** ? chaque agent a-t-il une **liste d'outils explicite** et des **gates STOP** ? vos règles existent-elles à **trois niveaux de spécificité** ? Priorité de remédiation selon le handbook : d'abord les trous de sécurité (S), ensuite la hiérarchie (E), puis le reste selon la douleur.

## Le mot d'honnêteté

- PROSE est une **discipline opinionée**, pas un standard adoubé par un organisme — l'auteur le dit lui-même. L'analogie REST est un objectif, pas un acquis : REST a gagné parce que tout le monde l'a adopté, et cette partie-là reste à jouer.
- Vous avez reconnu de vieux amis : responsabilité unique, moindre privilège, séparation des préoccupations. C'est assumé — et c'est plutôt rassurant : PROSE applique aux agents des principes que quarante ans de génie logiciel ont déjà éprouvés.

## En résumé

- **PROSE** = Progressive Disclosure, Reduced Scope, Orchestrated Composition, Safety Boundaries, Explicit Hierarchy — cinq contraintes qui *induisent* fiabilité, modularité et auditabilité, comme REST a induit la scalabilité du web.
- Chaque contrainte tue un anti-pattern précis : déversement de contexte, dérive de périmètre, prompt monolithe, agent débridé, instructions à plat.
- Elles sont **interdépendantes** : quatre sur cinq, et le système fuit par la cinquième.
- Testez-vous avec la **checklist en onze questions** — sécurité d'abord.

Demain, on plonge dans la ressource que tout ce système économise : l'**attention**. Fenêtre ≠ focus, courbe en U, et le cycle de chargement complet de vos primitives. Et ça, franchement… c'est pas sorcier.
