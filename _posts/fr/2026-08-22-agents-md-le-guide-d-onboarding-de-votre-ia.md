---
layout: post
title: "AGENTS.md : le guide d'onboarding de votre IA — c'est pas sorcier !"
date: 2026-08-22 10:00:00
author: AClerbois
lang: fr
ref: agent-instructions
image: /images/posts/agent-instructions.png
tags: [documentation, agents, AI, best-practices]
level: 100
---

Lundi, 9 h. Le nouveau arrive. Vous lui montrez tout : la commande de build, les conventions maison, la table qu'il ne faut surtout pas renommer. Il est brillant, il code vite, la journée se passe à merveille. Mardi, 9 h. Il revient… et ne se souvient de rien. Ni du build, ni des conventions, ni de la table. Vous réexpliquez tout. Mercredi ? Pareil. Ce collègue existe : c'est votre agent IA, amnésique chaque matin.

Hier, [la carte complète des artefacts du vibe coding]({{ site.baseurl }}/fr/2026/08/21/les-artefacts-du-vibe-coding-la-carte-complete/) posait le décor. Premier arrêt de la carte, et pas par hasard : le **fichier d'instructions d'agent** — le carnet d'accueil que votre collègue amnésique relit à chaque session. Vous allez voir : c'est pas sorcier.

<!--more-->

## Le collègue qui recommence à zéro chaque matin

Un agent IA ne garde rien d'une session à l'autre. La conversation d'hier — où vous avez expliqué trois fois que les tests d'intégration exigent Docker — est effacée. Chaque session repart d'une page blanche : mêmes questions, mêmes suppositions, mêmes erreurs, mêmes corrections. Vous, vous vous en souvenez ; lui, non.

Avec un humain, ce problème est résolu depuis longtemps : le guide d'onboarding. On l'écrit une fois, le nouveau le lit, on ne réexplique plus. La seule différence avec l'IA, c'est que *votre* nouveau doit relire le guide **tous les matins**. Bonne nouvelle : relire sans se lasser, c'est précisément ce qu'un agent fait mieux que quiconque.

## Le carnet d'accueil : AGENTS.md et ses cousins

Le remède tient dans un fichier Markdown **à la racine du dépôt**, que l'agent lit automatiquement au début de chaque session. Le standard émergent s'appelle **AGENTS.md** (décrit sur agents.md) — « un README pour les agents », adopté par de nombreux outils. Ses cousins font le même métier sous d'autres noms : `CLAUDE.md` pour Claude Code, `.github/copilot-instructions.md` pour GitHub Copilot.

Le nom exact importe peu ; l'idée est partout identique : tout ce que vous répétez à l'agent en début de session a sa place dans ce fichier — et n'a plus besoin d'être répété.

## Un exemple complet : vingt lignes pour un projet .NET

```markdown
# MyShop — instructions d'agent

## Build & tests
- Build : `dotnet build MyShop.sln` (racine du dépôt, .NET 9).
- Tests locaux : `dotnet test --filter Category!=Integration`.
  Les tests d'intégration exigent Docker : `docker compose up -d db`.
- Avant tout commit : `dotnet format --verify-no-changes`.

## Conventions
- CQRS léger : une commande OU une requête par fonctionnalité,
  handler dédié dans `src/Features/<Domaine>/` (voir ADR-0007).
- Nommage métier : suivre `docs/glossaire.md` — l'assuré est
  `Customer`, jamais `Client`.
- Pas de `DateTime.Now` : injecter `TimeProvider`.

## Pièges connus
- La table `TIERS` est un héritage ERP : ne jamais la renommer.
- `appsettings.Development.json` n'est pas versionné : partir de
  `appsettings.Template.json`.

## Définition de « fini »
Build vert, tests verts, format vérifié — et si la décision est
structurante, un ADR dans `docs/adr/`.
```

Vingt lignes, quatre rubriques : les **commandes exactes** (celles qui marchent, avec leurs prérequis), les **conventions non déductibles du code**, les **pièges connus**, et la **définition de « fini »**. Remarquez les renvois : le fichier ne duplique ni [les ADR]({{ site.baseurl }}/fr/2026/07/14/adr-memoire-decisions-architecture/) ni [le glossaire]({{ site.baseurl }}/fr/2026/07/16/le-glossaire-du-domaine/) — il pointe vers eux.

## Quoi mettre — et surtout quoi laisser dehors

Chaque ligne de ce fichier est relue **à chaque session** et coûte des tokens à chaque fois. Une ligne qui n'évite pas une erreur est une ligne qui dilue les autres. Le test :

| Dans le carnet d'accueil ? | Verdict |
| --- | --- |
| Les commandes **exactes** de build et de test, avec leurs prérequis | ✅ oui |
| Les conventions **non déductibles du code** (« pas de `DateTime.Now` ») | ✅ oui |
| Les **pièges connus** (« `TIERS`, ne pas renommer ») | ✅ oui |
| La définition de « **fini** » (build, tests, format, ADR) | ✅ oui |
| Ce que le code dit déjà (l'arborescence, la liste des projets) | ❌ non |
| La prose d'ambiance (« nous valorisons la qualité ») | ❌ non |

La règle des autres artefacts s'applique ici plus fort que partout : dix consignes importantes battent cent consignes bureaucratiques.

## Racine + dossiers : les instructions en poupées russes

Un seul fichier pour tout un monolithe, ça finit par déborder. La parade : la **hiérarchie**. Un `AGENTS.md` à la racine pour le global (build, définition de « fini »), et un par dossier pour le local — `src/Features/AGENTS.md` pour les conventions CQRS, `tests/AGENTS.md` pour les conventions de test. L'agent applique le fichier le plus proche du code qu'il modifie. Règle simple : le général à la racine, le spécifique au plus près du code.

## Pourquoi ça vaut double à l'ère des agents IA

Trois raisons — et ici, le « double » est presque un euphémisme :

1. **C'est l'artefact le plus directement lu de toute la carte.** Les ADR, le glossaire, les diagrammes : l'agent les lit *s'il* les trouve. Le fichier d'instructions, lui, est chargé d'office au début de chaque session. C'est donc la porte d'entrée vers tout le reste : une ligne « consulte `docs/adr/` avant de toucher à l'architecture » suffit à brancher la mémoire longue. Pour la mécanique précise côté Copilot — instructions, skills, agents — voir [l'article dédié]({{ site.baseurl }}/fr/2026/07/02/github-copilot-skills-instructions-agents-mcp/).
2. **La règle d'or : corrigé deux fois = une ligne.** Chaque remarque que vous répétez une deuxième fois en review d'une PR d'agent doit devenir une ligne du fichier. La review cesse d'être une corvée récurrente pour devenir un investissement : **l'IA propose, l'humain tranche, le dépôt mémorise** — et la même erreur ne revient pas une troisième fois.
3. **Il transforme l'amnésie en atout.** Un humain qui relirait le guide d'onboarding chaque matin, ce serait du gâchis. Un agent, lui, applique le carnet à la lettre dès la première minute, à chaque session, sans lassitude ni interprétation personnelle. Le même onboarding, parfaitement reproductible — pour le deuxième agent comme pour le deux-centième.

## Le mot d'honnêteté

- **Le fichier dérive.** Personne ne le relit spontanément, et une commande de build qui a changé le rend faux en silence. Le réflexe : quand l'agent se trompe, relisez d'abord le fichier — la consigne manquante ou périmée s'y cache souvent.
- **Trop long = dilué.** Un fichier de trois cents lignes noie les trois consignes vitales dans le bruit — et l'agent, comme un lecteur pressé, retient mal le milieu. Élaguer est un acte de maintenance, pas un sacrilège.
- **Ce n'est pas de la magie.** Une instruction n'est pas une contrainte : l'agent *peut* l'ignorer, surtout si elle est noyée. Les conventions vraiment non négociables méritent en plus un garde-fou exécutable — un analyzer, un test qui échoue.

## En résumé

- Votre agent IA est un collègue **amnésique chaque matin** : le fichier d'instructions est le carnet d'accueil qu'il relit à chaque session.
- **AGENTS.md** (et ses cousins `CLAUDE.md`, `copilot-instructions.md`) contient les **commandes exactes**, les **conventions non déductibles**, les **pièges connus** et la définition de « **fini** » — pas ce que le code dit déjà, chaque ligne coûtant des tokens à chaque session.
- **Hiérarchique** : le général à la racine, le spécifique dans un fichier par dossier, au plus près du code.
- La règle d'or : **toute correction répétée deux fois en review devient une ligne du fichier** — l'IA propose, l'humain tranche, le dépôt mémorise.

Vingt lignes de Markdown, relues chaque matin sans broncher par le collègue le plus assidu de l'équipe. Et ça, franchement… c'est pas sorcier.
