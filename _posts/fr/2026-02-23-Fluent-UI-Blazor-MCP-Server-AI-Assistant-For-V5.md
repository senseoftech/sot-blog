---
layout: post
title:  "Fluent UI Blazor MCP Server : un assistant IA pour accompagner votre migration vers la V5"
date:   2026-02-23 10:00:00
author: AClerbois
lang: fr
ref: fluentui-mcp
image: /images/posts/mcp.png
tags: [Blazor, Fluent UI, MCP, AI, .NET, Copilot]
level: 300
---

## Le défi de la migration vers Fluent UI Blazor V5

[Microsoft Fluent UI Blazor version 5](https://www.fluentui-blazor.net/) apporte une multitude de nouvelles fonctionnalités, de breaking changes et de refactorisations. Avec plus de **142 composants** disponibles, parcourir la documentation pour trouver le bon paramètre, comprendre une enum ou adapter votre code existant peut vite devenir chronophage.

<!--more-->

Et si votre assistant IA — GitHub Copilot, Claude, Cursor — pouvait accéder **directement** à la documentation complète de chaque composant, y compris aux guides de migration ?

C'est exactement ce que propose le **Fluent UI Blazor MCP Server**.

## Qu'est-ce qu'un serveur MCP ?

Le [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) est un standard ouvert qui permet aux agents IA d'accéder à des sources de données externes — outils, API, documentation — via un protocole unifié. Concrètement, un serveur MCP expose des **tools** (invoqués automatiquement par l'IA) et des **resources** (attachées manuellement à une conversation) que votre IDE peut exploiter.

Au lieu de copier-coller la documentation dans votre prompt, le serveur MCP la rend **nativement accessible** à l'IA.

## Le Fluent UI Blazor MCP Server

J'ai contribué à la création de ce serveur MCP, désormais disponible sous forme de [package NuGet officiel](https://www.nuget.org/packages/Microsoft.FluentUI.AspNetCore.McpServer). Il donne à votre assistant IA un accès complet à la documentation de Fluent UI Blazor V5 :

### Tools disponibles (invoqués automatiquement par l'IA)

| Tool | Description |
|---|---|
| `ListComponents` | Liste tous les composants disponibles, avec filtrage optionnel par catégorie |
| `GetComponentDetails` | Documentation complète d'un composant (paramètres, événements, méthodes) |
| `SearchComponents` | Recherche de composants par nom ou description |
| `GetEnumValues` | Explore les types enum et leurs valeurs |
| `GetComponentEnums` | Liste les enums utilisées par un composant donné |
| `ListDocumentationTopics` | Liste tous les sujets de documentation |
| `GetDocumentationTopic` | Documentation détaillée sur un sujet (installation, localisation, styles...) |
| `SearchDocumentation` | Recherche dans la documentation par mot-clé |
| `GetMigrationGuide` | **Guide de migration complet vers la V5** |

### Resources disponibles (attachées par l'utilisateur)

| URI | Description |
|---|---|
| `fluentui://components` | Liste complète de tous les composants par catégorie |
| `fluentui://categories` | Liste des catégories avec le nombre de composants |
| `fluentui://enums` | Liste complète de tous les types enum avec leurs valeurs |
| `fluentui://component/{name}` | Documentation détaillée d'un composant spécifique |
| `fluentui://category/{name}` | Composants d'une catégorie donnée |
| `fluentui://enum/{name}` | Détails d'un type enum |
| `fluentui://documentation` | Liste de tous les sujets de documentation |
| `fluentui://documentation/{topic}` | Documentation d'un sujet spécifique |
| `fluentui://documentation/migration` | Guide de migration vers la V5 |

## Installation

### Option 1 : outil global .NET (recommandé)

Installez le serveur MCP en tant qu'outil global :

```bash
dotnet tool install -g Microsoft.FluentUI.AspNetCore.McpServer
```

Configurez ensuite votre fichier `.vscode/mcp.json` :

```json
{
    "servers": {
        "fluent-ui-blazor": {
            "command": "fluentui-mcp"
        }
    }
}
```

### Option 2 : utiliser `dnx` (aucune installation requise)

Si vous utilisez .NET 10+, vous pouvez recourir au script [`dnx`](https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-10/sdk#the-new-dnx-tool-execution-script) pour exécuter le serveur à la volée :

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

Cette méthode télécharge automatiquement la dernière version depuis NuGet.org. Vous pouvez aussi épingler une version précise :

```bash
dnx Microsoft.FluentUI.AspNetCore.McpServer@5.0.1
```

### Option 3 : compiler depuis les sources

Pour contribuer au serveur ou le personnaliser :

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

**« Quels composants de type Button sont disponibles ? »**
→ L'IA invoque automatiquement `ListComponents(category: "Button")` et renvoie la liste complète.

**« Comment utiliser FluentDataGrid avec tri et pagination ? »**
→ L'IA appelle `GetComponentDetails(componentName: "FluentDataGrid")` et récupère tous les paramètres, événements et méthodes documentés.

**« Quelle enum utiliser pour l'apparence d'un bouton ? »**
→ `GetEnumValues(enumName: "Appearance")` renvoie toutes les valeurs possibles.

**« Comment migrer mon code de la V4 vers la V5 ? »**
→ `GetMigrationGuide()` fournit le guide de migration complet directement dans le contexte de l'IA.

## Architecture : sécurité et performance

Le serveur MCP a été conçu selon des principes de sécurité stricts :

| Caractéristique | Détail |
|---|---|
| **Lecture seule** | Aucune modification du système de fichiers |
| **Aucun accès réseau** | Fonctionne entièrement hors ligne |
| **Documentation pré-générée** | Aucune exécution de code au runtime |
| **Exécution sandboxée** | S'exécute comme processus enfant de votre IDE |
| **Aucune donnée sensible** | Ne sert que la documentation publique de l'API |
| **Open source** | Code entièrement auditable sur [GitHub](https://github.com/microsoft/fluentui-blazor) |

L'architecture repose sur un JSON de documentation **pré-généré au build time** à partir de la documentation XML du projet, puis embarqué comme ressource dans le package. Cela garantit un démarrage rapide et une documentation toujours cohérente avec la version du package.

```
┌─────────────────────────────────────────────────┐
│ FluentUI.Demo.DocApiGen (Build Time)            │
│ ├── Uses LoxSmoke.DocXml                        │
│ └── Generates FluentUIComponentsDocumentation.json
└─────────────────────────────────────────────────┘
                    │
                    ▼ (PreBuild / EmbeddedResource)
┌─────────────────────────────────────────────────┐
│ McpServer (Runtime)                             │
│ └── Reads JSON from embedded resource           │
└─────────────────────────────────────────────────┘
```

## Compatible avec Visual Studio Code ET Visual Studio 2026

Le serveur MCP fonctionne avec :

- **Visual Studio Code** via `.vscode/mcp.json`
- **Visual Studio 2026** via `.mcp.json` à la racine de la solution
- **Tout client MCP compatible** (MCP Inspector, Claude Desktop, etc.)

## Pourquoi c'est un game-changer pour la V5

Migrer vers une nouvelle version majeure d'une bibliothèque de composants est toujours un moment délicat. Avec le Fluent UI Blazor MCP Server :

1. **Fini les recherches dans la doc** — L'IA a un accès natif à toute la documentation
2. **Guide de migration intégré** — `GetMigrationGuide()` fournit les breaking changes et les étapes de migration
3. **Découverte des composants** — Vous ne connaissez pas encore les 142+ composants ? L'IA peut les présenter par catégorie
4. **Prototypage accéléré** — Demandez à l'IA de générer un `FluentDataGrid` avec pagination — elle connaît tous les paramètres

## Liens utiles

- [Package NuGet — Microsoft.FluentUI.AspNetCore.McpServer](https://www.nuget.org/packages/Microsoft.FluentUI.AspNetCore.McpServer)
- [Dépôt GitHub — microsoft/fluentui-blazor](https://github.com/microsoft/fluentui-blazor)
- [Site de démo Fluent UI Blazor](https://www.fluentui-blazor.net/)
- [What's New — Fluent UI Blazor](https://www.fluentui-blazor.net/whatsnew)
- [Model Context Protocol — Spécification](https://modelcontextprotocol.io/)
- [Documentation dnx (.NET 10)](https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-10/sdk#the-new-dnx-tool-execution-script)

## Conclusion

Le Fluent UI Blazor MCP Server transforme votre assistant IA en **expert Fluent UI Blazor**. Fini les allers-retours entre votre IDE et la documentation — tout est directement accessible au sein de votre conversation avec l'IA.

Si vous démarrez votre migration vers la V5 ou lancez un nouveau projet Blazor avec Fluent UI, installez le serveur MCP — votre productivité vous remerciera.

```bash
dotnet tool install -g Microsoft.FluentUI.AspNetCore.McpServer
```

**Happy coding !**
