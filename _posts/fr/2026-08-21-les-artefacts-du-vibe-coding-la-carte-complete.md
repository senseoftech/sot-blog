---
layout: post
title: "Les artefacts du vibe coding : le dépôt qui parle — c'est pas sorcier !"
date: 2026-08-21 10:00:00
author: AClerbois
lang: fr
ref: vibe-coding-artifacts
image: /images/posts/vibe-coding-artifacts.png
tags: [documentation, vibe-coding, agents, AI, best-practices]
level: 100
---

Faites l'expérience : donnez le même prompt à deux agents IA, l'un dans un dépôt nu, l'autre dans un dépôt outillé — des ADR, un glossaire, des schémas, des tests qui racontent le comportement. Le premier devine ; le second **sait**. Même modèle, même prompt, deux résultats sans rapport. La différence ne vient pas de l'IA : elle vient de ce que le dépôt a à lui dire.

Depuis cet été, cette série explore un par un ces artefacts — [les ADR]({{ site.baseurl }}/fr/2026/07/14/adr-memoire-decisions-architecture/), [le glossaire]({{ site.baseurl }}/fr/2026/07/16/le-glossaire-du-domaine/), [les diagrammes as code]({{ site.baseurl }}/fr/2026/07/17/diagrammes-as-code-la-carte-que-l-ia-sait-lire/), [l'historique Git]({{ site.baseurl }}/fr/2026/07/28/l-historique-git-la-memoire-que-votre-ia-lit-deja/). Aujourd'hui, prenons de la hauteur : voici la **carte complète** du dépôt qui parle — et les dix prochains jours pour la parcourir. Vous allez voir : c'est pas sorcier.

<!--more-->

## La thèse : la valeur migre du code vers ses artefacts

Le vibe coding a un effet secondaire que peu de gens formulent : **le code devient regénérable**. Une implémentation qu'un agent réécrit en vingt minutes n'est plus le capital du projet. Le capital, c'est tout ce qui *contraint* et *explique* ce code : les décisions, le vocabulaire, les contrats, les tests, les conventions. Perdez le code, vous le regénérez ; perdez les artefacts, vous regénérez **n'importe quoi**.

D'où la règle qui structure toute la série : chaque artefact vit **dans le dépôt**, versionné, relu en pull request — parce que c'est là, et seulement là, que votre agent le lit à chaque session. Un wiki externe est invisible pour lui ; un fichier Markdown à côté du code est du contexte gratuit.

## La carte : quatre familles

### 1. La mémoire des décisions — le *pourquoi*

| Artefact | Ce qu'il capture | L'article |
| --- | --- | --- |
| **ADR** | une décision prise, ses options, son prix | [déjà publié]({{ site.baseurl }}/fr/2026/07/14/adr-memoire-decisions-architecture/) |
| **RFC / design doc** | une décision *en cours* — le débat organisé | [24 août]({{ site.baseurl }}/fr/2026/08/24/rfc-design-docs-decider-avant-de-coder/) |
| **Historique Git** | les mille petites décisions, commit par commit | [déjà publié]({{ site.baseurl }}/fr/2026/07/28/l-historique-git-la-memoire-que-votre-ia-lit-deja/) |

Le fil rouge de cette famille : la barrière de Chesterton. Un agent qui ignore *pourquoi* une chose existe la démolit avec enthousiasme.

### 2. L'intention — le *quoi*

| Artefact | Ce qu'il capture | L'article |
| --- | --- | --- |
| **Spec** | le comportement attendu, source de vérité | [23 août]({{ site.baseurl }}/fr/2026/08/23/spec-driven-development-la-spec-source-de-verite/) |
| **Template d'issue** | le brief d'une tâche, prêt pour un agent | [déjà publié]({{ site.baseurl }}/fr/2026/08/07/templates-d-issues-le-brief-de-votre-agent/) |
| **Plan d'implémentation** | le *comment*, validé avant le code | [25 août]({{ site.baseurl }}/fr/2026/08/25/le-plan-d-implementation-le-point-de-controle-humain/) |
| **Tests** | la spec exécutable — celle qui ne peut pas mentir | [26 août]({{ site.baseurl }}/fr/2026/08/26/les-tests-la-spec-executable/) |

C'est la famille du contrôle : en vibe coding, on ne relit pas 2 000 lignes de diff — on valide une spec, on amende un plan, on exige des tests verts.

### 3. Les garde-fous — ce qui *s'applique tout seul*

| Artefact | Ce qu'il capture | L'article |
| --- | --- | --- |
| **Schémas et contrats** (OpenAPI, JSON Schema, types) | les frontières machine-vérifiables | [27 août]({{ site.baseurl }}/fr/2026/08/27/schemas-et-contrats-le-contexte-machine-verifiable/) |
| **Linters et analyzers** | les conventions auto-appliquées | [28 août]({{ site.baseurl }}/fr/2026/08/28/linters-analyzers-les-conventions-qui-s-appliquent-toutes-seules/) |
| **Une branche par agent** | l'isolation qui rend les erreurs réversibles | [déjà publié]({{ site.baseurl }}/fr/2026/08/09/une-branche-par-agent-git-a-l-ere-des-agents/) |

La famille préférée des agents : ils ne lisent même pas ces artefacts, ils **se cognent dedans** — et se corrigent tout seuls. Chaque règle automatisée est une instruction de moins à écrire et une remarque de moins en review.

### 4. Le contexte partagé — ce que *tout le monde lit*

| Artefact | Ce qu'il capture | L'article |
| --- | --- | --- |
| **AGENTS.md / instructions** | le guide d'onboarding de l'IA, relu à chaque session | [22 août]({{ site.baseurl }}/fr/2026/08/22/agents-md-le-guide-d-onboarding-de-votre-ia/) |
| **Glossaire du domaine** | le vocabulaire unique, métier ↔ code | [déjà publié]({{ site.baseurl }}/fr/2026/07/16/le-glossaire-du-domaine/) |
| **Diagrammes as code** | la carte du système, éditable par l'agent | [déjà publié]({{ site.baseurl }}/fr/2026/07/17/diagrammes-as-code-la-carte-que-l-ia-sait-lire/) |
| **Runbook** | le mode d'emploi des pannes connues | [déjà publié]({{ site.baseurl }}/fr/2026/08/05/le-runbook-le-mode-d-emploi-que-votre-agent-attend/) |
| **Postmortem** | la mémoire des incidents | [29 août]({{ site.baseurl }}/fr/2026/08/29/le-postmortem-la-memoire-des-incidents/) |
| **llms.txt** | votre doc publiée, pensée pour les agents des autres | [30 août]({{ site.baseurl }}/fr/2026/08/30/llms-txt-la-doc-pensee-pour-les-ia/) |

## Le motif qui revient partout

Relisez n'importe quel épisode déjà publié, vous retrouverez les trois mêmes règles — elles valent pour toute la carte :

1. **L'IA propose, l'humain tranche, le dépôt mémorise.** L'agent excelle à rédiger le brouillon (l'ADR, le glossaire, le postmortem, le diagramme) ; l'humain garde la décision ; le dépôt garde la trace.
2. **La sélectivité fait la valeur.** Dix fiches vivantes battent cent fiches bureaucratiques — un artefact qu'on ne maintient pas devient un mensonge versionné.
3. **Ça valait déjà de l'or avant l'IA.** Aucun de ces artefacts n'a été inventé pour les agents ; ils servaient déjà les humains. Les agents les rendent juste **deux fois rentables** : ce qui aidait le nouveau collègue aide désormais un nouveau collègue qui arrive amnésique *à chaque session*.

## Le mot d'honnêteté

- **N'installez pas les seize d'un coup.** Un dépôt qui passe de zéro artefact à tout l'attirail en une semaine produit surtout de la doc morte. Commencez par ce qui saigne : l'agent nomme mal ? Glossaire. Il défait vos choix ? ADR. Il ignore vos conventions ? AGENTS.md et linters.
- **L'artefact ne remplace pas la conversation.** Une équipe qui ne se parle plus parce que « tout est dans les docs » a un problème que le Markdown ne réglera pas.

## En résumé

- En vibe coding, **le code devient regénérable** ; le capital, ce sont les artefacts qui le contraignent et l'expliquent — tous **dans le dépôt**, versionnés, relus en PR.
- Quatre familles : la **mémoire des décisions** (ADR, RFC, Git), l'**intention** (specs, plans, tests), les **garde-fous** (schémas, linters), le **contexte partagé** (AGENTS.md, glossaire, diagrammes, runbooks, postmortems, llms.txt).
- Partout le même motif : **l'IA propose, l'humain tranche, le dépôt mémorise** — et la sélectivité fait la valeur.
- La suite : **un artefact par jour jusqu'au 30 août**. La carte est dessinée ; en route.

Un dépôt qui parle, c'est un agent qui sait — et un humain qui dort tranquille. Rendez-vous demain pour le premier arrêt : AGENTS.md. Et ça, franchement… c'est pas sorcier.
