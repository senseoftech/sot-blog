---
layout: post
title:  "Maîtriser les global tools dans .NET Core"
date:   2018-08-10 10:00:00
author: AClerbois
lang: fr
ref: netcore-global-tool
image: /images/posts/conquer-1.png
tags: [.net core, global tool, cli]
comments: true
---
# Maîtriser les global tools dans .NET Core

Comme vous le savez peut-être déjà, .NET Core nous permet de créer et d'exécuter des applications sur une multitude de plateformes. Il peut être difficile de les distribuer, en particulier les applications console.
Si l'on regarde ce qui existe dans le monde open source, et notamment sous NodeJS, on peut télécharger et installer une application assez facilement. Elle est ensuite automatiquement accessible depuis n'importe quel dossier du PC.
Voici un exemple avec node :

```console
$ npm install -g myLibrary
$ myLibrary
```

<!--more-->

À partir du SDK .NET Core 2.1, disponible depuis le 30 mai 2018, Microsoft nous propose une expérience similaire :

```console
$ dotnet install tool -g myLibrary
$ myLibrary
```

Avec la première ligne de commande, l'application est téléchargée et installée dans un espace commun. Une fois l'application installée, la seconde commande vous permet d'exécuter l'application console depuis n'importe où, `myLibrary` dans cet exemple.

## Hé Jamy, mais comment ça marche ?
(Jamy est une référence à une série documentaire française qui a popularisé la science dans les années 2000)

Cette fonctionnalité nous permet d'exposer des applications .NET Core, et plus précisément des applications netcoreapp 2.1 de type exécutable.
Le résultat est encapsulé dans un package NuGet et peut être distribué sur un serveur public (comme nuget.org), dans un espace privé (Visual Studio Online avec l'extension Packages, myget, ...) ou même dans un dossier local ou un répertoire distant.
Pour pouvoir utiliser cet exemple, je vous recommande de créer un répertoire destiné à contenir vos packages générés. Choisissez ensuite si vous souhaitez conserver les packages dans le workspace (le dossier de votre solution/projet) ou plus globalement sur votre ordinateur.
Voici comment rester dans le workspace :
- Créez un dossier à la racine de votre workspace, `nupkgs` dans mon exemple
- Créez un fichier de configuration : dotnet new nugetconfig
- Dans ce fichier de configuration, ajoutez la ligne qui définit votre répertoire :

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
 <packageSources>
    <add key="local-packages" value="./nupkgs" />  
 </packageSources>
</configuration>
```
## Pas de panique : ce n'est pas compliqué !
![Don't panic](/images/posts/conquer-2.jpg)

Maintenant que notre environnement est en place, partons à la recherche de résultats : créons notre application console :

```console
$ dotnet new console -o aclerbois.sayhello.programmez 
```

Cette commande crée un nouveau dossier nommé `aclerbois.sayhello.programz` et ajoute un projet d'application console .NET Core. Un fichier `program.cs` et un fichier `aclerbois.sayhello.programz.csproj` ont été ajoutés.

Commençons par modifier le fichier program.cs :

```csharp
static void Main(string[] args)
{
    Console.WriteLine("Salut les lecteurs du magazine Programmez!");
}
```
# Marquer l'application comme un tool

Dans la configuration de notre projet, nous allons définir l'application comme un tool. Rendez-vous dans `aclerbois.sayhello.programz.csproj` et configurez le projet comme suit :

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>netcoreapp2.1</TargetFramework>
    <PackAsTool>true</PackAsTool>
    <ToolCommandName>helloprogrammez</ToolCommandName>
    <PackageOutputPath>../nupkgs</PackageOutputPath>
    <Version>1.0.0</Version>
  </PropertyGroup>

</Project>
```
Vous connaissez peut-être les éléments OutputType, Version et TargetFramework, mais vous vous demandez sans doute ce que sont ces nouveaux éléments :

- `PackAsTool` : cela indique à la commande dotnet pack de packager correctement notre application afin qu'elle puisse être installée comme un tool.
- `ToolCommand` : cela vous permet de choisir le nom de l'exécutable en ligne de commande pour l'application. Avec ce paramètre, vous pouvez écrire helloprogram au lieu de aclerbois.sayhello.programz.

Note : si vous souhaitez utiliser le mot dotnet devant l'application, vous pouvez utiliser la valeur dotnet-helloprogram. La commande pour appeler la console sera :

```console
$ dotnet helloprogrammez
```

- `PackageOutputPath` : cela indique à la commande dotnet pack où placer le résultat .nupkg. Cette propriété n'est pas nouvelle et existe déjà dans le tooling publié. Pour notre exemple, elle doit pointer vers le chemin que nous avons configuré dans le fichier nuget.config.

## Et maintenant... ?

Nous sommes prêts à compiler et packager notre application. La commande `dotnet pack` compilera les binaires si ce n'est pas déjà fait et les packagera :

```console
$ dotnet pack -c Release
...
Successfully created package 
'C:\repos\clitools\nupkgs\aclerbois.sayhello.programmez.1.0.0.nupkg'.
```
Il ne nous reste plus qu'à installer le package généré :

```console
$ dotnet tool install -g aclerbois.sayhello.programmez

If there were no additional instructions, you can type the following command to invoke the tool: helloprogrammez
Tool 'aclerbois.sayhello.programmez' (version '1.0.0') was successfully installed.
```

Note : si vous êtes sur une version « preview », vous pouvez ignorer les avertissements générés par le compilateur.

Pour jouer le jeu, ouvrez une nouvelle invite de commande et tapez le mot magique :

![Result](/images/posts/conquer-3.png)

## Désinstaller une application

Il est très facile de désinstaller une application CLI. Vous devez utiliser la commande `dotnet tool uninstall [package name]`.
Dans notre cas :

```console
dotnet tool uninstall -g aclerbois.sayhello.programmez
```

### Les détails font la perfection, et la perfection n'est pas un détail, Léonard de Vinci.

Jetons un œil à la commande dotnet tool install.
Vous êtes autorisé à spécifier la version du package que vous souhaitez installer à l'aide de l'argument CLI `--version`.

```console
dotnet tool install -g aclerbois.sayhello.programmez --version 1.1.0
```

Vous pouvez également installer l'application uniquement dans le contexte de votre répertoire de travail. Pour ce faire, ne spécifiez pas le paramètre `-g` (ou `--global`) :

```console
dotnet tool install aclerbois.sayhello.programmez
```

Si les packages de votre application se trouvent dans un répertoire distant, utilisez l'argument `--source` avec l'emplacement de vos packages.

## Welcome home 

Notre tool helloprogrammez est installé dans le dossier `.dotnet\tools` du répertoire utilisateur :

![.NET Core](/images/posts/conquer-4.png)

La commande install génère un fichier .exe servant de wrapper sous Windows et des scripts shell sous MacOS / Linux. Sous Windows, il s'agit actuellement d'un exécutable .NET Framework, mais il est prévu de le remplacer par un exécutable natif dans une future version.
Les sources de mon exemple sont disponibles à l'adresse : [https://github.com/aclerbois/sayhello.programmez](https://github.com/aclerbois/sayhello.programmez)

## Sky's the limit

(Sauf pour Elon Musk, bien sûr)

Aujourd'hui, le nombre de ressources disponibles dans le répertoire public de npm est d'environ 600 000 packages. La diversité des fonctionnalités offertes par la communauté est impressionnante. L'arrivée de cette nouvelle contribution du SDK et les possibilités offertes par .NET Core sont illimitées. J'espère que le nombre de packages sur NuGet.org augmentera de façon exponentielle, avec de nombreux nouveaux tools qui nous permettront d'accélérer notre façon de travailler.
