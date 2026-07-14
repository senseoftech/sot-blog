---
layout: post
title: "Le plan d'implémentation : le point de contrôle humain — c'est pas sorcier !"
date: 2026-08-25 10:00:00
author: AClerbois
lang: fr
ref: implementation-plans
image: /images/posts/implementation-plans.png
tags: [AI, agents, planning, best-practices]
level: 100
---

Vendredi, 16 h 42. L'agent annonce fièrement : « Fonctionnalité implémentée — 47 fichiers modifiés. » Le diff fait 2 000 lignes. Vous scrollez. Au bout de 300 lignes, vos yeux glissent ; au bout de 800, vous approuvez « de confiance ». Quelque part dans les 1 200 restantes, l'agent a réécrit votre middleware d'authentification. Vous le découvrirez lundi.

Hier, on décidait avant de coder avec [les RFC et design docs]({{ site.baseurl }}/fr/2026/08/24/rfc-design-docs-decider-avant-de-coder/). Aujourd'hui, l'étape suivante sur [la carte des artefacts du vibe coding]({{ site.baseurl }}/fr/2026/08/21/les-artefacts-du-vibe-coding-la-carte-complete/) : le **plan d'implémentation** — le moment précis où l'humain garde la main sur ce que l'agent va faire. Vous allez voir : c'est pas sorcier.

<!--more-->

## Le devis avant les travaux

Personne ne laisse un entrepreneur attaquer les travaux sans devis. Le devis se lit en dix minutes : quels murs, quels matériaux, dans quel ordre, pour quel prix. Et surtout : **on négocie sur le devis**. Une fois le mur monté, la négociation change de nom — elle s'appelle démolition.

Le diff de 2 000 lignes, c'est le mur déjà monté. Le plan de 40 lignes, c'est le devis. Relire l'un prend deux heures — quand on le relit vraiment ; relire l'autre prend deux minutes. Un facteur 100, pour le même pouvoir de décision. Le plan est l'endroit où une minute de votre attention a le **maximum d'effet de levier** : c'est LE point de contrôle humain du vibe coding.

## Le plan mode : lire, proposer, amender, coder

Les outils ont intégré l'idée. GitHub Copilot a son *Plan mode* — déjà croisé dans [l'article sur les modes]({{ site.baseurl }}/fr/2026/07/04/copilot-modes-ask-edit-agent-plan/) — et Claude Code a le sien. La mécanique est la même partout, en quatre temps :

1. **L'agent lit.** Il explore le code en lecture seule : rien n'est modifié.
2. **L'agent propose un plan.** Fichiers, étapes, approche — en clair, avant toute ligne de code.
3. **L'humain amende.** C'est l'étape qui compte : vous barrez, vous précisez, vous réorientez.
4. **Puis seulement, l'agent code** — en suivant le plan validé.

Toute la valeur est à l'étape 3. Sauter du 2 au 4 en tapant « ok vas-y », c'est signer le devis sans le lire.

## Ce qu'un bon plan contient

| Rubrique | La question à laquelle elle répond |
| --- | --- |
| **Objectif** | qu'est-ce qu'on cherche à obtenir, en une phrase ? |
| **Fichiers touchés** | où ça va se passer — et donc, quel rayon d'action ? |
| **Étapes ordonnées** | dans quel ordre — chaque étape compile et passe les tests |
| **Risques** | qu'est-ce qui peut mal tourner, et qu'est-ce qu'on surveille ? |
| **Stratégie de test** | comment saura-t-on que ça marche ? |
| **Hors périmètre** | qu'est-ce qu'on ne fait **pas** — la rubrique en or |

Le « hors périmètre » est le meilleur ami du reviewer : c'est la clôture qui empêche l'agent d'aller « améliorer » trois modules voisins en passant.

## Un exemple concret, en entier

```markdown
# Plan : pagination sur GET /api/policies

## Objectif
Paginer la liste des contrats (aujourd'hui : tout chargé en mémoire,
40 000 lignes en production).

## Fichiers touchés
- Features/Policies/List/ListPoliciesQuery.cs      (paramètres page/pageSize)
- Features/Policies/List/ListPoliciesHandler.cs    (Skip/Take côté SQL)
- Features/Policies/List/ListPoliciesEndpoint.cs   (query string + en-têtes)
- Tests/Policies/ListPoliciesTests.cs

## Étapes (chacune compile et passe les tests)
1. Ajouter page/pageSize à la query, défauts : 1 et 20, pageSize max 100.
2. Basculer le handler sur Skip/Take + CountAsync — vérifier le plan SQL.
3. Exposer X-Total-Count et les liens prev/next dans l'endpoint.
4. Tests : page vide, dernière page, pageSize hors bornes.

## Risques
- L'app mobile appelle cet endpoint sans paramètres : les valeurs par
  défaut doivent reproduire le comportement actuel de la première page.

## Stratégie de test
Tests d'intégration sur base réelle (Testcontainers) — pas de mock d'EF.

## Hors périmètre
- Pas de pagination par curseur (keyset) : ADR à écrire si les perfs l'exigent.
- Pas de tri paramétrable — c'est un autre ticket.
```

Quarante lignes, deux minutes de lecture. Et à la relecture, la ligne « l'app mobile appelle cet endpoint sans paramètres » saute aux yeux — c'est exactement le genre de chose que *vous* savez et que l'agent ignore. Vous amendez une ligne ; il code deux heures.

## Persistez les plans dans le dépôt

Un plan non trivial mérite de survivre à la session : `docs/plans/2026-08-25-pagination-policies.md`, versionné avec le code. Deux bénéfices. En **pull request**, le reviewer lit le plan avant le diff — même effet de levier, une deuxième fois. Et à la **session suivante**, l'agent qui reprend le chantier relit le plan au lieu de re-deviner l'intention : le dépôt re-contextualise, comme pour les ADR.

Et la différence avec [la spec]({{ site.baseurl }}/fr/2026/08/23/spec-driven-development-la-spec-source-de-verite/) ? Simple : la spec dit **quoi** — le comportement attendu, stable dans le temps. Le plan dit **comment et dans quel ordre** — et il est jetable une fois exécuté. Une spec survit à dix plans.

## Pourquoi ça vaut double à l'ère des agents IA

1. **Le plan attrape les mauvaises directions avant qu'elles coûtent.** Un agent parti dans le mauvais sens produit 2 000 lignes fausses avec la même assurance que 2 000 lignes justes. Au stade du plan, la mauvaise direction tient en une ligne — « je vais réécrire le middleware d'auth » — et se corrige en une phrase.
2. **Amender le plan, c'est piloter sans micro-manager.** Entre « je dicte chaque ligne » et « je laisse faire et je prie », le plan est le juste milieu : vous corrigez la trajectoire une fois, en amont, puis vous laissez l'agent dérouler. La formule de la série, en action : **l'IA propose, l'humain tranche, le dépôt mémorise.**
3. **Le plan découpe le travail en étapes vérifiables.** « Chaque étape compile et passe les tests » transforme un pari de 2 000 lignes en quatre paris de 500. Au premier voyant rouge, on sait *quelle étape* a menti — au lieu de fouiller un diff monolithique.

## Le mot d'honnêteté

- **Les plans mentent dès le premier obstacle.** L'étape 2 révélera un problème que personne n'avait vu, et le plan devra bouger. C'est normal : on replanifie. La valeur est dans la *planification* — l'exploration, les risques débusqués — pas dans le document lui-même.
- **Sur-planifier un changement de trois lignes est du théâtre.** Exiger un plan pour corriger une typo, c'est de la bureaucratie déguisée en rigueur. Le plan se mérite : plusieurs fichiers, une direction discutable, un risque réel.
- **Un plan approuvé n'est pas un contrat.** « Mais tu avais validé le plan ! » n'est pas une défense. L'humain reste responsable du diff final — le plan réduit la surface de surprise, il ne remplace pas la relecture.

## En résumé

- Relire un plan coûte **100× moins cher** que relire le diff : négociez sur le **devis**, pas sur le mur déjà monté.
- Le *plan mode* : l'agent **lit** et **propose**, l'humain **amende**, *puis* l'agent code — toute la valeur est dans l'amendement.
- Un bon plan : fichiers touchés, **étapes ordonnées qui compilent et testent une à une**, risques, stratégie de test — et le **hors périmètre**.
- Les plans non triviaux vivent dans **`docs/plans/`** : relus en PR, re-lus par l'agent suivant. La spec dit **quoi** ; le plan dit **comment**.

Deux minutes d'attention au bon moment valent deux heures de scroll résigné au mauvais. Et ça, franchement… c'est pas sorcier.
