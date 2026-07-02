---
layout: post
title:  "Visual Studio 2017 : problème de certificat SSL GIT : unable to get local issuer certificate"
date:   2016-07-1 22:37:00
author: AClerbois
lang: fr
ref: tfs-git-certificate
image: /images/posts/trust.jpg
tags: [azure devops, hgit]
---

Lorsque vous tentez de cloner un dépôt, vous pouvez obtenir une erreur du type « ssl certificate problem: unable to get local issuer certificate »
<!--more-->
Et il peut en être de même en ligne de commande :

{% highlight c %}

C:\GIT>git clone https://onpremiseserver:8081/tfs/defaultcollection/collection/_git/repos
Cloning into ‘repos’…
fatal: unable to access ‘https://onpremiseserver:8081/tfs/defaultcollection/collection/_git/repos’: SSL certificate problem: unable to get local issuer certificate

{% endhighlight %}

Pour résoudre le problème, vous allez ajouter le certificat Base64 du serveur TFS.

## Correctif

1. Extrayez le certificat Base64 du serveur TFS
* Rendez-vous sur le serveur TFS on-premise avec Internet Explorer.
* Cliquez sur le cadenas à droite de la barre d'URL. 
* Cliquez sur « View certificates » 
* Allez dans l'onglet « Certification Path »
* Sélectionnez le certificat racine 
* Cliquez sur le bouton « View Certificate »
* Allez dans l'onglet « Details »
* Cliquez sur le bouton « Copy to File… » 

Une fenêtre d'assistant apparaît : 

* cliquez sur le bouton « Next > »
* Sélectionnez l'option « Base-64 encoded X.509 (.CER) » puis cliquez sur le bouton « Next > »
* Sélectionnez un emplacement d'extraction en saisissant l'emplacement avec un nom pour le certificat (exemple : TFS-ROOT-CERT.CER) ou en cliquant sur « Browse » et en indiquant le nom au bon endroit

À la fin de l'assistant, vous obtenez un récapitulatif de vos choix ; fermez la fenêtre en cliquant sur « Finish »

Ouvrez le fichier avec un éditeur de texte comme « Notepad++ » et copiez le contenu dans le presse-papiers

2. Ajoutez le contenu Base-64 du certificat au fichier ca-bundle.crt

Vous devez maintenant ouvrir « Notepad++ » avec les droits d'administrateur

Rendez-vous dans le répertoire où Visual Studio est installé et recherchez le dossier « certs » ; le chemin doit être le suivant :
C:\Program Files (x86)\Microsoft Visual Studio\2017\<Version>\Common7\IDE\CommonExtensions\Microsoft\TeamFoundation\Team Explorer\Git\mingw32\ssl\certs

Vous trouverez dans le tableau suivant le chemin pour Visual Studio 2017 pour chaque version disponible.

| Version       | Location          | 
| ------------- |:-------------:| 
| Enterprise      | C:\Program Files (x86)\Microsoft Visual Studio\2017\Enterprise\Common7\IDE\CommonExtensions\Microsoft\TeamFoundation\Team Explorer\Git\mingw32\ssl\certs | 
| Professional      | C:\Program Files (x86)\Microsoft Visual Studio\2017\Professional \Common7\IDE\CommonExtensions\Microsoft\TeamFoundation\Team Explorer\Git\mingw32\ssl\certs      |   
| Community | C:\Program Files (x86)\Microsoft Visual Studio\2017\Community\Common7\IDE\CommonExtensions\Microsoft\TeamFoundation\Team Explorer\Git\mingw32\ssl\certs    |    

Ouvrez le fichier « ca-bundle.crt » dans « Notepad++ » (clic droit puis « Open with Notepad++ ») 

Collez le contenu du certificat extrait (Étape 1) à la fin du fichier .crt 

## Ligne de commande

Cela résoudra le problème avec Visual Studio 2017. Si vous souhaitez résoudre le problème en ligne de commande, vous devez reproduire le collage dans le fichier « ca-bundle.crt » présent dans le répertoire C:\Program Files\Git\mingw64\ssl\certs
