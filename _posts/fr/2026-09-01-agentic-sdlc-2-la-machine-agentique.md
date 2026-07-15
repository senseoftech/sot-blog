---
layout: post
title: "L'Agentic SDLC (2/9) — La machine agentique : les quatre pièces qui exécutent vos prompts — c'est pas sorcier !"
date: 2026-09-01 10:00:00
author: AClerbois
lang: fr
ref: agentic-runtime-machine
image: /images/posts/agentic-runtime-machine.png
tags: [agentic-sdlc, agents, AI, harnais, github-copilot]
level: 200
---

Une équipe soigne pendant des semaines ses fichiers `.instructions.md` pour GitHub Copilot — globs `applyTo` millimétrés, règles par répertoire, le grand jeu. Puis elle essaie Claude Code sur le même dépôt… et l'agent ignore tout. Pas un bug : Claude Code attend des `CLAUDE.md` scopés par la hiérarchie des dossiers, pas des globs dans `.github/instructions/`. Même concept, syntaxe incompatible. Verdict de l'équipe : « l'IA est nulle ». Verdict du handbook : vous venez de découvrir que « l'IA » n'existe pas — il y a **quatre pièces**, et vous n'en avez changé qu'une.

Après [la falaise du vibe coding]({{ site.baseurl }}/fr/2026/08/31/agentic-sdlc-1-la-falaise-du-vibe-coding/), on ouvre le capot avec le chapitre 11 de l'[Agentic SDLC Handbook](https://danielmeppiel.github.io/agentic-sdlc-handbook/handbook/ch11-the-runtime-machine.html) de Daniel Meppiel : la **machine agentique**. Quatre composants indépendants et remplaçables — et un vocabulaire qui transforme « ça marche plus » en diagnostic précis. C'est pas sorcier, promis.

<!--more-->

## Les quatre pièces

| Pièce | C'est quoi | Ce qu'on oublie |
| --- | --- | --- |
| **Le modèle** | le moteur d'inférence (Claude, GPT, Gemini…) : du texte entre, du texte sort | il n'a **ni mémoire, ni outils, ni accès** à votre code — tout lui est apporté |
| **Le harnais** | le programme qui pilote le modèle : ce qui tourne quand vous tapez `claude`, `copilot` ou ouvrez Cursor | c'est lui qui charge les fichiers, appelle les outils, gère la conversation |
| **Le code source d'agent** | vos `AGENTS.md`, `.instructions.md`, `SKILL.md`… | ce n'est pas de la doc : c'est de la **configuration exécutable** |
| **Le client** | ce qui déclenche la session : terminal, IDE, GitHub Action, cron | il injecte le contexte de départ qui ruisselle sur tout le reste |

La plupart des reproches faits « au modèle » visent en réalité une des trois autres pièces. Nous avions déjà croqué le harnais dans [le harnais de l'IA]({{ site.baseurl }}/fr/2026/07/01/le-harnais-de-l-ia-github-copilot/) ; le handbook pousse l'idée un cran plus loin.

## Le harnais est un compilateur

L'histoire d'ouverture n'est pas une anecdote, c'est une loi. Copilot et Claude Code implémentent le **même concept** — des règles scopées injectées automatiquement — avec des **syntaxes incompatibles** :

| Aspect | GitHub Copilot | Claude Code |
| --- | --- | --- |
| Fichier | `api.instructions.md` | `CLAUDE.md` |
| Emplacement | `.github/instructions/` | dans l'arborescence concernée |
| Portée | frontmatter `applyTo` (glob) | hiérarchie des répertoires |
| Références | liens Markdown | directive `@chemin` |

Conclusion du handbook : **changer de harnais, c'est porter du code, pas cocher une case**. Le geste propre consiste à garder des primitives canoniques et à écrire un petit fichier-passerelle au point d'entrée attendu par le nouveau harnais — exactement comme on garde un cœur portable et des adaptateurs par plateforme.

## Le markdown est du code

Vos fichiers d'instructions ont *toutes* les propriétés du code exécutable :

- **parsés** : un frontmatter YAML malformé échoue en silence ;
- **liés** : les références entre fichiers forment un graphe de dépendances ;
- **chargés** : leur contenu entre en contexte à des moments déterministes, observables en mode verbeux ;
- **exécutés** : la précision des mots compte — « n'utilisez jamais X » prévient une régression, « évitez X » autorise la négociation.

Donc : versionnez-les, relisez-les en PR, lintez-les, testez-les. C'est le prolongement direct de ce qu'on écrivait sur [AGENTS.md]({{ site.baseurl }}/fr/2026/08/22/agents-md-le-guide-d-onboarding-de-votre-ia/) — avec un mot d'ordre en plus : écrivez ces fichiers avec l'exigence du code, pas le relâchement de la doc.

## L'asymétrie qui commande tout : l'inférence est par thread, le filesystem est partagé

C'est LE principe porteur du livre, celui dont découlent tous les patterns des épisodes suivants. Chaque session d'inférence est **amnésique** : une fenêtre privée, qui meurt avec la session, sans rien transmettre. Le **système de fichiers**, lui, est la seule mémoire persistante et partagée.

Conséquences très concrètes :

- deux agents en parallèle ne peuvent pas se parler : ils se coordonnent **exclusivement par fichiers** ;
- un agent enfant n'hérite de rien — il ne lit que ce que le parent a **écrit sur disque** ;
- les longues sessions exigent le pattern **plan-write-then-reload** : écrire le plan dans un fichier en cours de route, le relire aux points de décision, pour survivre aux frontières d'inférence.

Vous reconnaissez la mécanique de nos [sous-agents Copilot]({{ site.baseurl }}/fr/2026/07/29/copilot-sous-agents-decouper-le-travail/) ? C'est elle — généralisée en principe d'architecture.

## Ce que ça change lundi matin

1. **Un vocabulaire de diagnostic.** Comportement différent entre deux postes, deux outils, deux jours ? Demandez *laquelle des quatre pièces a changé* avant d'accuser « l'IA ».
2. **Un budget de contexte à surveiller.** Un skill qui ne se déclenche pas, c'est souvent un fichier parent qui a mangé le budget avant lui — la fermeture transitive de vos primitives se mesure.
3. **Une discipline d'ingénierie sur les primitives.** Revue, lint, CI : vos fichiers d'agent sont du code de prod.

## Le mot d'honnêteté

- Le découpage en quatre pièces est le **vocabulaire du handbook**, pas un standard de l'industrie — chaque éditeur renomme tout à sa sauce. C'est justement ce qui le rend utile : il survit aux renommages.
- La portabilité progresse (le handbook pointe l'émergence de standards côté skills), mais aujourd'hui, un portage entre harnais reste un vrai chantier. Budgétez-le comme tel.

## En résumé

- « L'IA » = **modèle + harnais + code source d'agent + client**. Quatre pièces indépendantes, remplaçables — et quatre suspects distincts quand ça déraille.
- **Le harnais est un compilateur** : mêmes concepts, syntaxes incompatibles ; changer d'outil est un portage.
- **Le markdown est du code** : parsé, lié, chargé, exécuté — traitez-le avec la même rigueur.
- **L'inférence est par thread, le filesystem est partagé** : toute coordination multi-agents passe par des fichiers ; d'où le pattern plan-write-then-reload.

Demain, on équipe le dépôt : les **sept primitives** du codebase instrumenté — instructions, agents, skills, prompts, mémoire, specs, hooks — et comment elles s'emboîtent. Et ça, franchement… c'est pas sorcier.
