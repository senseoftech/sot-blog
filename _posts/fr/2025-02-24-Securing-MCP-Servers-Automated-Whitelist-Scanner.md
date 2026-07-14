---
layout: post
title:  "Sécuriser vos serveurs MCP : un scanner automatisé pour GitHub Actions"
date:   2025-02-24 10:00:00
author: AClerbois
lang: fr
ref: mcp-scanner
image: /images/posts/mcp.png
tags: [MCP, security, AI, GitHub Actions, DevSecOps]
level: 300
---

## Le Model Context Protocol : une révolution... et une surface d'attaque

Le [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) s'impose rapidement comme le standard ouvert permettant aux agents IA — GitHub Copilot, Claude, Cursor et bien d'autres — d'accéder à des outils, bases de données et API externes. Concrètement, un fichier `mcp.json` déclaré dans votre projet permet à votre IDE d'interagir avec des serveurs distants ou locaux qui exposent des capacités supplémentaires à l'IA.

<!--more-->

C'est puissant. C'est aussi **dangereux** si ces serveurs ne sont pas audités.

## Les risques de sécurité liés aux serveurs MCP

La communauté de la sécurité a déjà identifié plusieurs vecteurs d'attaque propres aux serveurs MCP :

### Prompt injection

Un serveur MCP malveillant peut injecter du contenu dans les descriptions de ses outils pour manipuler le comportement de l'agent IA. L'agent effectue alors des actions non voulues par l'utilisateur, en toute transparence.

- [Invariant Labs — MCP Security Notification: Tool Poisoning Attacks](https://invariantlabs.ai/blog/mcp-security-notification-tool-poisoning-attacks)
- [OWASP — Prompt Injection](https://owasp.org/www-project-top-10-for-large-language-model-applications/)

### Tool poisoning

Un outil exposé par un serveur MCP peut être compromis : au lieu d'exécuter l'action attendue, il exécute du code malveillant — lecture de fichiers sensibles, exécution de commandes système, exfiltration de tokens.

- [Snyk — Securing AI Agents: Understanding MCP Tool Poisoning](https://snyk.io/blog/securing-ai-agents-understanding-mcp-tool-poisoning/)

### Toxic flows (exfiltration de données de type WhatsApp)

Lorsqu'un agent IA enchaîne plusieurs outils MCP, un outil compromis peut transmettre à un serveur malveillant les données collectées par un outil légitime. C'est le principe des *toxic tool-call flows*.

- [Trail of Bits — MCP Security Review](https://blog.trailofbits.com/2025/01/09/the-model-context-protocol-and-its-security-implications/)

### Rug pull attacks

Un serveur MCP peut modifier silencieusement le comportement de ses outils **après** que l'utilisateur les a approuvés. La description visible reste inchangée, mais le code exécuté est différent — un scénario particulièrement insidieux.

- [Pillar Security — The Security Risks of Model Context Protocol](https://www.pillar.security/blog/the-security-risks-of-model-context-protocol-mcp)

## La réalité : personne n'audite les serveurs MCP

Lors d'une mission chez un client, nous avons constaté que les équipes de développement ajoutaient des serveurs MCP à leurs configurations VS Code sans aucun processus de validation. Chaque développeur pouvait déclarer ses propres serveurs, avec une visibilité nulle pour l'équipe de sécurité.

Les questions qui se posaient :

- **Quels serveurs MCP sont utilisés** dans l'organisation ?
- **Sont-ils dignes de confiance ?** Un serveur HTTP tiers pourrait-il être compromis entre deux déploiements ?
- **Comment détecter les changements silencieux** dans les outils exposés par un serveur ?

## La solution : un scanner MCP automatisé dans GitHub Actions

Nous avons développé un workflow GitHub Actions qui :

1. **Découvre automatiquement** tous les fichiers `mcp.json` du dépôt
2. **Exécute [mcp-scan](https://github.com/snyk/agent-scan)** (l'outil open-source de Snyk) sur chaque configuration
3. **Analyse chaque outil, prompt et ressource** exposé par les serveurs MCP déclarés
4. **Génère un rapport de test JUnit XML** affiché directement dans l'onglet *Checks* de la Pull Request
5. **Publie un résumé Markdown** dans le *Job Summary* de chaque exécution

### Architecture du pipeline

```
mcp.json → mcp-scan (analysis) → JSON → JUnit XML + Markdown → GitHub Actions (Test Report + Summary)
```

### Déclencheurs automatiques

| Événement | Condition |
|---|---|
| **Push** vers `main` | Modification d'un fichier `mcp.json` |
| **Pull Request** vers `main` | Idem |
| **Planification hebdomadaire** | Chaque lundi à 08:00 UTC |
| **Manuel** | Via l'onglet Actions |

Le **scan hebdomadaire** est essentiel : il détecte les *rug pull attacks*, c'est-à-dire les modifications silencieuses côté serveur qui surviennent entre deux commits.

### Exemple de workflow GitHub Actions

```yaml
name: MCP Security Scan

on:
  push:
    branches: [main]
    paths:
      - '**/*mcp*.json'
  pull_request:
    branches: [main]
    paths:
      - '**/*mcp*.json'
  schedule:
    - cron: '0 8 * * 1'
  workflow_dispatch:

permissions:
  contents: read
  checks: write
  pull-requests: write

jobs:
  mcp-scan:
    name: Scan MCP Configurations
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install uv
        uses: astral-sh/setup-uv@v4

      - name: Run mcp-scan
        run: |
          MCP_FILES=$(find . -name "mcp.json" -o -name "mcp*.json" \
            | grep -v node_modules | grep -v .git/)
          uvx mcp-scan@latest --json --server-timeout 30 $MCP_FILES \
            > mcp-scan-results.json 2>mcp-scan-stderr.log || true

      - name: Convert results to JUnit XML
        run: |
          python .github/scripts/mcp-scan-to-junit.py \
            mcp-scan-results.json \
            mcp-scan-results.xml \
            mcp-scan-summary.md
          cat mcp-scan-summary.md >> "$GITHUB_STEP_SUMMARY"

      - name: Publish Test Report
        uses: dorny/test-reporter@v1
        if: always()
        with:
          name: MCP Security Scan Results
          path: mcp-scan-results.xml
          reporter: java-junit
          fail-on-error: false
```

### Lire les résultats

Les résultats apparaissent directement dans l'interface GitHub :

- **Onglet Checks** sur la PR : chaque serveur MCP est une *test suite*, chaque outil est un *test case*
  - ✅ **Passed** — aucun problème détecté
  - ❌ **Failed** — vulnérabilité détectée (prompt injection, tool poisoning, etc.)
  - ⚠️ **Error** — serveur injoignable ou timeout
- **Job Summary** : tableau récapitulatif par serveur avec le nombre d'outils analysés et les alertes

## Conversion des résultats : le script Python

Le cœur du système repose sur un script Python qui convertit la sortie JSON de `mcp-scan` en un rapport JUnit XML exploitable par [dorny/test-reporter](https://github.com/dorny/test-reporter). Chaque outil exposé par un serveur MCP est évalué selon un **score de risque** :

- Les outils dont le score dépasse le seuil (0,5) sont marqués comme **failed**
- Les serveurs injoignables sont marqués comme **error**
- Les outils sains sont marqués comme **passed**

Ce format JUnit tire parti de l'écosystème existant : intégration native avec GitHub, Azure DevOps, Jenkins, etc.

## Proposition de valeur

| Bénéfice | Détail |
|---|---|
| **Visibilité** | Inventaire centralisé et versionné de tous les serveurs MCP autorisés |
| **Détection proactive** | Identifier les vulnérabilités avant qu'elles n'impactent les développeurs |
| **Surveillance continue** | Détecter les changements silencieux côté serveur (rug pulls) |
| **Coût nul** | mcp-scan est open-source, aucune licence requise |
| **Audit & conformité** | Rapports archivés (JUnit XML, JSON, Markdown) pour chaque exécution |

## Aller plus loin

### Ressources sur la sécurité MCP

- [Model Context Protocol — Spécification officielle](https://modelcontextprotocol.io/)
- [Snyk agent-scan (mcp-scan) — GitHub](https://github.com/snyk/agent-scan)
- [Invariant Labs — MCP Security Notifications](https://invariantlabs.ai/blog/mcp-security-notification-tool-poisoning-attacks)
- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- [Trail of Bits — The Model Context Protocol and its Security Implications](https://blog.trailofbits.com/2025/01/09/the-model-context-protocol-and-its-security-implications/)
- [Pillar Security — The Security Risks of MCP](https://www.pillar.security/blog/the-security-risks-of-model-context-protocol-mcp)
- [Snyk — Securing AI Agents: Understanding MCP Tool Poisoning](https://snyk.io/blog/securing-ai-agents-understanding-mcp-tool-poisoning/)

### GitHub Actions utilisées

- [dorny/test-reporter](https://github.com/dorny/test-reporter) — Afficher les rapports de test dans GitHub
- [astral-sh/setup-uv](https://github.com/astral-sh/setup-uv) — Installer `uv` pour exécuter `mcp-scan`
- [actions/upload-artifact](https://github.com/actions/upload-artifact) — Archiver les résultats

## Conclusion

L'adoption massive de MCP dans les outils de développement assistés par IA crée une **nouvelle surface d'attaque** que la plupart des organisations n'ont pas encore prise en compte. Un serveur MCP compromis peut exfiltrer du code source, des secrets, ou manipuler silencieusement le comportement d'un agent IA.

Mettre en place un scanner automatisé, intégré à votre pipeline CI/CD, est une première étape essentielle pour **reprendre le contrôle** de cette supply chain émergente. Le tout à coût nul, sans infrastructure supplémentaire, et avec une intégration native à GitHub Actions.

**N'attendez pas un incident pour auditer vos serveurs MCP.**
