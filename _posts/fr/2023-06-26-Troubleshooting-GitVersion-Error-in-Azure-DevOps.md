---
layout: post
title:  "Résoudre une erreur GitVersion dans Azure DevOps"
date:   2023-06-26 08:37:00
author: AClerbois
lang: fr
ref: gitversion-error
github_repo_username: aclerbois
github_repo : aclerbois
image: /images/posts/azuredevops.png
tags: [azuredevops, gitversion]
level: 200
---

# Introduction :
Azure DevOps est une plateforme puissante qui permet une collaboration fluide et des workflows d'intégration continue / déploiement continu (CI/CD) pour les équipes de développement logiciel. Lorsque vous utilisez GitVersion, un outil open source pour le versioning des repositories Git, vous pouvez rencontrer des erreurs qui entravent son fonctionnement. L'une de ces erreurs est le message « Cannot find commit [commit hash]. Please ensure that the repository is an unshallow clone with `git fetch --unshallow`. » Dans ce billet de blog, nous verrons comment résoudre ce problème en ajoutant une variable de configuration, Agent.Source.Git.ShallowFetchDepth, avec la valeur 0.
<!--more-->
# Comprendre l'erreur :
Le message d'erreur indique que GitVersion est incapable de localiser un commit spécifique, identifié par le hash du commit (par exemple, « eeee52 Update ci.yml for Azure Pipelines »). Cette erreur survient généralement lorsque le repository n'est pas correctement cloné avec l'historique complet des commits, ce qui aboutit à un shallow clone. Un shallow clone ne récupère qu'une profondeur limitée de l'historique des commits, excluant potentiellement le commit requis pour le fonctionnement de GitVersion.

# Résoudre l'erreur :
Pour résoudre ce problème, nous devons modifier la configuration de l'agent de build dans Azure DevOps et nous assurer que le repository est cloné en tant qu'unshallow clone. Suivez les étapes ci-dessous pour ajouter la variable de configuration nécessaire :

Étape 1 : Accédez à votre projet Azure DevOps et rendez-vous sur le pipeline où GitVersion est utilisé.

Étape 2 : Repérez l'agent de build qui exécute le pipeline. Il peut s'agir d'un agent hébergé par Azure ou d'un agent auto-hébergé, selon votre configuration.

Étape 3 : Dans la configuration du pipeline, trouvez la section où vous définissez les variables de l'agent.

Étape 4 : Ajoutez une nouvelle variable nommée « Agent.Source.Git.ShallowFetchDepth » et définissez sa valeur à 0.

Étape 5 : Enregistrez la configuration du pipeline pour appliquer les changements.

En ajoutant la variable « Agent.Source.Git.ShallowFetchDepth » avec la valeur 0, nous demandons à l'agent de build d'effectuer un unshallow clone, récupérant l'historique complet des commits requis par GitVersion.

# Validation et exécution :
Après avoir effectué les changements nécessaires, déclenchez un nouveau run du pipeline de build pour valider le correctif. GitVersion devrait maintenant être capable de localiser le commit précédemment manquant, et le message d'erreur ne devrait plus apparaître. Si d'autres erreurs ou avertissements surviennent, consultez la documentation de GitVersion ou demandez de l'aide à la communauté.

# Conclusion :
Azure DevOps, associé à GitVersion, offre un environnement puissant pour gérer le versioning dans les repositories Git. Cependant, des erreurs ponctuelles peuvent survenir, comme l'impossibilité de trouver des commits spécifiques durant le processus de versioning. En ajoutant la variable « Agent.Source.Git.ShallowFetchDepth » avec la valeur 0, vous pouvez garantir un unshallow clone et ainsi résoudre le problème. Pensez à valider le correctif en déclenchant un nouveau run du pipeline et en confirmant l'absence de l'erreur. Grâce à ces étapes de dépannage, vous pouvez tirer le meilleur parti des capacités d'Azure DevOps et de GitVersion pour des workflows CI/CD fluides dans vos projets de développement logiciel.
