---
layout: post
title: "L'Agentic SDLC (1/9) — La falaise du vibe coding : pourquoi vos agents ont besoin d'une méthode — c'est pas sorcier !"
date: 2026-08-31 10:00:00
author: AClerbois
lang: fr
ref: agentic-sdlc-thesis
image: /images/posts/agentic-sdlc-thesis.png
tags: [agentic-sdlc, vibe-coding, agents, AI, methodologie]
level: 200
---

Vendredi, l'agent a construit votre prototype en deux heures et vous avez applaudi. Lundi, lâché sur le vrai dépôt — quinze ans d'histoire, des conventions que personne n'a écrites, un module legacy que tout le monde contourne — le même agent invente des API, viole vos règles maison et rend un diff que personne n'ose merger. Ce moment a un nom : **la falaise du vibe coding**. Et il a surtout un remède, qui n'est pas « attendre un meilleur modèle ».

C'est la thèse de l'[Agentic SDLC Handbook](https://danielmeppiel.github.io/agentic-sdlc-handbook/) de Daniel Meppiel — Global Black Belt chez Microsoft, créateur d'APM — un livre libre, en ligne, et écrit *avec* la méthode qu'il enseigne. Sa phrase d'ouverture résume le problème : toutes les organisations adoptent des agents de code, presque aucune n'a de méthodologie pour ça. Cette série de neuf épisodes parcourt sa vision, du poste du développeur jusqu'au bureau du CTO. Vous allez voir : c'est pas sorcier.

<!--more-->

## La falaise, vue de près

Le handbook ouvre sur un constat que vous avez probablement vécu : les agents IA échouent sur les vraies bases de code de manière **prévisible**. Trois motifs reviennent en boucle :

| Motif d'échec | Ce qui se passe |
| --- | --- |
| **Épuisement du contexte** | le système entier ne tient pas dans la fenêtre ; l'agent perd le fil en cours de session |
| **Interfaces hallucinées** | l'agent invente des API plausibles qui n'existent pas dans votre code |
| **Conventions violées** | les règles d'équipe jamais écrites sont invisibles pour lui — il les piétine |

Le piège, c'est que ces échecs sont **silencieux**. Un modèle faible échoue bruyamment : il n'y arrive pas, vous le voyez. Un modèle puissant mal contextualisé échoue *avec assurance* : du code plausible, qui passe la review… et casse en production.

## Ce n'est pas le modèle, c'est ce qu'on lui donne

L'objection classique : « le prochain modèle réglera ça ». Le handbook compile des chiffres qui racontent autre chose. Les fenêtres de contexte sont passées de 2 048 tokens (GPT-3, 2020) à plus d'un million aujourd'hui — un facteur 500. Si la taille était le problème, la satisfaction aurait suivi. Or l'enquête Stack Overflow 2024 donne 76 % d'adoption mais 45 % de répondants jugeant l'IA « mauvaise » sur les tâches complexes ; celle de 2025 ajoute que 66 % décrivent des solutions « presque justes, mais pas tout à fait ». Et les analyses GitClear sur 211 millions de lignes mesurent un **churn** (code réécrit peu après avoir été produit) qui explose chez les gros utilisateurs d'IA.

Doubler la fenêtre puis doubler ce qu'on y verse ne change rien : tout ce qui entre **se dispute la même attention**. Nous avions déjà touché ça du doigt dans [la fenêtre de contexte : l'art de compresser et d'oublier]({{ site.baseurl }}/fr/2026/07/26/fenetre-de-contexte-compresser-oublier/) — le handbook en fait un principe fondateur.

## Les trois propriétés qui ne partiront pas

Toute la méthode de Meppiel découle de trois propriétés structurelles des LLM — pas des bugs, des **caractéristiques** :

1. **Le contexte est fini et fragile.** Capacité fixe, attention en compétition ; la qualité se dégrade sous la charge.
2. **Le contexte doit être explicite.** Un dépôt contient deux savoirs : le code écrit (accessible à l'IA) et les conventions comprises (dans les têtes). L'agent n'a que le premier — la couture entre les deux est exactement là où ça casse.
3. **La sortie est probabiliste.** Mêmes entrées, sorties différentes. La fiabilité ne se suppose pas, elle **s'architecture**.

Ce deuxième point vous rappelle quelque chose ? C'est précisément le pari de notre série [« le dépôt qui parle »]({{ site.baseurl }}/fr/2026/08/21/les-artefacts-du-vibe-coding-la-carte-complete/) : transformer le savoir implicite en artefacts versionnés. Les deux visions s'emboîtent — nous y reviendrons à l'épisode 3.

## La réponse : des contraintes, pas de la magie

Face à ça, le handbook propose **PROSE** : cinq contraintes architecturales — Progressive Disclosure, Reduced Scope, Orchestrated Composition, Safety Boundaries, Explicit Hierarchy. L'analogie assumée, c'est **REST** : REST n'a prescrit aucune technologie, il a posé des contraintes qui *induisent* les propriétés désirées (scalabilité, évolution indépendante). PROSE fait pareil pour les agents : chaque contrainte répond à une des trois propriétés ci-dessus et induit fiabilité, modularité, auditabilité. L'épisode 4 les détaille une par une.

Meppiel replace le tout dans une image plus large, empruntée à Andrej Karpathy : nous sommes dans « les années 1980 » de cette informatique-là. Le processeur (le LLM) est déjà puissant ; tout ce qui va autour — harnais, contraintes, primitives, gestionnaires de paquets — est embryonnaire. Une pile se forme sous nos yeux, et c'est elle que la série va descendre couche par couche.

## La carte de la série

| # | Date | Épisode |
| --- | --- | --- |
| 1 | aujourd'hui | **La falaise du vibe coding** — vous êtes ici |
| 2 | [1er septembre]({{ site.baseurl }}/fr/2026/09/01/agentic-sdlc-2-la-machine-agentique/) | la machine agentique : modèle, harnais, code source d'agent, client |
| 3 | [2 septembre]({{ site.baseurl }}/fr/2026/09/02/agentic-sdlc-3-le-depot-instrumente/) | le dépôt instrumenté : sept primitives pour équiper vos agents |
| 4 | [3 septembre]({{ site.baseurl }}/fr/2026/09/03/agentic-sdlc-4-prose-cinq-contraintes/) | PROSE : les cinq contraintes en détail |
| 5 | [4 septembre]({{ site.baseurl }}/fr/2026/09/04/agentic-sdlc-5-l-economie-de-l-attention/) | l'économie de l'attention : la fenêtre n'est pas le focus |
| 6 | [5 septembre]({{ site.baseurl }}/fr/2026/09/05/agentic-sdlc-6-la-frontiere-deterministe-probabiliste/) | la frontière déterministe/probabiliste : l'agent propose, la machine dispose |
| 7 | [6 septembre]({{ site.baseurl }}/fr/2026/09/06/agentic-sdlc-7-orchestrer-une-flotte-d-agents/) | orchestrer une flotte d'agents : vagues et points de contrôle |
| 8 | [7 septembre]({{ site.baseurl }}/fr/2026/09/07/agentic-sdlc-8-dix-neuf-facons-de-saboter-ses-agents/) | dix-neuf anti-patterns, du prompt monolithe à l'agent débridé |
| 9 | [8 septembre]({{ site.baseurl }}/fr/2026/09/08/agentic-sdlc-9-cote-direction-business-case-gouvernance-facture/) | côté direction : business case, gouvernance, équipes et la facture |

## Le mot d'honnêteté

- Le handbook est un **document vivant en pré-version** (v0.11, juin 2026) sous licence CC BY-NC-ND. Son auteur est le premier à étiqueter ses preuves : une grosse PR publique et vérifiable, des enquêtes sectorielles, et des estimations marquées comme telles. La validation à l'échelle entreprise reste devant nous.
- Cette série est une **lecture commentée, pas une traduction** : je passe la vision de Meppiel au filtre de ce blog et de mon quotidien .NET/GitHub Copilot. Pour le texte intégral — gratuit — [c'est ici](https://danielmeppiel.github.io/agentic-sdlc-handbook/).

## En résumé

- La **falaise du vibe coding** : les agents brillent en démo et échouent sur les vrais dépôts, selon trois motifs prévisibles — contexte épuisé, interfaces hallucinées, conventions violées.
- Ce n'est **pas un problème de modèle** : fenêtres ×500, satisfaction stagnante ; ce qui compte, c'est ce qui remplit la fenêtre.
- Trois propriétés structurelles ne partiront pas : contexte **fini**, savoir **implicite invisible**, sortie **probabiliste**.
- La réponse du handbook : **PROSE**, cinq contraintes architecturales dans l'esprit de REST — et une pile complète qui se forme au-dessus des LLM.
- Neuf épisodes pour tout démonter, du terminal du dev à la feuille de calcul du CFO.

Demain, on ouvre le capot : quand vous tapez un prompt, *qui* fait quoi ? Modèle, harnais, fichiers d'instructions, client — les quatre pièces de la machine agentique. Et ça, franchement… c'est pas sorcier.
