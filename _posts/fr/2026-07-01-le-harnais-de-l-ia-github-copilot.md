---
layout: post
title: "Le « harnais » de l'IA : comment un modèle devient un agent — c'est pas sorcier !"
date: 2026-07-01 10:00:00
author: AClerbois
lang: fr
ref: ai-harness
image: /images/posts/ai-harness.png
tags: [AI, agents, github, copilot, LLM]
---

Tout le monde parle du « modèle » : GPT, Claude, Gemini… Comme si toute la magie tenait dans le cerveau. Pourtant, un modèle tout seul ne sait **rien faire** : il ne voit pas votre code, ne lance aucune commande, oublie tout d'une phrase à l'autre. Ce qui transforme ce cerveau en véritable **agent**, c'est une pièce dont on parle beaucoup moins : le **harnais** (le *harness*).

Alors on va ouvrir le capot et regarder cette mécanique de près. Et vous allez voir : c'est pas sorcier.

<!--more-->

## Le fil rouge : un cheval de trait surpuissant

Imaginez un **cheval de trait** d'exception. Une force brute phénoménale. Mais lâché seul dans un pré, cette puissance ne laboure aucun champ et ne tire aucune charrette. Elle tourne en rond.

Pour en faire un travail utile, il faut un **harnais** : les œillères qui canalisent l'attention, les rênes qui donnent la direction, et l'attelage qui relie enfin le cheval à la charrue.

Un modèle d'IA, c'est exactement ce cheval. Le **harnais**, c'est tout le logiciel qu'on met autour pour transformer sa puissance brute en actions concrètes : lire un fichier, modifier du code, lancer un test, appeler un outil. Le mot n'est pas de moi — c'est le terme que tout le milieu utilise. **GitHub Copilot, Claude Code, Cursor… ce sont des harnais.** Le modèle est interchangeable ; le harnais, lui, fait toute la différence entre un joli chatbot et un collègue qui abat le travail.

## D'abord, un modèle tout seul : que sait-il faire ?

Réponse honnête : **du texte, et rien d'autre.**

Un grand modèle de langage (LLM), c'est une fonction. Vous lui donnez du texte en entrée, il vous rend du texte en sortie. C'est prodigieux… mais c'est tout. En l'état, il souffre de trois handicaps :

- **Il est aveugle et manchot.** Il ne peut ni ouvrir un fichier, ni exécuter une commande. Il ne peut que *décrire* ce qu'il ferait.
- **Il est amnésique.** À chaque appel, il repart de zéro. Il n'a aucun souvenir de la phrase précédente, sauf si on la lui redonne à chaque fois.
- **Il ne fait qu'un pas.** Une question, une réponse. Il ne sait pas enchaîner « je regarde → je corrige → je vérifie ».

Le harnais est là pour compenser ces trois handicaps. Regardons ses pièces une par une.

## L'anatomie d'un harnais, pièce par pièce

### 1. La boucle agentique — le cœur qui bat

**L'analogie :** c'est le contremaître qui fait tourner le chantier. Il transmet une consigne au cheval, regarde le résultat, décide de la suite, recommence — jusqu'à ce que le travail soit fait.

C'est **la** pièce maîtresse. Un chatbot classique fait un aller-retour : question → réponse, terminé. Un agent, lui, **boucle** :

1. Le harnais envoie au modèle tout le contexte connu.
2. Le modèle répond… mais au lieu d'une simple phrase, il peut demander : « lance tel outil ».
3. Le harnais **exécute** l'outil et **réinjecte le résultat** dans la conversation.
4. On recommence — jusqu'à ce que le modèle déclare : « c'est bon, j'ai fini ».

Cette boucle « penser → agir → observer → recommencer », c'est ce qui transforme une réponse unique en une **suite d'actions autonome**. Sans elle, pas d'agent.

### 2. Les outils — les mains et les yeux

**L'analogie :** on donne enfin au cerveau des mains pour agir et des yeux pour voir.

Un **outil**, c'est une fonction que le harnais met à disposition du modèle, avec une description précise : son nom, ce qu'elle fait, les paramètres attendus. Par exemple :

- `read_file(chemin)` — lire un fichier,
- `edit(chemin, modif)` — modifier du code,
- `run_terminal(commande)` — lancer une commande,
- `search(requête)` — chercher dans le projet.

Le modèle ne *fait* pas l'action lui-même : il **demande** au harnais de la faire, sous forme d'un petit message structuré (« appelle `run_terminal` avec `dotnet test` »). Le harnais l'exécute pour de vrai et lui rapporte le résultat. C'est la différence entre un modèle qui *raconte* qu'il lancerait les tests… et un agent qui les lance vraiment.

### 3. Les consignes système — le règlement affiché au mur

**L'analogie :** le règlement intérieur que le cheval « lit » avant chaque tâche. Qui il est, comment il travaille, ce qu'il a le droit de faire.

Le *system prompt* est un bloc de texte que le harnais place **en tête de chaque conversation**, avant même votre demande. Il définit la personnalité de l'agent, ses règles, le catalogue d'outils disponibles, le format attendu. C'est invisible pour vous, mais c'est ce qui fait qu'un même modèle se comporte en « assistant de code prudent » plutôt qu'en poète bavard.

### 4. La gestion du contexte — un bureau trop petit

**L'analogie :** le modèle travaille sur un bureau minuscule. Impossible d'y étaler tout le projet à la fois. Le harnais est le documentaliste qui choisit **quelles feuilles poser sur le bureau** à chaque instant.

Le modèle a une **fenêtre de contexte** limitée : une quantité maximale de texte qu'il peut « voir » d'un coup. Un vrai projet n'y tient jamais entièrement. Le harnais doit donc :

- **sélectionner** ce qui est pertinent (les bons fichiers, les bons extraits) ;
- **résumer** ou **compacter** l'historique quand la conversation devient trop longue ;
- **jeter** ce qui ne sert plus.

C'est un art délicat : trop peu de contexte, le modèle travaille à l'aveugle ; trop de contexte, il se noie et coûte cher. La qualité d'un harnais se joue beaucoup ici.

### 5. Les garde-fous — le frein à main

**L'analogie :** on ne laisse pas le cheval partir au galop vers la falaise. Il y a des rênes, un frein, et parfois un enclos.

Un agent qui peut lancer des commandes et modifier des fichiers, c'est puissant… et potentiellement dangereux. Le harnais ajoute des **garde-fous** :

- **la confirmation** : demander votre feu vert avant une action sensible (supprimer, exécuter, pousser) ;
- **les listes d'autorisation** : `dotnet test` passe tout seul, `rm -rf` demande validation ;
- **le bac à sable** : restreindre l'accès aux fichiers et au réseau.

Sans garde-fous, un agent est une tronçonneuse sans carter. Avec, il devient un outil de chantier sûr.

### Et le modèle, dans tout ça ?

Le modèle reste le **cheval** : la source de puissance. Mais dans un bon harnais, il est **interchangeable**. Le même harnais peut atteler un GPT, un Claude ou un Gemini, selon la tâche, le budget ou vos préférences. La force change ; l'attelage reste.

## Deep-dive : le harnais à l'œuvre dans GitHub Copilot

Assez de théorie. Ouvrons un vrai harnais et regardons ses rouages. GitHub Copilot est un excellent cas d'école, parce qu'il expose **toutes** les pièces qu'on vient de décrire — et qu'il les décline en plusieurs « carrosseries ».

### Le cerveau interchangeable : le sélecteur de modèle

Copilot n'est pas marié à un seul modèle. Un **sélecteur** vous laisse choisir la monture : les modèles d'OpenAI (famille GPT et modèles de raisonnement), d'Anthropic (Claude Sonnet, Claude Opus), de Google (Gemini)… Le harnais, lui, ne change pas : c'est toujours la même boucle, les mêmes outils. Vous changez seulement le cheval sous le harnais — un modèle rapide pour les petites tâches, un modèle de raisonnement pour les gros morceaux. Quant à savoir *quel* cheval atteler, c'est justement le sujet de [mon article sur le choix du modèle]({{ site.baseurl }}/fr/2026/06/25/quel-modele-choisir-github-copilot/).

### Le mode agent : la boucle en action

Le **mode agent** de Copilot (dans VS Code, Visual Studio ou JetBrains), c'est la boucle agentique à l'état pur. Vous donnez un objectif de haut niveau ; l'agent **planifie**, modifie plusieurs fichiers, lance des commandes au terminal, lit les erreurs, se corrige, et recommence jusqu'à atteindre le but. Il ne s'arrête pas à la première réponse : il itère.

Voici à quoi ressemble, de l'intérieur, un seul objectif qui déroule la boucle :

```text
Vous : « Ajoute un endpoint /health et son test. »

┌─ Tour 1
│  🧠 Modèle : je dois d'abord comprendre la structure.
│  🔧 Outil  : search("Program.cs")            → 1 résultat
├─ Tour 2
│  🧠 Modèle : j'ajoute la route de santé.
│  🔧 Outil  : edit(Program.cs, +8 lignes)
├─ Tour 3
│  🧠 Modèle : j'écris le test associé.
│  🔧 Outil  : edit(HealthTests.cs, nouveau fichier)
├─ Tour 4
│  🧠 Modèle : je vérifie que tout passe.
│  🔧 Outil  : runInTerminal("dotnet test")     → ❌ 1 échec
├─ Tour 5
│  🧠 Modèle : un `using` manque, je corrige.
│  🔧 Outil  : edit(HealthTests.cs, +1 ligne)
│  🔧 Outil  : runInTerminal("dotnet test")     → ✅ 12 réussis
└─ ✅ Terminé.
```

Regardez le **tour 4 → tour 5** : l'agent lance les tests, voit un échec, comprend la cause et se corrige **tout seul**. Cette capacité à observer un résultat et rebondir, c'est toute la valeur de la boucle. Un simple assistant se serait arrêté au tour 3 en disant « voici le code, à vous de tester ».

### Les outils intégrés — les mains de Copilot

En mode agent, Copilot dispose d'une trousse d'outils prêts à l'emploi. Sans être exhaustif :

- **explorer et chercher** dans le code (l'index du *workspace*) ;
- **lire et éditer** des fichiers, sur plusieurs endroits à la fois ;
- **lancer des commandes** au terminal ;
- **exécuter les tests** et lire les erreurs (les *problems*) ;
- **aller chercher une page web** pour une doc externe.

Et surtout, cette trousse est **extensible via MCP** (*Model Context Protocol*) : vous branchez vos propres outils maison — base de données, Jira, monitoring, navigateur… — et ils viennent s'ajouter au catalogue que le modèle peut appeler. Le harnais ne se limite plus à votre code : il touche tout votre écosystème.

### Comment Copilot remplit le bureau — le contexte

Souvenez-vous du bureau trop petit. Copilot le garnit de plusieurs façons :

- **automatiquement** : les fichiers ouverts, la sélection courante, un **index du dépôt** qui permet de retrouver le bon extrait sans tout charger ;
- **à la demande**, quand vous pointez du doigt avec les `#`-références (`#file`, `#selection`, `#codebase`…) ou les `@`-participants (`@workspace`, `@terminal`) ;
- **en permanence**, via vos fichiers d'**instructions** (`.github/copilot-instructions.md`), qui rappellent à chaque tour vos conventions.

C'est précisément le rôle du documentaliste : décider ce qui mérite une place sur le bureau. Et c'est là que vos personnalisations entrent en jeu — un sujet que j'ai détaillé dans [Skills, Instructions, Agents, MCP… c'est pas sorcier !]({{ site.baseurl }}/fr/2026/07/02/github-copilot-skills-instructions-agents-mcp/). Ces fichiers ne sont, au fond, que des **manières de mieux garnir le harnais**.

### Les garde-fous — Copilot ne part pas au galop

Copilot applique tous les freins qu'on a vus. Avant de lancer une commande au terminal, il **demande confirmation**. Vous pouvez définir des **listes d'autorisation** (les commandes de confiance passent sans interruption, les autres non) et **bac-à-sabler** les serveurs MCP locaux pour restreindre leurs accès. Le principe : l'agent propose, mais **vous gardez la main** sur ce qui touche vraiment à votre machine.

### Un seul harnais, trois carrosseries

Le point le plus élégant : c'est **la même mécanique** qui se décline sous trois formes, selon l'endroit où vous travaillez.

| Carrosserie | Où ça tourne | Pour quoi faire |
| --- | --- | --- |
| **Dans l'IDE** | VS Code, Visual Studio, JetBrains | Complétion, chat et mode agent, à côté de votre code |
| **En ligne de commande** | Copilot CLI, dans le terminal | Piloter l'agent au clavier, sans quitter le shell |
| **Dans le cloud** | *Coding agent*, sur GitHub Actions | On lui **assigne une issue** : il travaille seul et ouvre une Pull Request |

Le *coding agent* est le plus spectaculaire : vous lui confiez un ticket GitHub, il démarre un environnement éphémère, déroule exactement la même boucle « penser → agir → observer », et vous livre une PR à relire. Même harnais, même boucle, même outils — simplement débranché de votre écran et rebranché sur un serveur.

## Le récap : les pièces du harnais

| Pièce | L'image | Son rôle |
| --- | --- | --- |
| **La boucle** | Le contremaître | Enchaîner penser → agir → observer jusqu'au but |
| **Les outils** | Les mains et les yeux | Lire, éditer, exécuter, chercher — agir pour de vrai |
| **Les consignes** | Le règlement au mur | Définir qui est l'agent et ses règles |
| **Le contexte** | Le documentaliste | Choisir quoi poser sur un bureau trop petit |
| **Les garde-fous** | Le frein à main | Confirmer, autoriser, mettre en bac à sable |
| **Le modèle** | Le cheval de trait | La puissance brute — interchangeable |

## La morale de l'histoire

La prochaine fois qu'on vous vantera « le nouveau modèle qui change tout », rappelez-vous du cheval de trait. La puissance brute compte, bien sûr. Mais ce qui transforme cette puissance en travail réel — lire, corriger, tester, livrer — **c'est le harnais**.

Et comprendre le harnais, ça change votre regard : quand vous ajoutez des instructions, une skill, un agent ou un serveur MCP, vous n'êtes pas en train de « configurer un chatbot ». Vous êtes en train d'**ajuster l'attelage** pour que le cheval tire droit.

Vous voyez la mécanique, maintenant ? Le cerveau, la boucle, les outils, le contexte, les freins…

Et ça, mine de rien… c'est pas sorcier.
