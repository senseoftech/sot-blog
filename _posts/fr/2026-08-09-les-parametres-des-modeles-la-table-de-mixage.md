---
layout: post
title: "Les paramètres des modèles : la table de mixage du prompt — c'est pas sorcier !"
date: 2026-08-09 10:00:00
author: AClerbois
lang: fr
ref: model-parameters
image: /images/posts/model-parameters.png
tags: [AI, LLM, parameters, temperature, top-p, api]
level: 200
---

Vous faites votre premier appel à une API de modèle, et là, un mur de paramètres : `temperature`, `top_p`, `max_tokens`, `frequency_penalty`, `stop`, `seed`… La plupart des gens touchent la température, prient, et laissent le reste au hasard. Dommage : chaque bouton fait *une* chose précise, et savoir lequel tourner change tout.

L'image du jour : une **table de mixage**. Vous êtes l'ingénieur du son, chaque fader et chaque potentiomètre a un rôle, et le talent, c'est de savoir *lequel* pousser pour l'effet voulu — pas de tous les pousser à fond. On passe la console en revue, groupe par groupe. Vous allez voir : c'est pas sorcier.

<!--more-->

## Le groupe « hasard » : temperature et top_p

Les deux faders les plus connus — et les plus mal utilisés. Ils dosent l'aléatoire dans le choix de chaque mot ([le vrai mécanisme est pour demain]({{ site.baseurl }}/fr/2026/08/10/sampling-decodage-contraint/), aujourd'hui on reste pratique) :

- **`temperature`** : la largeur de la pioche. Basse (→ 0), le modèle prend presque toujours le mot le plus probable — sobre, répétitif, fiable. Haute (→ 1 ou 2 selon le fournisseur), il ose des choix improbables — créatif, divers, aventureux. C'est le bouton de [l'article hallucinations]({{ site.baseurl }}/fr/2026/07/16/pourquoi-l-ia-hallucine/).
- **`top_p`** (nucleus) : au lieu de doser le hasard, il **coupe la traîne** des mots peu probables — « ne garde que les candidats qui pèsent p % ». À 0,1, ultra-restrictif ; à 1, tout est permis.

**La règle d'or que personne ne dit** : ne poussez **pas les deux en même temps**. Ils agissent sur la même distribution, et les combiner rend le comportement imprévisible. Choisissez-en **un** : la température pour la plupart des cas, top_p si vous voulez borner franchement les dérapages. Laissez l'autre à sa valeur par défaut.

*(Sur les modèles ouverts, deux cousins apparaissent : `top_k` — « garde les k meilleurs candidats » — et `min_p` — « rien sous X % du favori ». Même famille, réglages plus fins.)*

## Le groupe « longueur » : max_tokens

Un seul fader, mais un piège classique. **`max_tokens`** (parfois `max_completion_tokens`) plafonne la longueur de la **réponse** — [des tokens de sortie, les plus chers]({{ site.baseurl }}/fr/2026/07/05/tokens-llm-envoyes-sortie-cache/). Deux choses à savoir absolument :

- **Il tronque, il ne résume pas.** Atteindre la limite coupe la réponse **au milieu d'une phrase** — ce n'est pas « fais plus court », c'est « arrête-toi net ». Pour du plus court, demandez-le dans le prompt ; le paramètre est une ceinture de sécurité, pas une consigne de style.
- **Les modèles de raisonnement comptent leur réflexion dedans.** Sur ces modèles, les tokens de « pensée » invisible consomment le budget avant même la réponse visible — plafonnez trop bas, et vous n'obtenez… rien. Prévoyez large.

## Le groupe « répétition » : frequency et presence

Deux potentiomètres pour lutter contre le modèle qui radote — utiles en génération longue :

| Bouton | Ce qu'il pénalise | L'effet |
| --- | --- | --- |
| **`frequency_penalty`** | les mots déjà **souvent** utilisés | casse les répétitions littérales (« très très très ») |
| **`presence_penalty`** | les mots **déjà apparus** (même une fois) | pousse vers de nouveaux sujets, plus de variété |

Valeurs typiques de -2 à 2. Un léger positif (0,3–0,6) suffit d'ordinaire ; trop haut, le modèle s'interdit des mots nécessaires et devient bizarre. À laisser à zéro par défaut, à ne toucher que si vous *voyez* le radotage.

## Le groupe « contrôle » : stop, seed, n

Les boutons qui cadrent la sortie sans toucher au style :

- **`stop`** (ou `stop_sequences`) : des chaînes qui **coupent la génération** dès qu'elles apparaissent. Indispensable quand vous générez du structuré maison (« arrête-toi à `###` ») ou une seule réplique dans un dialogue.
- **`seed`** : une graine pour **tenter** de reproduire une sortie. Le mot important est *tenter* — [ce n'est jamais garanti]({{ site.baseurl }}/fr/2026/08/10/sampling-decodage-contraint/) à travers un parc de GPU. Utile en développement pour rejouer un cas, pas une promesse de déterminisme.
- **`n`** : demander **plusieurs réponses** en un appel — pratique pour choisir la meilleure ou explorer des variantes (attention, ça multiplie la facture de sortie).
- **`logit_bias`** : forcer ou bannir des mots précis. Puissant, chirurgical, rarement nécessaire — le bouton d'expert.

## Le groupe « structure & réflexion »

Les réglages les plus modernes, croisés ailleurs dans la série :

- **`response_format`** / **structured outputs** : imposer un schéma JSON. Ce n'est pas un réglage de style mais [un contrat qui contraint la génération]({{ site.baseurl }}/fr/2026/07/29/tool-calling-sous-le-capot/) — JSON valide par construction. Le bon réflexe pour tout ce qui alimente un écran ou un import.
- **L'effort de raisonnement** (`reasoning_effort` ou budget de réflexion selon le fournisseur) : sur les modèles de raisonnement, doser *combien* le modèle « réfléchit » avant de répondre. Bas = rapide et pas cher ; haut = plus lent mais meilleur sur les problèmes durs. C'est le bouton déjà rencontré dans [Copilot CLI]({{ site.baseurl }}/fr/2026/07/19/copilot-cli-2-le-quotidien/) — la même logique que [choisir le bon modèle]({{ site.baseurl }}/fr/2026/06/25/quel-modele-choisir-github-copilot/), mais pour l'intensité de calcul.

## Les recettes : quel réglage pour quel usage

Le tableau à garder sous le coude — un point de départ, pas une loi :

| Usage | temperature | Le reste |
| --- | --- | --- |
| **Factuel, extraction, classification** | 0 – 0,3 | `response_format` si sortie structurée |
| **Code** | 0 – 0,2 | max_tokens large (raisonnement compris) |
| **Rédaction, reformulation** | 0,6 – 0,8 | léger `frequency_penalty` si redites |
| **Brainstorm, idéation** | 0,9 – 1,2 | `n` > 1 pour varier les angles |
| **Chat / assistant** | 0,5 – 0,7 | `stop` sur le tour de parole |

## Le mot d'honnêteté

- **Les noms et plages varient selon le fournisseur.** OpenAI, Anthropic, les modèles ouverts n'exposent pas exactement les mêmes boutons ni les mêmes bornes (température jusqu'à 2 chez l'un, 1 chez l'autre ; `stop` vs `stop_sequences`…). **Vérifiez toujours la doc de *votre* fournisseur** — ce guide donne la carte, pas le territoire exact.
- **Les valeurs par défaut sont bonnes.** Dans l'immense majorité des cas, ne touchez *que* la température. Le cargo-cult de réglages (« j'ai copié top_p 0,92 d'un tuto ») fait plus de mal que de bien.
- **Réglez avec des [évals]({{ site.baseurl }}/fr/2026/07/17/tester-une-application-ia-les-evals/), pas au feeling.** Un paramètre « meilleur » sur trois essais est peut-être du hasard. Mesurez avant de graver.

## En résumé

- Un appel API, c'est une **table de mixage** : chaque bouton fait une chose, l'art est d'en toucher peu.
- **Hasard** : `temperature` **ou** `top_p`, jamais les deux. **Longueur** : `max_tokens` tronque (ne résume pas) et englobe le raisonnement.
- **Répétition** : `frequency`/`presence_penalty` contre le radotage, à doser léger. **Contrôle** : `stop`, `seed` (best-effort), `n`, `logit_bias`.
- **Structure** : `response_format` pour du JSON garanti ; **effort de raisonnement** pour doser la réflexion.
- Et surtout : par défaut c'est bon, les noms varient par fournisseur, et **on règle avec des évals**.

La console a beaucoup de boutons, mais un bon mix en pousse trois, pas trente. Commencez par la température, ajoutez un fader quand un besoin précis le réclame, et mesurez. Et ça, franchement… c'est pas sorcier.
