---
layout: post
title: "Pourquoi l'IA hallucine (et comment vivre avec) — c'est pas sorcier !"
date: 2026-07-19 10:00:00
author: AClerbois
lang: fr
ref: ai-hallucinations
image: /images/posts/ai-hallucinations.png
tags: [AI, LLM, hallucinations, reliability]
level: 100
---

Un `dotnet add package` d'une bibliothèque qui **n'existe pas**. Une méthode d'API parfaitement nommée, parfaitement documentée… et parfaitement fictive. Un avocat américain qui cite au tribunal des jurisprudences inventées par ChatGPT — véridique, il a été sanctionné pour ça.

Le mot est entré dans le langage courant : l'IA **hallucine**. Mais pourquoi ? Est-ce un bug qu'on va corriger ? Un mensonge ? Ni l'un ni l'autre — et une fois qu'on a compris le mécanisme, on sait exactement comment s'en protéger. On démonte. Vous allez voir : c'est pas sorcier.

<!--more-->

## Le mécanisme : une machine à finir les phrases

Débarrassons-nous du malentendu principal : un LLM ne **consulte pas** une base de faits pour répondre. Il fait une seule chose, en boucle : **prédire le prochain token le plus plausible** compte tenu de tout ce qui précède ([token par token]({{ site.baseurl }}/fr/2026/07/05/tokens-llm-envoyes-sortie-cache/), littéralement).

Imaginez un **conteur prodigieux** : il a lu toute la bibliothèque, et son métier est de toujours finir ses phrases, avec la suite la plus naturelle possible. Demandez-lui la capitale de la France : « Paris » est de très loin la suite la plus plausible — il a « raison ». Demandez-lui une bibliothèque .NET pour un besoin pointu qu'il n'a jamais vraiment vue : la suite la plus plausible est un nom **qui ressemble** à ce qui existe. `Microsoft.Extensions.SuperJson` sonne parfaitement crédible. Il vient de l'inventer — **avec la même mécanique, la même assurance et le même ton** que quand il dit vrai.

C'est le point clé : **plausible ≠ vrai.** L'hallucination n'est pas une panne du système — c'est le système, appliqué là où il n'a pas assez de matière.

## Pourquoi il ne dit pas « je ne sais pas »

Parce que rien, dans sa construction, ne l'y pousse naturellement. À l'entraînement, produire une réponse plausible est récompensé ; « je ne sais pas » est rarement la suite la plus probable d'une question. Les modèles récents progressent nettement — entraînés à refuser, à exprimer l'incertitude, à chercher sur le web — mais le mécanisme de fond reste : **un moteur de plausibilité, pas un moteur de vérité.**

Ajoutez-y la **température** — ce réglage qui dose le hasard dans le choix du prochain token. Basse : le modèle prend presque toujours le token le plus probable (répétitif, mais sage). Haute : il s'autorise des choix moins probables (créatif, mais aventureux). Utile à connaître : pour du factuel ou du code, on la baisse ; pour brainstormer, on la monte.

## Pourquoi ça frappe surtout les cas rares

Le conteur est solide sur ce qu'il a lu **mille fois**, fragile sur ce qu'il a lu **trois fois**. D'où une règle d'or trop peu connue : **plus votre question est pointue, plus le risque d'hallucination monte.** La syntaxe de base de C# : béton. L'API précise d'une bibliothèque confidentielle dans sa version d'il y a trois mois : zone rouge — il *interpole*, il comble les trous avec du plausible.

C'est exactement le mécanisme du *slopsquatting* vu dans [l'article sécurité]({{ site.baseurl }}/fr/2026/07/10/securiser-github-copilot/) : les IA inventent souvent les **mêmes** noms de paquets plausibles, et des attaquants publient de vrais paquets malveillants sous ces noms-là. L'hallucination des uns fait le phishing des autres.

Et le paradoxe à garder en tête : ce défaut est indissociable de la qualité principale. La capacité à générer du texte **nouveau et plausible**, c'est *aussi* ce qui écrit vos brouillons, propose trois architectures et reformule vos e-mails. On ne « répare » pas l'hallucination sans lobotomiser la créativité. On la **borde**.

## Comment vivre avec : les cinq garde-fous

1. **Ancrez (le bibliothécaire).** C'était [l'article d'hier]({{ site.baseurl }}/fr/2026/07/18/rag-embeddings-expliques-simplement/) : avec le RAG, le modèle répond appuyé sur **vos** documents posés sous ses yeux, au lieu de puiser dans sa mémoire statistique. L'hallucination recule massivement dès que les faits sont dans le contexte.

2. **Outillez (le harnais).** Un agent qui peut **compiler, tester, exécuter** attrape ses propres inventions : le paquet fantôme ne survit pas à `dotnet restore`, la méthode fictive ne survit pas au build. C'est tout l'argument du [harnais]({{ site.baseurl }}/fr/2026/07/01/le-harnais-de-l-ia-github-copilot/) : la boucle *écrire → vérifier → corriger* transforme un conteur en ingénieur.

3. **Exigez les sources.** « Cite le document et la section » change tout : une affirmation sourcée se vérifie en un clic, une affirmation nue se croit sur parole. Les réponses avec recherche web ou RAG + citations sont structurellement plus sûres.

4. **Vérifiez le vérifiable — vous.** Le réflexe humain reste le dernier maillon : un paquet s'installe → il se vérifie sur nuget.org ; une jurisprudence se cite → elle se cherche ; un chiffre part en production → il se recoupe. Tout ce qui est vérifiable **se vérifie**, proportionnellement à l'enjeu.

5. **Calibrez la tâche.** Température basse et formats contraints pour le factuel ; et pour les questions pointues, préférez un modèle avec accès à la documentation fraîche (recherche, MCP vers vos docs) plutôt que sa seule mémoire.

## En résumé

- Un LLM est un **moteur de plausibilité** : il complète avec la suite la plus crédible — qui est *souvent* vraie, mais pas *parce qu'elle* est vraie.
- L'hallucination frappe fort sur les **cas rares** (API pointues, versions récentes, domaines confidentiels) — précisément là où on aimerait lui faire confiance.
- Elle est le revers de la **créativité** : on ne la supprime pas, on la **borde** — RAG pour ancrer, outils pour vérifier, sources pour tracer, humain pour trancher.
- Et rappel de la série : le paquet suggéré par une IA se vérifie **avant** l'installation.

Un conteur génial qu'on ne laisse jamais publier sans relecture ni vérification des faits : voilà le bon modèle mental. Le prochain billet s'attaque à la suite logique — comment **tester** une application dont le cœur ne répond jamais deux fois pareil. D'ici là, souvenez-vous : plausible n'est pas vrai. Et ça, franchement… c'est pas sorcier.
