---
layout: post
title:  "Ajouter un lecteur alias dans PowerShell"
date:   2020-12-12 00:00:00
author: AClerbois
lang: fr
ref: powershell-alias-drive
image: /images/posts/powershell.jpg
tags: [powershell, cli, tips]
level: 100
---

Quand vous avez plusieurs clients ou projets et que, comme moi, vous utilisez souvent votre invite de commande, il est souvent pénible de naviguer de dossier en dossier pour arriver à l'emplacement exact du projet.

Avec cette petite astuce, vous pouvez utiliser un lecteur `projectName` pour arriver directement à l'emplacement souhaité.

<!--more-->

La cmdlet PowerShell est ```New-PSDrive```, avec la syntaxe : 

```bash
New-PSDrive [DRIVE_NAME] filesystem [PATH_TO_FOLDER]
```

À partir de maintenant, vous pouvez appeler l'alias avec la cmdlet suivante : 

```bash
cd [DRIVE_NAME]:

# i.e : 
cd MyDrive:
```

Vous pouvez inclure ceci dans votre profil PowerShell pour en disposer à chaque fois que vous lancez une nouvelle instance de console PowerShell. Pour éditer votre profil, exécutez cette commande dans PowerShell : 

```bash
notepad $Profile
```
