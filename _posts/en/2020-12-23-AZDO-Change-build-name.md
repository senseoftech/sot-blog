---
layout: post
title:  "Change pipeline name in build time"
date:   2020-12-12 00:00:00
author: AClerbois
ref: azdo-build-name
image: /images/posts/azuredevops.png
tags: [azure devops, tips]
level: 100
---

# Change pipeline name in build time

When you start to work on your own pipeline, either with YAML or using the GUI, you may be interested in changing the build name. 

Here is one way to do it:

<!--more-->

In your pipeline, you can add a bash step and use the following line: 

```yaml
 echo "##vso[build.updatebuildnumber]Hello World"
```

This command is part of the [Logging Commands](https://docs.microsoft.com/en-us/azure/devops/pipelines/scripts/logging-commands?view=azure-devops&tabs=bash&WT.mc_id=DOP-MVP-5001937). 
