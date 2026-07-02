---
layout: post
title:  "Use Visual Studio Code as GIT editor"
date:   2018-02-27 22:37:00
categories: VSCode
author: AClerbois
ref: vscode-git-editor
github_repo_username: aclerbois
github_repo : aclerbois
image: /images/posts/ms_loves_git.png
tags: [VS Code,git]
---
By default, git is configured to use VIM as its editor, but you can configure your git environment to use Visual Studio Code.
<!--more-->

If you, like me, want to use Visual Studio Code as the git editor, you should have Visual Studio Code installed in a way that lets you use it from the command line. To test this, open a command line and type the command « code ». If this command opens a new instance of Visual Studio Code, you can continue the exercise; otherwise, reinstall Visual Studio Code and check the option for the command line.

To configure it, open a command line and type this command:

{% highlight c %}

git config --global --add core.editor "code --wait"

{% endhighlight %}

To test this functionality, type the following command:

{% highlight c %}

git config --global -e

{% endhighlight %}
