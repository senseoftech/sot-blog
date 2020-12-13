---
layout: post
title:  "Create and publish to a Azure Container Registry"
date:   2018-08-16 21:35:00
categories: Azure
author: AClerbois
github_repo_username: aclerbois
github_repo: aclerbois
comments: true
image: /images/posts/azure-loves-docker.png
tags: [Azure,ACR]
---

## How to create a new Azure Container Registry and push images on it.

If you want like me, have a private image repository to store your Docker projects, using Azure Container Registry is a solution. 

<!--more-->

## What is an Azure Container Registry

> Azure Container Registry is a private registry for hosting container images. Using the Azure Container Registry, you can store Docker-formatted images for all types of container deployments. Azure Container Registry integrates well with orchestrators hosted in Azure Container Service, including Docker Swarm, DC/OS, and Kubernetes. Users can benefit from using familiar tooling capable of working with the open source Docker Registry v2.
> Use Azure Container Registry to:
> * Store and manage container images across all types of Azure deployments
> * Use familiar, open-source Docker command line interface (CLI) tools
> * Keep container images near deployments to reduce latency and costs
> * Simplify registry access management with Azure Active Directory
> * Maintain Windows and Linux container images in a single Docker registry

In order to follow this article, you must have installed the [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli?view=azure-cli-latest)

## Create a new Azure Container Registry (via the web portal)

* Go on the [Azure Portal](https://portal.azure.com) > Click on __Create a resource__

![step-1](/images/posts/acr-1.PNG)

* Search for "__Container Registry__" on the search box, the result will show you an item called __Container Registry__ published by __Microsoft__.

![step-2](/images/posts/acr-2.PNG)

Azure will explain you a small description of what is an __Azure Container Registry__ and you can Create a new one, click on "__Create__" button.

* Fill the form with your preferences: 

![step-3](/images/posts/acr-3.PNG)

> **Remarks : the SKU is proposed with 3 choices** 
>
> |                        | BASIC         | STANDARD      | PREMIUM                                                                                   |
> |------------------------|---------------|---------------|-------------------------------------------------------------------------------------------|
> | Price per day          | $0.1671       | $0.6671       | $1.6671                                                                                   |
> | Included storage (GiB) | 10            | 100           | 500 Premium offers enhanced throughput for docker pulls across multiple, concurrent nodes |
> | Total web hooks        | 2             | 10            | 100 (additional available upon request)                                                   |
> | Geo   Replication      | Not Supported | Not Supported | Supported $1.6671 per replicated region                                                   |
>
> Source : [https://azure.microsoft.com/en-us/pricing/details/container-registry/](https://azure.microsoft.com/en-us/pricing/details/container-registry/)

Click on "__Create__" and wait Azure completes the creation of your new __Azure Container Registry__.

![step-4](/images/posts/acr-4.PNG)

### Play with our new __Azure Container Registry__

* Go to the new resource created and admire your new __ACR__ (Azure Container Registry). 

![step-5](/images/posts/acr-5.PNG)

* Go in the section "__Access keys__", in order to retrieve keys for the next steps.
* Enable the __Admin user__

![step-6](/images/posts/acr-6.PNG)

**Keep this information handy, we will need it for the rest of this article.**

## Setup our command line environment

Begin by login to your Azure ACR subscription: 

az acr login --name __[acr registry name]__

```console
az acr login --name aclerboisblog
```

After that, you need to add a new repository to docker using the instruction: 

docker login __[acr registry name]__.azurecr.io -u __[username]__ -p __[password]__

```console
docker login aclerboisblog.azurecr.io -u aclerboisblog -p xjVDh72yUEIpc3auQnRObjJJp2fIO3T+
```

Great! we have set up your environment, our next will be to push an image:

![step-8](/images/posts/acr-8.PNG)

## Publish our first image 

For this part, I will use an empty .NET Core application with the __Docker Support__ added to the project console.

> Project files available at this link : [__aclerbois.acr.console repository__](https://github.com/aclerbois/aclerbois.acr.console)

To begin the creation of our new image, we need to build it with this command:  

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

Once the image is built, you can tag it to the remote registry: 

docker tag  __[name of your image]__:__[tag]__ __[registry name]__.azurecr.io/ __[name of your image for the remote registry]__:__[remote image tag]__

```console
docker tag aclerbois.acr.console:1.0.0 aclerboisblog.azurecr.io/aclerbois.acr.console:1.0.0
```

Our image is ready to be __pushed__ to the ACR: 

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

Awesome, we've pushed our first image, let's see it on the portal. 

![step-9](/images/posts/acr-9.PNG)

Ok, I agreed that is a lot annoying to build, tag and push on each modification you do. You can go further by using on [Visual Studio.com](https://visualstudio.microsoft.com) a __Continuous Integration__ way the image publication.
For my part, I create a bat file (available [here](https://github.com/aclerbois/aclerbois.acr.console/blob/master/publish.bat)) to automatize a little bit the command line.

I hope you have appreciate to read this article, feel free to reach if you have remarks or questions.
