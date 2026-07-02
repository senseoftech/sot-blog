---
layout: post
title: "GPT, Claude, Gemini… quel modèle choisir dans GitHub Copilot ? C'est pas sorcier !"
date: 2026-06-25 10:00:00
author: AClerbois
lang: fr
ref: copilot-model-choice
image: /images/posts/copilot-model-garage.svg
tags: [github, copilot, AI, LLM, models]
---

Vous ouvrez le sélecteur de modèles de GitHub Copilot et vous tombez sur une carte des vins : GPT-5.5, Claude Opus 4.8, Gemini 3.5 Flash, Haiku, Sonnet, mini, nano, Codex… Lequel prendre ? Le plus récent ? Le plus cher ? Celui avec le plus grand numéro ?

Spoiler : la question « quel est le meilleur modèle ? » est mal posée. La bonne question, c'est « **le meilleur pour quoi faire ?** ». On va démonter la mécanique — pourquoi un modèle n'est pas l'autre — puis je vous donne une méthode toute simple pour trouver **le vôtre**, chiffres à l'appui. Et vous allez voir : c'est pas sorcier.

<!--more-->

## Le fil rouge : personne ne demande « quel est le meilleur véhicule ? »

Imaginez la question posée dans un garage : « quel est le meilleur véhicule ? » Le vendeur vous regarderait bizarrement. Le meilleur… pour quoi ? Aller chercher le pain ? La citadine. Déménager un piano ? Le camion. Rouler tous les jours ? La berline polyvalente.

**Un modèle d'IA, c'est un véhicule.** Il y a des citadines nerveuses, des berlines fiables, des semi-remorques capables de tracter l'impossible — mais lents et gourmands. Et comme au garage, tout se joue sur une poignée de caractéristiques mesurables. Regardons lesquelles.

## Pourquoi un modèle n'est pas l'autre : les 5 différences qui comptent

### 1. La cylindrée — la taille du modèle

Un modèle, c'est un moteur fait de milliards de « réglages » internes (les *paramètres*). Plus il y en a, plus le modèle capte de nuances… mais plus chaque mot généré coûte du calcul. C'est physique : **chaque mot de la réponse doit traverser tout le moteur**.

D'où les gammes que vous voyez partout : *nano*, *mini*, *Flash*, *Haiku* d'un côté (petites cylindrées, réponses quasi instantanées), *Opus* ou les gros GPT de l'autre (grosses cylindrées, plus futées mais plus lentes et plus chères).

### 2. Le vécu du conducteur — l'entraînement

Deux véhicules identiques ne se conduisent pas pareil selon qui est au volant. Deux modèles de taille comparable ne « pensent » pas pareil non plus : tout dépend de **ce qu'on leur a appris**, et de comment.

C'est pour ça que certains modèles du sélecteur sont des **spécialistes du code** : GPT-5.3-Codex, Raptor mini (un GPT-5 mini ré-entraîné spécialement pour la complétion), Kimi-K2.7-Code… À taille égale, un modèle spécialisé bat souvent un généraliste sur son terrain. Comme un chauffeur-livreur connaît mieux les ruelles qu'un pilote de F1.

### 3. L'arrêt carte routière — le raisonnement

Certains modèles répondent au fil de la plume. D'autres — les modèles « de raisonnement » — **s'arrêtent d'abord sur le bas-côté pour étudier la carte** : ils produisent un brouillon interne, explorent des pistes, se corrigent, puis seulement répondent.

Sur un problème retors (un bug vicieux, une architecture à repenser), cet arrêt change tout. Pour renommer une variable ? C'est payer un détour d'autoroute pour aller au bout de la rue. Le raisonnement est un **super-pouvoir facturé** : du temps et des tokens en plus.

### 4. La taille du coffre — la fenêtre de contexte

Chaque modèle a une limite de texte qu'il peut « voir » d'un coup : sa **fenêtre de contexte**. Petite fenêtre : quelques fichiers. Grande fenêtre : certains modèles montent aujourd'hui à **un million de tokens** (dans VS Code et Copilot CLI), de quoi embarquer une grosse partie du projet.

Mais attention au réflexe « plus grand = mieux » : un grand coffre ne sert que **si vous avez des bagages**. Pour une question de syntaxe, il ne vous apporte rien — et le remplir coûte de l'argent, on y vient.

### 5. La consommation — le coût

Depuis le **1ᵉʳ juin 2026**, Copilot est passé à la facturation à l'usage : chaque échange consomme des **AI Credits** (1 crédit = 0,01 $) selon les tokens envoyés au modèle, générés par lui, et mis en cache. Trois choses à savoir, ordres de grandeur au moment où j'écris ([tarifs officiels](https://docs.github.com/en/copilot/reference/copilot-billing/models-and-pricing)) :

- **L'écart entre gammes est énorme** : ~0,20 à 0,50 $ le million de tokens d'entrée pour les légers, ~2 à 2,50 $ pour les polyvalents, **4 à 10 $ pour les puissants**. Du simple au vingtuple.
- **La sortie coûte 4 à 10× plus cher que l'entrée** : un modèle bavard se paie.
- **Le cache réduit l'entrée d'environ 90 %** : rester dans la même conversation bien contextée coûte moins cher que tout renvoyer à chaque fois.

Un exemple pour fixer les idées : un aller-retour qui envoie ~50 000 tokens de contexte et en génère 5 000 coûte grosso modo **2 crédits sur une citadine… et 40 à 50 sur un semi-remorque**. Même conversation, facture ×20. Voilà pourquoi « je mets le plus gros modèle partout » est une stratégie de millionnaire.

## Le parking Copilot en juin 2026

Voici la gamme actuelle, rangée par vocation. La liste bouge tous les mois (des nouveaux comme Claude Fable 5 arrivent, d'autres partent à la retraite) : la référence reste [la liste officielle](https://docs.github.com/en/copilot/reference/ai-models/supported-models) et [le comparatif officiel](https://docs.github.com/en/copilot/reference/ai-models/model-comparison).

| La gamme | Les modèles (extraits) | Taillés pour |
| --- | --- | --- |
| **Les citadines** — légers, vifs, sobres | Claude Haiku 4.5, Gemini 3.5 Flash, GPT-5 mini / 5.4 nano | Questions rapides, petites retouches, prototypage léger |
| **Les berlines** — les polyvalents du quotidien | Claude Sonnet 5 (et 4.6), GPT-5.4, MAI-Code-1-Flash | Le gros du travail : coder, expliquer, tester |
| **Les semi-remorques** — raisonnement profond | Claude Opus 4.8, GPT-5.5, Gemini 3.1 Pro | Refactorings multi-fichiers, debug retors, décisions d'architecture |
| **Les utilitaires spécialisés** — fine-tunés code | GPT-5.3-Codex, Raptor mini, Kimi-K2.7-Code | Tâches d'ingénierie pures, complétion affûtée |

Bonus : certains modèles acceptent aussi les **images** (GPT-5 mini, Claude Sonnet 4.6, Gemini 3.1 Pro) — pratique pour partir d'une capture d'écran ou d'une maquette.

## Le banc d'essai maison : trouvez VOTRE modèle en une heure

Les classements publics ne répondent pas à la seule question qui compte : le meilleur **pour vos tâches à vous**, votre codebase, vos habitudes. La bonne nouvelle : faire votre propre essai routier est à la portée de tout le monde. Cinq étapes.

### Étape 1 — Choisissez vos 3 trajets types

Prenez trois tâches **réelles et récentes** de votre quotidien — pas des exercices inventés. Par exemple :

1. une **course** : corriger un test cassé, écrire une petite fonction ;
2. un **trajet quotidien** : ajouter une fonctionnalité de taille moyenne ;
3. un **déménagement** : un refactoring multi-fichiers ou une question d'architecture.

### Étape 2 — Sélectionnez 3 candidats

Un par gamme suffit pour commencer : une citadine, une berline, un semi-remorque. Inutile de tester douze modèles — vous comparez des **gammes**, pas des étiquettes.

### Étape 3 — Roulez proprement

C'est l'étape que tout le monde rate. Pour que la comparaison vaille quelque chose :

- **même prompt**, copié-collé à l'identique ;
- **même contexte** (mêmes fichiers ouverts, mêmes `#`-références) ;
- **conversation neuve** à chaque essai — un historique pollué fausse tout ;
- **deux passages** par modèle : une seule réponse ne prouve rien, les modèles ont de la variance.

### Étape 4 — Notez sur une grille

Quatre colonnes, pas plus :

- **Qualité** (le résultat est-il juste, complet, idiomatique ?) — sur 5 ;
- **Allers-retours** nécessaires avant un résultat acceptable ;
- **Temps** ressenti ;
- **Crédits** consommés (visibles sur la page d'usage de votre compte GitHub).

Voici à quoi ça peut ressembler — chiffres **fictifs**, pour l'exemple :

| Tâche | Citadine (Haiku 4.5) | Berline (Sonnet 5) | Semi (Opus 4.8) |
| --- | --- | --- | --- |
| Corriger un test cassé | 4/5 · 1 échange · ~2 crédits | 5/5 · 1 échange · ~8 crédits | 5/5 · 1 échange · ~40 crédits |
| Ajouter une fonctionnalité | 2/5 · 4 échanges · ~10 crédits | 4/5 · 2 échanges · ~20 crédits | 5/5 · 1 échange · ~45 crédits |
| Question d'architecture | 1/5 · abandonné | 3/5 · 3 échanges · ~30 crédits | 5/5 · 1 échange · ~60 crédits |

### Étape 5 — Le verdict… par type de tâche

Lisez la grille **ligne par ligne**, jamais en score global. Dans l'exemple ci-dessus, le verdict n'est pas « Opus gagne » : c'est « Haiku suffit largement pour les courses (20× moins cher !), Sonnet est ma berline, et Opus vaut chaque centime sur l'architecture — et uniquement là ».

Refaites l'exercice tous les deux ou trois mois : les modèles changent vite, votre classement aussi.

## Les 4 pièges du comparateur amateur

1. **L'effet démo.** Une réponse assurée et bien rédigée n'est pas une réponse juste. Vérifiez le fond (lancez les tests !), pas le style.
2. **Le jugement sur un seul essai.** La variance existe. Deux passages minimum avant de conclure.
3. **L'historique qui triche.** Si le modèle B passe après le modèle A dans la même conversation, il hérite de ses indices. Conversation neuve, toujours.
4. **Oublier la colonne coût.** Une réponse 5 % meilleure pour 20× le prix, c'est rarement une bonne affaire — sauf le jour du déménagement.

## La règle simple à retenir

- **Par défaut : la berline.** Un polyvalent couvre 80 % de vos journées.
- **Pour les courses : la citadine.** Question rapide, petite retouche → modèle léger, réponse immédiate, coût dérisoire.
- **Quand ça coince : le semi-remorque.** Deux allers-retours sans progrès sur un problème complexe ? Montez en gamme, posez le problème une bonne fois. Puis **redescendez**.
- **Si votre quotidien est du code pur : essayez un utilitaire spécialisé.**

Et surtout : ne croyez ni les benchmarks, ni les influenceurs, ni moi. **Croyez votre grille.** Trois tâches, trois modèles, une heure d'essai routier — c'est tout ce qu'il faut pour savoir ce qui roule le mieux chez vous.

Un modèle n'est pas l'autre : pas parce que le marketing le dit, mais parce que la cylindrée, l'entraînement, le raisonnement, le coffre et la consommation diffèrent — et maintenant, vous savez lire la fiche technique.

Et ça, mine de rien… c'est pas sorcier.
