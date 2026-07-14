---
layout: post
title: "L'historique Git : la mémoire que votre IA lit déjà — c'est pas sorcier !"
date: 2026-07-28 10:00:00
author: AClerbois
lang: fr
ref: git-history
image: /images/posts/git-history.png
tags: [git, conventional-commits, documentation, AI, best-practices]
level: 100
---

Regardez un agent IA travailler sur un bug un peu retors : à un moment, presque toujours, il lance `git log` ou `git blame`. Il fait exactement ce que ferait un bon dev : chercher **quand** cette ligne a changé, **avec quoi** elle a changé, et **pourquoi**. Et là, deux mondes : soit il trouve `fix(order): arrondir la TVA au centime avant totalisation (#412)` — soit il trouve `fix`, `wip`, `update`, `fix2`.

[Hier, on a vu comment les IA se fabriquent une mémoire]({{ site.baseurl }}/fr/2026/07/27/la-memoire-des-ia/). Aujourd'hui, le twist : votre projet a **déjà** une mémoire parfaite, horodatée, infalsifiable — l'historique Git. La seule question est de savoir si vous y écrivez des souvenirs ou du bruit. Vous allez voir : c'est pas sorcier.

<!--more-->

## L'historique est une base de connaissances (gratuite)

Chaque commit répond potentiellement à trois questions que ni le code ni les commentaires ne savent porter :

- **Quoi, ensemble ?** Le périmètre : quels fichiers ont bougé d'un même geste. Un commit atomique dessine les liens invisibles entre un handler, sa migration et son test.
- **Quand, et dans quel ordre ?** La chronologie : ce bug est-il apparu avant ou après la migration EF ? `git log` répond en secondes.
- **Pourquoi ?** L'intention : la seule information qui n'existe *nulle part ailleurs*. Le diff dit ce qui a changé ; seul le message dit pour quelle raison.

C'est le même fil rouge que [les ADR]({{ site.baseurl }}/fr/2026/07/14/adr-memoire-decisions-architecture/) : perdre le *pourquoi* rend le code intouchable. L'ADR capture les grandes décisions ; le message de commit capture les mille petites — l'arrondi de TVA, le retry ajouté après l'incident, le contournement du bug du driver.

## Conventional Commits : trois minutes pour apprendre

Le format [Conventional Commits](https://www.conventionalcommits.org/) s'est imposé parce qu'il est minuscule : un préfixe, une portée optionnelle, une description.

```text
feat(catalog): ajouter le filtre par gamme de prix
fix(order): arrondir la TVA au centime avant totalisation (#412)
refactor(shipping): extraire le calcul de délai vers un service dédié
```

| Préfixe | Ça veut dire | Le lecteur (humain ou IA) en déduit |
| --- | --- | --- |
| `feat` | nouvelle capacité | le comportement attendu a grandi |
| `fix` | correction | il y avait un bug — le message dit lequel |
| `refactor` | ni feat ni fix | **le comportement ne doit pas changer** |
| `test`, `docs`, `chore` | périphérie | on peut souvent passer vite |

Le corps du message, optionnel, porte le *pourquoi* quand il ne tient pas dans la ligne : « le fournisseur arrondit par ligne, nous par commande ; écart d'un centime sur les paniers > 40 articles ». Deux phrases écrites une fois — relues à chaque `git blame` pendant dix ans.

La règle jumelle : le **commit atomique**. Un commit = un changement logique. Le commit fourre-tout (« fin de journée ») détruit la première richesse de l'historique : le périmètre. Si vous décrivez votre commit avec « et », découpez-le.

## Pourquoi ça vaut double à l'ère des agents IA

1. **L'agent lit l'historique sans qu'on lui demande.** `git log --oneline -- chemin/du/fichier`, `git blame`, `git show` : ce sont des outils standard de tout agent en mode autonome. Un historique propre, c'est du contexte de qualité **déjà injecté** dans chaque session — sans un token de votre part.
2. **L'agent écrit l'historique — briefez-le.** Une ligne dans vos [instructions]({{ site.baseurl }}/fr/2026/07/02/github-copilot-skills-instructions-agents-mcp/) : *« commits atomiques, format Conventional Commits, le corps explique le pourquoi »*. Les agents excellent à cette discipline — ils n'ont pas la flemme de 18 h 45. Beaucoup d'équipes découvrent que leurs plus beaux messages de commit sont désormais ceux des machines.
3. **La boucle se referme.** L'agent du sprint 30 qui lit `fix(order): arrondir la TVA…` écrit par l'agent du sprint 12 hérite du contexte sans que personne n'ait rédigé une ligne de doc. L'historique devient une conversation entre sessions — [la mémoire d'hier]({{ site.baseurl }}/fr/2026/07/27/la-memoire-des-ia/), version dépôt.

Et un bonus mécanique : les Conventional Commits sont **parsables**. Changelog généré, versionnement sémantique automatique ([GitVersion](https://gitversion.net/) et consorts), CI qui réagit différemment à un `feat` et à un `chore` — la prose devient de l'outillage.

## Le mot d'honnêteté

- **Ne réécrivez pas l'histoire ancienne.** L'historique pourri des trois dernières années est irrécupérable — et c'est OK. La valeur se construit à partir d'aujourd'hui ; dans six mois, la couche récente (celle qu'on consulte le plus) sera propre.
- **Le squash merge est un choix, pas un réflexe.** Écraser une PR de quinze commits soignés en un seul « Add feature (#89) » jette le détail du raisonnement. Squashez le bruit (« fix typo », « oops »), gardez les étapes qui racontent — ou exigez des PR assez petites pour qu'un commit suffise.
- **Un lint de commits est utile, pas suffisant.** [commitlint](https://commitlint.js.org/) ou un hook vérifie le *format* ; personne ne peut vérifier machinalement que le message dit le *pourquoi*. Ça reste une affaire de culture d'équipe — et de relecture.

## En résumé

- L'historique Git est la seule mémoire du projet qui soit **exhaustive, horodatée et gratuite** — à condition d'y écrire des souvenirs (`fix(order): arrondir la TVA…`) plutôt que du bruit (`fix2`).
- Deux disciplines minuscules suffisent : **Conventional Commits** (type, portée, description — le corps pour le *pourquoi*) et le **commit atomique** (un commit = un changement ; « et » = découpe).
- Les agents IA **lisent** cet historique spontanément (`git log`, `git blame`) et l'**écrivent** avec une discipline parfaite si vos instructions l'exigent — l'ADR capture les grandes décisions, le commit capture les mille petites.
- On ne nettoie pas le passé : on écrit propre **à partir d'aujourd'hui**, et on réfléchit à deux fois avant de squasher.

La prochaine fois que quelqu'un — humain ou agent — lancera `git blame` sur votre code, il tombera sur une explication au lieu d'une énigme. Dix secondes de soin par commit, des années de contexte gratuit. Et ça, franchement… c'est pas sorcier.
