---
layout: post
title: "Le coding agent GitHub : l'issue qui revient en pull request — c'est pas sorcier !"
date: 2026-08-08 10:00:00
author: AClerbois
lang: fr
ref: coding-agent
image: /images/posts/coding-agent.png
tags: [github, copilot, coding-agent, AI, automation]
level: 200
---

Dans [le dernier épisode de la série CLI]({{ site.baseurl }}/fr/2026/07/24/copilot-cli-4-deleguer-et-automatiser/), un caractère magique — `&` — envoyait une tâche « au cloud ». Il est temps de rencontrer celui qui la reçoit : le **Copilot coding agent**, le troisième visage de Copilot. L'IDE assiste, le CLI habite votre terminal… et le coding agent, lui, **travaille sur GitHub.com pendant que vous faites autre chose**.

Son mode d'emploi tient en une phrase : *assignez-lui une issue, il revient avec une pull request.* Le reste — où il travaille, comment le briefer, comment le border — c'est le programme du jour. Vous allez voir : c'est pas sorcier.

<!--more-->

## Le flux : une issue entre, une PR sort

Le geste de base est d'une banalité désarmante : sur GitHub, ouvrez une issue et **assignez-la à Copilot** — comme vous assigneriez un collègue (le `&` du CLI et l'interface Agents de github.com mènent au même endroit). Ensuite :

1. L'agent démarre dans un **environnement isolé** sur l'infrastructure GitHub Actions : il clone le dépôt, crée sa branche, configure son poste de travail.
2. Il travaille : explore le code, modifie, compile, teste — [la boucle du harnais]({{ site.baseurl }}/fr/2026/07/01/le-harnais-de-l-ia-github-copilot/), en autonomie complète.
3. Il ouvre une **pull request en brouillon**, avec la description de ce qu'il a fait — et vous demande la revue.
4. Vous commentez la PR ; **il répond aux commentaires par des commits**, comme un collègue distant.

Le point qui change la nature du travail : c'est **asynchrone et parallèle**. Trois issues assignées à 9 h, trois PR à relire à 11 h — pendant que vous étiez en réunion. Ce n'est plus de l'assistance ; c'est de la **délégation**.

## Le brief : une bonne issue est un bon de mission

Vous avez déjà tout appris dans [l'article sous-agents]({{ site.baseurl }}/fr/2026/07/29/copilot-sous-agents-decouper-le-travail/) : le coding agent ne sait que ce que l'issue lui dit — **une issue bien rédigée EST le brief**. La même anatomie s'applique, mot pour mot :

> **[Contexte]** Le endpoint `GET /orders/{id}` renvoie 500 quand l'id n'existe pas (log en pièce jointe).
> **[Mission]** Retourner 404 avec un ProblemDetails, et couvrir le cas par un test.
> **[Contraintes]** Suivre le pattern de la tranche `GetOrderById` ; ne pas toucher aux autres endpoints.
> **[Livrable]** PR avec le correctif + test AAA qui échoue avant / passe après.

Ce qu'il fait bien : les bugs reproductibles, la dette ciblée, les améliorations de couverture, les tâches nettes d'une [tranche verticale]({{ site.baseurl }}/fr/2026/07/25/vibe-engineering-vertical-slice-architecture/) — le périmètre borné, encore lui. Ce qu'on ne lui confie pas : les décisions d'architecture ([elles se prennent avec vous, et se consignent en ADR]({{ site.baseurl }}/fr/2026/07/14/adr-memoire-decisions-architecture/)), le flou (« améliore la perf ») et tout ce dont le critère de succès ne tient pas dans l'issue.

## Son poste de travail se personnalise (et c'est là que tout se joue)

Le coding agent démarre dans un conteneur nu. Trois leviers en font *votre* employé :

- **`AGENTS.md`** — [vos fondations]({{ site.baseurl }}/fr/2026/07/12/vibe-project-fondations-dotnet/), une fois de plus : conventions, architecture, commandes de build et de test. Le même fichier qui briefe l'IDE et le CLI briefe l'agent cloud. *Le prompt exprime, le dépôt mémorise* — jamais formule n'aura autant servi.
- **`.github/workflows/copilot-setup-steps.yml`** — la préparation du poste : préinstaller le SDK .NET, restaurer les packages, provisionner ce qui doit l'être *avant* que l'agent commence, pour qu'il ne perde pas vingt minutes (facturées) à deviner comment builder.
- **Les serveurs MCP** — configurables pour l'agent aussi : [votre serveur stock]({{ site.baseurl }}/fr/2026/07/30/serveur-mcp-en-production/), les outils internes… l'agent cloud a droit aux mêmes prises que l'équipe.

## Les garde-fous : bordé par construction

C'est la partie la plus rassurante du dossier — l'essentiel est **structurel**, pas optionnel :

- Il travaille sur **sa branche**, jamais sur `main` ; ses pushes sont confinés à `copilot/*`.
- La PR reste un **brouillon qui exige votre revue** — et les workflows CI ne se déclenchent qu'avec votre accord : pas d'auto-fusion, pas de déploiement sauvage.
- Un **pare-feu réseau** borne ce que l'environnement peut joindre (et son élargissement est une décision d'admin).
- Les **branch protections** de votre dépôt s'appliquent à lui comme à tout le monde — le règlement intérieur ne connaît pas d'exception.

Autrement dit : le pire scénario réaliste est *une PR médiocre que vous refusez*. C'est le [rayon d'explosion borné]({{ site.baseurl }}/fr/2026/07/25/vibe-engineering-vertical-slice-architecture/), version organisationnelle. Vos réflexes de [l'article sécurité]({{ site.baseurl }}/fr/2026/07/10/securiser-github-copilot/) restent de mise — la revue de PR est *le* point de contrôle, traitez-la comme telle.

**Le mot d'honnêteté**, côté compteur : chaque session consomme des **premium requests** et des **minutes GitHub Actions**. Une issue bien bordée qui aboutit du premier coup est rentable ; dix allers-retours de commentaires sur un brief flou coûtent plus cher que de l'avoir fait soi-même. La qualité du brief n'est pas que de l'hygiène — c'est de l'économie.

## En résumé

- Le coding agent = le **troisième Copilot** : issue assignée → travail en environnement isolé (Actions) → **pull request en brouillon** → itération par commentaires.
- **Une issue bien rédigée est le brief** : contexte, mission, contraintes, livrable — les règles des sous-agents, appliquées à l'échelle GitHub.
- Son poste se prépare : **AGENTS.md** (les fondations), **copilot-setup-steps.yml** (l'environnement), **MCP** (les prises).
- Bordé par construction : branche dédiée, revue obligatoire, pare-feu, branch protections — le pire cas réaliste : une PR refusée.
- Et le compteur tourne (premium requests + minutes Actions) : **le brief soigné est aussi une décision économique**.

La boucle de la série est bouclée : le même employé IA, briefé par les mêmes fondations, vous assiste dans l'IDE, habite votre terminal — et maintenant, prend des tickets pendant que vous dormez. Et ça, franchement… c'est pas sorcier.
