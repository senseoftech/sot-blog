---
layout: post
title: "RAG et embeddings : donnez vos documents à l'IA — c'est pas sorcier !"
date: 2026-07-18 10:00:00
author: AClerbois
lang: fr
ref: rag-embeddings
image: /images/posts/rag-embeddings.png
tags: [AI, RAG, embeddings, LLM, vector-search]
level: 100
---

Posez à un modèle d'IA une question sur l'histoire de Rome : réponse brillante. Posez-lui une question sur **votre** procédure de remboursement interne : il invente, poliment. Normal — il n'a jamais lu vos documents. Ils sont privés, récents, ou les deux.

La solution s'appelle **RAG** (*Retrieval-Augmented Generation*), et elle repose sur une idée délicieuse : les **embeddings**, ou comment transformer du texte en points sur une carte. Deux mots barbares, une mécanique limpide. On démonte. Vous allez voir : c'est pas sorcier.

<!--more-->

## Le problème : un expert cultivé qui n'a pas lu vos dossiers

Un LLM sait ce qu'il a vu à l'entraînement : beaucoup de choses, jusqu'à une certaine date, et **rien de vos données privées**. Deux fausses bonnes idées pour combler le trou :

**Fausse solution 1 : tout coller dans le prompt.** Vos 400 pages de documentation dans chaque message ? Rappelez-vous [l'article sur les tokens]({{ site.baseurl }}/fr/2026/07/05/tokens-llm-envoyes-sortie-cache/) : tout ce que vous envoyez se paie **à chaque tour**, le contexte a un plafond, et un modèle noyé sous 400 pages répond moins bien, pas mieux. La bonne taille de contexte, c'est la plus petite qui fait le travail.

**Fausse solution 2 : réentraîner le modèle (fine-tuning).** Coûteux, lent, et surtout **figé** : votre documentation change demain, et votre modèle sur-mesure est déjà périmé. Le fine-tuning apprend un *style* ou un *comportement* — pas des connaissances fraîches.

La vraie solution tient en une phrase : **ne donnez au modèle que les trois pages pertinentes, au moment où il en a besoin.** Encore faut-il savoir *trouver* ces trois pages. Entrée en scène des embeddings.

## L'embedding : le texte devient un point sur une carte

Un **embedding**, c'est une transformation : on donne un texte à un modèle spécialisé, il ressort une **liste de nombres** (un vecteur — souvent plusieurs centaines). Vous pouvez voir ces nombres comme des **coordonnées sur une carte géante des idées**.

Et voici la propriété magique : **deux textes proches par le sens atterrissent à des coordonnées proches.**

- « chaton » se retrouve tout près de « chat », pas loin de « vétérinaire »…
- …et très loin de « facture impayée ».
- Mieux : « congés payés » et « vacances » sont voisins **sans partager un seul mot**.

C'est ça, le saut de qualité par rapport au bon vieux Ctrl+F : la recherche par mot-clé trouve les *mots*, l'embedding trouve le *sens*. Quelqu'un cherche « télétravail » ? Le paragraphe qui parle de « travail à distance » remonte quand même.

## La base vectorielle : la bibliothèque rangée par sens

Une fois vos documents transformés en points, il faut les stocker et pouvoir demander : *« donne-moi les points les plus proches de celui-ci »*. C'est le travail d'une **base vectorielle** — une bibliothèque rangée non pas par ordre alphabétique, mais **par proximité d'idées** : les rayonnages regroupent ce qui parle de la même chose.

Détail qui compte : on n'indexe pas des documents entiers, mais des **morceaux** (*chunks*) de quelques paragraphes. Trop gros, le morceau noie l'information dans du bruit ; trop petit, il perd son contexte. Ce découpage — le *chunking* — est un réglage discret mais décisif de tout système RAG.

## Le RAG assemblé : le bibliothécaire et l'expert

Tout est en place. Voici le film complet, à chaque question :

1. **La question arrive** : « quel est le délai de remboursement des frais de mission ? »
2. **On la transforme en point** sur la même carte (embedding de la question).
3. **Retrieval** : la base vectorielle renvoie les 3 à 5 morceaux les plus proches — la section « frais professionnels » de votre règlement, une FAQ RH…
4. **Augmentation** : ces morceaux sont collés dans le contexte, avec la question et une consigne : *« réponds à partir de ces extraits, cite tes sources »*.
5. **Generation** : le modèle rédige — appuyé sur **vos** documents.

L'image à retenir : le modèle est un **expert brillant qui n'a pas lu vos dossiers** ; le RAG lui adjoint un **bibliothécaire** qui, avant chaque réponse, pose les trois bons documents sur son bureau. L'expert ne devient pas plus savant — il devient **documenté**.

Les lecteurs de [l'article Agent Framework]({{ site.baseurl }}/fr/2026/07/11/microsoft-agent-framework-equipe-agents-ia/) reconnaîtront le bibliothécaire : c'est exactement le rôle des *context providers* — l'information posée d'office sous les yeux de l'agent, sans qu'il ait à penser à la demander.

## Le mot d'honnêteté : ce que le RAG ne règle pas

- **La réponse vaut ce que la recherche a trouvé.** Si les bons passages ne remontent pas (mauvais découpage, question ambiguë, document absent), le modèle répond à côté — avec le même aplomb. Un système RAG s'évalue et se règle : c'est de la plomberie, pas de la magie.
- **L'hallucination ne disparaît pas.** Elle recule fortement — le modèle a les faits sous les yeux — mais il peut encore broder *entre* les extraits. Exigez les **citations** : une réponse qui pointe vers ses sources se vérifie en un clic. (Pourquoi le modèle brode-t-il, au fond ? Rendez-vous demain, c'est le sujet du prochain billet.)
- **La fraîcheur se gère.** Nouveau document = ré-indexation. C'est un pipeline à entretenir, pas un coup unique.

## En résumé

| Notion | L'image | Ce qu'il faut retenir |
| --- | --- | --- |
| **Embedding** | des coordonnées sur la carte des idées | proche en sens = proche sur la carte, même sans mots communs |
| **Base vectorielle** | la bibliothèque rangée par sens | retrouve les morceaux les plus proches d'une question |
| **Chunking** | découper les livres en passages | trop gros = bruit, trop petit = hors contexte |
| **RAG** | le bibliothécaire de l'expert | les 3 bons extraits posés sur le bureau, à chaque question |

- Ni tout-dans-le-prompt (cher, plafonné), ni fine-tuning (figé) : **la bonne information, au bon moment, en petite quantité.**
- La qualité d'un RAG se joue dans la **recherche** (embeddings, découpage) plus que dans le modèle.
- Exigez des **citations** — le RAG documente l'expert, il ne le rend pas infaillible.

La prochaine fois qu'on vous dira « on a branché l'IA sur nos documents », vous saurez exactement ce qui tourne derrière : une carte, un bibliothécaire, trois extraits sur un bureau. Et ça, franchement… c'est pas sorcier.
