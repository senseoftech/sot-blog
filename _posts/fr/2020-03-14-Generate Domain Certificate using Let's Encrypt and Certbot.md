---
layout: post
title:  "Générer un certificat de domaine avec Let's Encrypt et Certbot"
date:   2020-03-14 10:00:00
author: AClerbois
lang: fr
ref: letsencrypt-certbot
image: /images/posts/trust.jpg
tags: [.net core, hosting, dns]
---

Il peut parfois être compliqué de générer un certificat. Même si Let's Encrypt nous permet d'obtenir gratuitement des certificats renouvelables tous les trois mois, cette opération est parfois fastidieuse.

Un ami ([@pgrasseels](https://twitter.com/pgrasseels)) m'a fait découvrir un outil bien pratique pour créer des certificats Let's Encrypt. Cet outil s'appelle [Certbot](https://certbot.eff.org/).

<!--more-->

Il est entièrement gratuit, mais pour remercier les développeurs, un petit [don](https://supporters.eff.org/donate/support-work-on-certbot) leur fera toujours plaisir.

Pour cet article, j'utiliserai un nom de domaine acheté chez iKoula, et le site web est hébergé sur Azure. Pour l'installation de l'outil Certbot, je suis sur un système Windows Subsystem for Linux avec une distro [Ubuntu 18.04 LTS](https://www.microsoft.com/store/productId/9N9TNGVNDL3Q).

## Installer Certbot

### Mettre à jour le système et enregistrer le PPA

Mettez à jour votre système Linux et ajoutez le PPA (Personal Package Archives) de Certbot à votre liste de dépôts.

```sh
sudo apt-get update
sudo apt-get install software-properties-common
sudo add-apt-repository universe
sudo add-apt-repository ppa:certbot/certbot
sudo apt-get update
```

![Demo of Update System and register PPA](/images/posts/update-and-install-ppa.gif)

### Installer Certbot

Une fois le PPA référencé, vous pouvez installer Certbot :

```sh
sudo apt-get install certbot
```

![Demo of install certbot](/images/posts/install-certbot.gif)

## Créer les clés publique et privée

Certbot vous permet de générer des certificats directement sur le serveur qui héberge votre site web. Dans mon exemple, ce n'est pas le cas.

J'ai choisi d'opter pour une configuration manuelle. Cela vous oblige à copier-coller des commandes dans une autre session de terminal, qui peut se trouver sur un autre ordinateur. Nous allons donc réaliser la création en deux étapes :

1. La première étape consiste à prouver que le domaine vous appartient.
2. La seconde consiste à créer les clés publique et privée.

L'argument ```manual``` est un plugin. Il peut utiliser soit le challenge http, soit le challenge dns. Vous pouvez utiliser l'option ```--preferred-challenges``` pour choisir le challenge de votre préférence.

>   Le challenge ```http``` vous demandera de placer un fichier portant un nom et un contenu spécifiques dans le répertoire ```/.well-known/acme-challenge/```, directement dans le répertoire racine (« web root ») contenant les fichiers servis par votre serveur web. En substance, c'est la même chose que le plugin webroot, mais non automatisé.

>    Lors de l'utilisation du challenge ```dns```, certbot vous demandera de placer un enregistrement DNS TXT au contenu spécifique sous le nom de domaine correspondant au hostname pour lequel vous souhaitez qu'un certificat soit émis, précédé de ```_acme-challenge```.

```sh
 certbot certonly -d [YOUR DOMAIN] --manual --preferred-challenges http
```

Vous recevrez des instructions pour ajouter un fichier dans le dossier .well-known.

![Demo of install certbot](/images/posts/register-domain.gif)

Une fois les PEM générés, vous pouvez nettoyer les fichiers présents dans le dossier ```.well-known```.

> Si vous utilisez un site web ASP.NET Core en version 3.1 ou antérieure, vous devez indiquer au middleware responsable des fichiers statiques de prendre en compte le dossier .well-known. Voici un article qui explique comment procéder : [Include .well-known folder in your asp.net core project](/blog/2020/03/14/Include-.well-known-folder-in-your-asp.net-core-project)

## Créer le fichier de certificat PFX

Une fois la dernière étape correctement validée, la console affichera le dossier où se trouvent vos clés nouvellement générées.

Vous pouvez vous rendre dans le répertoire :

```sh 
cd /etc/letsencrypt/live/[YOUR DOMAIN]
```

Si vous listez le contenu de ce dossier, vous trouverez 4 fichiers intéressants :

* cert.pem 
* chain.pem 
* fullchain.pem
* privkey.pem

Nous allons créer un fichier PFX à partir de ces fichiers. Cette génération repose sur le célèbre outil OpenSSL :

```sh
openssl pkcs12 -export -out bundle.pfx -inkey privkey.pem -in cert.pem -certfile chain.pem -password pass:pass
```

Comme j'utilise WSL, que certbot a généré les clés et qu'OpenSSL a généré le nouveau certificat là où je me trouvais, il me suffit de copier ce fichier PFX dans un dossier accessible depuis mon Windows afin de pouvoir l'installer sur mon site web Azure.

```sh
cp bundle.pfx /mnt/d/Hack/
```

## Installer le certificat sur Azure

Vous devez disposer d'un site web avec un pricing tier d'au moins B1. Celui-ci supporte les domaines personnalisés et l'utilisation de certificats personnalisés.

![Pricing tiers](/images/posts/pricing-tiers-ssl.png)

Afin d'associer votre certificat à Azure, j'ai réalisé cette animation pas à pas pour vous montrer comment procéder :

![Install certificate on Azure](/images/posts/add-certificate-to-azure.gif)
