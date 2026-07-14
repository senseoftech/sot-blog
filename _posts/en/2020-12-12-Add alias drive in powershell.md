---
layout: post
title:  "Add alias drive in powershell"
date:   2020-12-12 00:00:00
author: AClerbois
ref: powershell-alias-drive
image: /images/posts/powershell.jpg
tags: [powershell, cli, tips]
level: 100
---

When you have several clients or projects and, like me, you often use your command prompt, it is often painful to navigate from folder to folder to get to the exact location of the project.

With this little trick, you can use a `projectName` drive to land directly at the desired location.

<!--more-->

The PowerShell cmdlet is ```New-PSDrive```, with the syntax: 

```bash
New-PSDrive [DRIVE_NAME] filesystem [PATH_TO_FOLDER]
```

From now on, you can call the alias with the following cmdlet: 

```bash
cd [DRIVE_NAME]:

# i.e : 
cd MyDrive:
```

You can include this in your PowerShell profile to have it available each time you launch a new PowerShell Console instance. To edit your profile, run this command in PowerShell: 

```bash
notepad $Profile
```
