---
layout: post
title:  "Visual Studio 2017 : GIT ssl certificate issue : unable to get local issuer certificate"
date:   2016-07-1 22:37:00
categories: Web
author: AClerbois
github_repo_username: aclerbois
github_repo : aclerbois
comments: true
image: /images/posts/trust.jpg
tags: [azure devops, hgit]
---

When you try to clone a repository, you may have an error like " ssl certificate problem: unable to get local issuer certificate"
<!--more-->
And may be the same in command line :

{% highlight c %}

C:\GIT>git clone https://onpremiseserver:8081/tfs/defaultcollection/collection/_git/repos
Cloning into ‘repos’…
fatal: unable to access ‘https://onpremiseserver:8081/tfs/defaultcollection/collection/_git/repos’: SSL certificate problem: unable to get local issuer certificate

{% endhighlight %}

In order to resolve the issue, you will put the Base64 certificat of the TFS Server.

## Fixe

1. Extract the Base64 Certificat of the TFS server
* Go on the On-premise TFS server with Internet Explorer.
* Click on the lock at the right of the URL bar. 
* Click on "View certificates" 
* Go on the "Certification Path" tab
* Select the root certificat 
* Click on the button "View Certificate"
* Go on the "Details" tab
* Click on the button "Copy to File…" 

A wizard window appears: 

* click on the "Next >" button
* Select the option " Base-64 encoded X.509 (.CER)" and then click on " Next >" button
* Select an extraction location by typing the location with a name for the certificate (example : TFS-ROOT-CERT.CER) or clicking on "Browse" and put the name at the right place

At the end of the Wizard, you will get a summary of your choices, close the window by clicking on "Finish"

Open the file with a text editor like "?otepad++" and Copy the content on the clipboard

2. Add the certificate Base-64 content to the ca-bundle.crt

Now, you must open " Notepad++" with administrator rights

Go on the directory where is install Visual Studio and lookup for the folder "certs", the path must be the followed
C:\Program Files (x86)\Microsoft Visual Studio\2017\<Version>\Common7\IDE\CommonExtensions\Microsoft\TeamFoundation\Team Explorer\Git\mingw32\ssl\certs

Please find the following array the path for Visual Studio 2017 with each version available.

| Version       | Location          | 
| ------------- |:-------------:| 
| Enterprise      | C:\Program Files (x86)\Microsoft Visual Studio\2017\Enterprise\Common7\IDE\CommonExtensions\Microsoft\TeamFoundation\Team Explorer\Git\mingw32\ssl\certs | 
| Professional      | C:\Program Files (x86)\Microsoft Visual Studio\2017\Professional \Common7\IDE\CommonExtensions\Microsoft\TeamFoundation\Team Explorer\Git\mingw32\ssl\certs      |   
| Community | C:\Program Files (x86)\Microsoft Visual Studio\2017\Community\Common7\IDE\CommonExtensions\Microsoft\TeamFoundation\Team Explorer\Git\mingw32\ssl\certs    |    

Open the "ca-bundle.crt" file on "Notepad++" (click right and " Open with Notepad++") 

Paste the content of the Extracted certificat (Step 1) at the end of the file .crt 

## Command line

This will solve the issue with Visual Studio 2017, if you want to solve the issue with the command line you must reproduce the pasting on the file "ca-bundle.crt" present on the directory C:\Program Files\Git\mingw64\ssl\certs