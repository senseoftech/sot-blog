---
layout: post
title: "Spec-driven development : la spec redevient la source de vérité — c'est pas sorcier !"
date: 2026-08-23 10:00:00
author: AClerbois
lang: fr
ref: spec-driven
image: /images/posts/spec-driven.png
tags: [spec-driven, documentation, AI, best-practices]
level: 100
---

Vendredi, 16 h. L'agent a généré la fonctionnalité « réinitialisation de mot de passe » en vingt minutes. Le code est propre, les tests passent. Lundi, le product owner regarde la démo : *« Le lien devait expirer après 24 heures, pas 7 jours. Et on ne renvoie jamais "cet email n'existe pas" — c'est une faille d'énumération. »* Personne ne l'avait écrit. L'agent a deviné. Il a deviné vite, il a deviné bien formaté, et il a deviné faux.

Hier, on a vu [AGENTS.md]({{ site.baseurl }}/fr/2026/08/22/agents-md-le-guide-d-onboarding-de-votre-ia/) — le guide qui dit à l'IA *comment* travailler dans votre dépôt. Aujourd'hui, suite de [la carte des artefacts]({{ site.baseurl }}/fr/2026/08/21/les-artefacts-du-vibe-coding-la-carte-complete/) : le **spec-driven development**, ou comment dire à l'IA *quoi* construire — avant qu'elle ne le devine à votre place. Vous allez voir : c'est pas sorcier.

<!--more-->

## Le plan d'architecte et la maison

Une maison se construit d'après un plan. Et la règle que tout architecte connaît : **on ne retouche pas la maison sans mettre à jour le plan**. Percez un mur porteur sans le reporter sur le plan, et le prochain chantier — l'extension, la rénovation — partira d'un plan faux. Le maçon suivant fera confiance à un document qui ment.

Pendant vingt ans, nos « plans » logiciels ont subi le sort inverse : la spec Word de départ, jamais mise à jour, morte au sprint 3. On a fini par déclarer que *le code est la source de vérité* — faute de mieux. Mais quelque chose a changé : quand une IA peut **régénérer le code** d'une fonctionnalité en minutes, le code devient le produit dérivé. Ce qui reste, ce qui a de la valeur, c'est l'intention. **La maison se reconstruit ; le plan est le capital.**

## La chaîne : PRD → spec → plan → code

Le spec-driven development remet les documents dans le bon ordre, chacun à son altitude :

| Étage | Document | Répond à | Qui tranche |
| --- | --- | --- | --- |
| Produit | **PRD** | pourquoi cette fonctionnalité ? pour qui ? | le product owner |
| Comportement | **Spec** | que doit-il se passer, observable de l'extérieur ? | l'équipe |
| Technique | **Plan** | comment on l'implémente, en quelles étapes ? | le dev (+ IA) |
| Exécution | **Code** | l'implémentation elle-même | l'IA (+ revue humaine) |

La spec est l'étage pivot : assez précise pour être vérifiable, assez abstraite pour survivre à trois réécritures du code. Une bonne spec décrit des **comportements observables**, des **critères d'acceptation** et des **cas limites** — jamais des choix d'implémentation. « Le lien expire après 24 heures » : spec. « On stocke le token dans Redis avec un TTL » : plan.

## Une spec courte, en entier

Pas un cahier des charges de quarante pages. Un fichier Markdown par fonctionnalité, dans `docs/specs/`, versionné et relu en PR — comme les ADR et le glossaire :

```markdown
# Spec : réinitialisation de mot de passe

## Exigences (style EARS)
- QUAND un utilisateur demande une réinitialisation avec un email
  connu, le système DOIT envoyer un lien à usage unique valable 24 h.
- QUAND l'email est inconnu, le système DOIT afficher le même message
  de confirmation (aucune énumération d'emails possible).
- QUAND le lien a expiré ou a déjà servi, le système DOIT afficher
  « lien expiré » et proposer d'en renvoyer un.
- TANT QU'une réinitialisation est en attente, les liens précédents
  DOIVENT être invalidés.

## Critères d'acceptation
- Étant donné un lien de plus de 24 h, quand l'utilisateur clique,
  alors le formulaire n'est pas affiché.
- Étant donné deux demandes successives, quand le premier lien
  est utilisé, alors il est rejeté.

## Cas limites
- Compte désactivé : même message que « email inconnu ».
- 3 demandes en 10 minutes : rate limit, HTTP 429.

## Hors périmètre
- Le changement d'email, la 2FA (specs séparées).
```

Tout est **vérifiable de l'extérieur** : on peut tester chaque ligne sans ouvrir le code. Et remarquez ce qui n'y est *pas* : ni Redis, ni la lib d'envoi d'emails, ni le nom des classes. Ça, c'est le plan — l'étage du dessous.

## Les outils qui ont popularisé l'approche

Deux noms reviennent. **GitHub Spec Kit**, open source, structure le flux en trois commandes — `/specify` (la spec), `/plan` (le plan technique), `/tasks` (le découpage en tâches) — que l'agent exécute l'une après l'autre. **Kiro**, l'IDE d'AWS, a mis les specs au cœur de son mode agent : chaque fonctionnalité commence par un fichier d'exigences (en style EARS, justement) que l'IA maintient avec vous.

Mais retenez le principe, pas les outils : un fichier Markdown dans `docs/specs/`, relu en PR, fait déjà 80 % du travail. Le spec-driven development survivra à Spec Kit comme les ADR ont survécu à leurs générateurs.

## Pourquoi ça vaut double à l'ère des agents IA

1. **L'agent implémente contre la spec au lieu de deviner.** Sans spec, l'IA comble les trous avec des choix statistiquement plausibles — 7 jours d'expiration, un message d'erreur qui énumère les emails. Avec la spec dans le contexte, chaque exigence devient une contrainte, et vos prompts fondent : « implémente la spec `password-reset.md` » suffit.
2. **La spec désambiguïse tout ce qui suit.** Le plan s'en déduit, les tests s'en déduisent, la revue de code s'y adosse — le relecteur (humain ou IA) compare le code à la spec, pas à son intuition. Toute la chaîne descend du même document.
3. **Quand le code et la spec divergent, la spec gagne — et l'agent détecte la divergence.** C'est la règle du plan d'architecte, et c'est une tâche où l'IA excelle : « compare ce module à sa spec et liste les écarts ». Soit le code est faux (on le corrige — voire on le régénère), soit la spec a vieilli (on la met à jour dans la même PR). La formule de la série s'applique telle quelle : **l'IA propose, l'humain tranche, le dépôt mémorise**.

## Le mot d'honnêteté

- **Ce n'est pas le retour du waterfall.** La spec waterfall décrivait tout le système, à l'avance, en une fois. Ici : une spec **par fonctionnalité**, une page, écrite juste avant de coder, amendée pendant. C'est du juste-à-temps, pas du Big Design Up Front.
- **Une spec non maintenue ment — et c'est pire que pas de spec.** Le plan faux fait percer le mauvais mur. Le garde-fou est le même que pour le glossaire : le code et sa spec voyagent **dans la même PR**, et un écart non justifié bloque la revue.
- **L'overhead est réel pour les petits changements.** Le fix d'une typo, un libellé, un ajustement de style : pas de spec. Réservez-la aux comportements qui méritent d'être défendus — dix specs vivantes battent cent specs bureaucratiques.

## En résumé

- Quand l'IA peut **régénérer le code**, le code devient produit dérivé — **la spec est le capital**, comme le plan d'architecte face à la maison.
- La chaîne : **PRD → spec → plan → code**, et la spec décrit des **comportements observables, critères d'acceptation, cas limites** — jamais l'implémentation.
- Une spec = **un fichier Markdown par fonctionnalité** dans `docs/specs/`, versionné, relu en PR — Spec Kit et Kiro outillent le flux, le principe leur survivra.
- Avec les agents : **l'IA implémente contre la spec**, détecte les divergences — et quand code et spec divergent, **la spec gagne**.

On ne retouche pas la maison sans mettre à jour le plan ; on ne fusionne pas le code sans mettre à jour la spec. Et ça, franchement… c'est pas sorcier.
