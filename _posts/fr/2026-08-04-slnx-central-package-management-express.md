---
layout: post
title: "slnx et Central Package Management : modernisez votre solution en dix minutes — c'est pas sorcier !"
date: 2026-08-04 10:00:00
author: AClerbois
lang: fr
ref: slnx-cpm
image: /images/posts/slnx-cpm.png
tags: [dotnet, nuget, tooling, csharp, best-practices]
level: 200
---

Deux consignes du [prompt de base]({{ site.baseurl }}/fr/2026/07/12/vibe-project-fondations-dotnet/) n'ont jamais eu leur mode d'emploi : *« solution au format .slnx »* et *« NuGet Central Package Management »*. Réparation aujourd'hui, format express : **deux migrations de cinq minutes chacune**, qui rendent votre dépôt plus lisible pour les humains — et pour les agents. Chrono lancé : c'est pas sorcier.

<!--more-->

## Migration 1 : du .sln au .slnx

Ouvrez un fichier `.sln` : un format propriétaire vieux de 25 ans, des GUID partout, des sections cryptiques — et le champion toutes catégories du **conflit de merge illisible**. Son successeur `.slnx`, c'est le même contenu en **XML minimal** :

```xml
<Solution>
  <Folder Name="/src/">
    <Project Path="src/Orders.Api/Orders.Api.csproj" />
    <Project Path="src/Web.Front/Web.Front.csproj" />
  </Folder>
  <Folder Name="/tests/">
    <Project Path="tests/Orders.Tests/Orders.Tests.csproj" />
  </Folder>
</Solution>
```

La migration tient en une commande :

```bash
dotnet sln MaSolution.sln migrate
```

Vous obtenez le `.slnx` à côté ; vérifiez que tout builde, supprimez l'ancien `.sln`, commitez. Le support est là depuis un moment déjà — Visual Studio (17.14+), la CLI `dotnet`, Rider, VS Code — donc plus d'excuse de tooling.

**Pourquoi ça compte au-delà de l'esthétique** : un diff de PR sur un `.slnx` se *lit* (« un projet ajouté », visible en deux lignes) ; un conflit de merge s'y résout à la main sans sueur froide ; et un agent qui doit ajouter un projet à la solution modifie un XML évident au lieu de jongler avec des GUID. La lisibilité est une fonctionnalité.

## Migration 2 : le Central Package Management

Le symptôme, vous le connaissez : `Newtonsoft.Json` en 13.0.1 dans un projet, 13.0.3 dans l'autre, un avertissement NU1603 qui traîne, et personne ne sait quelle version fait foi. **Une solution, N projets, N vérités.**

Le CPM inverse la logique : **toutes les versions dans un seul fichier** à la racine, `Directory.Packages.props` :

```xml
<Project>
  <PropertyGroup>
    <ManagePackageVersionsCentrally>true</ManagePackageVersionsCentrally>
  </PropertyGroup>
  <ItemGroup>
    <PackageVersion Include="Carter" Version="9.0.0" />
    <PackageVersion Include="FluentValidation" Version="12.1.0" />
    <PackageVersion Include="xunit" Version="2.9.3" />
  </ItemGroup>
</Project>
```

…et les `.csproj` ne gardent que **la référence, sans version** :

```xml
<ItemGroup>
  <PackageReference Include="Carter" />
  <PackageReference Include="FluentValidation" />
</ItemGroup>
```

Migration manuelle en trois gestes (dix minutes sur une solution moyenne) : créer le fichier, y déplacer chaque `Version=`, supprimer les attributs `Version` des csproj. Deux options à connaître :

- **`VersionOverride`** : l'exception assumée — *ce* projet a besoin d'une autre version, et ça se voit explicitement.
- **`GlobalPackageReference`** : le package injecté **partout** (analyzers, source generators) — parfait pour outiller toute la solution d'un coup, [analyzers du prompt de base compris]({{ site.baseurl }}/fr/2026/07/12/vibe-project-fondations-dotnet/).

## Le dividende vibe engineering

Ces deux migrations sont cousines : elles remplacent du **dispersé illisible** par **une source de vérité lisible** — et vous connaissez la musique :

- « Mets à jour FluentValidation partout » devient, pour [un agent]({{ site.baseurl }}/fr/2026/07/18/copilot-cli-1-sortez-copilot-de-l-ide/), **l'édition d'une ligne dans un fichier** — au lieu d'une chasse aux csproj avec le risque d'en rater un.
- Dependabot et Renovate ouvrent des PR d'une ligne, relisibles en trois secondes.
- Et l'audit de sécurité ([souvenez-vous du slopsquatting]({{ site.baseurl }}/fr/2026/07/10/securiser-github-copilot/)) se fait sur **un** fichier : ce qui entre dans la solution se voit à un seul endroit.

**Les deux pièges honnêtes** : la migration CPM se fait **d'un coup** (un projet à moitié migré = erreurs NU1008 en cascade — bloquez dix minutes, pas deux sprints) ; et les versions *transitives* restent hors du fichier par défaut (l'option `CentralPackageTransitivePinningEnabled` existe pour les verrouiller aussi — à activer en connaissance de cause).

## En résumé

- **`.slnx`** : `dotnet sln migrate`, cinq minutes — des diffs lisibles et des conflits résolubles.
- **CPM** : `Directory.Packages.props`, dix minutes — une version par package, pour toute la solution.
- `VersionOverride` pour l'exception explicite, `GlobalPackageReference` pour les analyzers partout.
- Le fil rouge, toujours : **une source de vérité lisible** sert les humains en PR… et les agents en mission.

Deux fichiers modernisés, un quart d'heure, et votre dépôt gagne en clarté pour les dix prochaines années. Et ça, franchement… c'est pas sorcier.
