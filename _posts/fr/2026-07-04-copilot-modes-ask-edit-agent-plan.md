---
layout: post
title: "Ask, Edit, Agent, Plan : les modes de GitHub Copilot — et pourquoi planifier change tout"
date: 2026-07-04 10:00:00
author: AClerbois
lang: fr
ref: copilot-modes
image: /images/posts/copilot-modes.png
tags: [github, copilot, AI, agents, LLM]
level: 100
---

Même Copilot, même modèle, même projet… et pourtant quatre résultats radicalement différents selon un petit menu déroulant que la plupart des gens ignorent : le **mode**. Ask, Edit, Agent — et le petit dernier qui change tout pour les grosses tâches, **Plan**.

Choisir le bon mode, c'est décider **qui tient le volant**. Et sur une grosse tâche, foncer sans avoir déplié la carte, c'est la meilleure façon de rouler trois heures dans la mauvaise direction. On démonte tout ça. Et vous allez voir : c'est pas sorcier.

<!--more-->

## Le fil rouge : qui tient le volant ?

Dans [l'article sur le harnais]({{ site.baseurl }}/fr/2026/07/01/le-harnais-de-l-ia-github-copilot/), on a vu que Copilot est une mécanique : une boucle, des outils, un modèle. Les **modes**, c'est le levier de vitesses de cette mécanique. Ils ne changent pas le moteur — ils changent **la part de conduite que vous déléguez.**

À gauche du levier, vous gardez les mains sur le volant et Copilot vous conseille. À droite, vous lui confiez le trajet entier et vous surveillez. Entre les deux, tout est une question de **dosage de la délégation**. Reprenons chaque cran.

## Les quatre modes

### Ask — vous demandez votre chemin

**L'analogie :** le copilote à côté de vous. Vous lui posez une question, il répond ; vous, vous conduisez. Il ne touche jamais au volant.

**Concrètement :** vous sélectionnez du code, vous posez une question, Copilot répond — il explique, propose un extrait, rappelle un cas limite. **Il ne modifie aucun fichier.** Zéro risque, réponse immédiate.

**Quand l'utiliser :** pour comprendre, explorer, apprendre. « Que fait cette fonction ? », « comment on teste ça ? », « c'est quoi la bonne façon en Rust ? ». C'est le mode le plus sûr et le plus rapide.

### Edit — vous déléguez un tronçon précis

**L'analogie :** le régulateur de vitesse sur une portion que **vous** avez choisie. Vous restez maître de la trajectoire, la machine exécute le tronçon.

**Concrètement :** vous désignez les fichiers à changer, vous décrivez la modification en langage naturel (« ajoute la gestion d'erreur », « passe en async/await »), et Copilot applique des éditions **prêtes à relire** dans ce périmètre. Vous validez avant que ça reste.

**Quand l'utiliser :** quand vous **savez déjà quoi faire et où**, mais que vous ne voulez pas tout taper. Une modification ciblée, un refactoring localisé. Vous ne lâchez pas les rênes — vous déléguez un geste précis.

### Agent — vous confiez le volant

**L'analogie :** la conduite autonome. Vous donnez la destination, la voiture planifie l'itinéraire, tourne, freine, se corrige. Vous gardez les yeux sur la route et la main près du frein.

**Concrètement :** vous donnez un objectif de haut niveau ; l'agent raisonne sur tout le projet, choisit les fichiers, écrit le code, lance les commandes, lit les erreurs et **itère tout seul** jusqu'au but. Il applique les changements automatiquement, en soumettant à validation les commandes sensibles. C'est la [boucle agentique du harnais]({{ site.baseurl }}/fr/2026/07/01/le-harnais-de-l-ia-github-copilot/) en pleine action.

**Quand l'utiliser :** pour construire une fonctionnalité, échafauder un module, corriger un bug qui touche plusieurs fichiers. Puissant — mais c'est justement là que le mode suivant devient vital.

### Plan — on déplie la carte avant de partir

**L'analogie :** avant un grand voyage, on étale la carte sur le capot et on trace l'itinéraire **ensemble**, avant de tourner la clé. On repère les péages, les détours, les questions (« on passe par où, exactement ? »).

**Concrètement :** en mode Plan, Copilot **explore la codebase, pose des questions de clarification, et produit un plan d'implémentation que vous relisez** — le tout **avant** d'écrire la moindre ligne. Vous corrigez le tir sur le plan, puis vous laissez l'agent l'exécuter.

**Quand l'utiliser :** dès que la tâche est grosse, ambiguë, ou touche à plusieurs endroits. C'est le cœur de cet article, alors creusons **pourquoi**.

## Pourquoi planifier avant une grosse tâche change tout

Lâchez l'agent directement sur « refais tout le système d'authentification » et voilà ce qui arrive : il **suppose** ce que vous vouliez dire, part dans une direction, produit 400 lignes de diff… et vous découvrez au bout de 20 minutes qu'il a résolu le mauvais problème. Vous jetez tout et vous recommencez. Coûteux en temps, en [crédits]({{ site.baseurl }}/fr/2026/07/05/tokens-llm-envoyes-sortie-cache/), en nerfs.

Le plan casse ce cercle vicieux. Voici ce qu'il vous achète :

- **Il fait remonter les ambiguïtés *avant* le code.** Les questions de clarification (« quelle stratégie de session ? JWT ou cookie ? ») surgissent quand elles coûtent une phrase à corriger — pas 400 lignes.
- **Il rend la correction bon marché.** Rediriger un plan en trois puces, c'est trivial. Rediriger un gros diff déjà écrit, c'est un chantier. On corrige la carte, pas la route déjà construite.
- **Il découpe en étapes relisables.** Une grosse tâche devient une liste d'étapes que vous validez une à une — au lieu d'un mur de changements à avaler d'un coup.
- **Il garde le contexte propre.** L'agent qui suit un plan clair reste concentré ; il divague moins, donc il gaspille moins de contexte (et de tokens).
- **Il crée un contrat.** Le plan validé devient la référence : à la fin, vous vérifiez le résultat *contre le plan*, pas contre une vague intention de départ.

La règle d'or tient en une image : **dix minutes de carte épargnent trois heures de détour.** Sur une petite tâche, planifier est un luxe inutile. Sur une grosse, c'est ce qui sépare un beau résultat d'un « annuler tout et recommencer ». On mesure deux fois, on coupe une fois.

## Le lien avec les modèles : quel modèle, quel mode

C'est ici que tout se rejoint. J'ai déjà défendu l'idée qu'[un modèle n'est pas l'autre]({{ site.baseurl }}/fr/2026/06/25/quel-modele-choisir-github-copilot/) — citadines, berlines, semi-remorques. Le mode vous dit **combien vous déléguez** ; le modèle vous dit **quelle puissance vous attelez**. Les deux se choisissent ensemble.

| Mode | Ce que fait Copilot | Gamme de modèle conseillée | Pourquoi |
| --- | --- | --- | --- |
| **Ask** | Répond, sans toucher au code | 🟢 Citadine (Haiku, Flash, mini) | Réponse immédiate, coût dérisoire, largement suffisant |
| **Edit** | Édite un périmètre que vous choisissez | 🔵 Berline (Sonnet, GPT-5.4) | Bon rapport qualité/prix pour du code ciblé |
| **Agent** | Construit en autonomie, multi-fichiers | 🔵 Berline par défaut, 🟣 Semi-remorque si ça coince | La berline suffit souvent ; on monte en gamme sur les vrais nœuds |
| **Plan** | Réfléchit et trace l'itinéraire | 🟣 Semi-remorque (Opus, GPT-5.5) | C'est l'étape « raisonnement » : payez le meilleur cerveau **ici** |

Et voici le **conseil qui fait vraiment la différence** :

> **Planifiez avec un gros modèle, exécutez avec un moins cher.**

Le raisonnement — la partie difficile, celle qui décide de la direction — se concentre dans le **plan**. C'est là que le modèle puissant (le [semi-remorque, voire Fable 5]({{ site.baseurl }}/fr/2026/06/25/quel-modele-choisir-github-copilot/) pour les très gros chantiers) justifie son prix. Une fois le plan validé, l'exécution est souvent mécanique : une berline la déroule très bien, à une fraction du coût.

Vous obtenez le meilleur des deux mondes : la **qualité de décision** d'un grand modèle là où elle compte, et le **coût maîtrisé** d'un modèle intermédiaire là où la route est déjà tracée. C'est exactement le raisonnement « [coût des tokens]({{ site.baseurl }}/fr/2026/07/05/tokens-llm-envoyes-sortie-cache/) » appliqué à votre façon de travailler.

## Le tableau récap

| Mode | L'image | Qui tient le volant | À utiliser pour |
| --- | --- | --- | --- |
| **Ask** | Le copilote qui répond | Vous, à 100 % | Comprendre, explorer, apprendre |
| **Edit** | Le régulateur sur un tronçon | Vous, la machine exécute | Une modification ciblée que vous savez décrire |
| **Agent** | La conduite autonome | Copilot, vous surveillez | Construire, échafauder, corriger sur plusieurs fichiers |
| **Plan** | La carte sur le capot | Vous cadrez, avant de partir | Toute grosse tâche ambiguë ou multi-fichiers |

## La règle simple à retenir

- **Petite question ?** → Ask, modèle léger.
- **Modification précise et connue ?** → Edit, modèle polyvalent.
- **Fonctionnalité à construire ?** → Agent, polyvalent — et montez en gamme si ça bloque.
- **Grosse tâche floue ?** → **Plan d'abord**, avec un gros modèle. Puis Agent pour exécuter, éventuellement avec un modèle moins cher.

Le réflexe du débutant, c'est de tout faire en mode Agent avec le plus gros modèle « pour être tranquille ». Le réflexe du pro, c'est de **doser** : le bon mode et le bon modèle pour chaque moment du trajet. La différence ne se voit pas sur une ligne de code — elle se voit sur la facture, et sur le nombre de fois où vous n'avez pas eu à tout recommencer.

Choisir son mode, c'est choisir qui conduit. Planifier avant de foncer, c'est regarder la carte avant de tourner la clé.

Et ça, mine de rien… c'est pas sorcier.
