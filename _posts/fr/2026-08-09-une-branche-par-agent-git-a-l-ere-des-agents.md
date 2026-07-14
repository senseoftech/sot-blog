---
layout: post
title: "Une branche par agent : Git à l'ère des agents — c'est pas sorcier !"
date: 2026-08-09 10:00:00
author: AClerbois
lang: fr
ref: agentic-branches
image: /images/posts/agentic-branches.png
tags: [git, branching, trunk-based, worktree, AI, coding-agent, best-practices]
level: 200
---

Faites le compte : un dev ouvre deux ou trois branches par semaine. Une équipe de trois devs qui délègue sérieusement — [sous-agents]({{ site.baseurl }}/fr/2026/07/29/copilot-sous-agents-decouper-le-travail/) en local, [coding agent]({{ site.baseurl }}/fr/2026/08/08/coding-agent-github-issue-pull-request/) dans le cloud — peut en produire **quinze par jour**. Votre stratégie de branches a été conçue pour le premier monde. Elle vient de changer d'ordre de grandeur sans vous demander votre avis.

Jusqu'ici, la série a traité les branches comme un détail d'implémentation (l'agent « pousse sa branche », point). Aujourd'hui on retourne la perspective : **la stratégie de branches fait partie du harnais**. C'est elle qui décide où les agents peuvent écrire, comment leur travail rejoint `main`, et à quelle vitesse les chantiers parallèles s'entrechoquent. Vous allez voir : c'est pas sorcier.

<!--more-->

## Le changement d'échelle tue GitFlow

GitFlow — `develop`, branches de release, branches de hotfix, fusions cérémonielles — suppose des branches **longues et rares**. Multipliez les auteurs par les agents et chaque hypothèse casse : quinze branches quotidiennes qui vivent une semaine, c'est la garantie mathématique de conflits en cascade, et un `develop` qui diverge de `main` devient un deuxième monde à re-contextualiser pour chaque agent.

Le modèle qui survit au volume est le plus simple : **trunk-based development**. Une seule branche longue (`main`), des branches de travail **courtes** — des heures ou des jours, jamais des semaines — fusionnées dès que la CI est verte et la revue faite. Moins une branche vit longtemps, moins elle diverge ; moins elle diverge, moins l'intégration coûte. C'est [le vertical slice]({{ site.baseurl }}/fr/2026/07/25/vibe-engineering-vertical-slice-architecture/) appliqué au temps : des tranches fines, intégrées en continu.

La règle d'or à donner à vos agents (et à vos humains) : **une issue = une branche = une PR**. Le brief entre par [le template d'issue]({{ site.baseurl }}/fr/2026/08/07/templates-d-issues-le-brief-de-votre-agent/), le travail sort par la PR — le cycle complet tient dans une journée.

## La branche comme périmètre de confiance

Une branche n'est pas qu'un espace de travail : c'est un **niveau d'autorisation**. Le coding agent GitHub l'illustre déjà — confiné à `copilot/*`, incapable de pousser ailleurs. Généralisez le principe avec une convention de nommage qui dit *qui* a écrit :

| Motif | Auteur | Règles associées |
| --- | --- | --- |
| `feat/*`, `fix/*` | humains | protections standard |
| `copilot/*`, `agent/*` | agents | poussée refusée partout ailleurs, revue humaine **obligatoire** |
| `main` | personne directement | tout passe par PR + CI verte |

L'outillage qui applique tout ça existe déjà dans GitHub : les **rulesets** (protections par motif de branche : revue obligatoire, checks requis, pas de force-push), et **CODEOWNERS** pour router la revue — `docs/adr/` vers les architectes, `*.sql` vers celui qui dort mal quand on migre. Un agent qui dérive ne rencontre pas un rappel à l'ordre : il rencontre un mur. C'est votre principe favori — *doubler la prose par l'outillage* — appliqué à Git.

## La PR : le sas entre le monde machine et main

Dans une équipe augmentée, la pull request change de statut : ce n'est plus *une* étape de qualité parmi d'autres, c'est **le point de passage unique** entre le travail des machines et la branche que tout le monde partage. Deux conséquences pratiques :

- **La taille de PR devient une contrainte de conception.** Quinze PR de 300 lignes se relisent ; trois PR de 3 000 lignes s'approuvent en diagonale — et l'approbation en diagonale de code machine est la définition même du risque. Bornez le périmètre dans l'issue, exigez des tranches fines.
- **La file d'attente devient un vrai sujet.** Quinze PR vertes qui visent `main` le même après-midi, c'est des fusions qui se périment mutuellement. La **merge queue** de GitHub règle le problème : chaque PR est re-testée contre l'état *réel* de `main` avant fusion, dans l'ordre. L'auto-merge (« fusionne quand tout est vert **et approuvé** ») complète — l'humain approuve, la mécanique s'occupe du reste.

## En local : les worktrees, le parallélisme sans les conflits

Le pendant local du « une branche par agent » : les **git worktrees** — plusieurs répertoires de travail sur un même dépôt, chacun sur sa branche. Trois chantiers d'agents en parallèle = trois worktrees : personne n'écrase les fichiers de personne, et votre répertoire principal reste propre pour *votre* travail. [Copilot CLI en a fait une commande]({{ site.baseurl }}/fr/2026/07/24/copilot-cli-4-deleguer-et-automatiser/) (`/worktree`), mais le mécanisme est du Git standard :

```bash
git worktree add ../app-fix-tva copilot/fix-tva-rounding
# ... l'agent travaille dans ../app-fix-tva ...
git worktree remove ../app-fix-tva   # après la fusion
```

L'hygiène qui va avec : un worktree par chantier, supprimé sitôt la PR fusionnée. Les worktrees zombis qui traînent trois semaines recréent exactement la divergence qu'on voulait éviter.

## Le mot d'honnêteté

- **Le goulot n'est plus Git, c'est vous.** Quinze PR par jour se produisent facilement ; elles ne se *relisent* pas facilement. Si la capacité de revue ne suit pas, la pression montera pour approuver vite — résistez, c'est précisément le sas qui protège `main`. Réduire le débit d'agents vaut mieux que dégrader la revue.
- **N'auto-mergez jamais du code d'agent sans revue humaine.** La tentation viendra (« la CI est verte, les tests passent… ») ; [l'article sécurité]({{ site.baseurl }}/fr/2026/07/10/securiser-github-copilot/) a montré pourquoi c'est non. La CI vérifie que ça marche ; la revue vérifie que c'est *ce qu'on voulait*.
- **Le trunk-based exige des tests solides.** Fusionner vite dans `main` n'est sain que si la CI attrape les régressions. Sans filet, les branches courtes propagent les erreurs plus vite — l'outillage d'abord, le débit ensuite.

## En résumé

- Les agents changent l'**ordre de grandeur** : quinze branches par jour. GitFlow s'effondre ; le **trunk-based** avec branches courtes (une issue = une branche = une PR) survit.
- La branche est un **périmètre de confiance** : conventions de nommage par auteur (`copilot/*`), rulesets et CODEOWNERS qui appliquent les règles mécaniquement.
- La **PR est le sas unique** entre machines et `main` : PR petites, revue humaine non négociable, merge queue et auto-merge pour la mécanique.
- En local, **un worktree par chantier** — créé pour la branche, supprimé après fusion.

Votre modèle de branches n'est plus une préférence d'équipe : c'est l'infrastructure qui décide si dix agents vous font gagner dix fois du temps ou perdre dix fois patience. Dessinez-le comme tel — et consignez-le dans un ADR, évidemment. Et ça, franchement… c'est pas sorcier.
