---
layout: post
title:  "How to delete a project Wiki in Azure DevOps?"
date:   2021-01-02 00:00:00
image: /images/posts/azuredevops.png
tags: [azure devops, tips]
---

# How to delete a project Wiki in Azure DevOps?

> In order to run this blogpost you should have Azure CLI and the Azure DevOps extension installed on your Powershell.

In order to be able to delete a wiki project, you have to delete its (hidden) repo Git.
<!--more-->
First step: identify the repository behind the Project Wiki:

```bash
az devops wiki list --project <MyProject>
```

In this example, you will see a lot of data, you save the repository Guid for the next step.

Second step : Delete repo

```bash
az repos delete --id 2c9047e3-ecb9-4913-b51e-893bc5a3e6gg 
--project <MyProject>
```

And that'is...

Enjoy