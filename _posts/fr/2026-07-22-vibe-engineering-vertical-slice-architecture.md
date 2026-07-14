---
layout: post
title: "Vibe engineering : pourquoi vos agents IA méritent une architecture en tranches — c'est pas sorcier !"
date: 2026-07-22 10:00:00
author: AClerbois
lang: fr
ref: vibe-vsa
image: /images/posts/vibe-vsa.png
tags: [dotnet, AI, vibe-engineering, architecture, vertical-slice, best-practices]
level: 300
---

Dans [le billet sur le vibe engineering]({{ site.baseurl }}/fr/2026/07/12/vibe-project-fondations-dotnet/), mon prompt de base imposait une architecture — CQRS, Minimal API, Carter, un handler par cas d'usage — en promettant qu'elle servirait de « moule » à l'IA. Plusieurs lecteurs m'ont posé la bonne question : **pourquoi celle-là ?**

Réponse aujourd'hui : parce que c'est une **Vertical Slice Architecture** — une architecture « en tranches » — et que de toutes les architectures solides, c'est celle qui épouse le mieux la façon dont un agent IA travaille réellement. Ce n'est pas un détail de goût : en vibe engineering, **le choix d'architecture est un choix d'outillage pour vos agents**. On démonte. Vous allez voir : c'est pas sorcier.

<!--more-->

## Le rappel en une phrase

Le vibe engineering, c'est laisser l'IA écrire le code **dans un cadre d'ingénierie qu'on a posé** : *le prompt exprime les décisions, le dépôt les mémorise, l'outillage les fait respecter.* Restait une question en suspens : parmi les architectures propres, **laquelle donner en pâture aux agents ?** Car elles ne se valent pas — pas pour ce critère-là.

## Le problème des couches : une fonctionnalité éparpillée

L'architecture en couches classique (contrôleurs, services, repositories…) organise le code **par métier technique**. L'image de l'entreprise, encore : c'est ranger tous les comptables au 3e étage, tous les juristes au 5e, tous les commerciaux au 7e. Cohérent vu de l'organigramme… mais suivez un **dossier client** : il traverse tous les étages.

Traduction code : « ajoute un champ à la commande » = toucher le contrôleur, le DTO, le mapper, le service, le repository, l'entité — **six fichiers dans six dossiers**, plus les fichiers partagés que d'autres fonctionnalités utilisent aussi. Pour un humain qui connaît la maison, c'est de la gymnastique. Pour un agent IA, c'est trois problèmes structurels :

1. **Le contexte explose.** Pour modifier une fonctionnalité, l'agent doit charger des fichiers éparpillés partout — et [tout ce qui entre dans le contexte se paie]({{ site.baseurl }}/fr/2026/07/05/tokens-llm-envoyes-sortie-cache/), en tokens et en qualité d'attention.
2. **Le rayon d'explosion est maximal.** `OrderService` sert douze fonctionnalités ? Une modification pour la treizième peut casser les douze autres. L'agent ne le sait pas — il ne voit pas les douze autres.
3. **Le moule est flou.** « Où mettre le nouveau code ? » a six réponses. Six occasions de dériver.

## La tranche verticale : tout ce qui change ensemble, rangé ensemble

La **Vertical Slice Architecture** renverse le rangement : on n'organise plus par couche technique, mais **par fonctionnalité**. Une tranche = un cas d'usage de bout en bout — l'endpoint, la validation, le handler, l'accès aux données — dans **un seul dossier** :

```
Features/
  Orders/
    CreateOrder/
      CreateOrderEndpoint.cs     ← le module Carter
      CreateOrderCommand.cs      ← la commande
      CreateOrderHandler.cs      ← la logique
      CreateOrderValidator.cs    ← la validation
      CreateOrderHandlerTests.cs ← les tests, à côté
    GetOrderById/
      ...
```

Vous reconnaissez le moule du prompt de base : **CQRS fournit le format de la tranche** (une commande *ou* une requête + son handler), Carter et Minimal API en font l'emballage. Le dossier client complet au même étage, avec son équipe pluridisciplinaire.

Le principe directeur, formulé par Jimmy Bogard (l'auteur de MediatR, ça ne s'invente pas) : **maximiser la cohésion dans la tranche, minimiser le couplage entre les tranches.** Ce qui change ensemble vit ensemble.

## Pourquoi les agents IA adorent les tranches

C'est ici que le choix devient stratégique. Point par point :

**La tranche tient dans le contexte.** « Modifie CreateOrder » = charger un dossier de cinq fichiers courts. Tout y est, rien ne manque, rien ne déborde — la définition exacte du *bon* contexte : le plus petit qui fait le travail. Le `/context` de [Copilot CLI]({{ site.baseurl }}/fr/2026/07/19/copilot-cli-2-le-quotidien/) reste vert.

**Le rayon d'explosion est borné.** L'agent travaille dans `CreateOrder/` ? Le pire accident possible casse… CreateOrder. Les autres tranches ne partagent pas de service mutualisé qui propage la casse. En vibe engineering, où l'on relit *a posteriori* du code qu'on n'a pas tapé, **borner ce qu'une session peut casser** vaut tous les audits.

**Le moule est photocopiable.** « Ajoute AddOrderNote » = « copie la structure de CreateOrder ». Or un LLM est *littéralement* une machine à reproduire des patterns — donnez-lui trois tranches exemplaires, la quatrième sortira conforme. C'est le moule du prompt de base, version béton : la meilleure instruction n'est pas une consigne, c'est **un exemple dans le dépôt**.

**Les tranches se parallélisent.** Trois fonctionnalités = trois tranches = trois dossiers disjoints. Trois [worktrees, trois agents]({{ site.baseurl }}/fr/2026/07/21/copilot-cli-4-deleguer-et-automatiser/) — et **zéro conflit de merge**, puisque personne ne touche aux mêmes fichiers. L'architecture en couches rend ça presque impossible : tout le monde passe par `OrderService.cs`.

**La revue redevient lisible.** Une PR = une tranche = un diff qui se lit de haut en bas comme une histoire. Le correcteur — humain ou [agent code-review]({{ site.baseurl }}/fr/2026/07/20/copilot-cli-3-l-equipe-dans-le-terminal/) — évalue une fonctionnalité entière, pas des confettis dispersés dans six couches.

## Et SOLID, dans tout ça ?

Le « S » de SOLID — *une seule raison de changer* — est précisément ce que la tranche applique **à l'échelle architecturale** : une tranche = une fonctionnalité = une raison de changer. Là où un `OrderService` de 2 000 lignes viole le principe par construction, la tranche le respecte par construction.

Et les autres principes vivent très bien *dans* la tranche — mieux, même : il est beaucoup plus facile pour un agent (et pour vous) de garder un handler de 80 lignes ouvert à l'extension et propre sur ses dépendances qu'un service-dieu partagé. **Une architecture solide n'est pas celle qui empile les abstractions ; c'est celle dont les frontières rendent les principes faciles à respecter.**

## Le mot d'honnêteté : les vraies objections

- **« Ça duplique du code entre les tranches. »** Oui — un peu, et c'est **assumé**. Deux tranches qui se ressemblent aujourd'hui divergeront demain ; les coupler prématurément pour économiser dix lignes recrée le service-dieu. La règle des trois : on tolère deux répétitions, on extrait à la troisième — vers un dossier `Common/` minimal, et on [consigne ce choix dans un ADR]({{ site.baseurl }}/fr/2026/07/14/adr-memoire-decisions-architecture/).
- **« Et les transverses ? »** Authentification, logging, validation générique : ils ont leur place — les *behaviors* du pipeline (MediatR ou équivalent), les middlewares ASP.NET. Le règlement intérieur encadre toutes les tranches sans vivre dans aucune.
- **« La VSA est-elle la seule bonne réponse ? »** Non. Une clean architecture tenue avec discipline fonctionne aussi — l'essentiel du vibe engineering est d'avoir **un moule explicite, répétable et exprimé dans le dépôt**. Mais à moule égal, la tranche a l'avantage décisif de la **localité** : contexte réduit, casse bornée, parallélisation gratuite. C'est l'architecture qui pense comme travaille un agent.

## La ligne à ajouter à votre prompt de base

Concrètement, le [prompt de base]({{ site.baseurl }}/fr/2026/07/12/vibe-project-fondations-dotnet/) gagne trois lignes dans sa section Architecture :

```markdown
# Architecture
- Vertical Slice Architecture : le code est organisé par fonctionnalité
  (Features/<Domaine>/<CasDUsage>/), jamais par couche technique.
- Chaque tranche contient endpoint, commande/requête, handler, validation
  et tests, colocalisés.
- Pour toute nouvelle fonctionnalité : prends la tranche existante la plus
  proche comme modèle et reproduis sa structure.
- La duplication entre tranches est tolérée jusqu'à 3 occurrences ;
  au-delà, propose une extraction et consigne-la dans un ADR.
```

Et le premier ADR du projet s'écrit tout seul : *« ADR-0001 : Vertical Slice Architecture — contexte : projet développé majoritairement par agents IA… »*

## En résumé

- En vibe engineering, l'architecture n'est pas qu'une affaire de goût : c'est **l'outillage de travail de vos agents**.
- Les couches éparpillent une fonctionnalité partout : contexte obèse, casse propagée, moule flou — trois poisons pour un agent.
- La **tranche verticale** inverse tout : la fonctionnalité entière dans un dossier — **contexte minimal, rayon d'explosion borné, moule photocopiable, parallélisation gratuite, revue lisible**.
- SOLID y gagne : une tranche = une raison de changer, par construction.
- La duplication se tolère (règle des trois), les transverses vont dans le pipeline, et le choix se grave dans un **ADR**.

Une entreprise où chaque dossier client a son équipe complète au même étage, plutôt que douze allers-retours entre services : voilà l'architecture qu'il faut à vos agents. Et ça, franchement… c'est pas sorcier.
