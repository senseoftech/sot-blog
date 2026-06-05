---
layout: post
title:  "Affranchir GitHub Copilot CLI des tokens : brancher un modèle local avec Microsoft Foundry Local"
date:   2026-06-05 10:00:00
categories: certificate
author: AClerbois
github_repo_username: aclerbois
github_repo : aclerbois
comments: true
image: /images/posts/trust.jpg
tags: [github, copilot, tokens, cli]
---

# Affranchir GitHub Copilot CLI des tokens : brancher un modèle local avec Microsoft Foundry Local

GitHub Copilot CLI est un excellent agent de développement en ligne de commande, mais par défaut chaque requête consomme vos jetons (« premium requests ») GitHub Copilot. Depuis avril 2026, GitHub a découplé l'agent du routeur de modèles : Copilot CLI peut désormais pointer vers **n'importe quel endpoint compatible avec l'API OpenAI Chat Completions**, y compris un modèle qui tourne entièrement sur votre machine.

C'est exactement ce que permet **Microsoft Foundry Local** : un runtime local, gratuit, sans abonnement Azure, qui expose une API compatible OpenAI. En les combinant, vous obtenez un agent terminal qui ne dépend plus de vos quotas Copilot, garde votre code sur votre machine, et peut même fonctionner hors ligne.

Voici comment mettre tout cela en place.
<!--more-->

## Pourquoi faire ça

Quelques bonnes raisons de brancher un modèle local :

- **Indépendance des quotas.** Plus de consommation de premium requests pour les tâches courantes (explications, refactos simples, lecture de logs, génération de tests).
- **Confidentialité.** Avec un modèle local et le mode hors ligne, vos prompts et votre contexte de code ne quittent pas la machine.
- **Coût.** Aucune facturation à l'usage pour l'inférence locale.
- **Workflows isolés / air-gapped.** Utile dans les environnements sans accès Internet une fois les modèles téléchargés.

À garder en tête : un modèle local de quelques milliards de paramètres reste nettement moins performant qu'un modèle frontière hébergé dans le cloud. L'approche idéale est souvent hybride — local pour le quotidien, cloud pour les tâches lourdes.

## Comment ça marche

Le montage repose sur deux briques :

1. **Foundry Local** lance un service d'inférence local qui expose un endpoint compatible OpenAI (du type `http://localhost:5273/v1`).
2. **Copilot CLI** est configuré via quelques variables d'environnement (mode *BYOK*, « Bring Your Own Key ») pour envoyer ses requêtes vers cet endpoint au lieu des serveurs GitHub.

Copilot CLI redirige alors tout le trafic modèle vers votre machine.

## Le point critique à connaître avant de commencer

Copilot CLI impose deux exigences sur le modèle :

- Il **doit supporter le *tool calling*** (appel de fonctions). C'est indispensable : l'agent a besoin d'invoquer des outils (lire/écrire des fichiers, lancer des commandes). Un modèle sans tool calling renvoie une erreur, et Copilot CLI **ne bascule jamais silencieusement** sur un modèle GitHub : il affiche un message d'erreur.
- Il doit supporter le **streaming**.
- Pour de bons résultats, GitHub recommande une **fenêtre de contexte d'au moins 128k tokens**.

Côté Foundry Local, **tous les modèles ne supportent pas le tool calling**. C'est la cause d'échec n°1 de ce montage. Nous verrons comment vérifier qu'un modèle est compatible avant de le brancher.

## Prérequis

- **GitHub Copilot CLI installé** (commande `copilot` disponible dans le terminal).
- **Windows** (avec `winget`) ou **macOS** (avec Homebrew). Foundry Local est principalement orienté Windows ; sous Linux/WSL2, il faut parfois appeler le service depuis une machine hôte supportée.
- Un accès Internet pour le premier téléchargement des modèles et des moteurs d'exécution (ensuite, l'usage peut être hors ligne).
- Des droits administrateur pour l'installation.

## Étape 1 — Installer Foundry Local

**Windows** (PowerShell en administrateur) :

```powershell
winget install Microsoft.FoundryLocal
```

**macOS** (Homebrew) :

```bash
brew tap microsoft/foundrylocal
brew install foundrylocal
```

Vous pouvez aussi récupérer l'installeur sur la page *releases* du dépôt GitHub `microsoft/foundry-local`.

Vérifiez ensuite l'installation :

```bash
foundry --version
```

Si vous obtenez une erreur de connexion au service du type *« Request to local service failed »*, relancez le service :

```bash
foundry service restart
```

## Étape 2 — Choisir un modèle qui supporte le tool calling

C'est l'étape la plus importante. Listez les modèles disponibles :

```bash
foundry model list
```

Dans la sortie, regardez la colonne **Task** : la valeur **`tools`** indique que le modèle supporte le tool calling. Choisissez impérativement un modèle marqué `tools` — sinon Copilot CLI échouera.

Vous remarquerez aussi que chaque modèle existe en plusieurs **variantes optimisées** selon le matériel (CPU générique, GPU générique, CUDA, TensorRT/RTX, NPU). Foundry Local sélectionne automatiquement la meilleure variante pour votre machine, mais vous pouvez forcer une variante précise via son ID.

Lancez le modèle choisi (exemple générique — remplacez par un modèle `tools` de votre liste, idéalement un modèle de code récent comme un Qwen Coder ou un Phi avec support des outils) :

```bash
foundry model run <NOM-DU-MODELE>
```

Cette commande télécharge le modèle au premier usage (cela peut prendre plusieurs minutes), démarre le service, puis ouvre une session de chat interactive. Le téléchargement n'a lieu qu'une fois : ensuite le modèle est mis en cache.

Vous pouvez quitter la session de chat — le service, lui, reste actif pour servir Copilot CLI.

> Astuce : pour forcer l'exécution sur CPU quel que soit votre matériel, utilisez l'ID complet de la variante CPU, par exemple `foundry model run qwen2.5-0.5b-instruct-generic-cpu`.

## Étape 3 — Récupérer l'endpoint local

Demandez l'état du service pour connaître l'URL et le **port** (alloués dynamiquement, par défaut `5273`) :

```bash
foundry service status
```

L'endpoint compatible OpenAI suit le format :

```
http://localhost:<PORT>/v1
```

avec les complétions de chat sur `http://localhost:<PORT>/v1/chat/completions`. Notez le port affiché : vous en aurez besoin à l'étape suivante.

Vous pouvez vérifier que le service répond :

```bash
curl http://localhost:<PORT>/openai/status
```

Il vous faut aussi l'**identifiant exact du modèle** (le *model ID*, pas seulement l'alias). Vous le trouvez dans la sortie de `foundry model list`.

> Besoin de changer le port (conflit avec un autre service) ? `foundry service set --port 8081`.

## Étape 4 — Configurer Copilot CLI vers Foundry Local

Copilot CLI se configure par variables d'environnement, à définir **avant** de lancer la commande `copilot`. Comme Foundry Local expose une API compatible OpenAI, on utilise le type de provider `openai` (qui est la valeur par défaut).

Les variables disponibles :

| Variable | Requise | Rôle |
| --- | --- | --- |
| `COPILOT_PROVIDER_BASE_URL` | Oui | URL de base de votre endpoint |
| `COPILOT_MODEL` | Oui | Identifiant du modèle (le *model ID*) |
| `COPILOT_PROVIDER_TYPE` | Non | `openai` (défaut), `azure` ou `anthropic` |
| `COPILOT_PROVIDER_API_KEY` | Non | Inutile pour un service local sans authentification |

**macOS / Linux (bash)** — adaptez le port et le nom du modèle :

```bash
export COPILOT_PROVIDER_BASE_URL=http://localhost:5273/v1
export COPILOT_MODEL=<MODEL-ID>
copilot
```

**Windows (PowerShell)** :

```powershell
$env:COPILOT_PROVIDER_BASE_URL = "http://localhost:5273/v1"
$env:COPILOT_MODEL = "<MODEL-ID>"
copilot
```

Une fois Copilot CLI lancé, l'agent envoie ses requêtes à votre modèle local. Aucune clé API n'est nécessaire, et l'authentification GitHub n'est pas obligatoire en mode BYOK.

> Mémo intégré : `copilot help providers` affiche un rappel rapide de la configuration directement dans le terminal.

Petit conseil : pour ne pas retaper ces variables à chaque session, ajoutez-les à votre profil shell (`~/.bashrc`, `~/.zshrc`) ou à vos variables d'environnement Windows.

## Étape 5 (optionnelle) — Mode hors ligne complet

Pour empêcher Copilot CLI de contacter les serveurs GitHub, activez le mode hors ligne :

```bash
export COPILOT_OFFLINE=true
```

(en PowerShell : `$env:COPILOT_OFFLINE = "true"`)

En mode hors ligne, toute la télémétrie est désactivée et le CLI ne communique qu'avec votre provider configuré. Combiné à un modèle local, cela donne un workflow entièrement isolé.

Deux nuances importantes :

- L'isolation réseau n'est totale que si votre provider est lui aussi **local**. Si `COPILOT_PROVIDER_BASE_URL` pointe vers un endpoint distant, vos prompts y sont quand même envoyés.
- Le mode hors ligne vous prive des fonctionnalités qui dépendent de GitHub (par exemple `/delegate`, la recherche de code GitHub, etc.). Si vous voulez garder ces fonctions tout en utilisant votre modèle local, restez connecté à GitHub et **ne définissez pas** `COPILOT_OFFLINE` : vous gardez alors le meilleur des deux mondes — votre modèle pour les réponses, et les fonctionnalités GitHub par-dessus.

## Pièges et limites à connaître

- **Tool calling obligatoire.** Si Copilot CLI renvoie une erreur de type *Invalid JSON* ou refuse de démarrer, le modèle ne supporte probablement pas le tool calling. Revenez à `foundry model list` et choisissez un modèle marqué `tools`.
- **Fenêtre de contexte.** Beaucoup de petits modèles locaux ont un contexte inférieur aux 128k recommandés. Sur de gros fichiers ou de longues sessions, la qualité chute. Ajustez vos limites de contexte/sortie en conséquence et privilégiez des prompts ciblés.
- **Matériel.** Les performances dépendent fortement de votre matériel. Un GPU change radicalement l'expérience par rapport au CPU seul. Les variantes quantifiées (par ex. INT8) aident sur les machines modestes.
- **TTL des modèles.** Par défaut, Foundry Local décharge un modèle de la mémoire après ~10 minutes sans requête. La première requête après cette inactivité sera plus lente, le temps de recharger.
- **Statut *preview*.** Foundry Local est en préversion : certaines commandes ou comportements peuvent évoluer. Le chemin BYOK de Copilot CLI est également récent et en évolution.
- **Pensez à l'écosystème autour du modèle.** Un modèle local seul reste limité. Ce qui le transforme en véritable outil de dev, ce sont les couches autour : instructions personnalisées (ce qu'est votre projet, ce qu'il ne faut pas toucher), *skills* (workflows structurés) et serveurs MCP (tests, linters, recherche sémantique). Le modèle n'a pas besoin d'être brillant en tout si l'outillage le guide.

## Récapitulatif express

```bash
# 1. Installer (Windows)
winget install Microsoft.FoundryLocal

# 2. Lister et choisir un modèle "tools", puis le lancer
foundry model list
foundry model run <MODEL-ID>

# 3. Récupérer le port de l'endpoint
foundry service status

# 4. Pointer Copilot CLI vers le modèle local
export COPILOT_PROVIDER_BASE_URL=http://localhost:5273/v1
export COPILOT_MODEL=<MODEL-ID>
# (optionnel) export COPILOT_OFFLINE=true
copilot
```

Et voilà : Copilot CLI tourne désormais sur votre propre modèle, sans toucher à vos quotas GitHub. Commencez petit avec un modèle léger pour valider le workflow, puis montez en gamme selon votre matériel et vos besoins.

---

*Références : documentation GitHub « Using your own LLM models in GitHub Copilot CLI » et documentation Microsoft Learn « Get started with Foundry Local » / « Use tool calling with Foundry Local ». Vérifiez ces sources pour les dernières évolutions, ces deux produits étant en évolution rapide.*
