---
layout: post
title:  "dotnet watch"
date:   2018-08-10 09:30:00
author: AClerbois
lang: fr
ref: dotnet-watch
image: /images/posts/powershell.jpg
tags: [.net core, cli]
---

# Développer des applications ASP.NET Core avec un file watcher

Par [Rick Anderson](https://twitter.com/RickAndMSFT) et [Victor Hurdugaci](https://twitter.com/victorhurdugaci)

`dotnet watch` est un outil qui exécute une commande de la [CLI .NET Core](/dotnet/core/tools) lorsque les fichiers source changent. Par exemple, une modification de fichier peut déclencher une compilation, l'exécution de tests ou un déploiement.

Ce tutoriel utilise une web API existante avec deux endpoints : l'un qui renvoie une somme et l'autre qui renvoie un produit. La méthode du produit contient un bug, qui est corrigé dans ce tutoriel.

<!--more-->

Téléchargez l'[application d'exemple](https://github.com/aspnet/Docs/tree/master/aspnetcore/tutorials/dotnet-watch/sample). Elle se compose de deux projets : *WebApp* (une web API ASP.NET Core) et *WebAppTests* (des tests unitaires pour la web API).

Dans un shell, rendez-vous dans le dossier *WebApp*. Exécutez la commande suivante :

```console
dotnet run
```

La sortie console affiche des messages similaires à ce qui suit (indiquant que l'application est en cours d'exécution et attend des requêtes) :

```console
$ dotnet run
Hosting environment: Development
Content root path: C:/Docs/aspnetcore/tutorials/dotnet-watch/sample/WebApp
Now listening on: http://localhost:5000
Application started. Press Ctrl+C to shut down.
```

Dans un navigateur web, rendez-vous sur `http://localhost:<port number>/api/math/sum?a=4&b=5`. Vous devriez voir le résultat `9`.

Rendez-vous sur l'API du produit (`http://localhost:<port number>/api/math/product?a=4&b=5`). Elle renvoie `9`, et non `20` comme on pourrait s'y attendre. Ce problème est corrigé plus loin dans le tutoriel.

::: moniker range="<= aspnetcore-2.0"

## Ajouter `dotnet watch` à un projet

L'outil de file watching `dotnet watch` est inclus dans la version 2.1.300 du SDK .NET Core. Les étapes suivantes sont nécessaires si vous utilisez une version antérieure du SDK .NET Core.

1. Ajoutez une référence au package `Microsoft.DotNet.Watcher.Tools` dans le fichier *.csproj* :

    ```xml
    <ItemGroup>
        <DotNetCliToolReference Include="Microsoft.DotNet.Watcher.Tools" Version="2.0.0" />
    </ItemGroup>
    ```

1. Installez le package `Microsoft.DotNet.Watcher.Tools` en exécutant la commande suivante :

    ```console
    dotnet restore
    ```

::: moniker-end

## Exécuter des commandes de la CLI .NET Core avec `dotnet watch`

N'importe quelle [commande de la CLI .NET Core](/dotnet/core/tools#cli-commands) peut être exécutée avec `dotnet watch`. Par exemple :

| Commande | Commande avec watch |
| ---- | ----- |
| dotnet run | dotnet watch run |
| dotnet run -f netcoreapp2.0 | dotnet watch run -f netcoreapp2.0 |
| dotnet run -f netcoreapp2.0 -- --arg1 | dotnet watch run -f netcoreapp2.0 -- --arg1 |
| dotnet test | dotnet watch test |

Exécutez `dotnet watch run` dans le dossier *WebApp*. La sortie console indique que `watch` a démarré.

## Effectuer des modifications avec `dotnet watch`

Assurez-vous que `dotnet watch` est en cours d'exécution.

Corrigez le bug dans la méthode `Product` de *MathController.cs* pour qu'elle renvoie le produit et non la somme :

```csharp
public static int Product(int a, int b)
{
  return a * b;
}
```

Enregistrez le fichier. La sortie console indique que `dotnet watch` a détecté une modification de fichier et redémarré l'application.

Vérifiez que `http://localhost:<port number>/api/math/product?a=4&b=5` renvoie le bon résultat.

## Exécuter des tests avec `dotnet watch`

1. Remettez la méthode `Product` de *MathController.cs* de façon à ce qu'elle renvoie la somme. Enregistrez le fichier.
1. Dans un shell, rendez-vous dans le dossier *WebAppTests*.
1. Exécutez [dotnet restore](/dotnet/core/tools/dotnet-restore).
1. Exécutez `dotnet watch test`. Sa sortie indique qu'un test a échoué et que le watcher attend des modifications de fichiers :

     ```console
     Total tests: 2. Passed: 1. Failed: 1. Skipped: 0.
     Test Run Failed.
     ```

1. Corrigez le code de la méthode `Product` pour qu'elle renvoie le produit. Enregistrez le fichier.

`dotnet watch` détecte la modification du fichier et relance les tests. La sortie console indique que les tests ont réussi.

## Personnaliser la liste des fichiers à surveiller

Par défaut, `dotnet-watch` suit tous les fichiers correspondant aux glob patterns suivants :

* `**/*.cs`
* `*.csproj`
* `**/*.resx`

D'autres éléments peuvent être ajoutés à la liste de surveillance en modifiant le fichier *.csproj*. Les éléments peuvent être spécifiés individuellement ou à l'aide de glob patterns.

```xml
<ItemGroup>
    <!-- extends watching group to include *.js files -->
    <Watch Include="**\*.js" Exclude="node_modules\**\*;**\*.js.map;obj\**\*;bin\**\*" />
</ItemGroup>
```

## Exclure des fichiers de la surveillance

`dotnet-watch` peut être configuré pour ignorer ses paramètres par défaut. Pour ignorer des fichiers spécifiques, ajoutez l'attribut `Watch="false"` à la définition d'un élément dans le fichier *.csproj* :

```xml
<ItemGroup>
    <!-- exclude Generated.cs from dotnet-watch -->
    <Compile Include="Generated.cs" Watch="false" />

    <!-- exclude Strings.resx from dotnet-watch -->
    <EmbeddedResource Include="Strings.resx" Watch="false" />

    <!-- exclude changes in this referenced project -->
    <ProjectReference Include="..\ClassLibrary1\ClassLibrary1.csproj" Watch="false" />
</ItemGroup>
```

## Projets de surveillance personnalisés

`dotnet-watch` n'est pas limité aux projets C#. Des projets de surveillance personnalisés peuvent être créés pour gérer différents scénarios. Considérez la structure de projet suivante :

* **test/**
  * *UnitTests/UnitTests.csproj*
  * *IntegrationTests/IntegrationTests.csproj*

Si l'objectif est de surveiller les deux projets, créez un fichier de projet personnalisé configuré pour surveiller les deux projets :

```xml
<Project>
    <ItemGroup>
        <TestProjects Include="**\*.csproj" />
        <Watch Include="**\*.cs" />
    </ItemGroup>

    <Target Name="Test">
        <MSBuild Targets="VSTest" Projects="@(TestProjects)" />
    </Target>

    <Import Project="$(MSBuildExtensionsPath)\Microsoft.Common.targets" />
</Project>
```

Pour démarrer la surveillance de fichiers sur les deux projets, rendez-vous dans le dossier *test*. Exécutez la commande suivante :

```console
dotnet watch msbuild /t:Test
```

VSTest s'exécute dès qu'un fichier change dans l'un ou l'autre des projets de test.

## `dotnet-watch` sur GitHub

`dotnet-watch` fait partie du [dépôt DotNetTools](https://github.com/aspnet/DotNetTools/tree/master/src/dotnet-watch) sur GitHub.
Source : https://docs.microsoft.com/en-us/aspnet/core/tutorials/dotnet-watch?view=aspnetcore-2.1
