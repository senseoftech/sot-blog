---
layout: post
title: "GitHub Copilot CLI (1/4) — Sortez Copilot de l'IDE — c'est pas sorcier !"
date: 2026-07-21 10:00:00
author: AClerbois
lang: fr
ref: copilot-cli-1
image: /images/posts/copilot-cli-terminal.png
tags: [github, copilot, cli, AI, agents, terminal]
level: 100
---

Pour beaucoup, GitHub Copilot vit dans VS Code. Complétion, chat, [modes]({{ site.baseurl }}/fr/2026/07/04/copilot-modes-ask-edit-agent-plan/) — tout se passe dans l'éditeur. Et pendant ce temps, un autre Copilot a grandi ailleurs, plus discret et redoutablement efficace : **GitHub Copilot CLI**, l'agent complet qui vit dans votre terminal. Disponibilité générale depuis février 2026, et un rythme de sorties hebdomadaire depuis.

Cette série en quatre épisodes fait le tour de **tout** ce qu'il sait faire à ce jour. Aujourd'hui : pourquoi le terminal, l'installation, et vos premières sessions. Vous allez voir : c'est pas sorcier.

<!--more-->

## Pourquoi le terminal ? Parce que c'est là que tout se passe

Réfléchissez à votre journée : `git`, `dotnet`, `npm`, `docker`, les scripts, le SSH vers le serveur de test… **L'éditeur n'est qu'une fenêtre ; le terminal est la salle des machines.** Y installer l'agent a des conséquences très concrètes :

- **L'agent est chez lui.** Compiler, tester, lancer, lire les logs : c'est son environnement natif — la boucle *écrire → vérifier → corriger* du [harnais]({{ site.baseurl }}/fr/2026/07/01/le-harnais-de-l-ia-github-copilot/), sans intermédiaire.
- **Il va partout.** Sur votre machine, dans un Codespace, un dev container, en SSH sur une VM — partout où il y a un shell, il y a votre agent.
- **Il se scripte.** Un agent en ligne de commande s'enchaîne, s'automatise, s'intègre en CI (patience, c'est l'épisode 4).
- **Il est indépendant de l'éditeur.** VS Code, Rider, Neovim, rien du tout : peu importe.

Précision utile pour éviter une confusion : ne le mélangez pas avec l'ancienne *extension* `gh copilot` (qui suggérait des commandes shell). Copilot CLI est un **agent autonome complet** — le grand frère du mode Agent de VS Code, en plus musclé.

## Installation : une ligne, trois options

```bash
# Windows
winget install GitHub.Copilot

# macOS / Linux
brew install copilot-cli

# Ou le script officiel
curl -fsSL https://gh.io/copilot-install | bash
```

Ensuite, tapez `copilot` — l'authentification GitHub se fait au premier lancement (flux OAuth). C'est inclus dans les abonnements **Pro, Pro+, Business et Enterprise** (pour les deux derniers, un administrateur doit l'activer dans les politiques de l'organisation). Bonus appréciable : certains modèles comme GPT-5 mini sont inclus **sans consommer de premium requests** — et si le [choix des modèles]({{ site.baseurl }}/fr/2026/06/25/quel-modele-choisir-github-copilot/) vous intrigue, l'épisode 2 y revient.

## Première session : l'agent et le bon de commande

Lancez `copilot` dans un dépôt, et demandez quelque chose de vrai :

> *« Ajoute une validation des e-mails à l'inscription, et mets à jour les tests. »*

L'agent explore le code, propose un plan d'action, puis travaille — et là, réflexe familier pour les lecteurs de la série : **chaque action sensible demande votre approbation.** Lire un fichier ? D'accord d'office. Exécuter `dotnet test` ? Il demande. Modifier un fichier ? Il montre le diff. C'est le principe du [tool approval]({{ site.baseurl }}/fr/2026/07/11/microsoft-agent-framework-equipe-agents-ia/) : le stagiaire remplit le bon de commande, vous signez.

Deux gestes à connaître dès le premier jour :

- **Esc Esc** : la machine à remonter le temps — restaure les fichiers à un instantané précédent. Le droit à l'erreur, intégré.
- **Ctrl+X Ctrl+E** : ouvre votre éditeur pour rédiger un prompt long confortablement.

## Les trois régimes de conduite

Copilot CLI reprend la philosophie des [modes de l'IDE]({{ site.baseurl }}/fr/2026/07/04/copilot-modes-ask-edit-agent-plan/), version terminal — un coup de **Shift+Tab** pour basculer :

| Mode | Qui tient le volant | Quand l'utiliser |
| --- | --- | --- |
| **Normal** | vous validez chaque action | le quotidien, par défaut |
| **Plan** | personne ne code : on cadre | Copilot analyse, pose des questions, produit un plan structuré — avant tout chantier sérieux |
| **Autopilot** | l'agent enchaîne sans s'arrêter | tâches balisées, environnement maîtrisé — avec les garde-fous de l'épisode 2 |

Le mode **Plan** mérite une insistance : c'est exactement le réflexe « comprendre, s'aligner, planifier » du [prompt de base]({{ site.baseurl }}/fr/2026/07/12/vibe-project-fondations-dotnet/) — ici, intégré dans l'outil. Cadrez d'abord, codez ensuite.

## Donnez-lui vos fondations : `/init` et AGENTS.md

Souvenez-vous de la formule : *le prompt exprime les décisions, le dépôt les mémorise.* Copilot CLI la prend au pied de la lettre :

- La commande **`/init`** examine votre projet et génère un fichier d'instructions adapté (conventions, architecture, commandes de build).
- Le CLI lit **AGENTS.md** et vos fichiers d'instructions — les mêmes qui pilotent déjà Copilot dans VS Code. Vos fondations servent une fois de plus.

Dans un dépôt bien équipé (instructions + ADR, comme dans le [billet vibe engineering]({{ site.baseurl }}/fr/2026/07/12/vibe-project-fondations-dotnet/)), l'agent terminal démarre déjà briefé.

## En résumé

- Copilot CLI = **l'agent complet dans le terminal** : là où vivent git, les builds et les scripts — GA depuis février 2026, mises à jour chaque semaine.
- Installation en une ligne (winget/brew/script), inclus dans les abonnements Copilot, authentification GitHub intégrée.
- **Normal, Plan, Autopilot** : trois régimes de conduite, bascule en Shift+Tab — et Esc Esc pour remonter le temps.
- `/init` + AGENTS.md : vos **fondations de dépôt** briefent l'agent dès la première seconde.

Au programme de la suite : l'épisode 2 explore le quotidien (sessions, contexte, mémoire, modèles, sécurité), l'épisode 3 monte l'équipe (agents intégrés, custom agents, skills, plugins, MCP), et l'épisode 4 délègue et automatise (cloud, worktrees, planification, CI). Un agent complet dans le terminal, franchement… c'est pas sorcier.
