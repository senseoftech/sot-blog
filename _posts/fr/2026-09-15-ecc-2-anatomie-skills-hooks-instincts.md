---
layout: post
title: "ECC (2/3) — Anatomie : skills-first, hooks, instincts et mémoire — c'est pas sorcier !"
date: 2026-09-15 10:00:00
author: AClerbois
lang: fr
ref: ecc-anatomy
image: /images/posts/ecc-anatomy.png
tags: [agents, AI, claude-code, skills, hooks]
level: 300
---

Question piège : comment charge-t-on **278 skills** dans un agent sans pulvériser sa fenêtre de contexte ? Réponse : on ne les charge pas. On charge leurs *descriptions*, et le corps n'arrive que si la tâche le réclame. Toute l'architecture d'[ECC]({{ site.baseurl }}/fr/2026/09/14/ecc-1-la-config-qui-a-gagne-le-hackathon/) tient dans ce genre d'arbitrage — et si vous avez suivi [notre épisode sur l'économie de l'attention]({{ site.baseurl }}/fr/2026/09/04/agentic-sdlc-5-l-economie-de-l-attention/), vous allez passer l'article à cocher des cases : budgets, chargement paresseux, seuils, portes. La théorie du handbook, incarnée dans une config gagnante.

Aujourd'hui, on dissèque les quatre organes d'ECC : la surface skills-first, la flotte d'agents, les hooks, et le système de mémoire à « instincts ». C'est pas sorcier.

<!--more-->

## Skills-first : les commandes sont mortes, vive les skills

Le choix architectural le plus visible : les **skills sont la surface de travail principale**, et les 94 slash-commands historiques ne survivent que comme *shims* de compatibilité. La différence n'est pas cosmétique — elle est budgétaire. Une commande se charge quand on l'invoque ; un skill expose en permanence sa **description** (quelques lignes) et ne matérialise son corps qu'à l'activation. C'est la *progressive disclosure* de [PROSE]({{ site.baseurl }}/fr/2026/09/03/agentic-sdlc-4-prose-cinq-contraintes/), appliquée à 278 reprises.

Deux skills donnent le ton de la maison :

- **`verification-loop`** — six portes avant de déclarer un travail terminé : build → types → lint → tests (couverture 80 % minimum) → sécurité (credentials, instructions de debug) → revue du diff. Règle maison : si le build casse, **STOP**, on répare avant de continuer. Sortie : un rapport standardisé **READY / NOT READY** pour la PR — et en session longue, la boucle retourne toutes les 15 minutes. C'est la réponse outillée au « saut de l'ange » de [notre galerie d'anti-patterns]({{ site.baseurl }}/fr/2026/09/07/agentic-sdlc-8-dix-neuf-facons-de-saboter-ses-agents/) : jamais le récit, toujours la preuve.
- **`search-first`** — la recherche *avant* le code : documentation et sources d'abord, implémentation ensuite. Le « research-first development » érigé en réflexe.

## 67 agents et une règle : paralléliser

La flotte d'agents couvre les rôles attendus (planner, architect, code-reviewer, security-reviewer, build-resolvers par langage) et quelques trouvailles — mention spéciale au **`silent-failure-hunter`**, dont le nom résume à lui seul [la frontière déterministe/probabiliste]({{ site.baseurl }}/fr/2026/09/05/agentic-sdlc-6-la-frontiere-deterministe-probabiliste/) : les échecs d'agents sont silencieux, autant employer un limier.

Le plus intéressant est dans les **règles toujours actives** qui pilotent la délégation : fonctionnalité complexe → `planner`, code fraîchement écrit → `code-reviewer`, bug → `tdd-guide`, question d'architecture → `architect` — **sans que l'utilisateur le demande**. Et une consigne en majuscules dans le texte : toujours paralléliser les tâches indépendantes, jamais de sérialisation inutile. C'est [l'orchestration de flotte]({{ site.baseurl }}/fr/2026/09/06/agentic-sdlc-7-orchestrer-une-flotte-d-agents/) réduite en règles de trois lignes.

## Les hooks : la couche déterministe

Les 20+ hooks d'ECC sont la matérialisation de ce qu'on prêchait dans [les linters qui s'appliquent tout seuls]({{ site.baseurl }}/fr/2026/08/28/linters-analyzers-les-conventions-qui-s-appliquent-toutes-seules/) : des garde-fous **hors du contrôle du modèle**.

| Moment | Exemples ECC |
| --- | --- |
| **Avant exécution** | bloquer les commandes git destructives (GateGuard), les `console.log`, le shell hors tmux |
| **Après édition** | formatage auto, vérification TypeScript |
| **Avant soumission** | détection de secrets par motifs (`sk-`, `ghp-`, `AKIA`…) |
| **Cycle de session** | sauvegarde du contexte au Stop, rechargement au SessionStart |

Le réglage se fait **au runtime par variables d'environnement** : `ECC_HOOK_PROFILE=minimal|standard|strict` pour le niveau d'exigence, `ECC_DISABLED_HOOKS` pour désactiver un hook précis sans toucher à la config. Un hook qui gêne se débraye, il ne se supprime pas — la config reste partageable.

## Les instincts : la mémoire qui apprend (sous quota)

Le morceau le plus original. ECC extrait des **patterns en cours de session** — vos corrections, vos préférences, vos conventions — et les stocke comme des « instincts » **notés en confiance de 0 à 1**. Au démarrage de session suivant, seuls les instincts au-dessus du seuil (0,7 par défaut) sont injectés, **six maximum**, dans un budget de contexte plafonné à 8 000 caractères. La mémoire complète vit sur disque (`$ECC_AGENT_DATA_HOME`, isolée par harnais pour que Claude Code et Cursor ne s'écrasent pas mutuellement) ; seule l'élite passe en contexte.

Quatre commandes pilotent le cycle : `/instinct-status` (voir les scores), `/instinct-export` / `/instinct-import` (partager ses patterns — la mémoire devient **transférable entre humains**), et la plus belle : `/evolve`, qui **clusterise des instincts corrélés en skill réutilisable**. Relisez [la boucle de feedback du dépôt instrumenté]({{ site.baseurl }}/fr/2026/09/02/agentic-sdlc-3-le-depot-instrumente/) : chaque échec corrigé devient une prévention permanente. ECC automatise littéralement cette boucle — l'échec devient instinct, l'instinct récurrent devient skill.

## Multi-harnais : le portage industrialisé

Dernier organe : la parité entre sept harnais, obtenue par le pattern adaptateur (Cursor réutilise les scripts de hooks de Claude Code), `AGENTS.md` comme format universel — [on vous le présentait comme le guide d'onboarding de votre IA]({{ site.baseurl }}/fr/2026/08/22/agents-md-le-guide-d-onboarding-de-votre-ia/) — et des scripts Node cross-platform. Souvenez-vous du diagnostic de [la machine agentique]({{ site.baseurl }}/fr/2026/09/01/agentic-sdlc-2-la-machine-agentique/) : « changer de harnais, c'est porter du code ». ECC est ce que donne le portage quand on l'assume comme un produit.

## Le mot d'honnêteté

- L'auto-apprentissage écrit de la **configuration générée par le modèle** dans votre système : c'est puissant, et c'est exactement le genre de surface qu'AgentShield existe pour auditer. Relisez vos instincts comme vous relisez une PR.
- La délégation automatique et le parallélisme ont un coût en tokens : ECC l'assume et le compense par une discipline budgétaire stricte — c'est tout l'objet de l'épisode 3.
- Certains choix sont des opinions fortes (le shell contraint à tmux, la couverture à 80 %) : des réglages d'auteur, pas des lois de la physique.

## En résumé

- **Skills-first** : 278 skills en chargement paresseux, 94 commandes réduites en shims — la progressive disclosure à l'échelle.
- **`verification-loop`** : six portes et un verdict READY/NOT READY — la preuve avant le récit, toutes les 15 minutes.
- **67 agents** avec délégation automatique par règles et parallélisme obligatoire sur les tâches indépendantes.
- **Hooks** = la couche déterministe (GateGuard, secrets, formatage), réglable au runtime par profils.
- **Instincts** : mémoire apprise, notée en confiance, injectée sous quota (seuil 0,7, max 6, 8 000 caractères) — et `/evolve` transforme les instincts récurrents en skills.

Demain, le dernier épisode : les **sept leçons transposables** — économie de tokens, drain MCP, compaction stratégique, preuve avant « fini »… — et comment les appliquer à votre harnais à vous, Copilot compris. Et ça, franchement… c'est pas sorcier.
