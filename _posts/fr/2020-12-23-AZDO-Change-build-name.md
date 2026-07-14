---
layout: post
title:  "Changer le nom du pipeline pendant le build"
date:   2020-12-12 00:00:00
author: AClerbois
lang: fr
ref: azdo-build-name
image: /images/posts/azuredevops.png
tags: [azure devops, tips]
level: 100
---

# Changer le nom du pipeline pendant le build

Quand vous commencez à travailler sur votre propre pipeline, que ce soit en YAML ou via l'interface graphique, vous pourriez vouloir changer le nom du build. 

Voici une façon de le faire :

<!--more-->

Dans votre pipeline, vous pouvez ajouter une étape bash et utiliser la ligne suivante : 

```yaml
 echo "##vso[build.updatebuildnumber]Hello World"
```

Cette commande fait partie des [Logging Commands](https://docs.microsoft.com/en-us/azure/devops/pipelines/scripts/logging-commands?view=azure-devops&tabs=bash&WT.mc_id=DOP-MVP-5001937). 
