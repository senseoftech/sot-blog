---
layout: post
title: "Le glossaire du domaine : le dictionnaire de votre projet — c'est pas sorcier !"
date: 2026-07-16 10:00:00
author: AClerbois
lang: fr
ref: domain-glossary
image: /images/posts/domain-glossary.png
tags: [documentation, DDD, ubiquitous-language, AI, best-practices]
level: 100
---

Ouvrez un projet de plus de six mois et cherchez « client ». Vous trouverez `Client`, `Customer`, `Account`, `User` — et, dans la base de données, une table `TIERS`. Quatre noms, cinq si on compte le métier qui dit « l'assuré ». La même personne ? Presque. *Presque*, c'est le problème.

Après [les ADR]({{ site.baseurl }}/fr/2026/07/14/adr-memoire-decisions-architecture/) — la mémoire de vos décisions — voici la deuxième pièce du dépôt qui parle : le **glossaire du domaine**. Une page Markdown, dix minutes d'écriture, et probablement le meilleur rapport effort/valeur de toute votre documentation. Vous allez voir : c'est pas sorcier.

<!--more-->

## La dérive sémantique : une maladie silencieuse

Personne ne décide un matin d'appeler la même chose de quatre façons. Ça arrive tout seul : le dev A dit `Customer` parce que c'est l'anglais naturel, le dev B crée `Account` parce qu'il pense facturation, le consultant du sprint 9 introduit `Tiers` parce que c'est le vocabulaire de l'ERP d'en face. Chaque choix est raisonnable ; leur somme est un champ de mines.

Le coût est bien réel : chaque conversation commence par trois minutes de synchronisation (« attends, ton Account, c'est mon Customer ? »), chaque bug de mapping vient d'une nuance oubliée, et chaque nouveau venu apprend le dialecte local à ses dépens.

Le domain-driven design a un nom pour le remède : le **langage omniprésent** (*ubiquitous language*) — un vocabulaire unique, partagé entre le métier, le code et la doc. Le glossaire en est la forme la plus simple : la version qui tient sur une page.

## Une page Markdown, pas un wiki

Le format qui marche, c'est le plus bête : un fichier `docs/glossaire.md` **dans le dépôt**, versionné et relu en pull request — exactement comme les ADR. Pas un wiki externe qui vivra sa vie (c'est-à-dire mourra sa mort) loin du code.

```markdown
# Glossaire du domaine

## Assuré (code : `Customer`)
La personne physique couverte par un contrat. Peut exister
sans contrat actif (prospect converti, contrat résilié).
- ≠ **Souscripteur** : celui qui paie. Souvent le même, pas toujours.
- Base de données : table `TIERS` (héritage ERP, ne pas renommer).

## Contrat (code : `Policy`)
L'engagement signé. Un assuré peut avoir plusieurs contrats.
- « Police » est banni du code : on dit `Policy` en code, contrat à l'oral.
- Statuts possibles : voir ADR-0012.

## Sinistre (code : `Claim`)
Toute déclaration d'événement couvert — même refusée ensuite.
- Un sinistre **refusé reste un sinistre** (le métier y tient).
```

Remarquez les trois ingrédients de chaque entrée : le terme métier, **le nom exact dans le code**, et les pièges (« ≠ souscripteur », « refusé reste un sinistre »). C'est la rubrique des différences qui vaut de l'or — un glossaire qui ne liste que des synonymes n'apprend rien à personne.

## Quand un terme mérite une entrée

Comme pour les ADR, la sélectivité fait la valeur. Le test :

| Le terme… | Entrée ? |
| --- | --- |
| a **deux sens** selon qui parle (« compte », « dossier ») | ✅ oui, d'urgence |
| se dit **autrement dans le code** que dans les réunions | ✅ oui |
| a des **faux amis** proches (assuré/souscripteur) | ✅ oui |
| est du vocabulaire technique standard (`Controller`, `DTO`) | ❌ non |
| n'apparaît que dans un seul fichier | ❌ pas encore |

Vingt entrées vivantes battent deux cents entrées mortes. Si tout le monde comprend un mot pareil, il n'a rien à faire dans le glossaire.

## Pourquoi ça vaut double à l'ère des agents IA

Un humain qui hésite sur un terme pose la question à côté de lui. Un agent IA, lui, **tranche en silence** — et il tranche statistiquement : il génère `Customer` ici, `Client` là, invente un `AccountHolder` au sprint suivant, et propage joyeusement chaque variante dans les tests, les migrations et les commentaires. La dérive sémantique à la vitesse du LLM.

Le glossaire retourne la situation, pour trois raisons :

1. **C'est du contexte en or massif.** Référencez `docs/glossaire.md` depuis vos [instructions d'agent]({{ site.baseurl }}/fr/2026/07/02/github-copilot-skills-instructions-agents-mcp/) (« respecte les noms du glossaire ») : l'IA nomme juste dès la première génération, dans le code *et* dans ses explications.
2. **L'IA le rédige très bien.** « Liste les termes métier de ce module et leurs synonymes suspects dans le code » est une tâche où l'agent excelle — il voit les incohérences plus vite qu'un humain. La division du travail des ADR s'applique telle quelle : **l'IA propose, l'humain tranche, le dépôt mémorise**.
3. **Il désambiguïse vos prompts.** « Ajoute une validation sur l'assuré » est un prompt flou ; avec le glossaire dans le contexte, l'agent sait que l'assuré est `Customer`, qu'il se distingue du souscripteur, et que la table s'appelle `TIERS`. Moins de suppositions, moins de [réponses inventées]({{ site.baseurl }}/fr/2026/07/12/vibe-project-fondations-dotnet/).

## Le mot d'honnêteté

- **Un glossaire ne renomme rien.** Écrire « `TIERS` est un héritage ERP » ne nettoie pas la dette — ça l'**éclaire**. C'est déjà beaucoup : la dette documentée cesse de mordre les nouveaux venus. Le renommage, lui, est une décision… qui mérite un ADR.
- **Il meurt sans gardien.** Un glossaire pas relu en PR devient faux, et un glossaire faux est pire que pas de glossaire. Le garde-fou : toute PR qui introduit un terme métier nouveau touche aussi le glossaire — une ligne dans votre checklist de revue suffit.

## En résumé

- La **dérive sémantique** — quatre noms pour la même chose — coûte des malentendus, des bugs de mapping et de l'onboarding pénible ; l'IA l'accélère si on la laisse nommer au hasard.
- Le remède tient en **une page** : `docs/glossaire.md`, versionné, relu en PR — terme métier, **nom exact dans le code**, et surtout les **pièges et faux amis**.
- On y met les termes **ambigus, traduits ou piégeux** — pas le vocabulaire technique standard. Vingt entrées vivantes battent deux cents entrées mortes.
- Avec les agents : **l'IA propose les entrées, l'humain tranche**, et le glossaire référencé dans les instructions fait nommer juste dès la première génération.

Dix minutes pour écrire la première page, une ligne dans la checklist de revue pour la garder vivante — et plus jamais de débat « Account ou Customer ? » à la machine à café. Et ça, franchement… c'est pas sorcier.
