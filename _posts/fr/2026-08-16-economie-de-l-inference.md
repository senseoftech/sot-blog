---
layout: post
title: "L'économie de l'inférence : VRAM, batching et le point de bascule — c'est pas sorcier !"
date: 2026-08-16 10:00:00
author: AClerbois
lang: fr
ref: inference-economics-400
image: /images/posts/inference-economics-400.png
tags: [AI, LLM, inference, gpu, cost, self-hosting]
level: 400
---

Niveau 400, épisode 4 — l'article pour ceux qui signent les factures. Dans [le billet BYOK de juin]({{ site.baseurl }}/certificate/2026/06/05/ghco-affranchir-les-tokens/), on affranchissait l'IA des tokens facturés en l'hébergeant soi-même. Question laissée ouverte : **à partir de quand est-ce rentable ?** Et surtout : *pourquoi* un contexte long coûte de la mémoire, pas seulement du calcul.

Le [KV cache]({{ site.baseurl }}/fr/2026/08/14/attention-kv-cache-sous-le-capot/) nous a donné la clé physique ; on la transforme aujourd'hui en économie. VRAM, batching continu, quantization, et le calcul de bascule API vs auto-hébergé. Vous allez voir : c'est pas sorcier.

<!--more-->

## Le vrai goulot n'est pas le calcul, c'est la mémoire

Intuition fausse à corriger d'emblée : « un GPU sert un modèle, donc plus de requêtes = plus de calcul ». En réalité, à l'inférence, le mur qu'on heurte en premier est la **VRAM** — la mémoire du GPU. Elle héberge deux choses :

1. **Les poids du modèle** — coût fixe. Un modèle de 70 milliards de paramètres en 16 bits, c'est ~140 Go rien que pour exister ; en 8 bits, ~70 Go. Constant, quel que soit le trafic.
2. **Le KV cache** — coût **variable, par requête et par token**. Souvenez-vous : [chaque token en vol garde ses Keys et Values]({{ site.baseurl }}/fr/2026/08/14/attention-kv-cache-sous-le-capot/) en VRAM. Une conversation de 8 000 tokens réserve donc une tranche de mémoire proportionnelle — *pendant toute sa durée*.

La conséquence financière est contre-intuitive et centrale : **« contexte long » = « mémoire GPU réservée » = « moins de conversations simultanées sur la même carte ».** Le coût réel d'un gros contexte n'est pas seulement le [calcul quadratique]({{ site.baseurl }}/fr/2026/08/14/attention-kv-cache-sous-le-capot/), c'est qu'il **occupe une place** que d'autres utilisateurs ne peuvent plus avoir. Votre facture au token n'est qu'un proxy de ça.

## Le batching continu : pourquoi le débit total prime

Un GPU traite les requêtes par **lots** (batch) : mille utilisateurs partagent la même carte, leurs tokens générés en parallèle. D'où deux métriques qu'il faut cesser de confondre :

- **La latence** — le temps pour *votre* réponse. Décomposée : le **TTFT** (time to first token, dominé par le [prefill quadratique]({{ site.baseurl }}/fr/2026/08/14/attention-kv-cache-sous-le-capot/) de tout votre prompt) puis les **tokens/seconde** du decode.
- **Le débit** (throughput) — le total de tokens/seconde que la carte crache, tous utilisateurs confondus. C'est *lui* qui détermine le coût par token.

Le **continuous batching** (le vLLM et consorts) est l'optimisation reine : au lieu d'attendre qu'un lot entier finisse, on injecte une nouvelle requête dès qu'une place se libère. La carte reste saturée, le débit grimpe, le coût par token s'effondre. La leçon d'architecte : **un modèle auto-hébergé n'est rentable que saturé.** Une carte à 30 % d'utilisation coûte presque aussi cher qu'à 100 % — mais produit trois fois moins.

## La quantization : troquer un peu de précision contre beaucoup de mémoire

Le levier qui rend l'auto-hébergement praticable. Les poids sont stockés en nombres à virgule flottante ; la **quantization** les compresse sur moins de bits — 16 → 8 → 4 — divisant d'autant l'empreinte VRAM (et accélérant, la mémoire étant le goulot).

| Précision | Empreinte (modèle 70B) | Ce qu'on y perd |
| --- | --- | --- |
| 16 bits (bf16) | ~140 Go | référence |
| 8 bits (INT8) | ~70 Go | négligeable en pratique |
| 4 bits (AWQ/GPTQ) | ~35 Go | mesurable, souvent acceptable |

Les méthodes modernes (AWQ, GPTQ) sont **intelligentes** : elles préservent finement les poids les plus sensibles au lieu de tout arrondir bêtement. Le 4 bits fait tenir un 70B sur une seule grosse carte — la différence entre « louable » et « inaccessible ». **Le mot d'honnêteté** : la perte est réelle et **à mesurer sur *votre* tâche** — avec [vos évals]({{ site.baseurl }}/fr/2026/07/20/tester-une-application-ia-les-evals/), pas sur un benchmark générique. Parfois indolore, parfois éliminatoire selon la sensibilité de votre cas.

## Le calcul de bascule : API ou auto-hébergé ?

La décision, dépouillée. L'API se paie **au token, sans engagement, élastique** ; l'auto-hébergement se paie **à l'heure de GPU, fixe, que ça tourne ou non**.

- **Sous un certain volume** → l'API gagne, toujours. Une carte à 20 000 €/an inoccupée la nuit ne bat jamais un compteur qui tombe à zéro quand vous ne l'appelez pas. C'est l'écrasante majorité des projets.
- **Au-dessus, avec un débit soutenu et prévisible** → l'auto-hébergé (saturé, quantifié) passe devant : le coût fixe s'amortit sur un flot constant.
- **Les autres critères, souvent décisifs avant le prix** : la **résidence des données** (le vrai moteur de [l'article BYOK]({{ site.baseurl }}/certificate/2026/06/05/ghco-affranchir-les-tokens/) — vos données ne sortent pas), la **latence** maîtrisée, l'indépendance vis-à-vis d'un fournisseur, et l'accès à des modèles ouverts spécialisés.

La règle honnête : **commencez sur API. Migrez vers l'auto-hébergé quand le débit est prouvé, prévisible et que la carte serait saturée** — ou quand la conformité l'impose. Migrer trop tôt, c'est payer une carte pour la regarder dormir.

## En résumé

- Le goulot de l'inférence est la **VRAM** : poids (fixe) + **KV cache** (variable par token) — d'où « contexte long = mémoire réservée = moins de requêtes simultanées ».
- Deux métriques distinctes : **latence** (TTFT + tokens/s, pour vous) et **débit** (pour le coût). Le **continuous batching** sature la carte et fait chuter le coût par token.
- La **quantization** (8/4 bits, AWQ/GPTQ) troque un peu de qualité contre beaucoup de VRAM — perte à mesurer sur *vos* évals.
- Bascule : **API par défaut** (élastique) ; **auto-hébergé** quand débit soutenu + carte saturée, ou quand résidence des données/latence l'exigent.

Un GPU, c'est un immeuble de bureaux : rentable plein, ruineux à moitié vide — et le KV cache est le loyer que chaque conversation paie à la place qu'elle occupe. Voilà l'économie de l'inférence, sans mystère. Et ça, franchement… c'est pas sorcier.
