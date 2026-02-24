---
layout: post
title:  "Fluent UI Blazor MCP Server : un assistant IA pour accompagner votre migration vers la V5"
date:   2026-02-23 10:00:00
author: AClerbois
tags: [Blazor, Fluent UI, MCP, AI, .NET, Copilot]
---

## Le défi de la migration vers Fluent UI Blazor V5

La [version 5 de Microsoft Fluent UI Blazor](https://www.fluentui-blazor.net/) apporte son lot de nouveautés, de breaking changes et de refactoring. Avec plus de **142 composants** disponibles, parcourir la documentation pour trouver le bon paramètre, comprendre un enum ou adapter son code existant peut vite devenir chronophage.

<!-- more -->

Et si votre assistant IA — GitHub Copilot, Claude, Cursor — pouvait accéder **directement** à la documentation complète de chaque composant, y compris les guides de migration ?

C'est exactement ce que propose le **Fluent UI Blazor MCP Server**.

## Qu'est-ce qu'un serveur MCP ?

Le [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) est un standard ouvert qui permet aux agents IA d'accéder à des sources de données externes — outils, API, documentation — via un protocole unifié. Concrètement, un serveur MCP expose des **tools** (invoqués automatiquement par l'IA) et des **resources** (attachées manuellement à une conversation) que votre IDE peut exploiter.

Au lieu de copier-coller de la documentation dans votre prompt, le serveur MCP la rend **nativement accessible** à l'IA.

## Le Fluent UI Blazor MCP Server

J'ai contribué à la création de ce serveur MCP, désormais disponible en tant que [package NuGet officiel](https://www.nuget.org/packages/Microsoft.FluentUI.AspNetCore.McpServer). Il fournit à votre assistant IA un accès complet à la documentation Fluent UI Blazor V5 :

### Tools disponibles (invoqués automatiquement par l'IA)

| Tool | Description |
|---|---|
| `ListComponents` | Liste tous les composants disponibles, avec filtrage par catégorie |
| `GetComponentDetails` | Documentation complète d'un composant (paramètres, événements, méthodes) |
| `SearchComponents` | Recherche de composants par nom ou description |
| `GetEnumValues` | Exploration des types enum et de leurs valeurs |
| `GetComponentEnums` | Liste des enums utilisés par un composant donné |
| `ListDocumentationTopics` | Liste de tous les sujets de documentation |
| `GetDocumentationTopic` | Documentation détaillée sur un sujet (installation, localisation, styles…) |
| `SearchDocumentation` | Recherche dans la documentation par mot-clé |
| `GetMigrationGuide` | **Guide de migration complet vers la V5** |

### Resources disponibles (attachées par l'utilisateur)

| URI | Description |
|---|---|
| `fluentui://components` | Liste complète de tous les composants par catégorie |
| `fluentui://categories` | Liste des catégories avec le nombre de composants |
| `fluentui://enums` | Liste complète des types enum avec leurs valeurs |
| `fluentui://component/{name}` | Documentation détaillée d'un composant spécifique |
| `fluentui://category/{name}` | Composants d'une catégorie donnée |
| `fluentui://enum/{name}` | Détails d'un type enum |
| `fluentui://documentation` | Liste de tous les sujets de documentation |
| `fluentui://documentation/{topic}` | Documentation d'un sujet spécifique |
| `fluentui://documentation/migration` | Guide de migration vers la V5 |

## Installation

### Option 1 : Outil .NET global (recommandé)

Installez le serveur MCP en tant qu'outil global :

```bash
dotnet tool install -g Microsoft.FluentUI.AspNetCore.McpServer
```

Puis configurez votre fichier `.vscode/mcp.json` :

```json
{
    "servers": {
        "fluent-ui-blazor": {
            "command": "fluentui-mcp"
        }
    }
}
```

### Option 2 : Utiliser `dnx` (sans installation)

Si vous utilisez .NET 10+, vous pouvez utiliser le script [`dnx`](https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-10/sdk#the-new-dnx-tool-execution-script) pour exécuter le serveur à la volée :

```json
{
    "servers": {
        "fluent-ui-blazor": {
            "type": "stdio",
            "command": "dnx",
            "args": [
                "Microsoft.FluentUI.AspNetCore.McpServer",
                "--yes"
            ]
        }
    }
}
```

Cette méthode télécharge automatiquement la dernière version depuis NuGet.org. Vous pouvez aussi épingler une version :

```bash
dnx Microsoft.FluentUI.AspNetCore.McpServer@5.0.1
```

### Option 3 : Build from source

Pour contribuer ou personnaliser le serveur :

```bash
cd src/Tools/McpServer
dotnet build
```

```json
{
    "servers": {
        "fluent-ui-blazor": {
            "type": "stdio",
            "command": "dotnet",
            "args": [
                "run",
                "--project",
                "src/Tools/McpServer/Microsoft.FluentUI.AspNetCore.McpServer.csproj"
            ],
            "env": {
                "DOTNET_ENVIRONMENT": "Development"
            }
        }
    }
}
```

## Exemples d'utilisation concrets

Une fois le serveur MCP configuré, votre assistant IA peut répondre à des questions comme :

**"Quels sont les composants de type Button disponibles ?"**
→ L'IA invoque automatiquement `ListComponents(category: "Button")` et vous retourne la liste complète.

**"Comment utiliser FluentDataGrid avec du tri et de la pagination ?"**
→ L'IA appelle `GetComponentDetails(componentName: "FluentDataGrid")` et obtient tous les paramètres, événements et méthodes documentés.

**"Quel enum dois-je utiliser pour l'apparence d'un bouton ?"**
→ `GetEnumValues(enumName: "Appearance")` retourne toutes les valeurs possibles.

**"Comment migrer mon code de la V4 vers la V5 ?"**
→ `GetMigrationGuide()` fournit le guide de migration complet directement dans le contexte de l'IA.

## Architecture : sécurité et performance

Le serveur MCP a été conçu avec des principes de sécurité stricts :

| Caractéristique | Détail |
|---|---|
| **Lecture seule** | Aucune modification du système de fichiers |
| **Aucun accès réseau** | Fonctionne entièrement hors-ligne |
| **Documentation pré-générée** | Pas d'exécution de code au runtime |
| **Exécution sandboxée** | Tourne en processus fils de votre IDE |
| **Aucune donnée sensible** | Sert uniquement de la documentation publique |
| **Open source** | Code entièrement auditable sur [GitHub](https://github.com/microsoft/fluentui-blazor) |

L'architecture repose sur un JSON de documentation **pré-généré au build** à partir des XML docs du projet, puis embarqué comme ressource dans le package. Cela garantit un démarrage rapide et une documentation toujours cohérente avec la version du package.

```
┌─────────────────────────────────────────────────┐
│ FluentUI.Demo.DocApiGen (Build Time)            │
│ ├── Utilise LoxSmoke.DocXml                     │
│ └── Génère FluentUIComponentsDocumentation.json │
└─────────────────────────────────────────────────┘
                    │
                    ▼ (PreBuild / EmbeddedResource)
┌─────────────────────────────────────────────────┐
│ McpServer (Runtime)                             │
│ └── Lit le JSON depuis la ressource embarquée   │
└─────────────────────────────────────────────────┘
```

## Compatible Visual Studio Code ET Visual Studio 2026

Le serveur MCP fonctionne avec :

- **Visual Studio Code** via `.vscode/mcp.json`
- **Visual Studio 2026** via `.mcp.json` à la racine de la solution
- **Tout client MCP compatible** (MCP Inspector, Claude Desktop, etc.)

## Pourquoi c'est un game-changer pour la V5

La migration vers une nouvelle version majeure d'une bibliothèque de composants est toujours un moment délicat. Avec le serveur MCP Fluent UI Blazor :

1. **Plus besoin de chercher dans la doc** — L'IA a accès à toute la documentation nativement
2. **Guide de migration intégré** — `GetMigrationGuide()` donne les breaking changes et les étapes de migration
3. **Découverte de composants** — Vous ne connaissez pas encore tous les 142+ composants ? L'IA peut vous les présenter par catégorie
4. **Prototypage accéléré** — Demandez à l'IA de générer un `FluentDataGrid` avec pagination, elle connaît tous les paramètres

## Liens utiles

- [Package NuGet — Microsoft.FluentUI.AspNetCore.McpServer](https://www.nuget.org/packages/Microsoft.FluentUI.AspNetCore.McpServer)
- [Repository GitHub — microsoft/fluentui-blazor](https://github.com/microsoft/fluentui-blazor)
- [Site de démonstration Fluent UI Blazor](https://www.fluentui-blazor.net/)
- [What's New — Fluent UI Blazor](https://www.fluentui-blazor.net/whatsnew)
- [Model Context Protocol — Spécification](https://modelcontextprotocol.io/)
- [Documentation dnx (.NET 10)](https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-10/sdk#the-new-dnx-tool-execution-script)

## Conclusion

Le Fluent UI Blazor MCP Server transforme votre assistant IA en **expert Fluent UI Blazor**. Plus besoin de jongler entre votre IDE et la documentation : tout est accessible directement dans votre conversation avec l'IA.

Si vous commencez votre migration vers la V5 ou si vous démarrez un nouveau projet Blazor avec Fluent UI, installez le serveur MCP — votre productivité vous remerciera.

```bash
dotnet tool install -g Microsoft.FluentUI.AspNetCore.McpServer
```

**Happy coding!**
