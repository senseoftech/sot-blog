---
layout: post
title:  "Générer pas à pas un PFX pour Apple Pay"
date:   2020-01-09 10:00:00
author: AClerbois
lang: fr
ref: apple-pay-pfx
image: /images/posts/iPhone-In-Hand.jpg
tags: [apple, certificate, dns]
comments: true
---

Sur l'un des projets que j'ai menés chez Ingenico ePayments, je devais intégrer ApplePay comme nouveau moyen de paiement supporté par la nouvelle API Ingenico.
Lors de l'intégration d'ApplePay, nous avons besoin de générer des certificats afin d'authentifier notre serveur.

<!--more-->

## 0. Prérequis

Pour ce tutoriel, vous devez avoir [OpenSSL](https://www.openssl.org/) installé. Si vous êtes sous Windows, vous pouvez le télécharger ou utiliser Windows Subsystem for Linux.

## 1. Générer la clé privée et le CSR
La première étape consiste à générer la clé privée et le CSR. L'algorithme de sécurité requis par Apple est RSA:2048 bits.

Voici la ligne de commande pour générer la clé privée et le CSR :

```console 
openssl req -nodes -newkey rsa:2048 -sha256 -keyout certificate.key -out certificate.csr
```

## 2. Générer le certificat sur le portail Apple Developer

Une fois connecté au portail Apple, dans les Identifiers, sélectionnez les Merchant IDs et choisissez votre marchand ou créez-en un nouveau.

Vous avez le choix de créer soit un **Apple Pay Processing Certificate**, soit un **Apple Pay Merchant Identity Certificate**.

![Merchant Id configuration page](/images/posts/apple-pay-cert-00.png)

J'ai choisi de créer un nouveau **Apple Pay Processing Certificate** en cliquant sur **Create Certificate**.

![Merchant Id configuration page](/images/posts/apple-pay-cert-01.png)

Contrairement à l'autre procédure, ici vous devez préciser si le marché ciblé touchera la Chine.

![Merchant Id configuration page](/images/posts/apple-pay-cert-02.png)

Après cette étape, vous pouvez uploader le fichier généré précédemment (étape 1).

![Merchant Id configuration page](/images/posts/apple-pay-cert-03.png)

Une fois l'upload effectué, vous pouvez télécharger le certificat généré à partir de la clé que vous avez fournie.

![Merchant Id configuration page](/images/posts/apple-pay-cert-04.png)

Conservez le fichier téléchargé, nous allons en avoir besoin pour l'étape finale.

## 3. Générer le fichier PFX

Une fois que vous disposez de la clé privée et du certificat généré par ApplePay, nous pouvons commencer à générer le PFX.

```console 

openssl x509 -inform der -in merchant_id.cer -out certificate.pem

openssl pkcs12 -export -inkey certificate.key -in certificate.pem -name Adrien_Clerbois -out certificate.pfx
```

Lors de la seconde opération, vous devez définir un mot de passe pour protéger votre PFX. Ne l'oubliez pas !

## 4. Configurer le client HTTP pour utiliser le PFX généré

Dans votre application ASP.NET, vous pouvez ajouter un HttpClient spécifique pour utiliser le certificat que nous avons créé à l'étape 3.

Dans cet exemple, nous ajoutons le certificat au projet et nous copions le fichier dans le répertoire de build.

```csharp
      services
             .AddHttpClient<IApplePayClient, ApplePayClient>("ApplePay")
             .ConfigurePrimaryHttpMessageHandler(
                 (serviceProvider) =>
                 {
                     // Retrieve the certificate
                     var certificate = LoadCertificateFromDisk("path_to_cetificate", "password set on step 3");

                     var handler = new HttpClientHandler();
                     handler.ClientCertificates.Clear();
                     handler.ClientCertificates.Add(certificate);
                     handler.SslProtocols = SslProtocols.Tls12;

                     handler.ServerCertificateCustomValidationCallback += (a, b, c, d) => true;

                     return handler;
                 });
                 
...
        private X509Certificate2 LoadCertificateFromDisk(string path, string password)
        {
            try
            {
                return new X509Certificate2(path, password, X509KeyStorageFlags.Exportable);
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException($"Failed to load Apple Pay merchant certificate file from '{options.MerchantCertificateFileName}'.", ex);
            }
        }
...
```
