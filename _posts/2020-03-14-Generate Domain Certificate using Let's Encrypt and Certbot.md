---
layout: post
title:  "Generate Domain Certificate using Let's Encrypt and Certbot"
date:   2020-03-14 10:00:00
categories: certificate
author: AClerbois
github_repo_username: aclerbois
github_repo : aclerbois
image: /images/posts/trust.jpg
tags: [.net core, hosting, dns]
comments: true
---

It can sometimes be complicated to generate a certificate. Even if Let's Encrypt allows us to get free certificates that can be renewed every three months. It is sometimes tedious to do this. 

A friend ([@pgrasseels](https://twitter.com/pgrasseels)) introduced me to a handy tool to create Let's Encrypt certificates. The tool is called [Certbot](https://certbot.eff.org/).

<!--more-->

It is entirely free, but to thank the developers, a small [donation](https://supporters.eff.org/donate/support-work-on-certbot) will always make them happy.

For this article, I will use a domain name bought on iKoula, the website is hosted on Azure. For the installation of the Certbot tool, I'm on a Windows Subsystem for Linux system with a distro of [Ubuntu 18.04 LTS](https://www.microsoft.com/store/productId/9N9TNGVNDL3Q).

## Install Certbot

### Update system and register PPA

Update your Linux system and add the Certbot PPA (Personal Package Archives) to your list of repositories. 

```sh
sudo apt-get update
sudo apt-get install software-properties-common
sudo add-apt-repository universe
sudo add-apt-repository ppa:certbot/certbot
sudo apt-get update
```

![Demo of Update System and register PPA](/images/posts/update-and-install-ppa.gif)

### Install Certbot

Once the PPA is referenced, you can install Certbot : 

```sh
sudo apt-get install certbot
```

![Demo of install certbot](/images/posts/install-certbot.gif)

## Creating public and private keys

Certbot allows you to generate certificates directly on the server that hosts your website. In my example, this is not the case.

I choose to opt to manual configuration. This requires you to copy and paste commands into another terminal session, which may be on a different computer. We will therefore perform the creation in two steps: 

1. The first step is to prove that the domain belongs to you. 
2. The second will be to create the public and private keys.

The ```manual``` argument is a plugin. It can use either the http or the dns challenge. You can use the ```--preferred-challenges``` option to choose the challenge of your preference.

>   The ```http``` challenge will ask you to place a file with a specific name and specific content in the ```/.well-known/acme-challenge/``` directory directly in the top-level directory (“web root”) containing the files served by your webserver. In essence it’s the same as the webroot plugin, but not automated.

>    When using the ```dns``` challenge, certbot will ask you to place a TXT DNS record with specific contents under the domain name consisting of the hostname for which you want a certificate issued, prepended by ```_acme-challenge```.

```sh
 certbot certonly -d [YOUR DOMAIN] --manual --preferred-challenges http
```

You will receive instruction to add a file into the .well-know

![Demo of install certbot](/images/posts/register-domain.gif)

When the pems are generated, you can clean you file inside ```.well-known``` folder

> If you are using an Asp.net core web site in version 3.1 or less, you must tell the middleware responsible for the static files to consider the .well-known folder. Here's an article that gives you how to do this : [Include .well-known folder in your asp.net core project](/blog/2020/03/14/Include-.well-known-folder-in-your-asp.net-core-project)

## Create the PFX certificate file 

Once the last step has been correctly validated, the console will display the folder where your newly generated keys are located.

You can jump to the directory :

```sh 
cd /etc/letsencrypt/live/[YOUR DOMAIN]
```

If you list the containt of this folder your will find 4 intesting files : 

* cert.pem 
* chain.pem 
* fullchain.pem
* privkey.pem

We will create a pfx file based on these files. This generation is based on the famous OpenSSL tool :

```sh
openssl pkcs12 -export -out bundle.pfx -inkey privkey.pem -in cert.pem -certfile chain.pem -password pass:pass
```

Since I'm using WSL and certbot generated the keys and OpenSSL generated the new certificate where I was, I just need to copy this pfx file to a folder accessible by my Windows so I can install it on my website Azure.

```sh
cp bundle.pfx /mnt/d/Hack/
```

## Install certificate on Azure

You need to add a website with a  pricing tiers with at least B1. This supports custom domains and the use of custom certificates.

![Pricing tiers](/images/posts/pricing-tiers-ssl.png)

In order to associate your certificate to Azure, I made this step-by-step animation to show you how to do it : 

![Install certificate on Azure](/images/posts/add-certificate-to-azure.gif)
