---
layout: post
title: "L'Agentic SDLC (7/9) — Orchestrer une flotte d'agents : vagues et points de contrôle — c'est pas sorcier !"
date: 2026-09-06 10:00:00
author: AClerbois
lang: fr
ref: agentic-sdlc-orchestration
image: /images/posts/agentic-sdlc-orchestration.png
tags: [agentic-sdlc, agents, AI, orchestration, multi-agents]
level: 300
---

Comment écrit-on un livre de 68 000 mots avec des agents IA ? Exactement comme on livre une PR de 75 fichiers : des **vagues**, des **points de contrôle**, et jamais deux agents sur le même fichier. L'[Agentic SDLC Handbook](https://danielmeppiel.github.io/agentic-sdlc-handbook/handbook/ch17-multi-agent-orchestration.html) de Daniel Meppiel a une élégance rare : il est **sa propre étude de cas** — onze agents, quatre pods, une flotte orchestrée par son auteur avec la méthode que le texte enseigne.

Après [la frontière déterministe]({{ site.baseurl }}/fr/2026/09/05/agentic-sdlc-6-la-frontiere-deterministe-probabiliste/), voici les chapitres 17 et 18 : quand passer au multi-agents, comment découper, et le méta-processus en cinq phases qui transforme une flotte en logiciel livré. Nous avions posé les bases avec [les sous-agents Copilot]({{ site.baseurl }}/fr/2026/07/29/copilot-sous-agents-decouper-le-travail/) ; on change ici d'échelle. C'est pas sorcier.

<!--more-->

## D'abord : en avez-vous besoin ?

Le chapitre 17 commence par doucher l'enthousiasme :

| Un seul agent suffit si… | Une flotte se justifie si… |
| --- | --- |
| moins de ~10 fichiers | 15-20 fichiers et plus |
| une seule préoccupation | des préoccupations qui se croisent (archi + logs + sécurité) |
| dépendances linéaires | du parallélisme qui ferait vraiment gagner du temps |
| le contexte tient à l'aise dans la fenêtre | des domaines d'expertise distincts à mobiliser |

Trois patterns de spécialisation reviennent : **rédacteur/relecteur/testeur** (séparer production et validation), **équipes par domaine** (chacune porte son contexte spécialisé), et **audit/exécution/validation** (des agents en lecture seule explorent, l'humain décide, des agents en écriture appliquent).

## La règle d'or et la vérité partagée

Une seule contrainte de parallélisation est non négociable : **un fichier, un agent, par vague**. Deux agents sur le même fichier, et les éditions du second échouent en silence — ses repères textuels ont bougé.

Et souvenez-vous de [l'épisode 2]({{ site.baseurl }}/fr/2026/09/01/agentic-sdlc-2-la-machine-agentique/) : les sessions sont amnésiques et isolées — l'agent 1 ne voit ni la conversation ni le raisonnement de l'agent 2. La coordination passe par **l'état committé** : entre deux vagues, le dépôt devient la vérité de référence que la vague suivante lit. D'où l'ordre impératif : les **fondations avant les consommateurs** — types, protocoles et interfaces en vague 0, implémentations ensuite — pour éviter les conflits *sémantiques*, ces changements corrects isolément mais incohérents ensemble.

## Le méta-processus : cinq phases

Le chapitre 18 assemble le tout en un flux universel, indépendant de l'outil :

1. **Audit** — 2 à 4 agents experts en lecture seule examinent le code sous des angles distincts et rendent des constats classés, cités fichier et ligne.
2. **Plan** — l'humain transforme les constats en spec exécutable : périmètre, équipes, vagues, principes. C'est **le point de plus fort impact** : un plan médiocre parfaitement exécuté donne du logiciel médiocre. Chaque tâche passe le **test d'autosuffisance** — réalisable sans question ? sinon, redécoupez. (Écho direct à [notre plan d'implémentation]({{ site.baseurl }}/fr/2026/08/25/le-plan-d-implementation-le-point-de-controle-humain/).)
3. **Vagues** — exécution parallèle, un fichier par agent ; chaque vague se termine **testée et committée**.
4. **Validation** — suite complète + inspection humaine des changements critiques.
5. **Ship** — merge, changelog, et un historique **bisectable** : un commit par vague, tests verts à chaque étape.

Quand un point de contrôle casse, la boucle **ADAPT** prend le relais : diagnostiquer, ajuster le plan, ré-exécuter — l'incertitude fait partie du contrat avec un système probabiliste. Et le processus **s'adapte à l'échelle** : moins de 10 fichiers, compressez tout (un audit, une vague) ; plus de 100, étendez (4-6 experts, 6-10 vagues).

## Les escalades et la taxe de coordination

L'humain orchestrateur gère quatre niveaux d'escalade : **L1** l'agent s'auto-répare (tests rouges), **L2** relance affinée par l'humain, **L3** décision de design, **L4** extension de périmètre. Le baromètre du handbook : un plan sain tourne autour de 20 % de L3/L4 ; **au-delà de 25 %, c'est le plan qui était sous-spécifié**, pas les agents qui sont mauvais.

Et les chiffres honnêtes de la PR de référence (75 fichiers) : **45 minutes de coordination humaine** pour 24 minutes de calcul d'agents. Le gain n'est pas la vitesse brute — c'est d'avoir remplacé 30 à 45 minutes de débogage d'une sortie mono-agent dégradée par de la qualité contrôlée en amont. Le multi-agents se rentabilise quand les fichiers se comptent en dizaines, que les préoccupations se partitionnent proprement et que le pattern va se répéter.

## La preuve par le livre

Le case study du handbook raconte sa propre écriture : **11 agents en 4 pods** (éditorial, domaine, review, audit), ~50 dispatches, 4 vagues d'écriture, 75 signalements de fact-checking, 4 escalades humaines. Trois leçons savoureuses : un agent unique a explosé en vol sur l'architecture des 15 chapitres (contexte fini, toujours) ; trois personas ont été créés **en cours de route** en réponse à des manques réels ; et le désaccord du panel sur la place à donner à APM (l'outil de l'auteur !) s'est dissous dès que l'éditeur en chef a énoncé un principe explicite — le livre doit être utile sans APM, qui n'apparaît que comme preuve. **Un principe écrit vaut mille arbitrages implicites.**

## Le mot d'honnêteté

- La taxe de coordination est réelle et le handbook la chiffre lui-même. Une flotte pour un changement de 50 lignes est un anti-pattern (le chapitre 27 le dit crûment) — commencez mono-agent, passez en flotte sur les critères ci-dessus.
- L'orchestration décrite est encore **artisanale** : c'est l'humain qui cadence les vagues. Les harnais automatisent progressivement — mais les invariants (un fichier/un agent, commit par vague, fondations d'abord) restent valables quel que soit l'outillage.

## En résumé

- Multi-agents seulement si : **15-20+ fichiers, préoccupations croisées, parallélisme rentable, expertises distinctes**.
- Règle d'or : **un fichier, un agent, par vague** — et l'état committé comme seule vérité partagée entre vagues.
- Le méta-processus : **audit → plan → vagues → validation → ship**, avec la boucle ADAPT en cas de casse ; le plan est le point de plus fort impact humain.
- Escalades L1-L4 : au-delà de 25 % de L3/L4, refaites le plan.
- La preuve d'existence : le handbook lui-même, écrit par 11 agents sous direction éditoriale humaine.

Demain, la galerie des horreurs : **dix-neuf anti-patterns** — du prompt monolithe à l'agent qui jure avoir modifié des fichiers intacts. Vous allez vous reconnaître (moi aussi). Et ça, franchement… c'est pas sorcier.
