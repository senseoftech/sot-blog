---
layout: post
title:  "Mettre à jour tous les dotnet tools en une seule commande"
date:   2020-01-09 10:00:00
author: AClerbois
lang: fr
ref: update-dotnet-tools
image: /images/posts/powershell.jpg
tags: [.net core, cli, nuget]
level: 100
---

Être développeur, c'est être paresseux. J'utilise souvent les dotnet global tools installés via la dotnet CLI.

Malheureusement, à ce jour il n'existe pas de commande « ```dotnet tool update --all``` » pour mettre à jour tous les packages en même temps.
Voici la commande PowerShell que j'utilise pour tous les mettre à jour, bien calé dans mon siège :
<!--more-->

```powershell
foreach ($packageToUpdate in $(dotnet tool list --global | Select-Object -Skip 2)) {
    Write-Host "dotnet tool update --global $($packageToUpdate.Split(" ", 2)[0])"
    dotnet tool update --global $($packageToUpdate.Split(" ", 2)[0])
}
```
