---
layout: post
title:  "Utiliser DevBox avec Microsoft Azure"
date:   2025-02-10 10:00:00
author: AClerbois
lang: fr
ref: devbox-azure
image: /images/posts/Desk.jpg
tags: [DevBox, Microsoft Azure, cloud, development]
level: 200
---

## Introduction à DevBox et à ses avantages

DevBox est un environnement de développement puissant qui permet aux développeurs de créer, tester et déployer des applications dans un environnement hébergé dans le cloud. En utilisant DevBox avec Microsoft Azure, les développeurs peuvent tirer parti de l'infrastructure robuste, de la scalabilité et des fonctionnalités de sécurité d'Azure. Cette combinaison offre une expérience de développement fluide et efficace, permettant aux développeurs de se concentrer sur l'écriture de code et la livraison d'applications de haute qualité.
<!--more-->
## Instructions pas à pas pour utiliser DevBox avec Microsoft Azure

### Étape 1 : configurer votre compte Azure

1. Si vous n'avez pas encore de compte Azure, créez un compte gratuit sur [Azure Free Account](https://azure.microsoft.com/en-us/free/).
2. Une fois votre compte créé, connectez-vous au [portail Azure](https://portal.azure.com/).

### Étape 2 : créer un environnement DevBox

1. Dans le portail Azure, accédez au service « DevBox ».
2. Cliquez sur « Create DevBox » pour démarrer le processus de configuration.
3. Renseignez les informations requises, telles que le nom de votre DevBox, la région et le groupe de ressources.
4. Choisissez la configuration souhaitée pour votre DevBox, y compris le système d'exploitation, la taille de la machine virtuelle et les options de stockage.
5. Cliquez sur « Review + Create » pour vérifier vos paramètres, puis sur « Create » pour déployer votre environnement DevBox.

### Étape 3 : se connecter à votre DevBox

1. Une fois votre environnement DevBox déployé, accédez au service « DevBox » dans le portail Azure.
2. Cliquez sur votre DevBox nouvellement créée pour afficher ses détails.
3. Cliquez sur le bouton « Connect » pour télécharger le fichier RDP d'accès distant.
4. Ouvrez le fichier RDP et saisissez vos identifiants pour vous connecter à votre environnement DevBox.

### Étape 4 : configurer votre environnement de développement

1. Après vous être connecté à votre DevBox, installez les outils et logiciels de développement nécessaires, tels que Visual Studio, Visual Studio Code ou tout autre IDE de votre choix.
2. Configurez votre environnement de développement selon les exigences de votre projet.

### Étape 5 : développer et tester votre application

1. Commencez à écrire du code et à développer votre application dans l'environnement DevBox.
2. Utilisez des services Azure, tels qu'Azure App Service, Azure Functions et Azure SQL Database, pour enrichir votre application et tirer parti des capacités du cloud.
3. Testez votre application en profondeur pour vous assurer qu'elle fonctionne comme prévu.

### Étape 6 : déployer votre application

1. Une fois votre application prête, déployez-la sur Azure à l'aide de la méthode de déploiement appropriée, telle qu'Azure DevOps, GitHub Actions ou un déploiement manuel via le portail Azure.
2. Surveillez les performances de votre application et effectuez les ajustements nécessaires pour garantir son bon fonctionnement dans le cloud.

## Consulter les VDI disponibles ou en créer une nouvelle via le Devportal

Vous pouvez voir dans le Devportal toutes les VDI disponibles ou en créer une nouvelle via ce lien : [Devportal](https://devportal.microsoft.com/).

## Utiliser l'application Windows App pour se connecter à la DevBox

Vous devriez utiliser l'application Windows App pour vous connecter à la DevBox. L'installation est disponible sur [Windows App Installation](https://aka.ms/devcenter/devportal/install-windows-app).

## Conclusion

Utiliser DevBox avec Microsoft Azure offre un environnement de développement puissant et efficace qui exploite les capacités du cloud. En suivant ces instructions pas à pas, vous pouvez configurer, développer, tester et déployer vos applications de manière fluide, en tirant parti de l'infrastructure et des services robustes d'Azure.

Pour plus d'informations et de ressources, consultez la [documentation Azure DevBox](https://docs.microsoft.com/en-us/azure/devbox/).
