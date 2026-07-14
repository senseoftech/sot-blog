---
layout: post
title:  "Créer et publier vers un Azure Container Registry"
date:   2018-08-16 21:35:00
author: AClerbois
lang: fr
ref: azure-container-registry
image: /images/posts/azure-loves-docker.png
tags: [Azure,ACR]
level: 200
---

## Comment créer un nouvel Azure Container Registry et y pousser des images.

Si, comme moi, vous souhaitez disposer d'un dépôt d'images privé pour stocker vos projets Docker, l'utilisation d'Azure Container Registry est une solution.

<!--more-->

## Qu'est-ce qu'un Azure Container Registry

> Azure Container Registry est un registre privé pour l'hébergement d'images de conteneurs. Avec Azure Container Registry, vous pouvez stocker des images au format Docker pour tous les types de déploiements de conteneurs. Azure Container Registry s'intègre bien avec les orchestrateurs hébergés dans Azure Container Service, notamment Docker Swarm, DC/OS et Kubernetes. Les utilisateurs peuvent bénéficier d'un outillage familier capable de fonctionner avec le Docker Registry v2 open source.
> Utilisez Azure Container Registry pour :
> * Stocker et gérer les images de conteneurs pour tous les types de déploiements Azure
> * Utiliser les outils en ligne de commande (CLI) Docker open source familiers
> * Conserver les images de conteneurs à proximité des déploiements afin de réduire la latence et les coûts
> * Simplifier la gestion des accès au registre avec Azure Active Directory
> * Maintenir des images de conteneurs Windows et Linux dans un unique Docker registry

Pour suivre cet article, vous devez avoir installé l'[Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest).

## Créer un nouvel Azure Container Registry (via le portail web)

* Rendez-vous sur le [portail Azure](https://portal.azure.com) > Cliquez sur __Create a resource__

![step-1](/images/posts/acr-1.PNG)

* Recherchez « __Container Registry__ » dans la barre de recherche ; le résultat vous affichera un élément appelé __Container Registry__ publié par __Microsoft__.

![step-2](/images/posts/acr-2.PNG)

Azure vous donnera une petite description de ce qu'est un __Azure Container Registry__, et vous pourrez en créer un nouveau en cliquant sur le bouton « __Create__ ».

* Remplissez le formulaire selon vos préférences :

![step-3](/images/posts/acr-3.PNG)

> **Remarque : le SKU est proposé avec 3 choix**
>
> |                        | BASIC         | STANDARD      | PREMIUM                                                                                   |
> |------------------------|---------------|---------------|-------------------------------------------------------------------------------------------|
> | Price per day          | $0.1671       | $0.6671       | $1.6671                                                                                   |
> | Included storage (GiB) | 10            | 100           | 500 Premium offers enhanced throughput for docker pulls across multiple, concurrent nodes |
> | Total web hooks        | 2             | 10            | 100 (additional available upon request)                                                   |
> | Geo   Replication      | Not Supported | Not Supported | Supported $1.6671 per replicated region                                                   |
>
> Source : [https://azure.microsoft.com/en-us/pricing/details/container-registry/](https://azure.microsoft.com/en-us/pricing/details/container-registry/)

Cliquez sur « __Create__ » et attendez qu'Azure termine la création de votre nouvel __Azure Container Registry__.

![step-4](/images/posts/acr-4.PNG)

### Jouons avec notre nouvel __Azure Container Registry__

* Rendez-vous sur la nouvelle ressource créée et admirez votre nouvel __ACR__ (Azure Container Registry).

![step-5](/images/posts/acr-5.PNG)

* Rendez-vous dans la section « __Access keys__ », afin de récupérer les clés pour les prochaines étapes.
* Activez l'__Admin user__

![step-6](/images/posts/acr-6.PNG)

**Gardez ces informations à portée de main, nous en aurons besoin pour la suite de cet article.**

## Configurer notre environnement en ligne de commande

Commencez par vous connecter à votre souscription Azure ACR :

az acr login --name __[acr registry name]__

```console
az acr login --name aclerboisblog
```

Après cela, vous devez ajouter un nouveau repository à docker à l'aide de l'instruction :

docker login __[acr registry name]__.azurecr.io -u __[username]__ -p __[password]__

```console
docker login aclerboisblog.azurecr.io -u aclerboisblog -p xjVDh72yUEIpc3auQnRObjJJp2fIO3T+
```

Parfait ! Nous avons configuré votre environnement, la prochaine étape sera de pousser une image :

![step-8](/images/posts/acr-8.PNG)

## Publier notre première image

Pour cette partie, j'utiliserai une application .NET Core vide avec le __Docker Support__ ajouté au projet console.

> Fichiers du projet disponibles à ce lien : [__aclerbois.acr.console repository__](https://github.com/aclerbois/aclerbois.acr.console)

Pour commencer la création de notre nouvelle image, nous devons la builder avec cette commande :

> docker build -t __[name of your image]__:__[tag]__ .

```console
λ __docker build -t aclerbois.acr.console:1.0.0__ .
Sending build context to Docker daemon  123.9kB
Step 1/13 : FROM microsoft/dotnet:2.1-runtime AS base
 ---> 4a127234d2b2
Step 2/13 : WORKDIR /app
 ---> Running in fa36f7df9812
Removing intermediate container fa36f7df9812
 ---> 841c12329b62
Step 3/13 : FROM microsoft/dotnet:2.1-sdk AS build
 ---> 9e243db15f91
Step 4/13 : WORKDIR /src
 ---> Running in 03577c22ed05
Removing intermediate container 03577c22ed05
 ---> 6ac318e64491
Step 5/13 : COPY . .
 ---> 70d4e7d16a70
Step 6/13 : RUN dotnet restore aclerbois.acr.console.csproj -nowarn:msb3202,nu1503
 ---> Running in 4cd9aeea9340
  Restoring packages for /src/aclerbois.acr.console.csproj...
  Generating MSBuild file /src/obj/aclerbois.acr.console.csproj.nuget.g.props.
  Generating MSBuild file /src/obj/aclerbois.acr.console.csproj.nuget.g.targets.
  Restore completed in 235.6 ms for /src/aclerbois.acr.console.csproj.
Removing intermediate container 4cd9aeea9340
 ---> 03e56f6a7b35
Step 7/13 : RUN dotnet build aclerbois.acr.console.csproj -c Release -o /app
 ---> Running in eb62eb704ff7
Microsoft (R) Build Engine version 15.7.179.6572 for .NET Core
Copyright (C) Microsoft Corporation. All rights reserved.

  Restore completed in 51.89 ms for /src/aclerbois.acr.console.csproj.
  aclerbois.acr.console -> /app/aclerbois.acr.console.dll

Build succeeded.
    0 Warning(s)
    0 Error(s)

Time Elapsed 00:00:03.76
Removing intermediate container eb62eb704ff7
 ---> 2d837d4639e5
Step 8/13 : FROM build AS publish
 ---> 2d837d4639e5
Step 9/13 : RUN dotnet publish aclerbois.acr.console.csproj -c Release -o /app
 ---> Running in edaee5940725
Microsoft (R) Build Engine version 15.7.179.6572 for .NET Core
Copyright (C) Microsoft Corporation. All rights reserved.

  Restore completed in 58.95 ms for /src/aclerbois.acr.console.csproj.
  aclerbois.acr.console -> /src/bin/Release/netcoreapp2.1/aclerbois.acr.console.dll
  aclerbois.acr.console -> /app/
Removing intermediate container edaee5940725
 ---> 26adf2c4933d
Step 10/13 : FROM base AS final
 ---> 841c12329b62
Step 11/13 : WORKDIR /app
 ---> Running in cb9c26de7878
Removing intermediate container cb9c26de7878
 ---> a46063ac949b
Step 12/13 : COPY --from=publish /app .
 ---> b5f202a6b993
Step 13/13 : ENTRYPOINT ["dotnet", "aclerbois.acr.console.dll"]
 ---> Running in 8f60e5924666
Removing intermediate container 8f60e5924666
 ---> 8d431fbe5ff3
Successfully built 8d431fbe5ff3
Successfully tagged aclerbois.acr.console:1.0.0
SECURITY WARNING: You are building a Docker image from Windows against a non-Windows Docker host. All files and directories added to build context will have '-rwxr-xr-x' permissions. It is recommended to double check and reset permissions for sensitive files and directories.
```

Une fois l'image buildée, vous pouvez la tagger vers le registre distant :

docker tag  __[name of your image]__:__[tag]__ __[registry name]__.azurecr.io/ __[name of your image for the remote registry]__:__[remote image tag]__

```console
docker tag aclerbois.acr.console:1.0.0 aclerboisblog.azurecr.io/aclerbois.acr.console:1.0.0
```

Notre image est prête à être __poussée__ vers l'ACR :

docker push __[registry name]__.azurecr.io/ __[name of your image for the remote registry]__:__[remote image tag]__

```
docker push aclerboisblog.azurecr.io/aclerbois.acr.console:1.0.0

The push refers to repository [aclerboisblog.azurecr.io/aclerbois.acr.console]
41132cce2256: Pushed
5171bb51769e: Pushed
b698081f13ec: Pushed
324d9a4273a9: Pushed
3cf68b57ae87: Pushed
cdb3f9544e4c: Pushed
1.0.0: digest: sha256:5f8661b4c30245dadf10fe4cbd0b1b6fbfc9cabd7eb72c6b0d84c67da5bf220e size: 1578
```

Génial, nous avons poussé notre première image, allons la voir sur le portail.

![step-9](/images/posts/acr-9.PNG)

Ok, j'admets que c'est assez pénible de builder, tagger et pousser à chaque modification que vous faites. Vous pouvez aller plus loin en utilisant [Visual Studio.com](https://visualstudio.microsoft.com) pour publier l'image de manière __Continuous Integration__.
Pour ma part, j'ai créé un fichier bat (disponible [ici](https://github.com/aclerbois/aclerbois.acr.console/blob/master/publish.bat)) pour automatiser un peu la ligne de commande.

J'espère que vous avez apprécié la lecture de cet article ; n'hésitez pas à me contacter si vous avez des remarques ou des questions.
