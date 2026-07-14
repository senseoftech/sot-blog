---
layout: post
title: "Tester une application IA : bienvenue dans les évals — c'est pas sorcier !"
date: 2026-07-17 10:00:00
author: AClerbois
lang: fr
ref: ai-evals
image: /images/posts/ai-evals.png
tags: [AI, LLM, testing, evals, quality]
---

Vous avez suivi [le prompt de base]({{ site.baseurl }}/fr/2026/07/12/vibe-project-fondations-dotnet/) : triple A, 80 % de couverture, tout est vert. Puis vous ajoutez la fonctionnalité IA — un résumé automatique de tickets — et vous écrivez naïvement :

```csharp
Assert.Equal("Le client signale un bug d'affichage.", resume);
```

Rouge. Vous relancez : rouge encore, mais **différemment** — le modèle a reformulé. Même entrée, autre sortie, [c'est sa nature]({{ site.baseurl }}/fr/2026/07/16/pourquoi-l-ia-hallucine/). Alors, comment teste-t-on un composant qui ne répond jamais deux fois pareil ? Bienvenue dans le monde des **évals**. Vous allez voir : c'est pas sorcier.

<!--more-->

## Changer de lunettes : de la machine à l'employé

Un test unitaire classique vérifie une **machine** : mêmes entrées → mêmes sorties, vrai ou faux, vert ou rouge. Un LLM ne se teste pas comme une machine — il s'évalue comme un **employé** : on ne demande pas si sa réponse est *identique à la réponse type*, on demande si elle est **de qualité**.

Le bon modèle mental, c'est **l'examen** : une copie n'est pas « vraie » ou « fausse » — elle vaut 14/20 selon une grille. Les évals, c'est exactement ça : faire passer des examens réguliers à votre fonctionnalité IA, avec une grille de correction et une note de passage.

Mais avant la salle d'examen, un tri s'impose.

## Étape 0 : isolez le non-déterminisme

Tout votre code n'a pas besoin d'évals — **la plus grande partie reste du code ordinaire** : celui qui construit le prompt, appelle l'API, parse la réponse, déclenche les outils, gère les erreurs. Tout ça est déterministe et se teste en triple A, comme d'habitude (mockez le LLM, vérifiez la plomberie). Le [harnais]({{ site.baseurl }}/fr/2026/07/01/le-harnais-de-l-ia-github-copilot/) se teste classiquement ; seul le **cerveau** a besoin d'un examen.

Première bonne nouvelle, donc : vos 80 % de couverture gardent tout leur sens — ils s'arrêtent juste à la porte du modèle.

## Le golden dataset : le recueil d'annales

La pièce maîtresse d'un système d'évals : un **jeu de cas de référence** — disons 50 à 200 exemples représentatifs, versionnés dans le dépôt comme du code :

```
evals/
  cas-001.json   { "ticket": "L'écran de paiement plante depuis la MAJ...",
                   "attendu": { "categorie": "bug", "priorite": "haute",
                                "doit_mentionner": ["paiement", "mise à jour"] } }
```

D'où viennent les cas ? De la réalité : les tickets typiques, les cas limites qui ont déjà posé problème, les pièges connus (ironie, multilingue, ticket vide…). Le recueil **grandit à chaque incident** — exactement comme on ajoute un test de régression après un bug.

## Les trois niveaux de correction

**Niveau 1 — les assertions déterministes (le QCM).** Avant de juger le style, vérifiez le vérifiable, à l'ancienne : la sortie est-elle du JSON valide ? La catégorie est-elle dans la liste autorisée ? Le résumé mentionne-t-il « paiement » ? Ne contient-il aucune donnée personnelle ? Le bon outil a-t-il été appelé ? Rapide, fiable, gratuit — attrapez un maximum d'erreurs à ce niveau.

**Niveau 2 — le LLM juge (le correcteur).** Pour ce qui reste subjectif — fidélité, ton, complétude — on emploie… un autre modèle, armé d'une **grille explicite** : *« Note de 1 à 5 : le résumé est-il fidèle au ticket, sans information inventée ? Justifie. »* C'est le pattern **LLM-as-judge**, le standard de l'industrie pour évaluer à grande échelle.

**Le mot d'honnêteté**, évidemment : le juge est un LLM — il peut se tromper, [comme les autres]({{ site.baseurl }}/fr/2026/07/16/pourquoi-l-ia-hallucine/). On le **calibre** : sur un échantillon, un humain note aussi, on compare, on ajuste la grille jusqu'à ce que juge et humain s'accordent. Un correcteur se forme avant de corriger seul.

**Niveau 3 — la prod (le contrôle continu).** L'examen ne s'arrête pas au déploiement : pouces haut/bas des utilisateurs, taux de reprise manuelle, traces d'observabilité ([OpenTelemetry, déjà croisé avec Agent Framework]({{ site.baseurl }}/fr/2026/07/11/microsoft-agent-framework-equipe-agents-ia/)). Les échecs de prod alimentent le recueil d'annales — la boucle est bouclée.

## Le prompt est du code : la régression d'évals

Le moment où tout s'assemble : vous « améliorez » un prompt — trois mots changés. Sans évals, vous venez de modifier un comportement de production **à l'aveugle**. Avec évals : vous rejouez la suite, et le verdict tombe — 94 % → 96 %, on déploie ; 94 % → 71 %, on vient d'éviter un incident.

D'où la place naturelle des évals : **dans la CI**, comme les tests. Chaque modification de prompt, de modèle ou de température déclenche la suite, avec un **seuil de passage** — l'équivalent IA de vos 80 % de couverture :

- Un taux de réussite minimal (par exemple ≥ 90 % du golden dataset).
- Pas 100 % : du non-déterminisme subsiste, on gère des **seuils**, pas des certitudes.
- Les cas critiques (sécurité, données personnelles) : eux, à 100 %, non négociables.

## En résumé

| Test classique | Éval |
| --- | --- |
| vrai / faux | note / seuil |
| `Assert.Equal` | grille de correction |
| échantillon = 1 exécution | échantillon = un dataset |
| protège la plomberie | protège le comportement |

- **Isolez** : la plomberie autour du LLM se teste en triple A comme avant ; seul le cerveau passe des examens.
- **Golden dataset** versionné, enrichi à chaque incident — vos annales.
- Trois correcteurs : **assertions déterministes** d'abord, **LLM juge calibré** ensuite, **feedback de prod** en continu.
- **Un prompt est du code** : toute modification rejoue les évals en CI, avec des seuils — 100 % réservé aux cas critiques.

Votre application IA mérite la même rigueur que votre code — simplement avec les bons instruments : une grille plutôt qu'un `Assert.Equal`, des seuils plutôt que du vert/rouge. Tester un employé plutôt qu'une machine, finalement… c'est pas sorcier.
