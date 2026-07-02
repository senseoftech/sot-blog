---
layout: post
title:  "How to delete a project Wiki in Azure DevOps?"
date:   2021-01-02 00:00:00
author: AClerbois
ref: delete-wiki-repo
image: /images/posts/azuredevops.png
tags: [azure devops, tips]
---

# How to delete a project Wiki in Azure DevOps?

> To follow this blog post, you should have the Azure CLI and the Azure DevOps extension installed in your PowerShell.

In order to delete a wiki project, you have to delete its (hidden) Git repo.
<!--more-->
First step: identify the repository behind the Project Wiki:

```bash
az devops wiki list --project <MyProject>
```

In this example, you will see a lot of data; save the repository Guid for the next step.

Second step: delete the repo

```bash
az repos delete --id 2c9047e3-ecb9-4913-b51e-893bc5a3e6gg 
--project <MyProject>
```

And that's it...

Enjoy