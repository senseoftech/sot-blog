---
layout: post
title:  "Comment supprimer un Wiki de projet dans Azure DevOps ?"
date:   2021-01-02 00:00:00
author: AClerbois
lang: fr
ref: delete-wiki-repo
image: /images/posts/azuredevops.png
tags: [azure devops, tips]
---

# Comment supprimer un Wiki de projet dans Azure DevOps ?

> Pour suivre ce billet de blog, vous devez avoir l'Azure CLI et l'extension Azure DevOps installées dans votre PowerShell.

Pour pouvoir supprimer un projet wiki, vous devez supprimer son repo Git (caché).
<!--more-->
Première étape : identifier le repository derrière le Wiki de projet :

```bash
az devops wiki list --project <MyProject>
```

Dans cet exemple, vous verrez beaucoup de données ; conservez le Guid du repository pour l'étape suivante.

Deuxième étape : supprimer le repo

```bash
az repos delete --id 2c9047e3-ecb9-4913-b51e-893bc5a3e6gg 
--project <MyProject>
```

Et voilà...

Enjoy
