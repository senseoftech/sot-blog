---
layout: post
title: "L'Agentic SDLC (8/9) — Dix-neuf façons de saboter ses agents — c'est pas sorcier !"
date: 2026-09-07 10:00:00
author: AClerbois
lang: fr
ref: agentic-sdlc-anti-patterns
image: /images/posts/agentic-sdlc-anti-patterns.png
tags: [agentic-sdlc, agents, AI, anti-patterns, best-practices]
level: 200
---

« C'est fait, les trois fichiers sont modifiés et les tests passent. » Vous lancez `git diff` : **rien**. L'édition a échoué en silence, l'agent a raconté son succès avec aplomb, et vous venez de vivre l'anti-pattern n° 12 du catalogue. Le chapitre 20 de l'[Agentic SDLC Handbook](https://danielmeppiel.github.io/agentic-sdlc-handbook/handbook/ch20-anti-patterns-and-failure-modes.html) de Daniel Meppiel recense **dix-neuf modes d'échec** du développement agentique — nommés, diagnostiqués, soignés. Sa phrase-clé mérite d'être affichée au mur : les échecs de l'IA ne plantent pas, ils produisent une sortie plausible et fausse.

Après [l'orchestration]({{ site.baseurl }}/fr/2026/09/06/agentic-sdlc-7-orchestrer-une-flotte-d-agents/), l'avant-dernier épisode joue les bêtisiers — sauf que vous allez vous reconnaître à chaque ligne. Moi aussi. C'est pas sorcier, mais c'est vexant.

<!--more-->

## Les cinq fondamentaux : PROSE en négatif

Les cinq premiers, vous les connaissez déjà — ce sont les violations directes des [contraintes PROSE]({{ site.baseurl }}/fr/2026/09/03/agentic-sdlc-4-prose-cinq-contraintes/) : le **prompt monolithique** (tout interagit avec tout, chaque règle ajoutée déstabilise les autres — les modèles interprètent le contexte de façon probabiliste, pas séquentielle), le **déversement de contexte** (toute la codebase dans la fenêtre, l'agent se fixe sur des détails hors sujet), l'**agent débridé** (aucune restriction de fichiers), les **instructions à plat** (les règles de domaines différents se contredisent), et la **dérive de périmètre** (la tâche enfle en cours de session, la qualité fond à mesure).

## Les cinq d'exécution : là où les flottes se plantent

| Anti-pattern | Le symptôme | Le remède |
| --- | --- | --- |
| **Le héros solitaire** | un agent, une feature entière, un diff géant illisible | un fichier par agent par vague, des checkpoints |
| **Le saut de l'ange** | croire l'agent sur parole (« c'est fait ») | **`git diff`, jamais le récit** — vérification déterministe |
| **Éditions parallèles du même fichier** | le second agent échoue en silence | un fichier, un agent ; séquencer entre vagues |
| **Checkpoints sautés** | trois vagues d'affilée sans test, cause racine introuvable | tester et committer **chaque** vague — 2 minutes contre 3 heures |
| **Ne pas réparer les primitives** | la même erreur à chaque session, corrigée à la main à chaque fois | remonter au fichier de config fautif : **réparez le système, pas la sortie** |

Le dernier est mon préféré : c'est la [boucle de feedback de l'épisode 3]({{ site.baseurl }}/fr/2026/09/02/agentic-sdlc-3-le-depot-instrumente/) prise à l'envers. Corriger la sortie sans corriger la primitive, c'est écoper sans boucher la coque.

## Les neuf de session : l'usure, le coût, la confiance

Le reste du catalogue couvre la vie quotidienne des sessions : l'**épuisement de fenêtre** (la qualité se dégrade en cours de route — coupez, committez, repartez frais, cf. [l'épisode 5]({{ site.baseurl }}/fr/2026/09/04/agentic-sdlc-5-l-economie-de-l-attention/)) ; les **éditions hallucinées** (notre `git diff` d'ouverture) ; le **contexte périmé entre vagues** (l'agent référence une interface d'avant-hier — relisez l'état committé après chaque checkpoint) ; l'**emballement des coûts** (quinze relances pour un progrès marginal — fixez un budget : après deux échecs, on redécoupe ou on change d'approche) ; le **piège du « presque fini »** (les derniers 10 % résistent, le coût irrécupérable vous retient — committez ce qui marche, isolez le dur) ; la **perte d'état de session** (crash au milieu, codebase incohérente — committez chaque vague) ; la **dérive de persona** (votre spécialiste backend se met à refactorer le CSS — sessions plus courtes, rôle réaffirmé dans le prompt de tâche) ; les **conflits inter-vagues** (chaque vague passe seule, l'ensemble casse — tests d'intégration à chaque vague) ; et la **prompt injection via les dépendances** (un README ou un commentaire de lib détourne l'agent — contenu externe = non fiable, listes d'autorisation, scan préalable ; on a consacré [un épisode entier à la défense en profondeur]({{ site.baseurl }}/fr/2026/08/13/prompt-injection-defense-en-profondeur/)).

## Détecter le silencieux

Puisque rien ne « plante », la détection se planifie. Le chapitre propose une checklist par granularité : **à chaque dispatch** (le diff correspond-il à la tâche ?), **à chaque vague** (tests + scan de conventions), **à chaque PR** (relecture des points sensibles), **chaque semaine** (tendances : churn, taux d'intervention). Le réflexe transversal : ne jamais accepter un récit de succès sans **preuve déterministe** — tests verts, diff inspecté, fichier relu.

## Le playbook de récupération

Quand c'est cassé malgré tout, six étapes : évaluer et diagnostiquer → sauvegarder ce qui marche → réverser les sections cassées → redécouper le problème → **mettre à jour la primitive fautive** → ré-exécuter sous contraintes. Notez l'étape 5 : chaque incident doit laisser une trace dans votre configuration — sinon vous le revivrez.

## Le mot d'honnêteté

- Dix-neuf, c'est un catalogue, pas une checklist d'angoisse. La plupart des équipes cumulent **trois ou quatre** de ces patterns, pas dix-neuf. Repérez les vôtres, réparez-les dans l'ordre du coût.
- Certains remèdes se contredisent en apparence (committer souvent vs ne pas s'acharner). L'arbitre, c'est toujours le même : l'état committé est-il **testé et cohérent** ? Si oui, avancez ; si non, reculez.

## En résumé

- Les échecs d'agents sont **silencieux** : plausibles, confiants, faux — la détection se conçoit, elle n'arrive pas toute seule.
- Cinq anti-patterns fondamentaux = les **violations de PROSE** ; cinq d'exécution pour les flottes ; neuf d'usure de session.
- Les réflexes qui sauvent : **`git diff` plutôt que le récit**, tester et committer chaque vague, budget de relances, et **réparer la primitive**, pas la sortie.
- Six étapes de récupération, dont une non négociable : l'incident doit améliorer votre configuration.

Demain, dernier épisode : on monte au bureau de la direction — le business case honnête, la gouvernance, les équipes qui changent, et la facture qui varie de 1 à 8,5 selon l'architecture. Et ça, franchement… c'est pas sorcier.
