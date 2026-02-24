---
layout: post
title:  "Sécuriser vos serveurs MCP : un scanner automatisé pour GitHub Actions"
date:   2025-02-24 10:00:00
author: AClerbois
tags: [MCP, security, AI, GitHub Actions, DevSecOps]
---

## Le Model Context Protocol : une révolution... et une surface d'attaque

Le [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) s'impose rapidement comme le standard ouvert permettant aux agents IA — GitHub Copilot, Claude, Cursor et bien d'autres — d'accéder à des outils, des bases de données et des API externes. Concrètement, un fichier `mcp.json` déclaré dans votre projet permet à votre IDE d'interagir avec des serveurs distants ou locaux qui exposent des capacités supplémentaires à l'IA.

<!-- more -->

C'est puissant. C'est aussi **dangereux** si ces serveurs ne sont pas audités.

## Les risques de sécurité liés aux serveurs MCP

La communauté sécurité a déjà identifié plusieurs vecteurs d'attaque spécifiques aux serveurs MCP :

### Prompt Injection

Un serveur MCP malveillant peut injecter du contenu dans les descriptions de ses outils afin de manipuler le comportement de l'agent IA. L'agent exécute alors des actions non souhaitées par l'utilisateur, en toute transparence.

- [Invariant Labs — MCP Security Notification: Tool Poisoning Attacks](https://invariantlabs.ai/blog/mcp-security-notification-tool-poisoning-attacks)
- [OWASP — Prompt Injection](https://owasp.org/www-project-top-10-for-large-language-model-applications/)

### Tool Poisoning

Un outil exposé par un serveur MCP peut être compromis : au lieu d'exécuter l'action attendue, il exécute du code malveillant — lecture de fichiers sensibles, exécution de commandes système, exfiltration de tokens.

- [Snyk — Securing AI Agents: Understanding MCP Tool Poisoning](https://snyk.io/blog/securing-ai-agents-understanding-mcp-tool-poisoning/)

### Toxic Flows (WhatsApp-style data exfiltration)

Lorsqu'un agent IA utilise plusieurs outils MCP en chaîne, un outil compromis peut transmettre les données collectées par un outil légitime vers un serveur malveillant. C'est le principe des *toxic tool-call flows*.

- [Trail of Bits — MCP Security Review](https://blog.trailofbits.com/2025/01/09/the-model-context-protocol-and-its-security-implications/)

### Rug Pull Attacks

Un serveur MCP peut modifier silencieusement le comportement de ses outils **après** que l'utilisateur les a approuvés. La description visible reste inchangée, mais le code exécuté est différent — un scénario particulièrement sournois.

- [Pillar Security — The Security Risks of Model Context Protocol](https://www.pillar.security/blog/the-security-risks-of-model-context-protocol-mcp)

## Le constat : personne n'audite les serveurs MCP

Lors d'une mission chez un client, nous avons constaté que les équipes de développement ajoutaient des serveurs MCP dans leurs configurations VS Code sans aucun processus de validation. Chaque développeur pouvait déclarer ses propres serveurs, sans visibilité pour l'équipe sécurité.

Les questions qui se sont posées :

- **Quels serveurs MCP sont utilisés** dans l'organisation ?
- **Sont-ils fiables ?** Un serveur HTTP tiers pourrait-il être compromis entre deux déploiements ?
- **Comment détecter un changement silencieux** dans les outils exposés par un serveur ?

## La solution : un scanner MCP automatisé dans GitHub Actions

Nous avons développé un workflow GitHub Actions qui :

1. **Détecte automatiquement** tous les fichiers `mcp.json` dans le repository
2. **Exécute [mcp-scan](https://github.com/snyk/agent-scan)** (outil open-source de Snyk) sur chaque configuration
3. **Analyse chaque outil, prompt et ressource** exposé par les serveurs MCP déclarés
4. **Génère un rapport de tests JUnit XML** affiché directement dans l'onglet *Checks* des Pull Requests
5. **Publie un résumé Markdown** dans le *Job Summary* de chaque exécution

### Architecture du pipeline

```
mcp.json → mcp-scan (analyse) → JSON → JUnit XML + Markdown → GitHub Actions (Test Report + Summary)
```

### Déclenchement automatique

| Événement | Condition |
|---|---|
| **Push** sur `main` | Modification d'un fichier `mcp.json` |
| **Pull Request** vers `main` | Idem |
| **Schedule hebdomadaire** | Chaque lundi à 08:00 UTC |
| **Manuel** | Via l'onglet Actions |

Le scan **hebdomadaire** est essentiel : il permet de détecter les *rug pull attacks*, c'est-à-dire les modifications silencieuses côté serveur qui surviennent entre deux commits.

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

### Lecture des résultats

Les résultats apparaissent directement dans l'interface GitHub :

- **Onglet Checks** de la PR : chaque serveur MCP est une *test suite*, chaque outil est un *test case*
  - ✅ **Passed** — aucun problème détecté
  - ❌ **Failed** — vulnérabilité détectée (prompt injection, tool poisoning, etc.)
  - ⚠️ **Error** — serveur injoignable ou timeout
- **Job Summary** : tableau récapitulatif par serveur avec le nombre d'outils analysés et les alertes

## Conversion des résultats : le script Python

Le coeur du système repose sur un script Python qui convertit la sortie JSON de `mcp-scan` en rapport JUnit XML exploitable par [dorny/test-reporter](https://github.com/dorny/test-reporter). Chaque outil exposé par un serveur MCP est évalué selon un **score de risque** :

- Les outils avec un score supérieur au seuil (0.5) sont marqués en **failed**
- Les serveurs injoignables sont marqués en **error**
- Les outils sains sont marqués en **passed**

Ce format JUnit permet d'exploiter l'écosystème existant : intégration native avec GitHub, Azure DevOps, Jenkins, etc.

## Proposition de valeur

| Bénéfice | Détail |
|---|---|
| **Visibilité** | Inventaire centralisé et versionné de tous les serveurs MCP autorisés |
| **Détection proactive** | Identification des vulnérabilités avant qu'elles n'impactent les développeurs |
| **Surveillance continue** | Détection des changements silencieux côté serveur (rug pull) |
| **Coût zéro** | mcp-scan est open-source, aucune licence requise |
| **Audit & compliance** | Rapports archivés (JUnit XML, JSON, Markdown) pour chaque run |

## Pour aller plus loin

### Ressources sur la sécurité MCP

- [Model Context Protocol — Specification officielle](https://modelcontextprotocol.io/)
- [Snyk agent-scan (mcp-scan) — GitHub](https://github.com/snyk/agent-scan)
- [Invariant Labs — MCP Security Notifications](https://invariantlabs.ai/blog/mcp-security-notification-tool-poisoning-attacks)
- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- [Trail of Bits — The Model Context Protocol and its Security Implications](https://blog.trailofbits.com/2025/01/09/the-model-context-protocol-and-its-security-implications/)
- [Pillar Security — The Security Risks of MCP](https://www.pillar.security/blog/the-security-risks-of-model-context-protocol-mcp)
- [Snyk — Securing AI Agents: Understanding MCP Tool Poisoning](https://snyk.io/blog/securing-ai-agents-understanding-mcp-tool-poisoning/)

### Actions GitHub utilisées

- [dorny/test-reporter](https://github.com/dorny/test-reporter) — Affichage de rapports de tests dans GitHub
- [astral-sh/setup-uv](https://github.com/astral-sh/setup-uv) — Installation de `uv` pour exécuter `mcp-scan`
- [actions/upload-artifact](https://github.com/actions/upload-artifact) — Archivage des résultats

## Conclusion

L'adoption massive du MCP dans les outils de développement assistés par IA crée une **nouvelle surface d'attaque** que la plupart des organisations n'ont pas encore adressée. Un serveur MCP compromis peut exfiltrer du code source, des secrets ou manipuler silencieusement le comportement d'un agent IA.

La mise en place d'un scanner automatisé, intégré dans la CI/CD, est une première étape essentielle pour **reprendre le contrôle** sur cette supply chain émergente. Le tout sans licence, sans infrastructure supplémentaire, et avec une intégration native dans GitHub Actions.

**N'attendez pas qu'un incident survienne pour auditer vos serveurs MCP.**
