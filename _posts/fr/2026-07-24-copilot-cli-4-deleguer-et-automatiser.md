---
layout: post
title: "GitHub Copilot CLI (4/4) — Déléguer au cloud, paralléliser, automatiser — c'est pas sorcier !"
date: 2026-07-24 10:00:00
author: AClerbois
lang: fr
ref: copilot-cli-4
image: /images/posts/copilot-cli-automation.png
tags: [github, copilot, cli, AI, automation, CI]
level: 300
---

Dernier épisode de la série. Vous savez [pourquoi]({{ site.baseurl }}/fr/2026/07/21/copilot-cli-1-sortez-copilot-de-l-ide/), vous maîtrisez [le quotidien]({{ site.baseurl }}/fr/2026/07/22/copilot-cli-2-le-quotidien/), vous avez [monté l'équipe]({{ site.baseurl }}/fr/2026/07/23/copilot-cli-3-l-equipe-dans-le-terminal/). Reste la dimension qui change le métier : **travailler à plusieurs endroits à la fois** — déléguer au cloud, paralléliser les chantiers en local, planifier des tâches récurrentes, et embarquer l'agent dans vos scripts et votre CI.

C'est l'épisode « multiplication ». Vous allez voir : c'est pas sorcier.

<!--more-->

## Le `&` magique : déléguer au coding agent cloud

Le geste le plus spectaculaire de l'outil tient en un caractère. Préfixez votre demande d'un **`&`** :

> `& corrige les trois warnings de nullabilité dans OrderService et ouvre une PR`

…et la tâche part vers le **Copilot coding agent**, dans le cloud GitHub. Votre terminal est **immédiatement libre** : l'agent distant clone, travaille dans son environnement isolé, pousse une branche, ouvre la pull request. Pendant ce temps, vous continuez autre chose — ou vous fermez le laptop.

- **`copilot --resume`** liste vos sessions **locales et distantes** — on bascule de l'une à l'autre comme entre deux fenêtres.
- **`/delegate --base`** cible même la branche de base de la PR à créer.

La grille de lecture est familière : le travail **local** pour ce qui demande votre supervision fine, la **délégation cloud** pour les tâches balisées et vérifiables. Le stagiaire local, l'équipe au siège — et vous arbitrez.

## Les worktrees : trois chantiers, zéro conflit

Autre forme de parallélisme, en local cette fois : **`/worktree`** crée un git worktree isolé — un clone léger sur une branche dédiée — et y lance le chantier. Trois refactorings en parallèle ? Trois worktrees, trois sessions, **zéro** conflit de fichiers ; votre répertoire principal reste propre. On peut même créer un worktree directement depuis l'écran des pull requests, pour tester une PR sans toucher à son espace de travail.

Ce pattern d'isolation, les lecteurs attentifs l'auront reconnu : c'est celui des agents qui travaillent en parallèle sans se marcher dessus — appliqué à *vos* chantiers.

## `/every` et `/after` : l'agent prend des rendez-vous

Discrète mais délicieuse : la **planification intégrée**, en langage naturel :

> `/every lundi 9h : vérifie les dépendances NuGet obsolètes et résume les mises à jour importantes`
> `/after 2h : relance les tests d'intégration et préviens-moi du résultat`

Cron sans la syntaxe cron. La veille récurrente, les vérifications de fin de journée, le rappel post-déploiement : autant de micro-tâches qui ne dépendent plus de votre mémoire.

## Le mode programmatique : l'agent dans vos scripts

La face cachée de l'outil, et peut-être la plus puissante : `copilot -p` exécute **une tâche sans interface**, à la façon de n'importe quelle commande Unix :

```bash
copilot -p "résume les erreurs de ce fichier de log et propose une cause racine" \
  --silent < build.log
```

Les options qui comptent :

| Option | Ce qu'elle fait |
| --- | --- |
| `-p "…"` | la tâche, en une commande |
| `--silent` | sortie épurée, exploitable dans un pipe |
| `--available-tools` / `--excluded-tools` | la liste blanche/noire d'outils — **le** garde-fou de l'automatisation |
| `--additional-mcp-config` | brancher un serveur MCP pour cette exécution |
| `--share chemin.md` / `--share-gist` | exporter la transcription en Markdown ou en gist |

Et pour la CI : l'authentification s'adapte aux environnements sans navigateur (variable `GITHUB_ASKPASS`, jetons), le proxy HTTPS est géré — l'agent tourne dans un runner GitHub Actions comme sur votre poste.

## L'automatisation responsable : la checklist

Un agent sans supervision, c'est un [conteur qui peut broder]({{ site.baseurl }}/fr/2026/07/19/pourquoi-l-ia-hallucine/) sans personne pour relire. Avant de mettre `copilot -p` dans un cron ou une CI, la checklist de la série :

1. **Périmètre minimal** : `--available-tools` réduit au strict nécessaire — un agent qui résume des logs n'a pas besoin d'écrire des fichiers.
2. **Sandbox et réseau bornés** : la [sandbox OS et les `allowed_urls`]({{ site.baseurl }}/fr/2026/07/22/copilot-cli-2-le-quotidien/) valent aussi — surtout — en automatisation.
3. **Sortie vérifiable** : l'agent propose, un humain (ou un test) dispose — une PR à relire plutôt qu'un push direct, [des évals plutôt que la confiance]({{ site.baseurl }}/fr/2026/07/20/tester-une-application-ia-les-evals/) pour ce qui tourne en boucle.
4. **Traçabilité** : `--share` archive la transcription — qui a fait quoi, et pourquoi.

## En résumé — et fin de série

- **`&`** délègue au cloud (PR à l'arrivée), **`/worktree`** parallélise en local, **`/every`**/**`/after`** planifient — vous n'êtes plus limité à un chantier à la fois.
- **`copilot -p`** + `--silent` + allowlists : l'agent devient une brique de script et de CI, avec transcriptions exportables.
- L'automatisation se **borde** : outils réduits, sandbox, sortie relue, traces.

La série en une phrase : Copilot CLI a commencé comme un chat dans le terminal, c'est devenu **une équipe complète** — briefée par vos [fondations]({{ site.baseurl }}/fr/2026/07/12/vibe-project-fondations-dotnet/), outillée par [vos serveurs MCP]({{ site.baseurl }}/fr/2026/07/13/premier-serveur-mcp-dotnet/), encadrée par des hooks, qui travaille dans votre terminal, dans le cloud et dans votre CI. Pourquoi il faut l'utiliser ? Parce que c'est l'endroit où toutes les briques de ce blog s'assemblent — et qu'au fond, vous le savez maintenant… c'est pas sorcier.
