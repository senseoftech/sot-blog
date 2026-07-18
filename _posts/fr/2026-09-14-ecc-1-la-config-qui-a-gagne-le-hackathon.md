---
layout: post
title: "ECC (1/3) — La config Claude Code qui a gagné le hackathon d'Anthropic — c'est pas sorcier !"
date: 2026-09-14 10:00:00
author: AClerbois
lang: fr
ref: ecc-winning-config
image: /images/posts/ecc-winning-config.png
tags: [agents, AI, claude-code, configuration, open-source]
level: 200
---

Pendant neuf épisodes, [notre série Agentic SDLC]({{ site.baseurl }}/fr/2026/08/31/agentic-sdlc-1-la-falaise-du-vibe-coding/) a défendu une thèse : coder avec des agents demande une méthode — des primitives, des contraintes, des portes de validation. Il manquait la pièce à conviction. La voici. Février 2026, hackathon Anthropic × Forum Ventures à Cerebral Valley : Affaan Mustafa et son cofondateur gagnent en construisant [zenith.chat](https://zenith.chat) **entièrement dans Claude Code**. Et plutôt que de garder sa recette, le gagnant a publié toute sa configuration en MIT : [**ECC**](https://github.com/affaan-m/ecc), « the agent harness operating system ». Plus de 230 000 étoiles GitHub plus tard, c'est probablement la config d'agent la plus scrutée du monde.

Cette mini-série en trois épisodes la dissèque : aujourd'hui l'histoire et la vue d'ensemble, demain l'anatomie technique, après-demain les leçons dont s'inspirer — même si vous n'utilisez pas Claude Code. C'est pas sorcier.

<!--more-->

## La fiche d'identité

ECC n'est pas « un fichier de config » : c'est un système complet, né — dixit son auteur — de plus de dix mois d'usage quotidien intensif à construire de vrais produits :

| Composant | Volume | Rôle |
| --- | --- | --- |
| **Skills** | 278 | la surface de travail principale : TDD, revue, e2e, déploiement, recherche… |
| **Agents** | 67 | des spécialistes délégables : planner, architecte, reviewers par langage |
| **Règles** | 34 (9 communes + 25 par langage) | le toujours-vrai : style, git, workflow |
| **Hooks** | 20+ scripts | des automatismes sur événements : garde-fous, formatage, secrets |
| **MCP** | 14 serveurs prêts | GitHub, Supabase, Vercel, Railway… |
| **Shims** | 94 commandes legacy | la rétrocompatibilité pendant la migration vers les skills |

Le tout multi-harnais — Claude Code, Cursor, Codex, OpenCode, Gemini, Copilot, Zed — maintenu par un développeur solo qui livre chaque semaine, épaulé par 230+ contributeurs. Si vous avez lu [notre épisode sur la machine agentique]({{ site.baseurl }}/fr/2026/09/01/agentic-sdlc-2-la-machine-agentique/), vous reconnaissez la case « code source d'agent » — poussée ici à l'échelle industrielle.

## Le déclic du hackathon

L'histoire tient en une phrase de l'auteur : la victoire a **validé que la config était prête pour la production**. Construire un produit complet en un week-end, entièrement piloté dans le harnais, c'est le crash test ultime d'une configuration — le contraire d'une collection de prompts théoriques. C'est exactement le principe « le handbook écrit par la méthode qu'il enseigne » qu'on avait admiré [chez Daniel Meppiel]({{ site.baseurl }}/fr/2026/09/06/agentic-sdlc-7-orchestrer-une-flotte-d-agents/) : la preuve par l'usage.

## AgentShield : né du même week-end

Du même hackathon est sorti **AgentShield**, un auditeur de sécurité… pour configurations d'agents. L'outil scanne `CLAUDE.md`, `settings.json`, configs MCP, hooks, agents et skills selon cinq axes : détection de secrets (14 patterns), audit de permissions, injection par hooks, profil de risque des serveurs MCP, revue des configs d'agents. La fiche technique annonce 1 282 tests, 98 % de couverture, 102 règles d'analyse statique — et un pipeline adversarial à trois agents Claude Opus : équipe rouge, équipe bleue, auditeur.

Prenez une seconde pour mesurer le renversement : **la config d'agent est devenue une surface d'attaque qui mérite son propre scanner**. C'est la suite logique de ce qu'on écrivait dans [prompt injection : la défense en profondeur]({{ site.baseurl }}/fr/2026/08/13/prompt-injection-defense-en-profondeur/) — on y reviendra à l'épisode 3.

## L'essayer sans se faire mal

Trois chemins d'installation, du plus simple au plus fin :

1. **Le plugin** (recommandé) : `/plugin install ecc@ecc` depuis la marketplace Claude Code.
2. **L'installation sélective** : `install.sh` / `install.ps1` avec profils `minimal`, `core` ou `full`.
3. **La copie manuelle** : piocher agents, règles et skills un par un dans `~/.claude/`.

Et le piège n° 1, documenté par l'auteur lui-même : **ne jamais empiler les méthodes** — plugin *puis* script d'installation = skills en double, hooks en double, contexte en conflit. Le README fournit même le `--dry-run` de désinstallation pour s'en sortir.

Dernier point, et pas le moindre : l'auteur avertit explicitement que des **miroirs tiers non officiels** de sa config circulent et peuvent contenir du malware — n'installez que depuis les canaux vérifiés (le dépôt GitHub, les paquets npm officiels, le slug `ecc@ecc`). Une config d'agent, ça s'installe avec la même paranoïa qu'une dépendance.

## La carte de la mini-série

| # | Date | Épisode |
| --- | --- | --- |
| 1 | aujourd'hui | **La config qui a gagné** — vous êtes ici |
| 2 | [15 septembre]({{ site.baseurl }}/fr/2026/09/15/ecc-2-anatomie-skills-hooks-instincts/) | anatomie : skills-first, hooks, instincts et mémoire |
| 3 | [16 septembre]({{ site.baseurl }}/fr/2026/09/16/ecc-3-les-lecons-dont-s-inspirer/) | les leçons dont s'inspirer — même sans Claude Code |

## Le mot d'honnêteté

- 230 000 étoiles ne signifient pas « installez tout » : ECC est une config **personnelle devenue écosystème**. Sa valeur première, pour nous, est de se **lire** — c'est un catalogue de patterns éprouvés en production, gratuit et commenté.
- Le projet a un versant commercial transparent (ECC Pro, sponsors) qui finance le rythme de livraison ; le cœur reste MIT « perpétuellement ». À garder en tête en lisant le README, comme pour tout projet open source avec une offre payante.

## En résumé

- **ECC** = la configuration complète du gagnant du hackathon Anthropic × Forum Ventures (fév. 2026, zenith.chat construit entièrement dans Claude Code), publiée en MIT — 278 skills, 67 agents, 34 règles, 20+ hooks, multi-harnais.
- Née de **dix mois d'usage réel**, validée par la victoire — la preuve par l'usage, pas la théorie.
- **AgentShield**, né du même week-end, scanne… les configs d'agents : la config est officiellement une surface d'attaque.
- Installez par **un seul** chemin (plugin ou script ou manuel), depuis les **canaux vérifiés** uniquement.

Demain, on ouvre le capot : comment 278 skills tiennent sans faire fondre la fenêtre de contexte, ce que gardent les hooks, et le système d'« instincts » qui apprend de vos sessions. Et ça, franchement… c'est pas sorcier.
