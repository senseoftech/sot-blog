---
layout: post
title: "Git worktrees : plusieurs plans de travail, un seul dépôt — c'est pas sorcier !"
date: 2026-07-18 16:00:00
author: AClerbois
lang: fr
ref: git-worktrees
image: /images/posts/git-worktrees.png
tags: [git, worktree, workflow, productivity, best-practices]
level: 300
---

La scène est universelle. Vous êtes au milieu d'une feature, quinze fichiers ouverts, la tête dedans — et le hotfix urgent tombe. Le réflexe : `git stash`, `git switch main`, corriger, revenir, `git stash pop`, et prier que rien n'ait bougé entre-temps. Ou, version brutale, un `git clone` complet du dépôt dans un autre dossier. Les deux marchent. Les deux sont du gâchis. Git a, depuis la version 2.5, un outil taillé exactement pour ça : les **worktrees**. Plusieurs répertoires de travail sur un **même** dépôt, chacun sur sa branche, tous en même temps.

On les croise souvent en surface (« crée un worktree, lance ton agent dedans »). Aujourd'hui, niveau 300 : on ouvre le capot, on regarde ce que Git écrit réellement sur le disque, et on cartographie les pièges — dont un franchement contre-intuitif. C'est pas sorcier.

<!--more-->

## Le modèle mental : l'atelier et ses plans de travail

Un dépôt Git, c'est deux choses qu'on a l'habitude de confondre :

- **le magasin** — l'historique, les commits, les branches, les objets : tout ce qui vit dans `.git/` ;
- **le plan de travail** (*working tree*) — les fichiers réels que vous éditez, une projection d'un commit donné.

Un `git clone` duplique **les deux**. Un worktree, lui, ajoute **un plan de travail de plus** branché sur le **même magasin**. L'atelier — les matériaux (objets) et le tableau des tâches (branches) — est partagé ; chaque plan de travail a juste *sa* pièce en cours de montage. D'où le gain : pas de re-téléchargement, pas de duplication de l'historique, et un commit fait sur un établi est immédiatement visible depuis les autres.

## Sous le capot : ce que Git écrit vraiment

C'est ici que le niveau 300 commence. Créons un worktree et observons :

```bash
git worktree add ../hotfix -b hotfix
```

Premier choc : dans `../hotfix`, le `.git` n'est **pas un dossier** — c'est un **fichier** d'une ligne :

```
gitdir: /chemin/vers/main-repo/.git/worktrees/hotfix
```

Il pointe vers un dossier d'administration créé dans le dépôt principal, `.git/worktrees/hotfix/`, qui contient :

```
HEAD  index  logs/  refs/  ORIG_HEAD  gitdir  commondir
```

Autrement dit, chaque worktree possède **son propre `HEAD` et son propre `index`** (la zone de staging), tandis que le fichier `commondir` (`../..`) renvoie vers le `.git` partagé pour tout le reste. Cette séparation est toute la magie — et toute la source des pièges. Résumons :

| Propre à chaque worktree | Partagé par tout le dépôt |
| --- | --- |
| le plan de travail (les fichiers) | les **objets** (commits, blobs, arbres) |
| `HEAD` (la branche courante) | les **branches** (`refs/heads/*`) |
| l'`index` (le staging) | les tags, les remotes |
| le reflog de `HEAD`, l'état de `bisect` | la config du dépôt |
| `refs/worktree/*` (refs privées) | **le stash** ⚠️ |

Retenez la ligne du bas : le **stash est global au dépôt**, pas par worktree. On y revient — c'est le piège n° 1.

## Les commandes qui comptent

```bash
# créer, sur une nouvelle branche
git worktree add ../feature-x -b feature-x

# créer, sur une branche existante (ex. relire une PR)
git worktree add ../review-123 origin/pr-123

# créer en HEAD détaché, pour un test jetable
git worktree add --detach ../spike HEAD

# faire l'inventaire (scriptable)
git worktree list --porcelain

# retirer proprement (refuse si le worktree est « sale »)
git worktree remove ../feature-x

# nettoyer les entrées fantômes après une suppression manuelle
git worktree prune -v

# protéger un worktree sur disque amovible/réseau de la purge
git worktree lock ../on-usb
```

Deux réflexes de pro : `list --porcelain` pour tout script d'automatisation (sortie stable, machine-lisible), et **toujours** `remove` plutôt que `rm -rf` (on verra pourquoi).

## Les pièges — le vrai niveau 300

**1. Une branche = un seul worktree.** Impossible de sortir la même branche dans deux établis :

```
fatal: 'feature' is already used by worktree at '.../feature-x'
```

Corollaire souvent oublié : vous ne pouvez pas non plus checkout `main` dans un second worktree si le principal est déjà dessus. C'est une protection — deux plans de travail qui écrivent la même branche, ce serait le chaos — mais ça surprend au début.

**2. Le stash est partagé — le piège qui fait perdre une heure.** Vous faites `git stash` dans le worktree A, vous passez au worktree B, et… votre stash est là aussi, mêlé aux autres. Le stash n'est pas rangé par établi : c'est un tiroir commun à tout l'atelier. Sur plusieurs worktrees actifs, préférez un vrai commit temporaire (`git commit -m wip`) à un `stash` que vous risquez de dépiler au mauvais endroit.

**3. Les fichiers non versionnés ne suivent pas.** Un worktree neuf est une projection de commits — donc **vierge** de tout ce qui n'est pas dans Git : `.env`, `node_modules/`, `target/`, vos caches de build, vos secrets locaux. C'est voulu (l'isolation est le but), mais il faut réinstaller les dépendances et recopier la config à chaque nouvel établi. Un `direnv` ou un script de bootstrap font des merveilles ici.

**4. Ne supprimez jamais un worktree au `rm -rf` seul.** Le dossier disparaît, mais l'entrée d'administration reste — un worktree fantôme. Git vous le dira au prochain `prune` :

```
Removing worktrees/hotfix: gitdir file points to non-existent location
```

Utilisez `git worktree remove` (qui refuse d'ailleurs si des modifications ne sont pas commitées — `--force` pour passer outre), et `git worktree prune` pour balayer les fantômes hérités.

**5. Hooks et config sont communs.** `core.hooksPath` et la config du dépôt sont partagés par tous les worktrees. Pour qu'un établi diverge (rare, mais utile), activez `extensions.worktreeConfig` puis écrivez avec `git config --worktree`. Sans ça, un réglage dans un worktree affecte tout le monde.

**6. Submodules et gros outils.** Chaque worktree a besoin de son propre `git submodule update`, et certains IDE indexent mal plusieurs plans de travail d'un même dépôt (watchers de fichiers, caches de langage). Rien de bloquant, mais à savoir avant de multiplier les établis.

## Worktree, stash ou clone : lequel, quand ?

| Votre besoin | Le bon outil |
| --- | --- |
| Aller-retour de 2 minutes sur la même branche | `git stash` |
| Hotfix pendant une feature en cours | **worktree** |
| Relire une PR sans casser votre environnement | **worktree** (`--detach` ou la branche PR) |
| Laisser tourner un build long pendant que vous codez ailleurs | **worktree** |
| Travailler sur un autre *remote* / un fork | `git clone` |
| Isoler plusieurs agents qui éditent en parallèle | **worktree** (un par agent) |

La règle : le **stash** pour l'interruption courte, le **clone** pour un dépôt vraiment distinct, le **worktree** pour du parallélisme *soutenu* sur un même historique. Entre les deux extrêmes, c'est presque toujours le worktree qui gagne.

## À l'ère des agents

Ce dernier cas d'usage est en train de devenir le principal. Un agent qui code, c'est un plan de travail qui s'agite ; trois agents en parallèle sur le même dépôt, sans worktrees, c'est trois agents qui s'écrasent les fichiers. **Un worktree par agent**, et le problème disparaît : périmètres de fichiers disjoints, répertoire principal intact pour *votre* propre travail. Les harnais modernes l'automatisent — [Copilot CLI en a fait une commande `/worktree`]({{ site.baseurl }}/fr/2026/07/24/copilot-cli-4-deleguer-et-automatiser/), et Claude Code sait lancer un sous-agent dans un worktree jetable, auto-nettoyé s'il n'a rien modifié. La mécanique que vous venez de disséquer, c'est *exactement* celle qui tourne sous ces commandes — et le modèle « [une branche par agent]({{ site.baseurl }}/fr/2026/08/09/une-branche-par-agent-git-a-l-ere-des-agents/) » en est le prolongement naturel.

## Le mot d'honnêteté

- Un worktree n'est pas gratuit : les objets sont partagés, mais le **plan de travail est bien réel sur le disque** — un `node_modules/` par établi, ça finit par peser. Sur un gros monorepo, comptez.
- Le vrai danger, ce sont les **worktrees zombis** : créés pour un chantier, oubliés trois semaines, ils divergent lentement et recréent la confusion qu'on voulait fuir. Hygiène non négociable : un établi par chantier, `remove` sitôt la branche fusionnée, `prune` de temps en temps.
- Ce n'est ni un remplacement des branches ni du clone : c'est l'outil d'un cas précis, le parallélisme local sur un même dépôt. Hors de ce cas, restez simple.

## En résumé

- Un worktree = **un plan de travail de plus** sur le **même magasin d'objets** — pas un clone, pas une duplication de l'historique.
- Sous le capot : `.git` devient un **fichier** pointeur ; chaque worktree a son **`HEAD` et son `index`**, mais **objets et branches sont partagés**.
- Trois pièges à graver : **une branche = un seul worktree**, le **stash est global**, et les **fichiers non versionnés ne suivent pas**.
- Supprimez avec `git worktree remove` + `prune`, jamais au `rm -rf` seul.
- Arbitrage : **stash** (court), **clone** (autre dépôt), **worktree** (parallélisme soutenu) — et un worktree par agent à l'ère de l'IA.

Le worktree, c'est l'outil qui transforme « j'attends la fin du build pour bosser » en « je bosse ailleurs pendant que ça build ». Une fois adopté, on ne revient pas — et on consigne, évidemment, le choix de workflow dans un [ADR]({{ site.baseurl }}/fr/2026/07/14/adr-memoire-decisions-architecture/). Et ça, franchement… c'est pas sorcier.
