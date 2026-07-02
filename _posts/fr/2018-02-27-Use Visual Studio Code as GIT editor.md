---
layout: post
title:  "Utiliser Visual Studio Code comme éditeur GIT"
date:   2018-02-27 22:37:00
author: AClerbois
lang: fr
ref: vscode-git-editor
image: /images/posts/ms_loves_git.png
tags: [VS Code,git]
---
Par défaut, git est configuré pour utiliser VIM comme éditeur, mais vous pouvez configurer votre environnement git pour utiliser Visual Studio Code.
<!--more-->

Si, comme moi, vous voulez utiliser Visual Studio Code comme éditeur git, vous devez avoir installé Visual Studio Code de manière à pouvoir l'utiliser en ligne de commande. Pour le vérifier, ouvrez une ligne de commande et tapez la commande « code ». Si cette commande ouvre une nouvelle instance de Visual Studio Code, vous pouvez continuer l'exercice ; sinon, réinstallez Visual Studio Code et cochez l'option pour la ligne de commande.

Pour le configurer, ouvrez une ligne de commande et tapez cette commande :

{% highlight c %}

git config --global --add core.editor "code --wait"

{% endhighlight %}

Pour tester cette fonctionnalité, tapez la commande suivante :

{% highlight c %}

git config --global -e

{% endhighlight %}
