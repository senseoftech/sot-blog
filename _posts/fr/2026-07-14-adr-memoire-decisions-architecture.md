---
layout: post
title: "Les ADR : la mémoire de vos décisions d'architecture — c'est pas sorcier !"
date: 2026-07-14 10:00:00
author: AClerbois
lang: fr
ref: adr
image: /images/posts/adr.png
tags: [architecture, documentation, ADR, AI, best-practices]
---

Sprint 23. Un nouveau développeur rejoint l'équipe et pose la question fatale : *« Pourquoi MongoDB, ici ? Tout le reste est en SQL Server. »* Silence. La personne qui avait fait ce choix est partie il y a un an. Était-ce une bonne raison ? Une contrainte de l'époque ? Un pari perdu ? Personne ne sait. Alors on n'ose pas y toucher.

Dans [l'article sur le vibe engineering]({{ site.baseurl }}/fr/2026/07/12/vibe-project-fondations-dotnet/), je glissais une consigne : *un dossier docs avec des ADR*. Aujourd'hui, on déplie. C'est l'outil de documentation au meilleur rapport effort/valeur que je connaisse — et à l'ère des agents IA, il vaut double. Vous allez voir : c'est pas sorcier.

<!--more-->

## La barrière de Chesterton

Une vieille parabole d'ingénierie : vous trouvez une barrière au milieu d'un chemin. Réflexe naïf : « elle ne sert à rien, enlevons-la. » Réflexe sage : **« tant que je ne sais pas pourquoi elle est là, je n'y touche pas. »**

Tout code hérité est plein de barrières de Chesterton : ce cache bizarre, ce retry à trois tentatives, ce MongoDB isolé. Sans la *raison*, chaque décision passée devient intouchable — ou pire, se fait démolir par quelqu'un qui ignorait la contrainte qu'elle résolvait. Le problème n'est pas la décision ; c'est la **mémoire de la décision**.

## L'ADR : une fiche par décision

Un **ADR** (*Architecture Decision Record*) est un petit fichier Markdown qui capture **une** décision structurante. Pas un cahier d'architecture de quarante pages : une fiche, numérotée, datée, qui tient sur un écran. Le format classique (celui de Michael Nygard) tient en cinq rubriques :

| Rubrique | La question à laquelle elle répond |
| --- | --- |
| **Titre + numéro** | de quoi parle-t-on ? (`0007-cqrs-avec-carter.md`) |
| **Statut** | proposé, accepté, remplacé par… ? |
| **Contexte** | quelle était la situation, quelles contraintes, quelles options ? |
| **Décision** | qu'a-t-on choisi, formulé à l'affirmative ? |
| **Conséquences** | qu'est-ce que ça implique — le bon *et* le moins bon ? |

## Un exemple concret, en entier

```markdown
# ADR-0007 : CQRS avec Minimal API + Carter plutôt que contrôleurs MVC

## Statut
Accepté — 2026-07-12

## Contexte
L'application expose une API dont les lectures (catalogues, recherches)
sont 20 fois plus fréquentes que les écritures, avec des besoins de
performance différents. L'équipe (3 devs) connaît MVC ; personne n'a
encore pratiqué CQRS. Une partie du code sera générée par IA : il faut
une structure que l'agent reproduit sans dériver.

Options considérées :
1. Contrôleurs MVC classiques — connu, mais tout se mélange dans les
   contrôleurs qui grossissent.
2. CQRS complet avec event sourcing — surdimensionné pour le besoin.
3. CQRS « léger » : Minimal API + Carter + un handler par cas d'usage.

## Décision
Option 3. Chaque fonctionnalité = une commande OU une requête, avec son
handler dédié. Les modules Carter regroupent les endpoints par domaine.

## Conséquences
+ Un moule clair et répétable — y compris pour le code généré par IA.
+ Handlers testables isolément (cible : 80 % de couverture).
- Courbe d'apprentissage pour l'équipe (~1 sprint).
- Plus de fichiers ; navigation à apprivoiser.
- L'event sourcing reste possible plus tard, ce choix ne le bloque pas.
```

Remarquez les **conséquences négatives assumées** : c'est ce qui distingue un ADR d'un document marketing. Dans dix-huit mois, la question « pourquoi Carter ? » aura une réponse complète — contexte, alternatives écartées, prix accepté.

## Quand écrire un ADR (et quand s'abstenir)

Le test en trois questions — il suffit d'un oui :

1. La décision sera-t-elle **coûteuse à inverser** ? (framework, base de données, découpage en services)
2. **Contraint-elle** les développements futurs ? (conventions, patterns imposés)
3. A-t-elle fait **débat** dans l'équipe ? (si on en a discuté une heure, la conclusion mérite dix minutes d'écriture)

Le nom d'une variable, le choix d'une lib utilitaire remplaçable en une heure : pas d'ADR. Sinon l'outil meurt sous son propre poids — dix fiches importantes battent cent fiches bureaucratiques.

## Le cycle de vie : on n'efface jamais, on remplace

Règle d'or : **un ADR accepté est immuable.** Si la décision change, on n'édite pas l'histoire — on écrit un nouvel ADR qui *remplace* l'ancien, et l'ancien passe au statut « Remplacé par ADR-0019 ». Le dossier `docs/adr/` devient ainsi la **chronologie** des choix du projet : on peut rejouer le film, comprendre ce qui était vrai à l'époque, et pourquoi ça ne l'est plus.

Côté pratique : les fiches vivent **dans le dépôt** (`docs/adr/NNNN-titre.md`), versionnées avec le code, relues en pull request comme le reste. Une décision d'architecture qui passe en revue de code — c'est exactement là qu'elle doit être.

## Pourquoi ça vaut double à l'ère des agents IA

Trois raisons, et la troisième est nouvelle :

1. **L'IA re-contextualise avec.** Une conversation s'oublie à la session suivante ; un dossier `docs/adr/` se relit. L'agent du sprint 24 qui lit l'ADR-0007 reproduit le pattern CQRS au lieu de réinventer des contrôleurs — c'est le versant documentation de la formule du [billet vibe engineering]({{ site.baseurl }}/fr/2026/07/12/vibe-project-fondations-dotnet/) : *le prompt exprime les décisions, le dépôt les mémorise*.
2. **L'IA rédige le brouillon.** La discussion d'alignement a eu lieu dans le chat ? Demandez à l'agent : « rédige l'ADR de ce qu'on vient de décider ». La division du travail idéale : **l'humain décide, l'IA consigne**, l'humain relit.
3. **L'ADR protège des agents trop zélés.** Un agent qui « nettoie » du code sans en connaître la raison, c'est la barrière de Chesterton arrachée à la vitesse du LLM. La fiche est le panneau « cette barrière est là parce que… » — lisible par les humains *et* par les machines.

## En résumé

- Le problème n'est pas de prendre des décisions, c'est d'en **perdre la raison** — la barrière de Chesterton.
- Un **ADR** = une fiche Markdown par décision structurante : statut, contexte, options, décision, **conséquences (y compris négatives)**.
- On en écrit pour ce qui est **coûteux à inverser, contraignant ou débattu** — et on n'édite jamais : on **remplace**.
- Dans le dépôt, relus en PR — et à l'ère des agents : **l'humain décide, l'IA consigne, l'ADR re-contextualise** les sessions suivantes.

Dix minutes d'écriture par décision, et plus jamais de « on ne sait plus pourquoi, alors on n'y touche pas ». Et ça, franchement… c'est pas sorcier.
