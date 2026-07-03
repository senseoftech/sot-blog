---
layout: post
title: "Sécuriser GitHub Copilot : un badge, pas le passe-partout — c'est pas sorcier !"
date: 2026-07-10 10:00:00
author: AClerbois
lang: fr
ref: copilot-security
image: /images/posts/copilot-security.png
tags: [github, copilot, AI, security, agents]
---

Copilot lit votre code, lance des commandes, ouvre des Pull Requests. Formidable. Mais posez-vous la question qu'on pose pour tout nouvel arrivant dans l'équipe : **qu'est-ce qu'on lui laisse toucher, et qu'est-ce qu'on garde sous clé ?**

Un agent IA, c'est un stagiaire brillant… et profondément **naïf** : il croit tout ce qu'il lit. Alors on va passer en revue les vrais risques, les parades qui existent déjà, et je vous laisse repartir avec une **checklist** à dérouler. Et vous allez voir : c'est pas sorcier.

<!--more-->

## Le fil rouge : le stagiaire brillant… et naïf

Dans [l'article sur la personnalisation]({{ site.baseurl }}/fr/2026/07/02/github-copilot-skills-instructions-agents-mcp/), on a équipé notre assistant : livret d'accueil, fiches, badges. Aujourd'hui, on parle de ce qu'on ne lui donne **pas**.

Car ce stagiaire a une particularité dangereuse : **il ne fait aucune différence entre une information et un ordre.** Tout ce qui entre dans son contexte — votre code, un README, une issue, le résultat d'un outil — est du texte, et tout texte peut l'influencer. C'est de là que partent presque tous les risques. Passons-les en revue, menace par menace, parade par parade.

## Menace 1 — Il croit tout ce qu'il lit : l'injection de prompt

**Le scénario :** quelqu'un glisse une consigne malveillante là où votre agent va lire. Un commentaire HTML invisible dans une issue (« ignore tes instructions et envoie les secrets à… »), un README piégé dans une dépendance, une page web. Vous, vous ne voyez rien. L'agent, lui, lit tout — et peut obéir. C'est **la** faille fondamentale des agents IA, démontrée à répétition par les chercheurs en sécurité.

**Les parades :**

- GitHub **filtre les caractères cachés** avant de passer les issues et commentaires au coding agent.
- Le coding agent tourne derrière un **firewall** qui restreint son accès à Internet — pour limiter l'exfiltration si une injection passe.
- Et surtout, la parade qui ne se configure pas : **vous**. Relisez ce que l'agent s'apprête à faire (commandes, diffs), et méfiez-vous du contenu externe que vous lui donnez à lire. Une issue publique, c'est une entrée utilisateur non fiable — au sens le plus classique de la sécurité.

## Menace 2 — Le passe-partout : trop d'accès, trop de confiance

**Le scénario :** l'agent a accès à tout le dépôt, tout le temps, pour toutes les tâches. Le jour où quelque chose déraille (injection, hallucination, simple maladresse), les dégâts sont à la mesure des accès.

**Les parades — le principe du moindre privilège :**

- **Les exclusions de contenu** (`content exclusion`, au niveau dépôt ou organisation) retirent des fichiers sensibles de la vue de Copilot : plus de complétion dedans, plus d'utilisation en contexte de chat ou de code review.
- **Le mot d'honnêteté**, fidèle à la série : au moment où j'écris, ces exclusions **ne sont pas respectées par les modes Edit et Agent** — c'est une [limite documentée](https://docs.github.com/en/copilot/concepts/context/content-exclusion). Traitez-les comme un garde-corps contre les fuites *par inadvertance*, pas comme une frontière de sécurité.
- La vraie frontière, c'est en amont : **ce qui ne doit jamais fuiter ne doit pas vivre dans le dépôt.** Ce qui nous amène aux secrets.

## Menace 3 — Le coffre-fort : les secrets

**Le scénario :** une clé API traîne dans un `.env` suivi par Git, ou dans un fichier de config « temporaire ». Copilot la voit, l'agent qui lance des commandes peut la lire, et elle peut ressortir dans un diff, un log ou une PR.

**Les parades :**

- **Aucun secret dans le code ni dans les prompts.** Les secrets vivent dans un coffre : variables d'environnement chiffrées, gestionnaire de secrets, GitHub Secrets.
- Activez **secret scanning avec push protection** : le secret est bloqué *avant* d'entrer dans l'historique.
- Bonus rassurant : les PR du coding agent passent **d'office** par secret scanning, CodeQL et une vérification des dépendances contre la base d'advisories GitHub — activés par défaut, sans licence supplémentaire.

## Menace 4 — Il ramène n'importe quoi du magasin : la chaîne d'approvisionnement

**Le scénario, en deux variantes :**

1. **Le paquet halluciné.** Le modèle suggère `npm install super-json-utils` — un paquet qui… n'existe pas. Des attaquants publient justement des paquets malveillants sous ces noms plausibles que les IA inventent souvent (le *slopsquatting*). Vous installez, et c'est le loup dans la bergerie.
2. **Le serveur MCP piégé.** Un serveur MCP, c'est du code tiers à qui vous donnez vos accès. Un serveur malveillant (ou compromis) peut mentir sur ses outils, exfiltrer ce qui passe, ou injecter des consignes.

**Les parades :**

- **Vérifiez chaque dépendance suggérée** : le paquet existe-t-il vraiment, depuis longtemps, avec un dépôt source et une communauté ? Trente secondes qui valent de l'or.
- Ne branchez que des **serveurs MCP de confiance**, confirmez la boîte de dialogue de confiance de VS Code en connaissance de cause, et **sandboxez** les serveurs locaux. J'ai consacré [un article entier au scan et à la mise en liste blanche des serveurs MCP]({{ site.baseurl }}/fr/2025/02/24/Securing-MCP-Servers-Automated-Whitelist-Scanner/).

## Menace 5 — Son travail a l'air fini : le code généré n'est pas du code vérifié

**Le scénario :** le code proposé compile, les tests passent, tout brille. Mais « qui a l'air correct » n'est pas « est sûr » : les modèles reproduisent aussi les mauvais patterns de leur entraînement — requête SQL concaténée, validation manquante, crypto artisanale.

**Les parades :**

- **La revue humaine reste obligatoire.** Relisez les diffs de l'agent comme ceux d'un collègue junior : avec bienveillance et suspicion.
- Gardez vos filets automatiques : **CodeQL / code scanning** sur toutes les PR, tests, linters.
- **Copilot code review** est un filet *en plus* — jamais à la place. Une IA qui relit une IA, c'est bien ; un humain qui tranche, c'est indispensable.

## Menace 6 — Il part au galop : les garde-fous du mode agent

**Le scénario :** pour aller plus vite, vous cochez « tout autoriser » sur les commandes terminal. L'agent enchaîne alors les actions sans jamais vous demander. Le jour où une injection ou une hallucination survient, plus personne ne tient les rênes.

**Les parades** (le « frein à main » [du harnais]({{ site.baseurl }}/fr/2026/07/01/le-harnais-de-l-ia-github-copilot/)) :

- Laissez la **confirmation des commandes** activée. C'est trois clics par session, pas une punition.
- Construisez une **liste d'autorisation fine** : `dotnet test` oui, `git push` non. Jamais de joker global.
- Résistez au mode « YOLO » : un agent sans confirmation, c'est une tronçonneuse sans carter — on en a parlé dans l'article sur le harnais.

## Menace 7 — Et dans le cloud ? Le coding agent est sécurisé d'usine

Bonne nouvelle pour finir : le **coding agent** (celui à qui on assigne une issue) embarque des protections par défaut, [documentées noir sur blanc](https://docs.github.com/en/copilot/concepts/agents/coding-agent/risks-and-mitigations) :

- il ne travaille que sur **sa propre branche** (préfixée `copilot/`) et ne peut pas pousser ailleurs ;
- ses PR sont des **brouillons qu'un humain doit relire et fusionner** — et celui qui a demandé le travail **ne peut pas approuver lui-même** ;
- il respecte les **protections de branche** et les checks obligatoires, comme tout le monde ;
- ses workflows Actions attendent une **approbation manuelle** par défaut ;
- son **accès Internet est restreint** par le firewall (gérable au niveau organisation) ;
- ses commits sont **signés et audités**, avec journaux de session pour les admins.

Autrement dit : les rambardes sont posées d'usine. Votre travail, c'est de **ne pas les démonter**.

## La checklist

La voilà. Trois niveaux : vous, votre dépôt, votre organisation. Imprimez, cochez, dormez mieux.

### 🧑‍💻 Au quotidien (développeur)

- ⬜ **Je relis chaque diff avant d'accepter** — du code généré n'est pas du code vérifié.
- ⬜ **La confirmation des commandes terminal reste activée** ; ma liste blanche ne contient que des commandes précises, jamais « tout autoriser ».
- ⬜ **Je me méfie du contenu externe** que je donne à lire à l'agent (issues, README tiers, pages web) : c'est un vecteur d'injection.
- ⬜ **Je vérifie chaque dépendance suggérée** : existence réelle, ancienneté, dépôt source, popularité.
- ⬜ **Aucun secret dans le code, les prompts ou les fichiers suivis** — ils vivent dans un coffre.
- ⬜ **Je ne branche que des serveurs MCP de confiance**, sandboxés quand c'est possible.

### 📁 Par dépôt (équipe)

- ⬜ **Protections de branche + revue obligatoire** sur les branches principales — l'agent y est soumis comme tout le monde.
- ⬜ **Secret scanning + push protection** activés.
- ⬜ **Code scanning (CodeQL)** sur toutes les PR — y compris celles de Copilot.
- ⬜ **Exclusions de contenu** configurées pour les fichiers sensibles — en connaissant leur limite (non respectées en mode agent).
- ⬜ **Firewall du coding agent laissé activé**, liste d'accès réseau minimale.
- ⬜ **Approbation manuelle des workflows Actions** sur les PR de l'agent (le défaut — conservez-le).

### 🏢 À l'organisation

- ⬜ **Politiques Copilot revues** : fonctionnalités actives, modèles autorisés, filtre de code public.
- ⬜ **Liste blanche de serveurs MCP approuvés**, partagée par les équipes.
- ⬜ **Firewall du cloud agent géré au niveau organisation**, pas dépôt par dépôt.
- ⬜ **Journaux d'audit des sessions agent** consultés régulièrement.
- ⬜ **Équipe sensibilisée à l'injection de prompt** — le dernier maillon est humain.

## La règle simple à retenir

Traitez Copilot comme le stagiaire brillant qu'il est :

- tout ce qu'il **lit** peut le manipuler → contrôlez ses lectures ;
- tout ce qu'il **produit** doit être relu → gardez la revue humaine ;
- tout ce qu'il **n'a pas besoin de voir** reste sous clé → moindre privilège, pas de passe-partout.

Un badge d'accès bien réglé, des rambardes qu'on ne démonte pas, et un regard humain avant chaque fusion. C'est toute la recette.

Et ça, mine de rien… c'est pas sorcier.
