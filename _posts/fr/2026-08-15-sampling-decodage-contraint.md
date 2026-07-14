---
layout: post
title: "Sampling : temperature, top-p et le décodage contraint — c'est pas sorcier !"
date: 2026-08-15 10:00:00
author: AClerbois
lang: fr
ref: sampling-400
image: /images/posts/sampling-400.png
tags: [AI, LLM, sampling, temperature, structured-outputs]
level: 400
---

Niveau 400, épisode 3. Dans [l'article sur les hallucinations]({{ site.baseurl }}/fr/2026/07/19/pourquoi-l-ia-hallucine/), on a croisé la **température** — « le dosage du hasard ». Et dans [le tool calling]({{ site.baseurl }}/fr/2026/08/02/tool-calling-sous-le-capot/), les **structured outputs** — « le contrat qui contraint la génération ». Deux affirmations lâchées sans le mécanisme. Aujourd'hui, on regarde comment un token est *réellement* choisi.

Au menu : la distribution de probabilités, comment temperature/top-p/top-k la sculptent, pourquoi le déterminisme parfait n'existe pas *même* à température zéro, et comment une grammaire force du JSON valide au niveau du décodage. Vous allez voir : c'est pas sorcier.

<!--more-->

## Ce qui sort du modèle : une distribution, pas un mot

Reprenons là où [le KV cache]({{ site.baseurl }}/fr/2026/08/14/attention-kv-cache-sous-le-capot/) s'arrêtait. Après avoir digéré le contexte, le modèle ne produit pas « un mot ». Il produit, pour **chaque token possible du vocabulaire** (des dizaines de milliers), un score brut — un **logit**. Une fonction (softmax) transforme ces logits en **distribution de probabilités** : *« "Paris" 82 %, "la" 6 %, "Lyon" 3 %… »* sur tout le vocabulaire.

Le modèle s'arrête là. **Choisir** le token dans cette distribution est une étape séparée — le **sampling** — et c'est *elle* qu'on règle avec les paramètres. Distinction cruciale : le modèle propose une distribution figée ; le sampler en tire un token. Changer la température ne change pas ce que le modèle « pense » — ça change comment on pioche dans ce qu'il pense.

## La température : aplatir ou piquer la distribution

La **température** agit sur les logits *avant* le softmax. L'image juste : elle **remodèle la courbe**.

- **Température basse** (→ 0) : la courbe se **pique**. L'écart entre le favori et les autres se creuse ; le token le plus probable écrase tout. Prévisible, répétitif, sobre.
- **Température haute** (> 1) : la courbe s'**aplatit**. Les outsiders remontent, le modèle ose des choix improbables. Créatif, divers, aventureux.

Concrètement : factuel, code, extraction → **basse** ; brainstorm, variété rédactionnelle → **haute**. Ce n'est pas un bouton « intelligence », c'est un bouton « largeur de la pioche ». Un modèle à haute température n'est pas plus créatif *au sens de meilleur* — il est juste autorisé à sortir des sentiers les plus probables.

## Top-k, top-p, min-p : où l'on coupe la queue

La température seule laisse une chance minuscule aux tokens absurdes de la longue traîne. On la borne donc avec des filtres — appliqués *avant* le tirage :

| Filtre | Ce qu'il fait | L'image |
| --- | --- | --- |
| **top-k** | ne garde que les *k* tokens les plus probables | « les 40 candidats en tête, poubelle le reste » |
| **top-p** (nucleus) | garde les tokens jusqu'à cumuler *p* % de proba | « le plus petit groupe qui pèse 90 % » |
| **min-p** | seuil relatif au meilleur token | « rien en dessous de 5 % du favori » |

Le plus utilisé est **top-p** (nucleus sampling) : sa taille de sélection **s'adapte** au contexte — large quand le modèle hésite entre mille suites plausibles, étroite quand une seule s'impose. C'est le compromis fluidité/sûreté par défaut de la plupart des API. En pratique on combine : top-p pour couper la traîne absurde, température pour doser dans ce qui reste.

## La bombe : température 0 n'est PAS déterministe

Voici ce qui sépare le niveau 300 du 400, et ce qui fait perdre des heures de débogage à ceux qui l'ignorent. « Je mets température 0, je prends toujours le token le plus probable, donc c'est reproductible. » **Faux en production**, et pour des raisons physiques, pas logicielles :

- **L'arithmétique flottante n'est pas associative.** `(a + b) + c ≠ a + (b + c)` sur un GPU. Or les calculs sont répartis sur des milliers de cœurs dont l'**ordre d'agrégation varie** d'une exécution à l'autre. Deux logits quasi ex æquo peuvent donc s'inverser — et un token bascule.
- **Le batching non déterministe.** Votre requête est traitée avec d'autres, dans un lot dont la composition change à chaque appel ; les optimisations de noyaux GPU qui en découlent modifient l'ordre des opérations. La sortie dépend donc de *qui d'autre* appelait au même moment — que vous ne contrôlez pas.

Conséquence pour l'architecte : **le déterminisme n'est pas une propriété sur laquelle bâtir.** C'est exactement ce qui fonde [l'approche par évals]({{ site.baseurl }}/fr/2026/07/20/tester-une-application-ia-les-evals/) — on gère des *seuils*, pas des sorties identiques — et [l'ingénierie statistique des évals]({{ site.baseurl }}/fr/2026/08/13/prompt-injection-defense-en-profondeur/) que ce blog abordera bientôt. Un `seed` fixe aide en développement ; il ne garantit rien à travers un parc GPU.

## Le décodage contraint : comment le JSON devient valide *par construction*

Reste la promesse du [tool calling]({{ site.baseurl }}/fr/2026/08/02/tool-calling-sous-le-capot/) à honorer : les **structured outputs**. Le mécanisme est d'une élégance limpide et se loge *exactement* à l'étape de sampling.

À chaque token, avant de tirer, on connaît la grammaire cible (votre JSON Schema). On **masque les logits** de tous les tokens qui violeraient cette grammaire — leur probabilité est forcée à zéro. Si le schéma attend `{` en ouverture, tout token autre que `{` est éliminé *avant* le tirage. Le modèle ne peut littéralement **pas** produire de JSON invalide : la grammaire agit comme un rail.

C'est là toute la différence avec « réponds en JSON s'il te plaît » : la prière espère que la distribution privilégie du JSON ; la contrainte **interdit** mécaniquement les tokens hors-grammaire. Et ça éclaire la nuance finale : le décodage contraint garantit une *forme* valide (le JSON parse), jamais un *fond* correct (les valeurs sont vraies). La forme par la grammaire, [le fond par les évals]({{ site.baseurl }}/fr/2026/07/20/tester-une-application-ia-les-evals/) — toujours.

## En résumé

- Le modèle produit une **distribution de probabilités** (logits → softmax) ; le **sampling** en tire un token — deux étapes distinctes.
- La **température** remodèle la courbe (basse = piquée/sobre, haute = plate/créative) ; **top-p** coupe la traîne de façon adaptative — c'est le duo par défaut.
- **Température 0 ≠ déterministe** : flottants non associatifs + batching variable sur GPU. On bâtit sur des **seuils** (évals), jamais sur la reproductibilité exacte.
- Les **structured outputs** masquent les logits hors-grammaire à chaque token : JSON valide *par construction* — la forme, jamais le fond.

Le modèle pense en probabilités, le sampler tranche, et la grammaire pose les rails : voilà comment un mot devient *le* mot. Le hasard, ici, est un paramètre — pas une fatalité. Et ça, franchement… c'est pas sorcier.
