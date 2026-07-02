---
layout: post
title: "GitHub Copilot : Skills, Instructions, Agents, MCP… c'est pas sorcier !"
date: 2026-07-02 10:00:00
author: AClerbois
lang: fr
ref: copilot-personnalisation
image: /images/posts/copilot-customization.png
tags: [github, copilot, AI, MCP, skills]
---

GitHub Copilot n'est plus le petit assistant qui complétait vos lignes de code. C'est devenu un véritable agent, capable de lire votre projet, lancer des commandes, appeler des outils externes et suivre vos règles. Le problème ? On peut désormais le personnaliser de **cinq façons différentes** — Instructions, Prompts, Skills, Agents, MCP — et tout le monde s'y perd.

Alors on va démonter la mécanique, pièce par pièce. Et pour chacune, on répondra à la question qui fâche : **à quel moment est-elle chargée, et qu'est-ce qui entre vraiment dans le contexte du modèle ?** Parce que c'est ça, le vrai secret. Et vous allez voir : c'est pas sorcier.

<!--more-->

## Le fil rouge : imaginez un nouvel assistant surdoué

Pour comprendre les cinq mécanismes, une seule image suffit : **Copilot, c'est un nouvel employé brillant mais amnésique.**

Il code très bien, il apprend vite… mais à chaque matin il a tout oublié : vos conventions, vos outils, la façon dont vous aimez travailler. Votre job, c'est de l'équiper pour qu'il soit efficace **sans que vous ayez à tout ré-expliquer à chaque fois**.

Chaque fonctionnalité de personnalisation répond à un moment de cet accueil :

- le **livret d'accueil** (Custom Instructions, et son cousin universel `AGENTS.md`),
- les **mémos prêts à l'emploi** (Prompts),
- les **fiches savoir-faire** rangées dans un classeur (Skills),
- les **casquettes de spécialiste** (Agents),
- et les **badges d'accès** vers vos outils maison (MCP).

Et pour chacune, on ajoutera un petit encadré ⚙️ qui dit **quand elle est chargée** et **ce que le modèle voit réellement**. Reprenons dans l'ordre.

## Avant de démonter : le frontmatter, l'étiquette sur la fiche

Un dernier outil avant d'ouvrir le capot, parce qu'il revient dans presque tous les exemples qui suivent : le **frontmatter**.

**L'analogie :** c'est l'**étiquette collée sur la fiche**. Elle ne fait pas partie de la procédure elle-même — elle dit *à qui* la fiche s'adresse, *quand* la sortir et *comment* la ranger. On peut trier tout le classeur rien qu'en lisant les étiquettes, sans jamais ouvrir les fiches.

**Concrètement :** c'est un petit bloc **YAML** placé tout en haut d'un fichier Markdown, délimité par deux lignes `---` :

```markdown
---
name: deploiement-azure
description: Déploie l'app sur Azure App Service.
---

Ici commence le contenu Markdown normal…
```

Tout ce qui est entre les deux `---`, ce sont des **métadonnées** sous forme de paires clé-valeur. Tout ce qui vient après, c'est le contenu proprement dit.

Et cette distinction n'est pas cosmétique — elle recoupe exactement notre question fétiche du « qui voit quoi » :

- le **frontmatter** est lu par le **harness** (VS Code, Copilot CLI…) *avant* tout appel au modèle : c'est lui qui décide si le fichier s'applique, quand le charger et avec quels réglages ;
- le **corps** est le texte destiné au **modèle**, chargé au moment prévu par le mécanisme.

Chaque mécanisme utilise ses propres clés, et vous les reconnaîtrez au fil de l'article :

| Clé | Vue dans… | Elle sert à… |
| --- | --- | --- |
| `applyTo` | `*.instructions.md` | Restreindre les règles aux fichiers qui matchent le motif glob |
| `mode` | `*.prompt.md` | Choisir le mode d'exécution du prompt (ex. `agent`) |
| `name` / `description` | `SKILL.md`, `*.agent.md` | Identifier la fiche — c'est la partie **toujours visible** du skill |
| `tools` | `*.agent.md` | Restreindre les outils exposés à l'agent |
| `model` | `*.agent.md` | Imposer le modèle à utiliser |

Deux cas particuliers à noter : `AGENTS.md` n'a **pas de frontmatter du tout** (c'est justement sa promesse — du Markdown brut compris par tous les agents), et dans un `SKILL.md`, le frontmatter joue un rôle de premier plan : `name` et `description` sont **la seule chose chargée en permanence** — c'est l'étiquette que le modèle lit pour décider d'ouvrir la fiche.

Voilà, vous avez la clé de lecture. Maintenant, démontons.

## 1. Custom Instructions — le livret d'accueil

**L'analogie :** c'est le règlement intérieur affiché au mur. Votre assistant le lit *à chaque tâche*, sans qu'on lui demande. « Ici, on écrit en C#, on teste avec xUnit, et on répond en français. »

**Concrètement :** un fichier Markdown à la racine du dépôt qui donne à Copilot le contexte permanent du projet — la stack, les conventions, les préférences.

Le fichier principal vit dans `.github/copilot-instructions.md` :

```markdown
# Contexte du projet

- API ASP.NET Core en C# (.NET 9).
- Utilise des `record` immuables pour les DTO.
- Écris les tests avec xUnit et FluentAssertions.
- Dans tes explications, réponds en français.
```

Besoin de règles **ciblées** sur certains fichiers ? On ajoute des fichiers `*.instructions.md` dans `.github/instructions/`, avec un en-tête `applyTo` qui utilise un motif glob :

```markdown
---
applyTo: "**/*.test.ts"
---
- Utilise Vitest et Testing Library.
- Un bloc `describe` par composant.
```

Si le fichier correspond, ces règles s'ajoutent à celles de tout le projet.

> ⚙️ **Chargé quand :** à **chaque** requête, automatiquement. Le fichier racine s'applique toujours ; un `*.instructions.md` ne s'ajoute que si son motif `applyTo` correspond aux fichiers en jeu.
>
> **Ce qui entre dans le contexte :** le **texte intégral** du fichier, injecté en tête de contexte comme une consigne système. Il est présent à *chaque* appel — d'où l'importance de le garder court et net.

**Quand l'utiliser :** **toujours, et en premier.** C'est le socle. Dès que vous vous surprenez à répéter « en C#, avec des records, en français… » à chaque conversation, c'est qu'il faut l'écrire une bonne fois ici.

### Le cousin universel : `AGENTS.md`

`.github/copilot-instructions.md` est propre à Copilot. Mais si vous jonglez entre plusieurs agents (Copilot, mais aussi Cursor, Codex, Jules…), il existe un fichier **standard et neutre** : `AGENTS.md`, à la racine du dépôt.

C'est un simple Markdown — un « README pour les agents » — où l'on met ce qui encombrerait le README humain : commandes de build, façon de lancer les tests, conventions maison, pièges à éviter. Pas d'en-tête, pas de syntaxe particulière : du Markdown, point.

```markdown
# AGENTS.md

## Build & tests
- Installer : `dotnet restore`
- Lancer les tests : `dotnet test`
- Ne jamais committer dans `main` directement.

## Conventions
- C# / .NET 9, DTO en `record` immuables.
```

Deux choses à retenir :

- **C'est un standard ouvert**, piloté par l'Agentic AI Foundation (sous la Linux Foundation) et adopté par OpenAI Codex, Cursor, Jules (Google), Amp, Factory… et lu par l'agent de codage GitHub Copilot.
- **Le plus proche gagne.** Vous pouvez poser un `AGENTS.md` à la racine *et* des `AGENTS.md` dans des sous-dossiers : l'agent lit le plus proche des fichiers sur lesquels il travaille. Chaque sous-projet peut ainsi avoir ses propres consignes.

> ⚙️ **Chargé quand :** automatiquement, comme les Custom Instructions. Celui de la racine s'applique toujours ; un `AGENTS.md` de sous-dossier prend le relais quand l'agent travaille dans ce dossier.
>
> **Ce qui entre dans le contexte :** le texte du `AGENTS.md` le plus proche, injecté comme consigne. Bonus : l'agent de codage Copilot sait aussi lire `.github/copilot-instructions.md`, `*.instructions.md`, ainsi que `CLAUDE.md` et `GEMINI.md` — vous n'êtes pas obligé de tout dupliquer.

**Instructions ou `AGENTS.md` ?** Même idée (le « livret d'accueil »), deux portées : `copilot-instructions.md` si vous êtes 100 % Copilot, `AGENTS.md` si vous voulez **un seul fichier compris par tous les agents**.

## 2. Prompts — les mémos prêts à l'emploi

**L'analogie :** le post-it « Voici comment tu prépares une fiche de release » collé sur le bureau. Un raccourci pour une tâche que vous redemandez souvent, mot pour mot.

**Concrètement :** un *prompt file*, fichier `.prompt.md` rangé dans `.github/prompts/`, que vous déclenchez comme une commande avec un slash.

```markdown
---
mode: agent
---
Prépare la description de la Pull Request à partir du diff courant :
un résumé en une phrase, la liste des changements, et les risques éventuels.
```

Enregistré sous `pr.prompt.md`, il s'appelle en tapant simplement `/pr` dans le chat. Fini le paragraphe d'instructions recopié à la main.

> ⚙️ **Chargé quand :** uniquement quand **vous** tapez `/mon-prompt`. Jamais tout seul.
>
> **Ce qui entre dans le contexte :** le corps du prompt est inséré à ce moment-là comme (partie de) votre message, avec les fichiers qu'il référence. Le reste du temps, il n'occupe **aucune** place dans le contexte.

**Le mot d'honnêteté :** vous avez peut-être entendu que les prompt files sont **« moins nécessaires » aujourd'hui**. C'est vrai — et c'est assumé. Les **Agents** (qui embarquent déjà un rôle et des consignes) et les **Skills** (qui se déclenchent tout seuls) couvrent une bonne partie des besoins. Le prompt file reste néanmoins l'option la plus **simple et rapide** pour transformer un paragraphe récurrent en une commande d'un mot. Un couteau qui coupe encore très bien, même s'il existe désormais des robots de cuisine.

**Quand l'utiliser :** pour un raccourci **simple et personnel**, sans script ni outil particulier. Si votre besoin devient un vrai savoir-faire multi-étapes, passez aux Skills.

## 3. Skills — les fiches savoir-faire dans le classeur

**L'analogie :** un classeur de fiches procédure. Votre assistant ne les lit pas toutes en permanence — il en lit juste le **titre**, et quand une tâche correspond, il sort la bonne fiche et suit la procédure (qui peut même contenir des scripts et des exemples).

**Concrètement :** une *Agent Skill* est un **dossier** contenant un fichier `SKILL.md` (plus, éventuellement, des scripts, gabarits ou exemples).

```
.github/skills/
└── deploiement-azure/
    ├── SKILL.md
    ├── deploy.sh
    └── exemples/
```

Le `SKILL.md` commence par un en-tête qui décrit *quand* l'utiliser :

```markdown
---
name: deploiement-azure
description: Déploie l'app sur Azure App Service et vérifie le health check.
---

1. Construire l'image avec `docker build ...`
2. Pousser vers le registre `az acr ...`
3. Déployer avec `az webapp up ...`
4. Vérifier `https://.../health` avant de confirmer.
```

> ⚙️ **Chargé quand :** en **divulgation progressive**, à l'initiative du modèle. Au départ, il ne « voit » que le `name` et la `description`. Il ne charge le corps du `SKILL.md` que si la tâche correspond (ou si vous l'invoquez), et n'ouvre les scripts que s'il en a besoin.
>
> **Ce qui entre dans le contexte :** au repos, **juste une ligne de description** par skill. Puis, à la demande, le corps de la fiche, puis les ressources. C'est exactement pour ça qu'on peut en avoir des dizaines sans saturer le contexte.

Autre avantage : les Skills suivent un **standard ouvert**. La même fiche fonctionne dans Copilot sous VS Code, dans Copilot CLI et dans l'agent cloud — et même avec d'autres agents compatibles.

**Quand l'utiliser :** pour un **savoir-faire réutilisable et multi-étapes**, surtout s'il embarque des scripts ou des ressources. « Comment on déploie », « comment on écrit un test d'intégration maison » : ce sont des skills.

## 4. Agents — les casquettes de spécialiste

**L'analogie :** au lieu d'un assistant généraliste, vous convoquez **le bon spécialiste** : le relecteur tatillon, l'architecte, le rédacteur de docs. Chacun a son caractère, ses outils autorisés et sa manière de travailler.

**Concrètement :** un *custom agent* est un fichier `*.agent.md` (dans `.github/agents/`) qui définit une **persona** : son rôle, ses consignes, les outils qu'il a le droit d'utiliser, et même le **modèle** à employer.

```markdown
---
name: relecteur
description: Relecteur de code senior, exigeant sur la sécurité et les tests.
tools: ['search', 'edit']
model: claude-sonnet-5
---
Tu es un relecteur senior. Concentre-toi sur :
les bugs, les failles de sécurité, les cas limites et les tests manquants.
Sois direct, propose des correctifs concrets, ne reformule pas le code qui va bien.
```

On bascule alors sur cet agent en un clic, plutôt que de ré-expliquer son rôle à chaque conversation. C'est aussi le principe de l'**agent de codage** (le *coding agent*) auquel vous pouvez carrément assigner une issue GitHub : il travaille en autonomie et ouvre une Pull Request.

> ⚙️ **Chargé quand :** quand vous **activez** l'agent (sélection dans l'interface, `@mention`, ou assignation d'une issue pour l'agent de codage).
>
> **Ce qui entre dans le contexte :** ses consignes deviennent la **consigne système** active ; sa liste `tools` **restreint** les outils exposés par le harness ; son `model` choisit le modèle. Un agent ne fait pas qu'ajouter du texte : il **reconfigure la session**.

**Quand l'utiliser :** quand vous voulez un **rôle spécialisé et récurrent**, avec ses propres outils et garde-fous. Si vous jonglez entre « casquette dev » et « casquette relecture », faites-en deux agents.

## 5. MCP — les badges d'accès vers le monde extérieur

**L'analogie :** jusqu'ici, votre assistant ne connaît que votre code. MCP, ce sont les **badges et les prises** qui le branchent sur le reste de votre écosystème : la base de données, Jira, votre monitoring, un navigateur, votre CRM…

**Concrètement :** le *Model Context Protocol* est un **standard ouvert** pour connecter un agent IA à des outils et des données externes. Vous déclarez les serveurs MCP dans un fichier `mcp.json` (dans `.vscode/mcp.json` pour un projet) :

```json
{
  "servers": {
    "github": {
      "type": "http",
      "url": "https://api.githubcopilot.com/mcp"
    },
    "playwright": {
      "command": "npx",
      "args": ["-y", "@microsoft/mcp-server-playwright"]
    }
  }
}
```

Une fois branché, Copilot peut lire vos issues GitHub, piloter un navigateur, interroger une base… selon les outils que le serveur expose.

> ⚙️ **Chargé quand :** dès qu'un serveur est **activé**, le harness charge la **description des outils** qu'il expose (nom, rôle, schéma d'entrée) — même si vous ne les appelez jamais. Les **résultats**, eux, n'arrivent que lorsqu'un outil est réellement appelé.
>
> **Ce qui entre dans le contexte :** les **définitions d'outils** (en permanence, tant que le serveur est actif) puis les **résultats d'appels** (à la demande). Conséquence très concrète : trop de serveurs MCP = un contexte encombré rien que par les schémas. D'où l'intérêt de **désactiver ceux qu'on n'utilise pas**.

**Attention au badge d'accès :** un serveur MCP, c'est du code tiers à qui vous donnez les clés. VS Code vous demande de **confirmer votre confiance** avant de le démarrer, et permet de mettre les serveurs locaux dans un bac à sable (accès fichiers/réseau restreint). Ne branchez que ce que vous connaissez — j'en parlais déjà dans mon article sur [la sécurisation des serveurs MCP]({{ site.baseurl }}/2025/02/24/Securing-MCP-Servers-Automated-Whitelist-Scanner/).

**Quand l'utiliser :** dès que Copilot a besoin de **données ou d'actions qui vivent en dehors de votre code**. Pour tout ce qui est purement « connaissances et conventions du projet », les Instructions et les Skills suffisent.

## Le tableau récap : quand utiliser quoi — et quand c'est chargé ?

| Élément | Ça sert à… | Où ça vit | Chargé dans le contexte | Quand l'utiliser |
| --- | --- | --- | --- | --- |
| **Custom Instructions** | Contexte et conventions permanents du projet | `.github/copilot-instructions.md`, `*.instructions.md` | **Toujours** — texte intégral, à chaque requête | Dès que vous répétez les mêmes règles |
| **`AGENTS.md`** | Les mêmes consignes, mais pour **tous** les agents | `AGENTS.md` (racine + sous-dossiers) | **Toujours** — le fichier le plus proche l'emporte | Vous utilisez plusieurs agents, pas que Copilot |
| **Prompts** | Rejouer un prompt récurrent en `/commande` | `*.prompt.md` dans `.github/prompts/` | **À l'invocation** manuelle uniquement | Un raccourci simple et personnel, sans script |
| **Skills** | Un savoir-faire multi-étapes (+ scripts) | Dossier `SKILL.md` dans `.github/skills/` | **À la demande** — nom + description, puis le reste | Une procédure réutilisable (« comment on déploie ») |
| **Agents** | Un rôle dédié, avec ses outils et son modèle | `*.agent.md` dans `.github/agents/` | **À l'activation** — devient la consigne système | Un profil récurrent (relecteur, architecte…) |
| **MCP** | Brancher Copilot sur des outils/données externes | `mcp.json` (ex. `.vscode/mcp.json`) | **Schémas** dès l'activation, **résultats** à l'appel | Besoin d'agir hors du code (BDD, Jira, navigateur…) |

## 🎁 L'astuce de départ : faites écrire le livret d'accueil… par l'assistant lui-même

Vous êtes convaincu par le `AGENTS.md`, mais la page blanche vous freine ? Bonne nouvelle : il existe un **skill dont le seul métier est de générer votre `AGENTS.md`**. Oui, vous avez bien lu — on utilise une fiche savoir-faire (mécanisme n° 3) pour fabriquer le livret d'accueil (mécanisme n° 1). C'est un peu de l'inception, et c'est surtout de l'**auto-apprentissage** : l'assistant explore votre dépôt et rédige lui-même le document qui lui servira de mémoire à chaque session.

Le skill s'appelle [`create-agentsmd`](https://www.skills.sh/github/awesome-copilot/create-agentsmd) et vient du dépôt officiel [awesome-copilot](https://github.com/github/awesome-copilot) de GitHub. Une commande suffit :

```bash
npx skills add https://github.com/github/awesome-copilot --skill create-agentsmd
```

Ensuite, demandez simplement à Copilot de « créer le AGENTS.md du projet » : le skill se déclenche, analyse votre dépôt (stack, commandes de build, façon de lancer les tests, conventions, structure — monorepos compris) et produit un `AGENTS.md` conforme au standard ouvert, prêt à être relu et committé.

Et c'est là que la boucle se referme : au prochain démarrage, votre employé amnésique **lira le livret qu'il a écrit lui-même la veille**. Relisez-le, corrigez ce qui manque, committez — et vous venez de faire le premier pas concret pour aider votre agent à garder son contexte d'une session à l'autre.

## La règle simple à retenir

Si vous ne deviez retenir qu'une chose : **commencez par les Instructions, ajoutez le reste seulement quand un besoin revient.**

- Vous répétez des **règles** ? → Instructions (ou `AGENTS.md` si plusieurs agents).
- Vous répétez un **prompt** ? → Prompt file.
- Vous répétez une **procédure** ? → Skill.
- Vous répétez un **rôle** ? → Agent.
- Vous répétez un **branchement** vers un outil externe ? → MCP.

Et si vous ne deviez en retenir *deux*, ajoutez le réflexe **contexte** : ce qui est « toujours chargé » (Instructions, `AGENTS.md`, schémas MCP) doit rester léger, car vous le payez à *chaque* requête ; ce qui est « à la demande » (Prompts, Skills, résultats d'outils) peut être plus riche, car il ne coûte que lorsqu'on s'en sert.

Vous voyez la logique ? À chaque fois que vous vous entendez dire « je l'ai déjà expliqué la semaine dernière… », c'est le signal qu'un de ces mécanismes attend d'être utilisé.

Et ça, mine de rien… c'est pas sorcier.
