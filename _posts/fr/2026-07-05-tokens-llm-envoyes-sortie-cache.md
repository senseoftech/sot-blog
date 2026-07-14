---
layout: post
title: "Tokens envoyés, tokens sortis, tokens en cache… c'est pas sorcier !"
date: 2026-07-05 10:00:00
author: AClerbois
lang: fr
ref: llm-tokens
image: /images/posts/llm-tokens.png
tags: [AI, LLM, tokens, cost]
level: 100
---

Quand on commence à utiliser des modèles d'IA — que ce soit via une API, GitHub Copilot ou un chatbot — un mot revient partout : **token**. Sur votre facture, dans les limites (« context window »), dans les messages d'erreur (« trop de tokens »). Et on distingue même les **tokens envoyés**, les **tokens de sortie** et les **tokens en cache**, chacun à un prix différent.

Ça a l'air ésotérique. En réalité, une fois qu'on a la bonne image en tête, tout devient limpide. Allez, on démonte le compteur. Vous allez voir : c'est pas sorcier.

<!--more-->

## D'abord : c'est quoi un token ?

Un modèle de langage ne lit pas des mots, et pas non plus des lettres. Il lit des **jetons** — des *tokens* : des petits morceaux de texte. Avant de traiter votre phrase, le modèle la passe dans un **hachoir** (le *tokenizer*) qui la découpe en jetons.

Un token, ce n'est **ni un mot, ni une lettre**. C'est un morceau, souvent une syllabe ou un bout de mot fréquent. Règle de pouce en anglais : **1 token ≈ 4 caractères ≈ ¾ de mot**. En français, comptez un peu plus (accents et mots longs se découpent davantage).

Le plus parlant, c'est de le voir. Voici de vrais découpages, avec le tokenizer des modèles GPT récents :

| Texte | Nombre de tokens | Découpage |
| --- | --- | --- |
| `Hello world` | 2 | `Hello` · `world` |
| `Bonjour le monde` | 3 | `Bonjour` · `le` · `monde` |
| `développeurs` | 4 | `dé` · `velop` · `pe` · `urs` |
| `anticonstitutionnellement` | 5 | `ant` · `icon` · `stitution` · `nel` · `lement` |
| `🎉` (emoji) | 2 à 3 | selon le modèle |
| `    def hello():` (indenté) | 4 | l'indentation compte aussi |

Trois enseignements sautent aux yeux :

- Un mot courant comme `world` = **1 seul token**, mais un mot rare ou long comme `développeurs` en vaut **4** à lui tout seul.
- Le **français coûte plus cher** que l'anglais : les accents et les mots longs se fragmentent davantage.
- **Tout** compte : les espaces, l'indentation du code, les emojis. Même un simple 🎉 pèse plusieurs tokens.

Le mieux, c'est d'essayer vous-même : collez n'importe quel texte sur [tokenizer.openai.com](https://tokenizer.openai.com) et regardez-le se découper en direct. C'est le meilleur moyen de développer une intuition.

## Les trois compteurs : envoyés, sortis, en cache

Maintenant que le hachoir tourne, il y a **trois compteurs** distincts — et c'est là que se joue votre facture.

### 1. Les tokens envoyés (entrée / *input*)

Ce sont **tous les tokens que vous envoyez au modèle** à chaque requête. Et attention, ce n'est pas seulement votre question du moment. C'est :

- l'**instruction système** (le rôle, les consignes) ;
- **tout l'historique** de la conversation jusqu'ici ;
- votre **message** actuel ;
- les **définitions des outils** disponibles (par exemple les schémas des serveurs MCP) ;
- les **documents** ou le contexte que vous joignez.

Point crucial : vous les payez **à chaque tour**. Plus la conversation grandit, plus l'entrée grossit — et plus chaque nouvelle requête coûte cher. C'est exactement pour ça que, dans mon article sur [la personnalisation de GitHub Copilot]({{ site.baseurl }}/2026/07/02/github-copilot-skills-instructions-agents-mcp/), je soulignais qu'un gros fichier d'instructions ou trop de serveurs MCP « pèsent » : tout ça, ce sont des tokens envoyés à chaque appel.

### 2. Les tokens de sortie (sortie / *output*)

Ce sont les tokens que le **modèle génère** en réponse. Et voici la surprise : **ils sont généralement plus chers** — souvent **3 à 5 fois** le prix d'un token d'entrée.

Pourquoi ? Parce que produire un token demande au modèle un vrai effort de calcul (il « réfléchit » un jeton à la fois), là où lire l'entrée est comparativement rapide. C'est aussi la raison du paramètre `max_tokens` : il plafonne la longueur de la réponse pour éviter les mauvaises surprises.

### 3. Les tokens en cache (*prompt caching*)

Voici l'astuce qui change tout. Si vous renvoyez **le même début de prompt** d'une requête à l'autre — un gros prompt système, un long document de référence — le fournisseur peut le **garder en mémoire** (le mettre en cache) et le relire sans tout recalculer.

Résultat : ces tokens-là sont facturés une **fraction** du prix normal (jusqu'à **~90 % moins cher**) et la réponse arrive **bien plus vite** (jusqu'à ~80 % de latence en moins). Le modèle a « déjà mâché » ces jetons récemment, il ne repart pas de zéro.

La règle d'or pour en profiter : **mettez le contenu stable au début** (instructions, documents fixes) et le **contenu variable à la fin** (la question de l'utilisateur). Selon le fournisseur, le cache est automatique ou à activer explicitement — mais le principe est le même partout.

## Chaque modèle a ses particularités

On parle des tokens comme d'une unité universelle. Ce n'est pas tout à fait vrai : **chaque modèle a son propre hachoir et son propre bol.**

### Son propre hachoir (le tokenizer)

Chaque famille de modèles découpe le texte à sa façon. Les modèles GPT d'OpenAI utilisent la bibliothèque **tiktoken**, avec plusieurs encodages selon la génération (`cl100k_base` pour GPT-4, `o200k_base` pour les modèles plus récents). Claude, Gemini ou Llama ont chacun le **leur**.

Conséquence très concrète : **le même texte ne fait pas le même nombre de tokens d'un modèle à l'autre.** Notre emoji 🎉 vaut 2 tokens avec un encodage OpenAI récent, mais 3 avec l'ancien. Donc « ça fait 500 tokens » n'a de sens **que pour un modèle donné**. Pour un compte exact et une estimation de coût fiable, utilisez toujours le tokenizer **du fournisseur que vous visez** — et pour visualiser côté OpenAI, [tokenizer.openai.com](https://tokenizer.openai.com) reste l'outil le plus parlant.

### La taille de son bol (le *context window*)

Le **context window**, c'est la **mémoire de travail maximale** du modèle : le nombre total de tokens qu'il peut prendre en compte d'un coup — **entrée et sortie réunies**. C'est la taille du bol dans lequel on verse les jetons.

Cette taille varie énormément d'un modèle à l'autre : de l'ordre de **128 000** tokens pour certains, jusqu'à **un million et plus** pour d'autres (et ça évolue vite). Quand vous dépassez ce plafond, le modèle ne peut pas « tout garder en tête » : il faut **tronquer ou résumer** le contexte. C'est précisément ce qui se passe quand une très longue conversation ou un très gros fichier finit par « saturer ».

Un grand bol, c'est pratique, mais rappelez-vous les trois compteurs : plus vous remplissez le contexte, plus vous payez de **tokens envoyés à chaque tour**. La bonne taille de contexte, c'est la plus petite qui fait le travail.

## Le tableau récap

| Type de token | C'est quoi | Coût relatif | Comment l'alléger |
| --- | --- | --- | --- |
| **Tokens envoyés** (entrée) | Tout ce que vous envoyez : système, historique, message, outils, documents | 💶 normal — payé à **chaque** tour | Contexte court, historique élagué, n'activez que les outils utiles |
| **Tokens de sortie** | Ce que le modèle rédige en réponse | 💶💶💶 le plus cher (souvent 3–5×) | Demandez des réponses concises, bornez `max_tokens` |
| **Tokens en cache** | Le préfixe répété, déjà « mâché » récemment | 💶 une fraction (jusqu'à ~90 % de remise) | Mettez le contenu **stable en tête**, le variable en fin |

Et pour les particularités des modèles :

| Notion | Ce qu'il faut retenir |
| --- | --- |
| **Tokenizer** | Chaque modèle découpe différemment → un même texte = un nombre de tokens différent. Comptez avec le tokenizer **du bon fournisseur**. |
| **Context window** | La mémoire de travail max (entrée + sortie). De ~128k à 1M+ selon les modèles. La dépasser force à tronquer/résumer. |

## Quelques réflexes pour alléger la facture

- **Mettez le stable au début.** Instructions et documents fixes en tête → le cache fait le reste.
- **Soyez concis en sortie.** C'est le token le plus cher : demandez des réponses courtes quand vous le pouvez.
- **Élaguez le contexte.** L'historique et les gros documents sont renvoyés à *chaque* tour. Ne gardez que l'utile.
- **Coupez les outils inutiles.** Les schémas d'outils / serveurs MCP inactifs occupent le contexte pour rien.
- **Attention au français.** Il est plus « verbeux » en tokens que l'anglais — utile à savoir pour estimer un coût.
- **Choisissez la bonne taille de contexte.** Un modèle à 1M de tokens est séduisant, mais un bol plus petit et mieux rempli coûte souvent moins cher.

## En résumé

- Le modèle lit et écrit en **jetons** (tokens), pas en mots. Un hachoir (le *tokenizer*) découpe tout d'abord.
- **Trois compteurs** : les tokens **envoyés** (tout ce que vous fournissez, payé à chaque tour), les tokens de **sortie** (ce qu'il génère, le plus cher), les tokens en **cache** (le préfixe répété, à prix cassé).
- **Chaque modèle a son hachoir** (des comptes différents pour le même texte) et **son bol** (le context window).

La prochaine fois que vous verrez « tokens » sur une facture ou dans une limite, vous saurez exactement ce qui se cache derrière. Et ça, franchement… c'est pas sorcier.
