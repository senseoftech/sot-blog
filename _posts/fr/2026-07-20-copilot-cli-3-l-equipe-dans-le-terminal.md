---
layout: post
title: "GitHub Copilot CLI (3/4) — Agents, skills, plugins, MCP : l'équipe dans le terminal — c'est pas sorcier !"
date: 2026-07-20 10:00:00
author: AClerbois
lang: fr
ref: copilot-cli-3
image: /images/posts/copilot-cli-team.png
tags: [github, copilot, cli, AI, agents, MCP]
level: 200
---

Jusqu'ici, Copilot CLI ressemblait à **un** excellent employé dans votre terminal. Aujourd'hui, changement d'échelle : c'est toute une **équipe** qui s'y cache — des spécialistes intégrés qui travaillent en parallèle, vos propres agents sur mesure, des compétences en fichiers Markdown, des plugins, et bien sûr la prise MCP.

Si vous avez lu [l'article Agent Framework]({{ site.baseurl }}/fr/2026/07/11/microsoft-agent-framework-equipe-agents-ia/), préparez-vous à un déjà-vu assumé : les mêmes idées, déjà en production dans un outil du quotidien. Vous allez voir : c'est pas sorcier.

<!--more-->

## Les spécialistes intégrés : la délégation automatique

Demandez quelque chose d'ambitieux, et regardez la timeline : Copilot CLI ne fait pas tout lui-même. Il **délègue à des agents spécialisés**, qui travaillent en parallèle et ne rapportent que l'essentiel :

| Agent | Sa spécialité | Ce que ça vous épargne |
| --- | --- | --- |
| **Explore** | analyser la codebase, répondre aux questions | l'exploration ne pollue pas votre contexte principal |
| **Task** | lancer builds et tests | résumé bref si ça passe, sortie complète si ça casse |
| **Plan** | bâtir un plan en examinant dépendances et structure | le mode Plan a son moteur dédié |
| **Code-review** | relire les changements | du signal, pas du bruit |

Vous reconnaissez le pattern *agents as tools* : le généraliste délègue au spécialiste, chacun son contexte, chacun sa fiche de poste. Et le clin d'œil de la maison : un agent **Rubber Duck** critique indépendamment votre approche — le canard en plastique du débogage, version IA.

Bonus discret mais puissant : `/subagents` permet de configurer **modèle et effort de raisonnement par agent** — le petit modèle rapide pour explorer, le gros pour planifier. Exactement la promesse « chaque employé son calibre » d'Agent Framework, en production.

## Vos propres agents : le `.agent.md`

Les spécialistes intégrés ne suffisent plus ? Créez les vôtres. Un **custom agent** est un simple fichier `.agent.md` : un nom, des instructions, une liste d'outils autorisés — et le CLI propose même un assistant interactif pour le générer.

L'intérêt est le même que pour [les agents personnalisés de VS Code]({{ site.baseurl }}/fr/2026/07/02/github-copilot-skills-instructions-agents-mcp/) : un « collègue DBA » qui ne touche qu'aux migrations, un « rédacteur de doc » qui n'a pas le droit d'exécuter du code. **Une fiche de poste stricte vaut mieux qu'un généraliste qui déborde** — et le fichier vit dans le dépôt, versionné, partagé avec l'équipe.

## Les skills : des compétences en Markdown

Les **Agent Skills** sont des fichiers Markdown qui décrivent *comment* réaliser une tâche précise (« déployer sur notre staging », « écrire un ADR au format maison ») — chargés automatiquement quand le sujet s'y prête, et **partagés entre les produits Copilot** : le même skill sert dans VS Code et dans le CLI.

- `copilot skill` liste, ajoute, supprime des skills — depuis un fichier, une URL ou un dossier.
- Et la nouveauté qui fait sourire : **Forge** observe vos patterns de travail récurrents et **génère des brouillons de skills** tout seul. L'outil qui documente vos habitudes — on n'arrête pas le progrès.

Skills, instructions, agents : trois étages de la même fusée que vous connaissez [depuis l'article personnalisation]({{ site.baseurl }}/fr/2026/07/02/github-copilot-skills-instructions-agents-mcp/) — désormais complètement disponibles dans le terminal.

## Les plugins : l'écosystème s'ouvre

Nouveau venu de 2026 : les **plugins**. Un plugin empaquette des commandes, des agents, des skills et des configurations MCP, installable en une ligne :

```
/plugin install owner/repo
```

`/plugins` gère l'installé (avec rechargement à chaud, sans redémarrer la session), et un **marketplace** communautaire se construit. La logique est celle des extensions VS Code appliquée à l'agent : vous n'êtes plus limité à ce que GitHub livre — l'écosystème contribue.

## MCP : la prise, côté branchement

Évidemment, la [prise universelle]({{ site.baseurl }}/fr/2026/07/13/premier-serveur-mcp-dotnet/) est de la partie — et c'est ici que la série MCP paie :

- Le **serveur MCP GitHub est intégré d'office** : issues, PR, Copilot Spaces… l'agent a déjà accès à votre écosystème GitHub.
- **`.github/mcp.json`** : posez la configuration dans le dépôt, elle se charge **automatiquement** — toute l'équipe hérite des mêmes branchements. Le serveur stock de [l'article MCP .NET]({{ site.baseurl }}/fr/2026/07/13/premier-serveur-mcp-dotnet/) ? Trois lignes de JSON, et tous vos collègues l'ont.
- **`/mcp`** gère le reste : ajout de serveurs, en-têtes HTTP pour l'authentification, OAuth, et l'affichage du statut sandbox de chaque serveur.

## Les hooks : le règlement intérieur

Dernière brique, pour les équipes : les **hooks** `preToolUse` et `postToolUse` — vos scripts s'exécutent **avant et après chaque appel d'outil**. Bloquer l'accès à un dossier sensible, journaliser toutes les commandes exécutées, imposer une politique d'entreprise : c'est le **middleware** d'[Agent Framework]({{ site.baseurl }}/fr/2026/07/11/microsoft-agent-framework-equipe-agents-ia/), version CLI — le règlement intérieur qui encadre sans toucher aux fiches de poste.

## En résumé

- Copilot CLI délègue déjà tout seul à des **spécialistes parallèles** (Explore, Task, Plan, Code-review… et un canard).
- **`.agent.md`** pour vos propres collègues sur mesure, **skills** en Markdown partagés entre produits (avec Forge qui les rédige), **plugins** installables en une ligne.
- **MCP intégré** (serveur GitHub inclus) et `.github/mcp.json` versionné : les branchements font partie des fondations du dépôt.
- **Hooks** pre/postToolUse : le règlement intérieur, exécutable.

Le terminal héberge désormais une équipe complète — briefée par vos instructions, outillée par vos serveurs MCP, encadrée par vos hooks. Demain, dernier épisode : on délègue au cloud, on parallélise les chantiers et on met tout ça en CI. D'ici là… c'est pas sorcier.
