---
layout: post
title: "Dans les 30 millisecondes d'un token : attention et KV cache — c'est pas sorcier !"
date: 2026-08-14 10:00:00
author: AClerbois
lang: fr
ref: kv-cache-400
image: /images/posts/kv-cache-400.png
tags: [AI, LLM, attention, kv-cache, performance]
level: 400
---

Niveau 400, épisode 2. Depuis le début de la série, on a posé des règles empiriques : *le contexte se paie à chaque tour*, *le cache ne réutilise que le préfixe identique*, *le milieu du contexte est mal retenu*. Elles marchent. Mais un architecte veut le **pourquoi causal** — le mécanisme sous les abstractions.

Alors ouvrons le capot et regardons ce qui se passe *physiquement* dans les quelques dizaines de millisecondes où le modèle produit un token. Trois concepts — **attention, coût quadratique, KV cache** — et toutes vos règles empiriques deviennent des théorèmes. Vous allez voir : c'est pas sorcier.

<!--more-->

## L'attention : chaque token regarde tous les autres

Un modèle de langage est fait de couches, et le cœur de chaque couche s'appelle l'**attention**. L'idée, dépouillée des mathématiques : pour « comprendre » un token, le modèle le laisse **regarder tous les tokens précédents** et pondérer leur importance. Le mot « elle » regarde en arrière, trouve « Marie » dix tokens plus tôt, et lui accorde un poids fort. C'est ça, l'attention — un mécanisme de mise en relation de chaque position avec toutes les autres.

Techniquement, chaque token produit trois vecteurs — une **Query** (ce que je cherche), une **Key** (ce que j'offre comme point d'accroche), une **Value** (l'information que je transporte). Le poids d'attention entre deux tokens est le produit de la Query de l'un et de la Key de l'autre ; la sortie est la somme des Values, pondérée par ces poids. Retenez les noms **Key** et **Value** : ils reviennent dans deux minutes, et ils expliquent tout.

## Le coût quadratique : d'où vient la dilution

Voici la conséquence qui fait mal. Si chaque token regarde tous les autres, alors pour une séquence de N tokens, il y a **N × N paires** à évaluer. Doublez le contexte, **quadruplez** le calcul d'attention. C'est le fameux coût **quadratique** (O(N²)) — et il n'est pas anecdotique, c'est la contrainte physique centrale des LLM.

Deux de vos règles empiriques en tombent, démontrées :

- **Pourquoi la fenêtre géante coûte si cher** — pas linéairement, mais quadratiquement. Un contexte de 200 k tokens n'est pas « deux fois » un contexte de 100 k, c'est **quatre fois** le calcul d'attention. [La facture]({{ site.baseurl }}/fr/2026/07/05/tokens-llm-envoyes-sortie-cache/) et [la latence]({{ site.baseurl }}/fr/2026/07/26/fenetre-de-contexte-compresser-oublier/) ont ici leur cause.
- **Pourquoi *lost in the middle*** — le budget d'attention est fini et se dilue sur N² paires. Plus N grandit, plus l'attention portée à chaque token individuel s'amincit — d'où la dégradation, et le milieu, moins ancré que le début (l'instruction) et la fin (la question récente), qui trinque le plus.

Le bureau bien tenu de [l'article contexte]({{ site.baseurl }}/fr/2026/07/26/fenetre-de-contexte-compresser-oublier/) n'était pas une métaphore de confort : c'est une **nécessité quadratique**.

## Le KV cache : ce que le prompt caching cache vraiment

Maintenant, le joyau — et la vraie nature du [prompt caching]({{ site.baseurl }}/fr/2026/08/03/prompt-caching-sous-le-capot/). La génération se fait **token par token** : pour produire le token 501, le modèle a besoin des Keys et Values de tous les tokens 1 à 500. Naïvement, il les recalculerait à chaque nouveau token — un gâchis colossal, puisque la Key et la Value du token 12 **ne changent jamais** une fois qu'il est écrit.

D'où le **KV cache** : on garde en mémoire (dans la VRAM du GPU) les Keys et Values déjà calculées, et chaque nouveau token ne calcule *que les siennes*. C'est ce qui rend la génération praticable. Et voici la révélation qui referme la série :

**Le prompt caching, c'est la persistance du KV cache entre deux requêtes.** Quand le fournisseur « cache votre préfixe », il garde littéralement les Keys/Values déjà calculées pour ces tokens-là. Et maintenant, LA règle du préfixe s'explique d'elle-même : la Key/Value d'un token dépend de **tout ce qui le précède** (l'attention regarde en arrière). Changez le token en position 3, et les K/V des positions 4, 5, 6… sont invalidées — elles ont été calculées en « regardant » l'ancien token 3. **Le préfixe identique n'est pas une convention arbitraire : c'est la seule portion dont les Keys et Values restent mathématiquement valides.** Le [timestamp tueur de cache]({{ site.baseurl }}/fr/2026/08/03/prompt-caching-sous-le-capot/) invalide tout ce qui suit parce qu'il change ce que chaque token suivant a regardé.

## Ce que ça débloque comme compréhension

- **Le KV cache vit dans la VRAM, et il grossit avec le contexte.** C'est *le* poste mémoire qui limite le nombre de conversations simultanées sur un GPU — le fil que tirera [l'article économie de l'inférence]({{ site.baseurl }}/fr/2026/08/03/prompt-caching-sous-le-capot/). « Contexte long » = « mémoire GPU consommée », pas seulement « tokens facturés ».
- **Les optimisations d'attention** (GQA, sliding window, MLA…) que vous voyez dans les fiches de modèles ne sont pas du folklore : ce sont des attaques directes contre le coût quadratique et la taille du KV cache. Vous savez désormais *quel* problème elles résolvent.
- **Le premier token est lent, les suivants rapides.** Le « prefill » (digérer tout le prompt) est le gros calcul quadratique ; le « decode » (générer la suite) profite du KV cache. TTFT vs tokens/seconde, deux régimes physiquement distincts.

## En résumé

- **L'attention** relie chaque token à tous les précédents via des **Query/Key/Value** — le cœur de chaque couche.
- Le coût est **quadratique** (N²) : la fenêtre géante coûte quatre fois, pas deux ; et la dilution du budget d'attention *est* le *lost in the middle* — deux règles empiriques, désormais démontrées.
- Le **KV cache** garde les Keys/Values déjà calculées ; le **prompt caching en est la persistance inter-requêtes**, et c'est pourquoi seul le **préfixe identique** est réutilisable (les K/V dépendent de tout ce qui précède).
- Et ça ouvre la suite : le KV cache dans la VRAM est la contrainte mémoire de l'inférence à l'échelle.

Trois lettres — Q, K, V — et toute la série tient debout d'un bloc : la facture, la dilution, la règle du préfixe, la lenteur du premier token. Le niveau 400, c'est voir le mécanisme là où le 100 voyait la règle. Et ça, franchement… c'est pas sorcier.
