---
layout: post
title: "Votre premier serveur MCP en .NET : fabriquez la prise universelle — c'est pas sorcier !"
date: 2026-07-13 10:00:00
author: AClerbois
lang: fr
ref: mcp-server-dotnet
image: /images/posts/mcp-server-dotnet.png
tags: [dotnet, AI, MCP, csharp, agents, tutorial]
level: 200
---

Dans les derniers articles, MCP revient sans arrêt sous le même surnom : **la prise universelle**. On l'a branchée sur [GitHub Copilot]({{ site.baseurl }}/fr/2026/07/02/github-copilot-skills-instructions-agents-mcp/), sur [Agent Framework]({{ site.baseurl }}/fr/2026/07/11/microsoft-agent-framework-equipe-agents-ia/), on a appris à s'en [méfier]({{ site.baseurl }}/fr/2026/07/10/securiser-github-copilot/)… mais on ne l'a jamais fabriquée.

Aujourd'hui, on passe de l'autre côté : **votre propre serveur MCP, en C#, en une trentaine de lignes.** Votre logique métier devient un outil que Copilot, Claude ou vos agents peuvent appeler. Vous allez voir : c'est pas sorcier.

<!--more-->

## Le rappel en trente secondes

**MCP** (Model Context Protocol) est un standard ouvert qui définit comment une application IA découvre et appelle des outils externes. Trois rôles :

- **L'hôte** : l'application IA (VS Code avec Copilot, Claude, votre agent…).
- **Le serveur** : votre programme, qui expose un **catalogue** de capacités.
- **Le client** : le morceau de l'hôte qui parle au serveur, via un protocole commun (JSON-RPC).

Et dans le catalogue d'un serveur, trois types d'articles :

| Primitive | C'est quoi | Exemple |
| --- | --- | --- |
| **Tools** | des actions que le modèle peut invoquer | « donne-moi le stock du produit X » |
| **Resources** | des documents à lire | le catalogue produits, un fichier de config |
| **Prompts** | des gabarits de conversation prêts à l'emploi | « analyse ce ticket au format support » |

L'image de l'entreprise, toujours : le serveur MCP est un **prestataire externe** avec son catalogue de services. Aujourd'hui on crée le prestataire — et on commence par les *tools*, le cas d'usage numéro un.

## Pourquoi fabriquer le vôtre ?

Parce que c'est **la** réponse au problème « je veux que l'IA accède à mes données métier ». Sans MCP, vous écrivez une intégration par outil IA : une extension VS Code, un plugin par-ci, un connecteur par-là. Avec MCP : **vous écrivez le serveur une fois, et tout ce qui parle MCP peut s'y brancher** — Copilot, Claude, un agent Agent Framework, l'outil de demain.

C'est l'argument « écrit une fois, branché partout » de [l'article Agent Framework]({{ site.baseurl }}/fr/2026/07/11/microsoft-agent-framework-equipe-agents-ia/) — sauf que cette fois, c'est vous le fournisseur.

## Le code : un serveur en trente lignes

Microsoft et le projet MCP maintiennent un SDK officiel : le package NuGet **`ModelContextProtocol`** (ligne stable 1.x). On crée une console .NET classique :

```bash
dotnet new console -n MonServeurMcp -f net10.0
cd MonServeurMcp
dotnet add package ModelContextProtocol
dotnet add package Microsoft.Extensions.Hosting
```

Et voici `Program.cs`, en entier :

```csharp
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ModelContextProtocol.Server;
using System.ComponentModel;

var builder = Host.CreateApplicationBuilder(args);

// Piège n°1 (on y revient) : les logs partent sur stderr, jamais stdout.
builder.Logging.AddConsole(o => o.LogToStandardErrorThreshold = LogLevel.Trace);

builder.Services
    .AddMcpServer()
    .WithStdioServerTransport()
    .WithToolsFromAssembly();

await builder.Build().RunAsync();

[McpServerToolType]
public static class StockTools
{
    [McpServerTool, Description("Retourne le niveau de stock d'un produit à partir de sa référence.")]
    public static int GetStock(
        [Description("La référence produit, par exemple SKU-1234.")] string reference)
        => StockDb.Lookup(reference); // votre vraie logique métier ici

    [McpServerTool, Description("Recherche des produits par mot-clé dans le catalogue.")]
    public static IEnumerable<string> SearchProducts(
        [Description("Le mot-clé de recherche, par exemple 'clavier'.")] string keyword)
        => StockDb.Search(keyword);
}
```

C'est tout. Décortiquons ce qui vient de se passer :

- **Un serveur MCP est une application .NET ordinaire** : `Host.CreateApplicationBuilder`, de l'injection de dépendances, rien d'exotique.
- **`[McpServerToolType]` + `[McpServerTool]`** : une classe, des méthodes — et `WithToolsFromAssembly()` les découvre tout seul. Le SDK génère le schéma JSON à partir de la signature : vos paramètres C# typés deviennent le contrat de l'outil.
- **`WithStdioServerTransport()`** : le serveur communique par l'entrée/sortie standard — l'hôte le lance comme un processus enfant. Parfait en local.

## Les deux pièges qui cassent tout

**Piège n°1 : stdout est sacré.** En STDIO, la sortie standard *est* le canal du protocole. Un seul `Console.WriteLine("démarrage...")` dans votre code — ou une bibliothèque bavarde qui affiche une bannière — et le client coupe la connexion sur une erreur de parsing. D'où la ligne de logging vers **stderr** tout en haut du programme, *avant* tout le reste. Si votre serveur « ne répond pas », c'est le suspect numéro un.

**Piège n°2 : des descriptions vagues.** Les attributs `[Description]` ne sont pas de la décoration : c'est **la vitrine du catalogue**, le texte exact que le modèle lit pour décider *s'il* utilise votre outil et *comment* le remplir. « Retourne des données » = outil jamais appelé. « Retourne le niveau de stock d'un produit à partir de sa référence » = outil utilisé à bon escient. Soignez-les comme une documentation publique — au fond, c'en est une.

## On le branche

Sur **VS Code / Copilot**, créez `.vscode/mcp.json` dans votre workspace :

```json
{
  "servers": {
    "mon-stock": {
      "type": "stdio",
      "command": "dotnet",
      "args": ["run", "--project", "${workspaceFolder}/src/MonServeurMcp"]
    }
  }
}
```

Ouvrez le chat Copilot en mode agent, et demandez : *« quel est le stock du SKU-1234 ? »*. Copilot découvre `GetStock`, l'appelle, répond avec la vraie valeur. **Votre code vient d'entrer dans la conversation.**

Pour développer confortablement, l'outil de débogage officiel s'appelle **MCP Inspector** : il lance votre serveur, liste ses outils et vous laisse les appeler à la main depuis une interface web —

```bash
npx @modelcontextprotocol/inspector dotnet run --project ./MonServeurMcp
```

## Et pour aller plus loin

- **STDIO ou HTTP ?** STDIO pour un serveur local lancé par le client. Pour un serveur **distant et partagé** (une API d'équipe), le SDK propose le transport **Streamable HTTP** via le package `ModelContextProtocol.AspNetCore` — même code d'outils, autre branchement. (Le transport SSE historique est déprécié : n'en tenez plus compte dans les vieux tutoriels.)
- **Resources et prompts** : mêmes mécaniques que les tools, avec `[McpServerResourceType]` et `[McpServerPromptType]` — pensez à les enregistrer (`WithResources<T>()`, `WithPrompts<T>()`), sinon ils sont invisibles.
- **La boucle est bouclée** : rappelez-vous [l'article Agent Framework]({{ site.baseurl }}/fr/2026/07/11/microsoft-agent-framework-equipe-agents-ia/) — un agent peut lui-même s'exposer comme serveur MCP. Votre prestataire peut être… une équipe entière.

**Le mot d'honnêteté**, côté sécurité : un serveur MCP, c'est du code qui s'exécute **avec vos droits** et que des modèles vont piloter. Les réflexes de [l'article sécurité]({{ site.baseurl }}/fr/2026/07/10/securiser-github-copilot/) s'appliquent dans les deux sens : moindre privilège pour ce que votre serveur *peut* faire, validation des entrées (le modèle peut envoyer n'importe quoi en paramètre), et pas de secret dans les réponses — tout ce que votre outil retourne part dans le contexte du modèle.

## En résumé

- Un serveur MCP = un **catalogue** (tools, resources, prompts) exposé via un protocole standard — écrit une fois, branché sur Copilot, Claude, vos agents.
- En .NET : package **`ModelContextProtocol`** (stable 1.x), une console ordinaire, des attributs `[McpServerTool]` + `[Description]` — le SDK fait le reste.
- Les deux pièges : **stdout réservé au protocole** (logs sur stderr) et **descriptions vagues** (la vitrine que lit le modèle).
- Test avec **MCP Inspector**, branchement en trois lignes de JSON, et Streamable HTTP quand il faudra partager.

La prise universelle, vue de l'intérieur, c'est une console .NET avec deux attributs. Votre logique métier dans la conversation de l'IA, en une pause déjeuner. Et ça, franchement… c'est pas sorcier.
