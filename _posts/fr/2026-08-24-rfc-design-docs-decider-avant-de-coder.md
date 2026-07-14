---
layout: post
title: "RFC et design docs : décider avant de coder — c'est pas sorcier !"
date: 2026-08-24 10:00:00
author: AClerbois
lang: fr
ref: design-docs
image: /images/posts/design-docs.png
tags: [architecture, documentation, RFC, AI, best-practices]
level: 100
---

Réunion d'architecture, mardi 14 h. Six personnes, une heure, un sujet : « comment on gère le multi-tenant ? ». Deux options défendues avec passion, une troisième évoquée en passant, zéro conclusion — on replanifie. Trois semaines plus tard, quelqu'un a codé la sienne. Pas par malice : parce qu'il fallait bien avancer, et que personne n'avait écrit où on en était.

Hier, on a vu le [spec-driven development]({{ site.baseurl }}/fr/2026/08/23/spec-driven-development-la-spec-source-de-verite/) : la spec décrit un **comportement** attendu. Mais avant de décrire un comportement, il faut parfois choisir une **direction** — et c'est le rôle du *RFC* (*Request for Comments*), alias *design doc*. Dans [la carte des artefacts]({{ site.baseurl }}/fr/2026/08/21/les-artefacts-du-vibe-coding-la-carte-complete/), c'est la pièce qui organise le débat. Vous allez voir : c'est pas sorcier.

<!--more-->

## Le procès-verbal existe — mais où est la réunion ?

Vous connaissez déjà [l'ADR]({{ site.baseurl }}/fr/2026/07/14/adr-memoire-decisions-architecture/) : le **procès-verbal** d'une décision *prise*. Contexte, choix, conséquences — signé, archivé, immuable. Indispensable… mais le procès-verbal arrive *après*. Il ne dit rien de la façon dont on décide.

Le RFC, c'est **la réunion elle-même — mais par écrit**. Au lieu de six personnes qui s'interrompent pendant une heure, un document qui pose le problème, étale les options avec leurs prix, propose une recommandation, et récolte les commentaires en asynchrone. La réunion devient relisible, citable, et surtout : elle laisse une trace de *pourquoi les autres options ont perdu*.

## L'anatomie d'un RFC

Cinq rubriques, dans cet ordre — chacune répond à une question précise :

| Rubrique | La question à laquelle elle répond |
| --- | --- |
| **Problème** | qu'est-ce qui nous force à décider, et pour quand ? |
| **Contraintes** | qu'est-ce qui est non négociable (budget, équipe, contrats) ? |
| **Options + trade-offs** | quelles pistes, et **ce que chacune coûte** ? |
| **Recommandation** | que propose l'auteur — en s'engageant ? |
| **Questions ouvertes** | qu'est-ce qu'on ne sait pas encore ? |

La rubrique qui fait tout le travail, c'est **options + trade-offs**. Un RFC avec une seule option n'est pas un RFC : c'est une annonce déguisée. Et une option sans inconvénient assumé n'est pas une option : c'est du marketing.

## Un exemple condensé : « comment gérer le multi-tenant ? »

```markdown
# RFC-012 : stratégie multi-tenant pour l'API

## Problème
Trois clients « entreprise » signés ; chacun exige l'isolation de ses
données. Aujourd'hui : une seule base, zéro notion de tenant.
À trancher avant le sprint 32 — après, la migration coûte le double.

## Contraintes
- Budget infra : +20 % de coût mensuel maximum.
- L'équipe (4 devs) n'a jamais pratiqué le row-level security.
- Le contrat Contoso exige une option « base dédiée ».

## Options
### A. Une base par tenant
+ Isolation maximale ; backup/restore par client trivial.
- Coût infra ×N ; chaque migration rejouée N fois ; provisioning à outiller.

### B. Un schéma par tenant, base partagée
+ Bon compromis isolation/coût ; migrations centralisables.
- Outillage EF Core plus rare ; plafond pratique à quelques centaines.

### C. Colonne TenantId + filtre global
+ Le moins cher ; un seul pipeline de migration.
- L'isolation repose sur la discipline du code : un filtre oublié = fuite.

## Recommandation
Option C par défaut, option A pour les contrats qui l'exigent
(Contoso). Filtre global EF Core + tests d'isolation obligatoires.

## Questions ouvertes
- Le surcoût de la base dédiée Contoso : facturé au client ou absorbé ?
- RLS Postgres en ceinture de sécurité en plus du filtre : utile ?

## Commentaires jusqu'au : 2026-09-05
```

Une page. Pas quarante. Le lecteur pressé lit le problème et la recommandation ; le lecteur concerné attaque les options ; et la dernière ligne — la **date limite** — évite le débat qui ne finit jamais.

## Le cycle : proposé → commenté → décidé → archivé

1. **Proposé.** Le RFC arrive là où on relit du texte : une pull request sur `docs/rfc/`, ou un document commentable. L'important est que les commentaires soient *attachés au texte*, pas éparpillés dans un chat.
2. **Commenté.** Chacun réagit à son rythme : « +1 sur C », « objection : le contrat Contoso interdit la base partagée », « et la migration des données existantes ? ». La réunion a lieu — sans salle, sans créneau.
3. **Décidé.** À la date limite, quelqu'un tranche — le *tech lead*, l'architecte, l'équipe au consensus. Pas de date limite, pas de décision : juste un débat en apnée.
4. **Archivé.** La conclusion devient un **ADR** qui pointe vers le RFC. Le procès-verbal cite la réunion : l'ADR dit *ce qu'on a choisi*, le RFC garde *tout ce qu'on a pesé*.

## Quand un RFC — et quand un ADR direct suffit

Le RFC a un coût : quelques heures d'écriture, quelques jours de débat. Il se mérite. Deux signaux, un seul suffit :

- **La décision engage plusieurs équipes ou plusieurs personnes** qui devront vivre avec. Décider seul dans son coin, c'est s'assurer que l'exécution sera sabotée par l'inertie — ou pire, par la bonne foi de gens qui n'étaient pas au courant.
- **Personne n'a la réponse.** Si l'expert du sujet est sûr de lui et que personne ne conteste : ADR direct, dix minutes, terminé. Le RFC sert quand la réponse doit *émerger* du débat — pas quand elle préexiste.

## Pourquoi ça vaut double à l'ère des agents IA

1. **L'agent rédige le premier jet.** La discussion a eu lieu dans un thread ou un chat ? « Rédige le RFC de cette discussion : problème, contraintes, les trois options évoquées avec leurs trade-offs. » Le squelette tombe en deux minutes ; les humains passent leur temps sur le fond. La formule habituelle : **l'IA propose, l'humain tranche, le dépôt mémorise**.
2. **L'agent explore les options.** « Donne-moi trois approches pour le multi-tenant en .NET, avec les trade-offs de chacune. » Trois options argumentées coûtent quelques minutes de génération — trois prototypes coûtent trois sprints. L'IA élargit l'éventail *avant* que le débat ne se referme sur les deux idées de la réunion.
3. **L'agent red-team la proposition.** Avant d'ouvrir les commentaires aux humains : « attaque ce design, trouve les failles, les cas limites, les hypothèses fragiles. » L'agent n'a ni ego ni politesse — il signalera le filtre oublié de l'option C sans craindre de vexer l'auteur. Les relecteurs humains partent d'une proposition déjà éprouvée.

## Le mot d'honnêteté

- **Le RFC peut devenir du théâtre.** Si la décision est déjà prise en haut, ne faites pas semblant d'organiser un débat : un simulacre de RFC détruit la confiance dans tous les suivants. Écrivez l'ADR, assumez, passez à la suite.
- **Les RFC non conclus s'accumulent.** Un dossier `docs/rfc/` plein de débats jamais tranchés est un cimetière démoralisant. Le garde-fou tient en une ligne : **tout RFC a une date limite de commentaires** — et à l'échéance, on décide, même imparfaitement.
- **L'IA n'a pas d'avis sur *vos* contraintes.** Elle rédige bien, elle red-team bien — mais elle ignore que le contrat Contoso est intouchable, que le budget infra est gelé jusqu'en janvier, et que l'équipe data sort d'un burn-out. Les trade-offs techniques, elle les voit ; les trade-offs politiques et budgétaires, c'est vous.

## En résumé

- L'ADR est le **procès-verbal** d'une décision prise ; le RFC est **la réunion** — le débat organisé *avant*, par écrit et en asynchrone.
- Cinq rubriques : **problème, contraintes, options avec trade-offs, recommandation, questions ouvertes** — et une option sans inconvénient assumé n'est pas une option.
- Le cycle : **proposé → commenté → décidé → archivé dans un ADR** — avec une **date limite** de commentaires, sinon le débat ne finit jamais.
- Avec les agents : **l'IA rédige le premier jet, explore les options, red-team la proposition** — et l'humain tranche, parce que les contraintes politiques et budgétaires, elles, ne sont pas dans le contexte.

Une page qui organise le débat avant le code, plutôt qu'une réunion qui recommence chaque mardi. Et ça, franchement… c'est pas sorcier.
