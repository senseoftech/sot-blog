---
layout: post
title:  "Update all dotnet tools on one command"
date:   2020-01-09 10:00:00
categories: dotnet
author: AClerbois
github_repo_username: aclerbois
github_repo : aclerbois
comments: true
image: /images/posts/trust.jpg
tags: [.net core, cli, nuget]
---

To be a developer is to be lazy. I often use the dotnet global tools set up in the dotnet cli.

Unfortunately, to date there is no : "```dotnet tool update --all```" command to be able to update all the packages at the same time. 
Here is the powershell command that I use to update all of them while lying in its seat:
<!--more-->

```powershell
foreach ($packageToUpdate in $(dotnet tool list --global | Select-Object -Skip 2)) {
    Write-Host "dotnet tool update --global $($packageToUpdate.Split(" ", 2)[0])"
    dotnet tool update --global $($packageToUpdate.Split(" ", 2)[0])
}
```
