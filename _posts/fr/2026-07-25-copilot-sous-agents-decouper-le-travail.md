---
layout: post
title: "Les sous-agents de GitHub Copilot : découper pour mieux régner — c'est pas sorcier !"
date: 2026-07-25 10:00:00
author: AClerbois
lang: fr
ref: copilot-subagents
image: /images/posts/copilot-subagents.png
tags: [github, copilot, cli, AI, agents, prompts]
---

Dans [l'épisode 3 de la série Copilot CLI]({{ site.baseurl }}/fr/2026/07/20/copilot-cli-3-l-equipe-dans-le-terminal/), on a rencontré l'équipe : Explore, Task, Plan, Code-review, et vos propres agents en `.agent.md`. Plusieurs lecteurs m'ont fait le même retour : *« d'accord, l'équipe existe — mais comment je m'en sers, concrètement ? »*

Aujourd'hui, le mode d'emploi complet : **comment fonctionne un sous-agent sous le capot**, comment découper une vraie tâche de développement sur tout son cycle de vie, et — le morceau que vous attendez — **des prompts prêts à l'emploi pour chaque sous-agent**. Vous allez voir : c'est pas sorcier.

<!--more-->

## Sous le capot : un employé en mission, pas un collègue au courant

Un sous-agent, mécaniquement, c'est **une conversation séparée** : son propre contexte ([son propre bureau]({{ site.baseurl }}/fr/2026/07/23/fenetre-de-contexte-compresser-oublier/)), sa fiche de poste, ses outils autorisés — et depuis `/subagents`, son propre modèle et son effort de raisonnement. Le cycle de vie tient en trois temps :

1. **Le brief** : l'agent principal (ou vous) lui confie une mission, avec les informations qu'il juge utiles.
2. **La mission** : le sous-agent travaille en isolation — il explore, exécute, lit ce qu'il veut… dans *son* contexte.
3. **La synthèse** : il rend **un** rapport. Tout le reste — ses 50 000 tokens d'exploration — meurt avec lui.

Et de cette mécanique découle **la règle qui change tout** : le sous-agent **ne voit pas votre conversation**. Il ne sait *que* ce que le brief lui dit. Symétriquement, vous ne saurez *que* ce que sa synthèse rapporte. Un sous-agent n'est pas un collègue au courant du projet — c'est **un prestataire en mission** : la qualité du résultat est plafonnée par la qualité du bon de mission.

Pourquoi s'infliger ça ? Vous connaissez déjà les trois réponses : le **contexte préservé** (l'exploration ne pollue jamais votre bureau principal), le **parallélisme** (plusieurs missions en même temps), et la **spécialisation** (une fiche de poste étroite exécute mieux qu'un généraliste débordé).

## Le découpage type : une fonctionnalité, six missions

Prenons le fil rouge de [l'article sur les tranches verticales]({{ site.baseurl }}/fr/2026/07/22/vibe-engineering-vertical-slice-architecture/) : *ajouter `AddOrderNote`* — une note texte sur une commande. Voici le cycle de vie complet, découpé en missions :

| Phase | Sous-agent | Sa mission | Ce qu'il rend |
| --- | --- | --- | --- |
| 1. Explorer | **Explore** | comprendre l'existant | la carte du terrain |
| 2. Cadrer | **Plan** | produire le plan | un plan numéroté, **écrit dans un fichier** |
| 3. Implémenter | le principal (ou un agent par tranche) | coder en suivant le plan | le code |
| 4. Vérifier | **Task** | build + tests | verdict bref, ou les erreurs |
| 5. Relire | **Code-review** | chasser les vrais problèmes | max 5 findings classés |
| 6. Consigner | un agent custom docs | ADR + doc de la feature | les fichiers mis à jour |

Remarquez le point 2 : le plan est **écrit dans un fichier** (`docs/plans/add-order-note.md`), pas seulement dit en conversation. C'est LE pattern central du travail multi-agents — [l'externalisation]({{ site.baseurl }}/fr/2026/07/23/fenetre-de-contexte-compresser-oublier/) appliquée à la coordination : **le fichier plan devient la mémoire partagée** que chaque mission suivante reçoit en référence. Les sous-agents ne partagent pas de contexte ; ils partagent des fichiers.

## Les prompts, phase par phase

L'anatomie d'un bon brief tient en quatre blocs — parce que le sous-agent part de zéro, chaque bloc compte : **[Contexte] [Mission] [Contraintes] [Livrable]**.

**Phase 1 — Explore** (comprendre avant de toucher) :

> Explore `Features/Orders/` et la tranche `CreateOrder` en particulier.
> **Mission** : comprendre le pattern d'une tranche verticale dans ce projet.
> **Livrable** : la liste des fichiers types d'une tranche avec leur rôle, les conventions de nommage, et les pièges spécifiques que tu repères (validation, transactions…).
> **Ne propose pas encore de solution** — je veux la carte, pas l'itinéraire.

**Phase 2 — Plan** (cadrer, et écrire le plan sur disque) :

> **Contexte** : voir la synthèse d'exploration ci-dessus. On ajoute `AddOrderNote` : une note texte (max 500 caractères) sur une commande existante.
> **Mission** : produis un plan d'implémentation en suivant la tranche `CreateOrder` comme modèle.
> **Contraintes** : aucune nouvelle dépendance NuGet ; la commande échoue si la commande cible n'existe pas ; tests AAA inclus.
> **Livrable** : écris le plan dans `docs/plans/add-order-note.md` — étapes numérotées, fichiers à créer, et une section « questions ouvertes » si tu en as.

**Phase 3 — Implémentation** (le principal garde la main, le plan sert de contrat) :

> Implémente les étapes 1 à 4 de `docs/plans/add-order-note.md`.
> **Contraintes** : ne touche qu'à `Features/Orders/AddOrderNote/` ; reproduis la structure de `CreateOrder` ; si le plan s'avère faux sur un point, arrête-toi et dis-le au lieu d'improviser.

Trois fonctionnalités indépendantes ? Trois tranches, trois [worktrees, trois agents en parallèle]({{ site.baseurl }}/fr/2026/07/21/copilot-cli-4-deleguer-et-automatiser/) — le parallélisme n'est sûr que si les périmètres sont **disjoints**, et c'est exactement ce que les tranches garantissent.

**Phase 4 — Task** (vérifier, sans noyer le contexte) :

> Lance `dotnet build` puis `dotnet test` sur la solution.
> **Livrable** : si tout est vert, réponds « OK » avec le nombre de tests et la durée. Sinon, les **trois premières erreurs** avec fichier:ligne et ton hypothèse de cause — pas le log complet.

**Phase 5 — Code-review** (du signal, pas du bruit) :

> Relis le diff de la branche courante par rapport à `main`.
> **Focus** : gestion d'erreurs, validation des entrées, cohérence avec la tranche modèle `CreateOrder`, et tout écart au plan `docs/plans/add-order-note.md`.
> **Livrable** : maximum 5 findings, classés par gravité, chacun avec fichier:ligne et une proposition. **Ignore le style** — les analyzers s'en chargent.

**Phase 6 — l'agent docs** (votre premier custom agent) :

```markdown
---
name: docs-writer
description: Rédige ADR et documentation de feature, ne touche jamais au code.
tools: ['read', 'edit']
---
Tu es le documentaliste du projet. Tu rédiges des ADR au format maison
(contexte, options, décision, conséquences — voir docs/adr/) et tu mets à
jour la doc des features. Tu n'écris jamais de code. Réponds en français.
```

Puis le brief : *« Lis `docs/plans/add-order-note.md` et le diff. S'il y a une décision structurante, rédige l'ADR ; sinon dis pourquoi non. Mets à jour le README de la feature. »* Notez la ligne `tools` : le documentaliste **ne peut pas** exécuter de code — [le moindre privilège]({{ site.baseurl }}/fr/2026/07/10/securiser-github-copilot/), appliqué à l'équipe interne.

## Les pièges honnêtes

- **Le sur-découpage.** Six sous-agents pour renommer une variable : chaque mission repart de zéro (re-exploration, re-lecture), l'overhead dépasse le gain. Le bon critère : déléguez quand **le volume de travail intermédiaire polluerait votre contexte principal** — pas pour le plaisir de l'organigramme.
- **Le brief pauvre.** « Regarde le code et dis-moi ce que tu en penses » → synthèse inutilisable, à tous les coups. Relisez la règle d'or : il ne sait *que* ce que le brief dit.
- **La perte entre phases.** Une synthèse est [une perte choisie]({{ site.baseurl }}/fr/2026/07/23/fenetre-de-contexte-compresser-oublier/) — si une nuance compte, exigez-la dans le livrable, ou faites-la écrire dans le fichier plan. Les fichiers survivent ; les conversations non.
- **Le faux parallélisme.** Deux agents dans les mêmes fichiers = conflits garantis. Parallélisez par tranches, jamais par couches.

## En résumé

- Un sous-agent = **un prestataire en mission** : contexte isolé, fiche de poste, une synthèse en retour — il ne sait que ce que le brief dit.
- Le cycle de vie se découpe naturellement : **Explore → Plan → implémentation → Task → Code-review → docs**, chaque phase avec son spécialiste.
- Le brief type : **[Contexte] [Mission] [Contraintes] [Livrable]** — et le livrable précise le *format* (« max 5 findings », « OK ou 3 erreurs »).
- Le pattern qui tient tout : **le plan écrit dans un fichier**, mémoire partagée entre missions.
- Découpez quand ça protège votre contexte, parallélisez quand les périmètres sont disjoints — les tranches verticales garantissent les deux.

Un projet mené par sous-agents, c'est une entreprise qui tourne aux bons de mission : brief clair, livrable défini, rapport concis — et un classeur de plans que tout le monde consulte. Et ça, franchement… c'est pas sorcier.
