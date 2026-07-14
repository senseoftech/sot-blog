---
layout: post
title: "L'ingénierie des évals : ce que « 94 % » veut vraiment dire — c'est pas sorcier !"
date: 2026-08-16 10:00:00
author: AClerbois
lang: fr
ref: eval-stats-400
image: /images/posts/eval-stats-400.png
tags: [AI, LLM, evals, statistics, quality]
level: 400
---

Niveau 400, épisode 6. [L'article évals de juillet]({{ site.baseurl }}/fr/2026/07/17/tester-une-application-ia-les-evals/) a posé la méthode : golden dataset, trois niveaux de correction, seuil en CI. Excellent socle — et un piège tapi dedans. Vous lancez la suite, vous lisez **« 94 % »**, vous déployez. Mais 94 %… **plus ou moins combien ?**

Parce qu'un système [non déterministe par construction]({{ site.baseurl }}/fr/2026/08/10/sampling-decodage-contraint/), mesuré sur un petit échantillon, produit un chiffre qui **bouge**. Aujourd'hui, la rigueur statistique qui transforme « on a 94 % » en « on sait ce que 94 % vaut ». Vous allez voir : c'est pas sorcier.

<!--more-->

## La variance : le même système, deux scores différents

Première vérité qui dérange. Relancez votre suite d'évals à l'identique, sans rien changer : le score bouge. 94 %, puis 91 %, puis 95 %. Rien n'a changé *chez vous* — c'est le [sampling non déterministe]({{ site.baseurl }}/fr/2026/08/10/sampling-decodage-contraint/) qui parle, jusque dans vos mesures. Conséquence directe et brutale : **un score d'éval unique est une observation, pas une vérité.**

D'où le premier réflexe d'ingénieur : mesurer **plusieurs fois** et regarder la dispersion. On croise ici la notion de **pass@k** — la probabilité de réussir *au moins une fois* sur k tentatives. Un cas qui passe à 96 % *en moyenne* et un cas qui passe une fois sur deux mais que vous avez eu la chance de voir vert : le score unique les confond, la mesure répétée les sépare. Sur un agent où l'utilisateur ne réessaie pas, c'est la moyenne — pas le coup de chance — qui compte.

## L'intervalle de confiance : 50 cas, c'est peu

Voici le calcul que personne ne fait et qui change tout. Vous avez 50 cas dans votre golden dataset, 47 passent : 94 %. Quelle est la « vraie » qualité de votre système ?

La statistique répond : avec 47/50, l'intervalle de confiance à 95 % s'étend d'environ **83 % à 98 %**. Autrement dit, votre « 94 % » est compatible avec une vraie qualité de 84 % **comme** de 98 %. **La barre d'erreur est énorme** — parce que 50 échantillons, c'est peu. Deux conséquences d'architecte :

- **Comparer deux prompts sur un petit dataset est souvent du bruit.** Prompt A à 94 %, prompt B à 90 % sur 50 cas ? Leurs intervalles se chevauchent largement — vous n'avez **rien** prouvé. Déployer B « parce qu'il est meilleur » est une décision prise sur du vent.
- **La taille du dataset se dimensionne.** Pour distinguer 90 % de 94 % avec confiance, il ne faut pas 50 cas mais **plusieurs centaines**. Vouloir mesurer fin sur un petit échantillon est une erreur de conception, pas un détail.

La règle : **affichez toujours l'intervalle, jamais le point seul.** « 94 % [83–98 %, n=50] » est une information honnête ; « 94 % » est une illusion de précision.

## Calibrer le juge : mesurer, ne pas croire

[L'article évals]({{ site.baseurl }}/fr/2026/07/17/tester-une-application-ia-les-evals/) recommandait de calibrer le LLM-juge « jusqu'à ce qu'il s'accorde avec l'humain ». Niveau 400 : on **quantifie** cet accord, on ne le décrète pas. L'outil est le **kappa de Cohen** — une mesure d'accord entre deux annotateurs *corrigée du hasard* (deux juges qui disent « oui » 90 % du temps s'accordent souvent par pure chance ; kappa retire cette chance).

Le protocole : un humain annote un échantillon (disons 50 cas), le juge aussi, on calcule kappa. En dessous d'un accord solide, **votre juge n'est pas un instrument de mesure fiable — c'est un générateur de bruit corrélé**, et tous les scores qu'il produit héritent de son biais. On ré-affine la grille de correction, on recalcule, on recommence. Un thermomètre se **étalonne** avant de servir ; un juge LLM aussi.

## Contamination et dérive : les deux poisons lents

Deux menaces sur la validité *dans le temps* :

- **La contamination.** Si vos cas de test ressemblent à des données d'entraînement publiques (ou pire, ont fuité dedans), le modèle « réussit » par mémorisation, pas par capacité. Le score est faussement bon et **ne prédit rien** sur vos vraies données. Réflexe : des cas issus de *votre* domaine privé, renouvelés, jamais un benchmark public pris tel quel.
- **La dérive** (drift). Le monde bouge : le trafic réel de production s'éloigne peu à peu de votre golden dataset figé. Votre suite reste verte pendant que la qualité perçue baisse — vous mesurez fidèlement un passé révolu. Réflexe : **échantillonner la production en continu** ([via les traces OTel]({{ site.baseurl }}/fr/2026/07/31/observer-ses-agents-opentelemetry/)) pour détecter l'écart de distribution, et [ré-alimenter le dataset]({{ site.baseurl }}/fr/2026/07/17/tester-une-application-ia-les-evals/) — l'incident de cette nuit qui devient le cas de test de demain.

## En résumé

- Un score d'éval **varie** ([sampling non déterministe]({{ site.baseurl }}/fr/2026/08/10/sampling-decodage-contraint/)) : mesurez plusieurs fois, pensez en **pass@k**, jamais en observation unique.
- Sur 50 cas, l'**intervalle de confiance** de « 94 % » va grosso modo de 83 à 98 % : comparer deux prompts sur un petit dataset est souvent du **bruit**. Affichez l'intervalle, dimensionnez n.
- Le **juge LLM se calibre au kappa de Cohen** — accord humain quantifié ; sinon c'est un générateur de bruit corrélé.
- Surveillez **contamination** (cas privés, jamais un benchmark public) et **dérive** (échantillonner la prod, ré-alimenter le dataset).

« 94 % » n'est pas un résultat, c'est le début d'une phrase : *94 %, sur 50 cas, à ± 7 points, avec un juge calibré à kappa 0,8, sur des données non contaminées.* La différence entre une intuition et une mesure. Et ça, franchement… c'est pas sorcier.
