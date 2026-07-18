---
layout: post
title: "ECC (3/3) — Les leçons dont s'inspirer, même sans Claude Code — c'est pas sorcier !"
date: 2026-09-16 10:00:00
author: AClerbois
lang: fr
ref: ecc-lessons
image: /images/posts/ecc-lessons.png
tags: [agents, AI, best-practices, github-copilot, configuration]
level: 200
---

Vous n'utilisez pas Claude Code ? Aucune importance. Les meilleures idées d'[ECC]({{ site.baseurl }}/fr/2026/09/14/ecc-1-la-config-qui-a-gagne-le-hackathon/) ne sont pas des idées Claude Code : ce sont des idées de **harnais** — et votre Copilot, votre Cursor ou votre Codex obéissent aux mêmes lois. Pour clore cette mini-série, voici les sept leçons que je retiens de la config gagnante, chacune vérifiable dans le dépôt, chacune transposable dès lundi matin.

Sortez le carnet. C'est pas sorcier — et c'est du vécu, pas de la théorie.

<!--more-->

## Leçon 1 — L'économie d'abord, l'héroïsme ensuite

Le conseil le plus contre-intuitif du README : **ne mettez pas le plus gros modèle par défaut**. La config recommandée d'ECC : Sonnet en modèle de base (≈ −60 % de coût, suffisant pour l'essentiel des tâches de code), plafond de *thinking tokens* à 10 000 au lieu de 31 999 (≈ −70 % sur le coût caché du raisonnement), et le gros modèle **à la demande** pour les problèmes qui le méritent. Le gagnant d'un hackathon Anthropic ne brûle pas du Opus sur des renommages de variables — méditez là-dessus, et relisez [l'économie de l'inférence]({{ site.baseurl }}/fr/2026/08/16/economie-de-l-inference/).

## Leçon 2 — Vos MCP mangent votre fenêtre

Le chiffre qui pique, tel que le formule le README : chaque description d'outil MCP consomme des tokens de votre fenêtre de 200k — potentiellement réduite à ~70k utiles. La discipline ECC : **moins de 10 serveurs MCP actifs, moins de 80 outils**, et la désactivation au runtime de tout ce qui ne sert pas au projet en cours. On l'avait annoncé dans [notre épisode sur l'économie de l'attention]({{ site.baseurl }}/fr/2026/09/04/agentic-sdlc-5-l-economie-de-l-attention/) : le *bind* n'est pas gratuit. Faites l'inventaire de vos serveurs MCP aujourd'hui — vous serez surpris.

## Leçon 3 — Compactez aux frontières, jamais au milieu

Le skill `strategic-compact` renverse le réflexe par défaut : ne laissez pas la compaction se déclencher **à 95 % de remplissage**, en catastrophe, au milieu d'une implémentation — elle emporte les noms de variables et les chemins de fichiers dont vous avez justement besoin. Compactez **délibérément aux frontières logiques** : après la recherche, après un jalon, après un débogage clos. ECC va jusqu'à abaisser le seuil d'auto-compaction à 50 % pour garder la main. C'est le cousin opérationnel du *plan-write-then-reload* [du handbook]({{ site.baseurl }}/fr/2026/09/04/agentic-sdlc-5-l-economie-de-l-attention/).

## Leçon 4 — « Fini » est un verdict, pas une phrase

La `verification-loop` [vue hier]({{ site.baseurl }}/fr/2026/09/15/ecc-2-anatomie-skills-hooks-instincts/) mérite d'être volée telle quelle : six portes (build, types, lint, tests, sécurité, diff), un verdict binaire **READY / NOT READY**, et l'interdiction de continuer sur un build cassé. Peu importe votre harnais : écrivez cette checklist dans vos instructions, exigez le rapport. C'est l'antidote outillé aux [dix-neuf façons de saboter ses agents]({{ site.baseurl }}/fr/2026/09/07/agentic-sdlc-8-dix-neuf-facons-de-saboter-ses-agents/) — le saut de l'ange en tête.

## Leçon 5 — La mémoire se budgète comme le reste

La mémoire d'ECC n'est pas un grenier, c'est un **sas avec quota** : 8 000 caractères maximum injectés au démarrage, six instincts au plus, seuil de confiance à 0,7 — et un interrupteur global pour les setups à petit contexte. La mémoire illimitée est un anti-feature : elle recrée le déversement de contexte qu'elle prétendait résoudre. Si vous tenez [un journal de bord pour votre IA]({{ site.baseurl }}/fr/2026/07/27/la-memoire-des-ia/), donnez-lui un plafond et un tri par valeur — pas un scroll infini.

## Leçon 6 — Votre config est une surface d'attaque

AgentShield existe parce que le créateur d'ECC a constaté l'angle mort : on scanne ses dépendances, jamais ses fichiers d'agent. Or un hook peut exfiltrer, un serveur MCP peut mentir, un skill copié d'un gist peut embarquer une injection — et l'auteur avertit lui-même que des miroirs malveillants de sa propre config circulent. Trois réflexes : **auditer** ses configs (secrets, permissions, hooks), **installer** depuis les canaux vérifiés uniquement, et **relire** toute config générée par un modèle avant de la persister. La suite logique de [sécuriser GitHub Copilot]({{ site.baseurl }}/fr/2026/07/10/securiser-github-copilot/) et de [la défense en profondeur]({{ site.baseurl }}/fr/2026/08/13/prompt-injection-defense-en-profondeur/).

## Leçon 7 — Commencez minimal, élaguez souvent

L'auteur de 278 skills vous dit lui-même de **ne pas les installer toutes** : profils d'installation (`minimal`, `core`, `full`), règles copiées uniquement pour *votre* stack, et le piège n° 1 documenté — empiler les méthodes d'installation jusqu'au conflit. C'est mot pour mot la feuille de route du [dépôt instrumenté]({{ site.baseurl }}/fr/2026/09/02/agentic-sdlc-3-le-depot-instrumente/) : 3 à 5 fichiers d'abord, croissance pilotée par les échecs réels, élagage mensuel. La config parfaite n'est pas la plus grosse ; c'est celle dont chaque ligne a mérité sa place.

## Transposer chez vous : la table Copilot

| Idée ECC | Équivalent GitHub Copilot |
| --- | --- |
| Skills paresseux | [skills et instructions scopées]({{ site.baseurl }}/fr/2026/07/02/github-copilot-skills-instructions-agents-mcp/) (`applyTo`) |
| Agents spécialisés | [sous-agents et agents custom]({{ site.baseurl }}/fr/2026/07/29/copilot-sous-agents-decouper-le-travail/) |
| Hooks GateGuard | protections de branche, CI, [linters]({{ site.baseurl }}/fr/2026/08/28/linters-analyzers-les-conventions-qui-s-appliquent-toutes-seules/), politiques d'organisation |
| Instincts / mémoire | [AGENTS.md]({{ site.baseurl }}/fr/2026/08/22/agents-md-le-guide-d-onboarding-de-votre-ia/) + journal versionné, tenus à la main |
| Économie de modèle | [choisir son modèle par tâche]({{ site.baseurl }}/fr/2026/06/25/quel-modele-choisir-github-copilot/) |
| Budget MCP | mêmes serveurs, même drain — inventaire et désactivation |

Une absence honnête : l'équivalent des **hooks d'événements** n'existe pas partout — d'où le report sur la CI et les protections de dépôt, qui font le même travail un cran plus loin.

## Le mot d'honnêteté

- Une config gagnante est gagnante **pour son auteur** : dix mois de *ses* échecs, *ses* stacks, *ses* opinions (tmux, 80 % de couverture). Clonez la méthode — la boucle échec → règle → skill — pas le contenu en bloc.
- Les chiffres cités (−60 %, −70 %, 200k→70k) sont ceux du README d'ECC : des ordres de grandeur d'exploitation constatés par l'auteur, pas des benchmarks contrôlés. Vérifiez sur vos propres factures.

## En résumé — la mini-série en une idée

- **Économisez d'abord** : petit modèle par défaut, thinking plafonné, compaction choisie, MCP inventoriés.
- **Prouvez ensuite** : six portes, un verdict, jamais de « fini » sur parole.
- **Capitalisez enfin** : une mémoire sous quota, des règles qui naissent des échecs, un élagage régulier — et une config auditée comme du code, parce que c'en est.
- ECC est la démonstration grandeur nature de ce que [la série Agentic SDLC]({{ site.baseurl }}/fr/2026/08/31/agentic-sdlc-1-la-falaise-du-vibe-coding/) théorisait : le dépôt gagnant est un dépôt **instrumenté, borné et mesuré**.

Merci d'avoir suivi cette plongée — [le dépôt d'Affaan Mustafa est là](https://github.com/affaan-m/ecc), gratuit, lisible, et honnêtement plus instructif que bien des formations payantes. Inspirez-vous, adaptez, élaguez. Et ça, franchement… c'est pas sorcier.
