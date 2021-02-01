---
layout: post
title:  "Change pipeline name"
date:   2020-12-12 00:00:00
image: /images/posts/azuredevops.jpg
tags: [azure devops, tips]
---

When you start to work on your own pipeline with yaml or using the GUI, you may interested to change the build name. 

This is a way to do it :

<!--more-->

On your pipeline, you can add a step in bash and use the following line 

```yaml
 echo "##vso[build.updatebuildnumber]Hello World"
```

This command is part of [Logging Command](https://docs.microsoft.com/en-us/azure/devops/pipelines/scripts/logging-commands?view=azure-devops&tabs=bash&WT.mc_id=DOP-MVP-5001937). 