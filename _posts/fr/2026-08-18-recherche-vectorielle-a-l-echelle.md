---
layout: post
title: "La recherche vectorielle à l'échelle : HNSW, hybride et re-ranking — c'est pas sorcier !"
date: 2026-08-18 10:00:00
author: AClerbois
lang: fr
ref: vector-search-400
image: /images/posts/vector-search-400.png
tags: [AI, RAG, vector-search, hnsw, embeddings]
level: 400
---

Niveau 400, épisode 7. Dans [le RAG expliqué]({{ site.baseurl }}/fr/2026/07/15/rag-embeddings-expliques-simplement/) puis [construit en .NET]({{ site.baseurl }}/fr/2026/07/28/construire-son-rag-en-dotnet/), on appelait `SearchAsync(queryVector, top: 5)` et — magie — les cinq voisins remontaient. Un architecte se méfie de la magie : **comment trouve-t-on les 5 plus proches parmi dix millions de vecteurs, en 20 millisecondes ?**

Réponse : on **ne cherche pas les vrais plus proches**. On triche intelligemment. Aujourd'hui : les entrailles d'un index vectoriel (HNSW), le compromis qu'on accepte sans le savoir, et les couches qui font passer une démo à un moteur de recherche sérieux. Vous allez voir : c'est pas sorcier.

<!--more-->

## Le mur : la recherche exacte ne passe pas à l'échelle

La recherche naïve est simple : pour trouver les voisins d'une requête, on calcule sa distance à **chacun** des vecteurs stockés, puis on trie. Sur 10 000 chunks, instantané. Sur **10 millions**, chaque requête compare 10 millions de vecteurs de 1 536 dimensions — des centaines de millisecondes, voire des secondes. À l'échelle, la recherche exacte (*k-nearest neighbors* exact) **s'écroule**.

D'où le renoncement fondateur, et il faut le nommer clairement : on abandonne l'exactitude pour la vitesse. C'est l'**ANN** — *Approximate* Nearest Neighbors. On ne cherche plus les vrais 5 plus proches, mais **5 très probablement parmi les plus proches**. Ce petit mot, « approximate », est la clé de toute la recherche vectorielle moderne — et le paramètre que vous réglez sans le savoir.

## HNSW : la carte routière à plusieurs échelles

L'algorithme qui domine (celui derrière la plupart des bases vectorielles) s'appelle **HNSW** — *Hierarchical Navigable Small World*. L'image juste est celle d'un **atlas routier à plusieurs niveaux de zoom** :

- **La couche du haut** : les autoroutes. Peu de nœuds, de longs sauts — on traverse le continent des idées en quelques bonds.
- **Les couches du bas** : les rues. Beaucoup de nœuds, des pas courts — on affine jusqu'à la bonne adresse.

Une requête entre par le haut, fait de grands bonds vers la bonne région, puis « descend » de couche en couche en affinant, comme un GPS qui passe de l'autoroute à la départementale à la rue. Résultat : au lieu de visiter 10 millions de points, on en visite **quelques centaines** — le temps de recherche croît de façon *logarithmique*, pas linéaire. C'est ce qui rend le `top: 5` instantané.

Et voici le bouton que HNSW vous met entre les mains : **le compromis recall/latence**. Le paramètre de recherche (souvent ` efSearch`) contrôle combien de chemins on explore. Plus haut = plus de région couverte = **recall** meilleur (on rate moins de vrais voisins) mais plus lent. Plus bas = plus rapide mais on rate parfois le bon. Régler une base vectorielle, c'est essentiellement **placer ce curseur** pour votre tolérance — et ça se mesure avec [un golden dataset de recherche]({{ site.baseurl }}/fr/2026/08/16/ingenierie-des-evals-la-rigueur-statistique/), exactement comme au niveau 300.

## La quantization des vecteurs : le KV cache a un cousin

Souvenez-vous : [la quantization compressait les poids]({{ site.baseurl }}/fr/2026/08/12/economie-de-l-inference/) d'un modèle pour tenir en VRAM. Même idée, autre cible : dix millions de vecteurs de 1 536 dimensions en 32 bits, ça pèse — et la RAM d'un index vectoriel coûte cher. On **compresse les vecteurs eux-mêmes** : quantization scalaire (32 → 8 bits, ×4 de mémoire économisée) ou produit (plus agressive). On perd un peu de précision de distance, on gagne énormément de place et de vitesse. Le même arbitrage précision/ressources que partout dans cette série — à mesurer, toujours, sur *vos* données.

## Les deux couches qui font un vrai moteur

Le RAG de base (embed → ANN → prompt) a deux angles morts que la production révèle vite :

**1. La recherche hybride.** Les embeddings capturent le *sens* — mais butent sur l'exact : une référence produit `SKU-1234`, un nom propre rare, un identifiant. Le bon vieux mot-clé (BM25), lui, excelle là-dessus et échoue sur le sens. La solution n'est pas de choisir : c'est de **fusionner** les deux classements. L'algorithme standard est le **RRF** (*Reciprocal Rank Fusion*) — il combine le rang sémantique et le rang lexical sans avoir à calibrer des scores hétérogènes. Sémantique *et* mots-clés, le meilleur des deux mondes.

**2. Le re-ranking.** L'ANN est rapide mais grossier : il compare la requête et les chunks *séparément* (chacun a son vecteur, calculé une fois). Un **cross-encoder**, lui, lit la requête **et** un chunk *ensemble* — bien plus précis, mais trop lent pour dix millions. D'où le pattern en deux temps, universel dans les moteurs sérieux : l'ANN **rappelle** 50 candidats plausibles (rapide), le cross-encoder les **re-classe** finement pour n'en garder que 5 (précis). Le videur à l'entrée fait le tri grossier, le jury à l'intérieur départage — chacun son rôle.

## Le mot d'honnêteté : migrer d'embeddings fait mal

Le piège que personne ne mentionne avant de le vivre. Le jour où un meilleur modèle d'embeddings sort, vous ne pouvez pas juste « changer le modèle » : **les nouveaux vecteurs ne sont pas comparables aux anciens** (autre modèle = autre carte des idées, coordonnées incompatibles). Une migration d'embeddings, c'est **ré-indexer *tout* le corpus** — coûteux, long, et à faire sans casser le service en place. Les stratégies existent (double indexation, bascule progressive, versionnage de l'espace vectoriel), mais c'est une opération lourde à **anticiper dès la conception**, et [à consigner en ADR]({{ site.baseurl }}/fr/2026/07/14/adr-memoire-decisions-architecture/). Le choix du modèle d'embeddings est bien plus engageant qu'il n'en a l'air.

## En résumé

- À l'échelle, la recherche exacte s'écroule : on passe à l'**ANN** (*approximate*) — 5 *probablement* parmi les plus proches, pas les 5 vrais.
- **HNSW** = un atlas routier multi-échelle : recherche logarithmique, avec le curseur **recall/latence** (`efSearch`) à placer et à mesurer.
- La **quantization des vecteurs** (cousine de celle des poids) troque un peu de précision contre beaucoup de RAM et de vitesse.
- Un vrai moteur ajoute deux couches : **recherche hybride** (RRF : sémantique + mots-clés) et **re-ranking** (cross-encoder qui affine le top 50 en top 5).
- Et le piège d'architecte : **changer de modèle d'embeddings = tout ré-indexer** — à anticiper et documenter.

« Trouve les 5 plus proches » cachait un atlas routier, un renoncement assumé à l'exactitude, et un videur doublé d'un jury. La magie du `top: 5`, désassemblée. Et ça, franchement… c'est pas sorcier.
