---
layout: post
title: "Le prompt caching : payer une fois, relire cent fois — c'est pas sorcier !"
date: 2026-07-30 10:00:00
author: AClerbois
lang: fr
ref: prompt-caching
image: /images/posts/prompt-caching.png
tags: [AI, LLM, tokens, caching, cost]
level: 300
---

Dans [l'article sur les tokens]({{ site.baseurl }}/fr/2026/07/05/tokens-llm-envoyes-sortie-cache/), une ligne du tableau de prix intriguait : les *tokens cachés*, facturés une fraction du prix normal. Et dans [la boucle du tool calling]({{ site.baseurl }}/fr/2026/07/29/tool-calling-sous-le-capot/), un détail aurait dû vous alarmer : à chaque aller-retour, **tout le contexte est renvoyé et refacturé**. Un agent qui enchaîne trente appels d'outils relit trente fois les mêmes instructions.

Le remède s'appelle le **prompt caching**, et c'est probablement l'optimisation au meilleur rendement de toute l'ingénierie IA : bien utilisé, il divise la facture par plusieurs fois — à condition de comprendre **une seule règle**. Vous allez voir : c'est pas sorcier.

<!--more-->

## Pourquoi ça existe : relire n'est pas gratuit

Petit rappel mécanique : avant de générer le moindre token, le modèle doit « digérer » tout votre contexte — un calcul lourd, proportionnel à la taille du prompt. Or dans une conversation ou une boucle d'agent, **l'écrasante majorité du prompt ne change pas d'un tour à l'autre** : mêmes instructions système, même catalogue d'outils, même début d'historique. Refaire ce calcul à chaque tour, c'est payer la relecture intégrale d'un dossier dont seule la dernière page est nouvelle.

L'idée du cache : le fournisseur **garde en mémoire le résultat de la digestion** d'un préfixe de prompt. Au tour suivant, si le même préfixe revient, il reprend le calcul là où il s'était arrêté — et ne vous facture la relecture qu'au **tarif réduit** (selon les fournisseurs, de 2 à 10 fois moins cher que l'entrée normale ; certains majorent légèrement la *première* écriture en cache). La latence chute avec la facture : moins à digérer, réponse plus vite.

## LA règle : tout se joue sur le préfixe

Gravez celle-ci, tout le reste en découle : **le cache ne réutilise que le plus long préfixe *strictement identique* du prompt.** Identique octet pour octet, depuis le tout premier caractère. Le moindre changement en position N invalide tout ce qui suit N — même si 99 % du reste est inchangé.

D'où l'architecture canonique d'un prompt cachable — **du plus stable au plus volatil** :

1. **Les instructions système** (votre [prompt de base]({{ site.baseurl }}/fr/2026/07/12/vibe-project-fondations-dotnet/), les règles) — ne bougent jamais.
2. **Le catalogue d'outils** ([les JSON Schemas d'hier]({{ site.baseurl }}/fr/2026/07/29/tool-calling-sous-le-capot/)) — ne bouge jamais en cours de session.
3. **L'historique de conversation** — ne fait que *grandir par la fin* (parfait : le préfixe reste stable).
4. **Le tour courant** — nouveau à chaque fois, jamais caché, c'est normal.

Une conversation bien structurée est ainsi **cachée par construction** : chaque tour ne paie plein tarif que la nouveauté.

## Les erreurs qui ruinent le cache (vues en vrai)

- **Le timestamp dans le system prompt.** *« Nous sommes le 30/07/2026, 10:47:23 »* en première ligne = préfixe différent à chaque requête = **zéro cache, pour toujours**. L'erreur classique numéro un. La date, si vous en avez besoin, va à la *fin* du prompt — ou arrondie au jour.
- **Le catalogue d'outils instable.** Réordonner les outils, en activer/désactiver dynamiquement, reformuler une description à la volée : tout ce qui précède l'historique doit être **figé pour la session**.
- **L'identifiant de session mal placé.** Un GUID ou un nom d'utilisateur inséré tôt dans le prompt fragmente le cache par requête. Les données variables vont le plus tard possible.
- **Et la compaction !** Le lien avec [l'article fenêtre de contexte]({{ site.baseurl }}/fr/2026/07/23/fenetre-de-contexte-compresser-oublier/) : résumer l'historique **réécrit le préfixe** — donc invalide le cache. C'est un vrai arbitrage : la compaction réduit le contexte durablement, mais le tour qui suit repaie tout plein tarif. Raison de plus pour compacter *aux bons moments* (entre deux tâches), pas en plein milieu d'une boucle d'outils.

Dernier détail de mécanique : le cache a un **TTL court** — typiquement quelques minutes glissantes (rechargées à chaque réutilisation), extensibles chez certains fournisseurs. Un agent qui enchaîne ses tours reste au chaud ; une conversation reprise une heure après repaie la première digestion.

## Qui s'en occupe : souvent pas vous, mais vérifiez

Bonne nouvelle : dans les outils du quotidien — Copilot, Claude Code, les harness d'agents — **le caching est géré pour vous**, et c'est une des raisons de la structure très stable de leurs prompts. Côté API :

- **OpenAI** : automatique au-delà d'un seuil de taille de prompt — rien à faire, tout à bien structurer.
- **Anthropic (Claude)** : explicite — vous posez des *breakpoints* de cache (typiquement après les instructions et les outils) et le SDK fait le reste.
- Dans tous les cas, **la réponse API vous dit ce qui a été caché** (`cached_tokens` et équivalents) : c'est LA métrique à surveiller. Un taux de cache bas sur une app conversationnelle = un préfixe instable quelque part — cherchez le timestamp.

## L'ordre de grandeur qui motive

Prenons un agent réaliste : 20 000 tokens de socle (instructions + outils), 30 tours d'outils dans la session. Sans cache : ~600 000 tokens d'entrée plein tarif rien que pour relire le socle. Avec cache : le socle se paie **une fois** plein tarif, puis ~29 relectures à tarif réduit — selon le fournisseur, c'est **60 à 90 % de la facture d'entrée qui s'évapore**, et des réponses sensiblement plus rapides. Aucune autre optimisation de cette série n'a ce rapport effort/gain : ici, « l'effort », c'est déplacer un timestamp.

## En résumé

- À chaque tour, tout le contexte est redigéré et refacturé — le cache permet de **payer la digestion une fois** et de relire à tarif réduit.
- **La règle unique** : seul le plus long préfixe *identique octet pour octet* est réutilisé — structurez du plus stable au plus volatil : instructions → outils → historique → tour courant.
- Les tueurs de cache : **timestamp en tête**, catalogue d'outils instable, identifiants placés tôt — et la **compaction**, à déclencher entre les tâches.
- OpenAI cache automatiquement, Anthropic par breakpoints, vos outils du quotidien le font pour vous — mais **surveillez `cached_tokens`** : c'est le thermomètre.

Payer la lecture du dossier une fois, puis ne payer que les pages nouvelles : le prompt caching, c'est la photocopieuse de l'ingénierie IA — spectaculairement rentable, à condition de ne pas gribouiller la première page. Et ça, franchement… c'est pas sorcier.
