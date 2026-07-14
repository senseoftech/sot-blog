---
layout: post
title: "Du vibe coding au vibe engineering : posez les fondations — c'est pas sorcier !"
date: 2026-07-12 10:00:00
author: AClerbois
lang: fr
ref: vibe-foundations
image: /images/posts/vibe-foundations.png
tags: [dotnet, AI, vibe-coding, architecture, blazor, best-practices]
level: 200
---

Démarrer un projet à partir de rien avec une IA, c'est grisant : quelques phrases, et le code jaillit. Mais le code jaillit **dans la direction que vous avez donnée** — ou dans celle que l'IA choisit par défaut si vous n'avez rien dit. Et là, bonne chance pour redresser le chantier au sprint 4.

C'est toute la différence entre deux pratiques qu'on confond : le **vibe coding** — on accepte ce qui sort sans le relire, on teste au feeling, parfait pour un prototype jetable — et le **vibe engineering** — l'IA écrit toujours le code, mais dans un cadre d'ingénierie posé dès le départ.

Ma parade pour rester du bon côté : un **prompt de base**, le même à chaque nouveau projet. Une bonne architecture de départ structure le projet et le fait évoluer dans le bon sens — exactement comme des fondations. Je vous détaille le mien, ligne par ligne, pour un projet .NET — et en fin d'article, une version prête à copier. Vous allez voir : c'est pas sorcier.

<!--more-->

## Pourquoi un prompt de base ?

Retenez une chose : **toute décision que vous n'exprimez pas sera prise à votre place.** L'IA choisira une version de framework (pas forcément la dernière), une organisation de solution (générique), une stratégie de tests (souvent aucune), une architecture (le premier tutoriel venu).

Chacun de ces choix par défaut est raisonnable isolément. Leur somme donne un projet sans colonne vertébrale — qui tient debout à la démo, et qui s'effondre à la première évolution sérieuse. Le prompt de base, c'est le **cahier des charges de l'architecte** : court, mais chaque ligne engage la structure du bâtiment.

Passons en revue le mien, et surtout le **pourquoi** de chaque ligne.

## La pile : .NET 10, Blazor et Fluent UI

> *« Application .NET 10, en Blazor avec Fluent UI. Si la complexité est importante, utiliser .NET Aspire. »*

Nommer la pile **explicitement et avec les versions** évite le premier piège du vibe coding : l'IA a appris sur des années de code, et sans consigne, elle vous ressort volontiers des patterns d'il y a trois versions. `.NET 10` fixe le cadre ; Blazor + [Fluent UI](https://www.fluentui-blazor.net/) donne une UI cohérente sans réinventer un design system.

Et la nuance importante : **Aspire seulement si la complexité le justifie.** Plusieurs services, de l'observabilité, des dépendances orchestrées → Aspire apporte beaucoup. Un CRUD monolithique → c'est de l'échafaudage inutile. Donner à l'IA le critère de décision, plutôt qu'un ordre absolu, c'est déjà de l'architecture.

## L'architecture : CQRS, Minimal API, Carter et MediatR

> *« Architecture CQRS, avec une vision Minimal API + Carter et MediatR. »*

Le cœur des fondations. **CQRS** (Command Query Responsibility Segregation) sépare ce qui **modifie** l'état (les commandes) de ce qui le **lit** (les requêtes). Pour une IA, c'est une consigne en or : chaque fonctionnalité devient un couple commande/requête + handler, un moule qu'elle remplit sans dévier.

- **Minimal API** : des endpoints fins, sans le cérémonial des contrôleurs.
- **[Carter](https://github.com/CarterCommunity/Carter)** : organise ces endpoints en modules propres — fini le `Program.cs` de 400 lignes.
- **MediatR** : chaque endpoint ne fait que déléguer à un handler. L'endpoint reste bête, le handler reste testable.

**Le mot d'honnêteté**, fidèle à la série : MediatR est passé sous **licence commerciale** (gratuit seulement sous un certain seuil de revenus). Le pattern compte plus que la bibliothèque : [Wolverine](https://wolverinefx.net/) fait le même travail, et un dispatch maison via l'injection de dépendances suffit souvent. L'important, c'est la consigne « un endpoint délègue à un handler » — pas le nom du package.

Le bénéfice au quotidien est énorme : quand vous demanderez « ajoute la fonctionnalité X » au sprint 12, l'IA saura **exactement où la mettre**. Un moule clair produit des briques régulières.

## La découpe moléculaire : des composants, pas des monolithes

> *« Toujours avoir une découpe moléculaire. »*

Côté UI, j'impose le principe de l'[atomic design](https://bradfrost.com/blog/post/atomic-web-design/) : des **atomes** (un bouton, un champ), assemblés en **molécules** (une barre de recherche), assemblées en **organismes** (un en-tête complet). Sans cette consigne, l'IA a un travers connu : la page Blazor de 800 lignes qui fait tout.

La découpe moléculaire force des composants **petits, réutilisables, testables** — et elle rend chaque conversation suivante plus simple : « modifie la molécule SearchBar » est un ordre chirurgical ; « modifie la recherche dans la grosse page » est une invitation à la casse.

## Les tests : le triple A et les 80 % — mais pas tout de suite

> *« Tests unitaires en triple A, couverture d'au moins 80 %. Cependant, en phase de démarrage, ne pas le faire directement : d'abord un premier jet vérifiable par l'utilisateur. »*

Deux consignes en une, et la seconde est ma préférée.

D'abord la norme : le **triple A** (Arrange, Act, Assert) — on prépare, on agit, on vérifie — et un plancher de **80 % de couverture**. L'IA écrit des tests volontiers, autant qu'ils soient lisibles et nombreux.

Ensuite le **séquencement**, et c'est là que le vibe coding a sa propre logique : **pas de tests sur le premier jet.** Pourquoi ? Parce qu'au tout début, le risque numéro un n'est pas la régression — c'est de construire *la mauvaise chose*. Je veux un prototype **vérifiable par l'humain** le plus vite possible : je clique, je valide la direction, *ensuite* on verrouille avec les tests. Écrire 80 % de couverture sur un premier jet qu'on va jeter à moitié, c'est bétonner des murs qu'on n'a pas encore décidé de garder.

C'est le même réflexe que dans [l'article sur les modes Copilot]({{ site.baseurl }}/fr/2026/07/04/copilot-modes-ask-edit-agent-plan/) : la boucle de feedback humaine d'abord, la consolidation ensuite.

## L'outillage moderne : CPM et slnx

> *« Utiliser les derniers standards .NET et C#, le Central Package Management et le format slnx. »*

Les détails qui trahissent un projet soigné :

- **Central Package Management** : toutes les versions de packages NuGet dans un seul `Directory.Packages.props`. Fini les versions qui divergent entre projets — une source de vérité.
- **Le format `.slnx`** : le nouveau format de solution, du XML lisible à la place de l'antique `.sln` illisible en diff.
- **Les derniers standards C#** : primary constructors, collection expressions, pattern matching moderne… Sans la consigne, l'IA retombe dans le C# de ses vieilles lectures.

Aucun de ces points ne change la fonctionnalité. Tous changent la **maintenabilité** — et c'est précisément l'objectif affiché dans mon prompt : *un code aussi maintenable que si un dev expert l'avait rédigé.* Cette phrase a l'air décorative ; elle recadre en réalité chaque micro-choix de l'IA vers la lisibilité plutôt que vers l'astuce.

## La documentation : des ADR, et comprendre avant de construire

> *« Ajouter un dossier docs avec des ADR. Toujours bien comprendre le besoin et s'aligner sur les choix d'architecture avant de démarrer le plan de conception. »*

La consigne la plus importante est la dernière, et elle ne parle pas de code : **comprendre le besoin, s'aligner, puis planifier.** Concrètement, j'attends de l'IA qu'elle me pose des questions et me soumette ses choix d'architecture **avant** la première ligne de code. Le vibe coding sans cette étape, c'est un maçon qui coule la dalle pendant que vous décrivez encore la maison.

Et les **ADR** (Architecture Decision Records) gardent la trace : un petit fichier par décision structurante — le contexte, les options, le choix, les conséquences. Dans un projet piloté par IA, c'est doublement précieux : les ADR documentent pour les humains, et **re-contextualisent l'IA** à chaque session. Une conversation s'oublie ; un dossier `docs/adr/` se relit — y compris par l'agent du sprint suivant.

## Le prompt bootstrap, le dépôt pérennise

Un prompt, aussi bon soit-il, a la durée de vie d'une conversation. Le vibe engineering commence quand ces fondations **quittent le chat pour entrer dans le dépôt** :

- **Gravez le prompt dans des fichiers d'instructions** : `copilot-instructions.md`, `AGENTS.md` ou l'équivalent selon votre outil. Chaque session future — la vôtre, celle d'un collègue, celle d'un agent — hérite des fondations sans qu'on les redemande. C'est exactement la mécanique détaillée dans [l'article sur la personnalisation de Copilot]({{ site.baseurl }}/fr/2026/07/02/github-copilot-skills-instructions-agents-mcp/).
- **Doublez la prose par l'outillage.** « Utilise les derniers standards C# » est une consigne que l'IA peut oublier au sprint 12. Un `.editorconfig`, des analyzers Roslyn, `TreatWarningsAsErrors` et un seuil de couverture dans la CI, eux, n'oublient jamais : le build échoue, l'agent corrige.

La formule à retenir : **le prompt exprime les décisions, le dépôt les mémorise, l'outillage les fait respecter.**

## Le prompt revisité, prêt à copier

Voici mon prompt de base, reformulé et structuré. Prenez-le comme un **template** : remplacez la pile par la vôtre — l'essentiel est que chaque décision structurante soit *exprimée*.

```markdown
# Mission
Tu démarres une application .NET 10 à partir de zéro.
Objectif : un code aussi maintenable que s'il était rédigé par un développeur expert.

# Avant de coder
- Commence par comprendre le besoin : pose-moi tes questions.
- Propose-moi les choix d'architecture et attends mon alignement.
- Rédige ensuite un plan de conception ; on implémente seulement après.

# Pile technique
- .NET 10, dernière version de C# — utilise les standards les plus récents du langage.
- Front : Blazor avec Fluent UI.
- Si la complexité le justifie (plusieurs services, observabilité, orchestration) :
  .NET Aspire. Sinon, rester simple.

# Architecture
- CQRS : sépare les commandes (écriture) des requêtes (lecture).
- Endpoints en Minimal API, organisés en modules avec Carter, dispatch via MediatR.
- UI en découpe moléculaire : atomes → molécules → organismes.
  Chaque composant : petit, réutilisable, testable.

# Qualité & outillage
- Solution au format .slnx.
- NuGet Central Package Management (Directory.Packages.props).
- Configure un .editorconfig et des analyzers Roslyn ; traite les warnings en erreurs.
- Nommage explicite, méthodes courtes, pas d'astuce au détriment de la lisibilité.
- Reporte ces conventions dans un fichier d'instructions du dépôt
  (copilot-instructions.md / AGENTS.md) pour les sessions suivantes.

# Tests
- Tests unitaires en Arrange-Act-Assert, objectif : au moins 80 % de couverture.
- EXCEPTION — phase de démarrage : ne commence pas par les tests.
  Livre d'abord un premier jet fonctionnel que je peux vérifier ;
  on consolide la couverture immédiatement après ma validation.

# Documentation
- Dossier docs/ avec des ADR (Architecture Decision Records) :
  une décision structurante = un ADR (contexte, options, choix, conséquences).
```

## En résumé

- En vibe coding, **toute décision non exprimée est prise par l'IA** — et rarement comme vous l'auriez prise.
- Un **prompt de base** fixe les fondations : pile explicite (versions comprises), architecture en moule (CQRS + Carter + MediatR), découpe moléculaire de l'UI.
- Les tests : **triple A et 80 %**, mais *après* le premier jet vérifiable — valider la direction avant de bétonner.
- **Comprendre, s'aligner, planifier** avant de coder — et consigner chaque choix dans des **ADR** qui re-contextualiseront l'IA aux sessions suivantes.
- Le prompt lance la session ; **les fichiers d'instructions du dépôt et l'outillage** (analyzers, CI) pérennisent. C'est ça, la bascule du vibe coding au **vibe engineering**.

Un bon prompt de base tient sur une page, mais c'est lui qui décide si votre projet du dimanche soir devient un logiciel qui évolue — ou un prototype qu'on réécrit. Des fondations avant les murs, un plan avant la dalle. Et ça, franchement… c'est pas sorcier.
