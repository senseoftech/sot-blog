---
layout: post
title: "GitHub Copilot CLI (2/4) — Sessions, mémoire, modèles : le quotidien — c'est pas sorcier !"
date: 2026-07-19 10:00:00
author: AClerbois
lang: fr
ref: copilot-cli-2
image: /images/posts/copilot-cli-daily.png
tags: [github, copilot, cli, AI, tokens, security]
level: 200
---

[Épisode 1]({{ site.baseurl }}/fr/2026/07/18/copilot-cli-1-sortez-copilot-de-l-ide/) : Copilot CLI est installé, vous connaissez les trois régimes de conduite. Aujourd'hui, on s'installe dans le quotidien — et c'est là que l'outil brille : des sessions qui reprennent où elles s'étaient arrêtées, un contexte qui se gère tout seul, une **mémoire** qui apprend vos conventions, et un garage de modèles qui se change en une commande.

Épisode le plus dense de la série — accrochez-vous, mais vous allez voir : c'est pas sorcier.

<!--more-->

## Les sessions : fermez le terminal, pas la conversation

Une session Copilot CLI survit à tout : fermez le terminal, revenez demain, `copilot --resume` vous liste vos conversations (locales **et** distantes — on verra les distantes à l'épisode 4) et vous reprenez le fil exact — contexte, historique, répertoire de travail compris. Le réflexe `/clear`, lui, remet les compteurs à zéro quand vous changez de sujet.

## Le contexte : la théorie des tokens, appliquée

Souvenez-vous de [l'article sur les tokens]({{ site.baseurl }}/fr/2026/07/05/tokens-llm-envoyes-sortie-cache/) : tout ce qui est dans le contexte se paie à chaque tour, et un contexte obèse dégrade les réponses. Copilot CLI est l'outil qui rend tout ça **visible et actionnable** :

- **`/context`** : la jauge en direct — qui consomme quoi, fichier par fichier, outil par outil. La facture détaillée de l'article tokens, en couleurs dans votre terminal.
- **L'auto-compaction** : à l'approche de 95 % de la fenêtre, l'historique est **résumé automatiquement** en arrière-plan — la conversation continue sans le mur du « contexte plein ».
- **`/compact`** : la même chose, à la demande — avant d'attaquer un gros morceau, faites de la place.

## La mémoire : le collègue qui apprend

La fonctionnalité qui change le rapport à l'outil : Copilot CLI **retient d'une session à l'autre**. Deux étages :

- **Repository memory** : les conventions, patterns et préférences qu'il découvre dans votre codebase (« les tests utilisent xUnit et le triple A », « les endpoints passent par Carter ») sont mémorisés et réutilisés.
- **Cross-session memory** : il peut retrouver ce que vous avez fait dans des sessions passées — « sur quoi travaillait-on la semaine dernière ? » a désormais une réponse.

Vous vous souvenez du duo du [billet vibe engineering]({{ site.baseurl }}/fr/2026/07/12/vibe-project-fondations-dotnet/) — *le prompt exprime, le dépôt mémorise* ? Voici le troisième étage : **l'outil apprend**. Les instructions restent la source de vérité explicite ; la mémoire complète avec l'implicite.

## Le garage de modèles : `/model`

Le CLI donne accès à toute l'écurie : Claude (Opus, Sonnet, Haiku), GPT-5.x et variantes Codex, Gemini, et d'autres qui arrivent au fil des semaines — la liste exacte bouge chaque mois. L'essentiel tient en trois réflexes :

- **`/model`** change de modèle **en pleine session** — cadrez avec un modèle rapide, implémentez avec un costaud, exactement la logique de [l'article « quel modèle choisir »]({{ site.baseurl }}/fr/2026/06/25/quel-modele-choisir-github-copilot/).
- **L'effort de raisonnement se règle** (jusqu'au niveau max sur tous les plans) — et **Ctrl+T** affiche ou masque le raisonnement en direct.
- Les modèles inclus (GPT-5 mini, GPT-4.1) ne consomment **pas de premium requests** : parfaits pour le tout-venant ; gardez les gros calibres pour ce qui les mérite. Et pour l'indépendance totale, le mode BYOK fonctionne toujours — jusqu'au [modèle 100 % local]({{ site.baseurl }}/certificate/2026/06/05/ghco-affranchir-les-tokens/).

Astuce d'équipe : dans un dépôt de confiance, `.github/copilot/settings.json` peut **épingler** modèle, effort et niveau de contexte — les fondations du projet incluent désormais son moteur.

## Le confort qui fait rester

Les petites choses qui font la différence au bout d'une semaine :

- **`/diff`** : les changements de la session, coloration syntaxique fine, recherche intégrée, navigation vim (`g`, `G`, `Ctrl+D`), touche `w` pour masquer les changements d'espaces.
- **`/review`** : une revue de vos modifications *avant* le commit — le réflexe [code review]({{ site.baseurl }}/fr/2026/07/04/copilot-modes-ask-edit-agent-plan/), sans quitter le terminal.
- **`/refine`** : réécrit votre prompt brouillon en prompt soigné — l'outil qui vous apprend à mieux lui parler.
- **`/settings`** : toute la configuration dans un dialogue interactif ; thèmes (dont variantes accessibilité) via `/theme`.

## Les garde-fous : sandbox et périmètre réseau

L'épisode 1 promettait des garde-fous pour l'autopilot — les voici, et ils rappelleront [l'article sécurité]({{ site.baseurl }}/fr/2026/07/10/securiser-github-copilot/) :

- **La sandbox** : `--sandbox` isole les commandes shell au niveau de l'OS. L'agent travaille dans un enclos ; en sortir demande une approbation explicite. Toggle à chaud, y compris en pleine tâche.
- **Le périmètre réseau** : `allowed_urls` / `denied_urls` dans la configuration contrôlent ce que l'agent peut consulter — et les règles s'appliquent aussi à ses `curl` et `wget`. Le moindre privilège, appliqué au web.
- **Les permissions d'outils** persistent par dépôt : ce que vous autorisez dans un projet de confiance ne vaut pas ailleurs.

Autopilot + sandbox + périmètre réseau : c'est le trio qui permet de lâcher la bride **sans** lâcher le contrôle.

## En résumé

| Besoin | La commande |
| --- | --- |
| reprendre le travail d'hier | `copilot --resume` |
| voir qui mange le contexte | `/context` (et `/compact` pour faire le ménage) |
| changer de moteur en route | `/model` (+ effort de raisonnement, Ctrl+T) |
| relire avant de commiter | `/diff`, `/review` |
| mieux formuler | `/refine` |
| lâcher la bride en sécurité | autopilot + `--sandbox` + `allowed_urls` |

- Les **sessions** survivent au terminal ; la **mémoire** survit aux sessions.
- La gestion de contexte de l'article tokens est ici **visible** (`/context`) et **automatique** (compaction à 95 %).
- Le bon modèle pour la bonne tâche, **en pleine session** — et épinglable par dépôt.

Rendez-vous demain pour l'épisode 3 : les agents intégrés, vos propres agents, les skills, les plugins et MCP — le moment où le terminal devient une équipe. D'ici là… c'est pas sorcier.
