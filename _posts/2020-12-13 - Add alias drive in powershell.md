---
layout: post
title:  "Add alias drive in powershell"
date:   2020-12-13 00:00:00
image: /images/posts/powershell.jpg
tags: [powershell, cli, tips]
---

When you have several clients or projects and, like me, you often use your command prompt. 

It is often painful to navigate from folder to folder to get to the exact location of the project.

With this little trick, you can make a projectName cd to land directly at the desired location.

<!--more-->

The powershell commandlet is ```New-PSDrive``` with the syntax : 

```bash
New-PSDrive [DRIVE_NAME] filesystem [PATH_TO_FOLDER]
```

You can include this in your Powershell profile to have it each time you launch a new Powershell Console instance. To edit your profile, run this command in powershell : 

```bash
notepad $Profile
```