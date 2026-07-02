---
layout: post
title:  "Visual Studio 2017 : GIT ssl certificate issue : unable to get local issuer certificate"
date:   2016-07-1 22:37:00
categories: Web
author: AClerbois
ref: tfs-git-certificate
github_repo_username: aclerbois
github_repo : aclerbois
comments: true
image: /images/posts/trust.jpg
tags: [azure devops, hgit]
---

When you try to clone a repository, you may get an error like "ssl certificate problem: unable to get local issuer certificate"
<!--more-->
And it may be the same on the command line:

{% highlight c %}

C:\GIT>git clone https://onpremiseserver:8081/tfs/defaultcollection/collection/_git/repos
Cloning into ‘repos’…
fatal: unable to access ‘https://onpremiseserver:8081/tfs/defaultcollection/collection/_git/repos’: SSL certificate problem: unable to get local issuer certificate

{% endhighlight %}

In order to resolve the issue, you will add the Base64 certificate of the TFS server.

## Fix

1. Extract the Base64 certificate of the TFS server
* Go to the on-premise TFS server with Internet Explorer.
* Click on the lock at the right of the URL bar. 
* Click on "View certificates" 
* Go to the "Certification Path" tab
* Select the root certificate 
* Click on the "View Certificate" button
* Go to the "Details" tab
* Click on the "Copy to File…" button

A wizard window appears: 

* click on the "Next >" button
* Select the option "Base-64 encoded X.509 (.CER)" and then click on the "Next >" button
* Select an extraction location by typing the location with a name for the certificate (example: TFS-ROOT-CERT.CER) or by clicking on "Browse" and putting the name in the right place

At the end of the wizard, you will get a summary of your choices; close the window by clicking on "Finish"

Open the file with a text editor like "Notepad++" and copy the content to the clipboard

2. Add the Base-64 certificate content to the ca-bundle.crt

Now, you must open "Notepad++" with administrator rights

Go to the directory where Visual Studio is installed and look for the folder "certs"; the path must be as follows:
C:\Program Files (x86)\Microsoft Visual Studio\2017\<Version>\Common7\IDE\CommonExtensions\Microsoft\TeamFoundation\Team Explorer\Git\mingw32\ssl\certs

Please find in the following table the path for Visual Studio 2017 for each available version.

| Version       | Location          | 
| ------------- |:-------------:| 
| Enterprise      | C:\Program Files (x86)\Microsoft Visual Studio\2017\Enterprise\Common7\IDE\CommonExtensions\Microsoft\TeamFoundation\Team Explorer\Git\mingw32\ssl\certs | 
| Professional      | C:\Program Files (x86)\Microsoft Visual Studio\2017\Professional \Common7\IDE\CommonExtensions\Microsoft\TeamFoundation\Team Explorer\Git\mingw32\ssl\certs      |   
| Community | C:\Program Files (x86)\Microsoft Visual Studio\2017\Community\Common7\IDE\CommonExtensions\Microsoft\TeamFoundation\Team Explorer\Git\mingw32\ssl\certs    |    

Open the "ca-bundle.crt" file in "Notepad++" (right-click and "Open with Notepad++") 

Paste the content of the extracted certificate (Step 1) at the end of the .crt file 

## Command line

This will solve the issue with Visual Studio 2017. If you want to solve the issue on the command line, you must repeat the paste in the file "ca-bundle.crt" present in the directory C:\Program Files\Git\mingw64\ssl\certs