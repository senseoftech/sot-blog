---
layout: post
title: "Votre serveur MCP en production : HTTP, authentification, déploiement — c'est pas sorcier !"
date: 2026-07-30 10:00:00
author: AClerbois
lang: fr
ref: mcp-server-prod
image: /images/posts/mcp-server-prod.png
tags: [dotnet, AI, MCP, csharp, azure, security]
level: 300
---

Dans [le premier article MCP]({{ site.baseurl }}/fr/2026/07/13/premier-serveur-mcp-dotnet/), on a fabriqué la prise universelle : un serveur en trente lignes, en STDIO, sur votre poste. Et je vous avais promis la suite : *« Streamable HTTP quand il faudra partager. »*

Il faut partager. Votre serveur stock fonctionne si bien que toute l'équipe le veut — et le commercial aussi, depuis son Copilot. Un serveur MCP **distant, partagé, authentifié, déployé** : c'est le programme du jour. Vous allez voir : c'est pas sorcier.

<!--more-->

## STDIO a une limite : c'est un outil de poste, pas un service

Rappel de la mécanique : en STDIO, **le client lance votre serveur comme processus enfant**. Conséquences : une copie par utilisateur, sur chaque machine, avec les droits de chacun, et la configuration qui va avec. Pour un outil personnel, parfait. Pour un serveur d'équipe — *la* base de données de stock, *le* catalogue produit — il faut l'inverse : **un** serveur, quelque part, et tous les clients qui s'y branchent.

C'est le rôle du transport **Streamable HTTP**. Au passage : si vous croisez de vieux tutoriels parlant du transport « SSE », passez votre chemin — il est **déprécié**, Streamable HTTP le remplace.

## Le même serveur, en HTTP : dix lignes changent

La beauté de l'affaire : **vos outils ne changent pas d'un caractère.** Seul le branchement change — on passe d'une console `Host` à une application ASP.NET :

```bash
dotnet new web -n MonServeurMcp
dotnet add package ModelContextProtocol.AspNetCore
```

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddMcpServer()
    .WithHttpTransport()
    .WithToolsFromAssembly();   // vos StockTools, inchangés

var app = builder.Build();

app.MapMcp("/mcp");             // le endpoint MCP vit sur /mcp

app.Run();
```

Votre classe `StockTools` de l'article précédent — attributs, descriptions, logique — se copie telle quelle. **Même code d'outils, autre prise murale.** Et le bonus immédiat : plus de piège stdout — en HTTP, `Console.WriteLine` redevient inoffensif (mais gardez les vrais logs, on y revient).

## Stateful ou stateless : la décision d'architecture

Le transport HTTP a un choix structurant que STDIO n'avait pas :

- **Stateful (défaut)** : le serveur garde une session par client. Nécessaire pour les fonctionnalités où *le serveur* sollicite *le client* — sampling, elicitation, notifications.
- **Stateless** (`options.Stateless = true`) : chaque requête est indépendante — **indispensable pour scaler horizontalement** (plusieurs instances derrière un load balancer, scale-to-zero), mais les fonctionnalités serveur-vers-client cessent de fonctionner.

La règle simple : un serveur d'outils classique (des tools qu'on appelle, point) → **stateless, et scalez tranquille**. Un serveur qui dialogue (demande des validations, pousse des notifications) → stateful, avec de l'affinité de session. [Consignez le choix dans un ADR]({{ site.baseurl }}/fr/2026/07/14/adr-memoire-decisions-architecture/) — c'est typiquement une décision qu'on paie plus tard.

## L'authentification : c'est de l'ASP.NET, tout simplement

La bonne nouvelle cachée du transport HTTP : votre endpoint MCP est **un endpoint ASP.NET comme les autres**. Toute votre boîte à outils habituelle s'applique — pas de mécanique exotique à apprendre :

```csharp
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(o => { /* votre autorité : Entra ID, etc. */ });

app.MapMcp("/mcp").RequireAuthorization();
```

Côté client, les configurations MCP acceptent des **en-têtes HTTP** (jeton Bearer, clé API) — Copilot CLI propose même un formulaire pour les saisir, et l'OAuth est géré par les clients modernes. Trois réflexes de [l'article sécurité]({{ site.baseurl }}/fr/2026/07/10/securiser-github-copilot/) à transposer :

1. **Les secrets restent côté client** (variables d'environnement, gestionnaire de secrets) — jamais en dur dans un `mcp.json` commité.
2. **Votre serveur revalide tout** : le modèle peut envoyer n'importe quoi en paramètre — l'authentification ne remplace pas la validation d'entrées.
3. **Aucun secret dans les réponses** : tout ce que retourne un outil part dans le contexte du modèle — et potentiellement dans des transcriptions.

## Le déploiement : un conteneur comme un autre

Un serveur MCP HTTP se déploie comme n'importe quelle API ASP.NET. Le chemin le plus court aujourd'hui : **Azure Container Apps** —

```bash
az containerapp up --name mcp-stock --source . --ingress external --target-port 8080
```

Pourquoi Container Apps plutôt qu'autre chose : HTTPS fourni, **scale-to-zero** (un serveur MCP d'équipe dort 90 % du temps — autant ne pas le payer), et l'ingress *interne* si le serveur ne doit être joignable que depuis votre réseau — pour un serveur d'entreprise, c'est souvent le bon défaut. Les alternatives classiques (App Service, Functions pour les serveurs simples, AKS si vous y êtes déjà) fonctionnent aussi — c'est de l'ASP.NET, encore et toujours.

Dernier kilomètre : la distribution. Une fois l'URL stable, [`.github/mcp.json`]({{ site.baseurl }}/fr/2026/07/23/copilot-cli-3-l-equipe-dans-le-terminal/) dans les dépôts de l'équipe :

```json
{
  "servers": {
    "stock": { "type": "http", "url": "https://mcp-stock.demo.azurecontainerapps.io/mcp" }
  }
}
```

…et tous les agents de l'équipe héritent du branchement. Écrit une fois, déployé une fois, branché partout.

## Le mot d'honnêteté : vous venez de publier une API d'actions

Un serveur MCP distant, c'est **une API publique dont les appels sont décidés par des LLM**. Traitez-la avec le sérieux correspondant :

- **Moindre privilège** : le serveur stock lit le stock ; il n'a pas la chaîne de connexion d'écriture si aucun outil n'écrit.
- **Journalisez les appels** (qui, quel outil, quels paramètres) — c'est votre trace d'audit, et le matériau de [l'article observabilité à venir]({{ site.baseurl }}/fr/2026/07/19/pourquoi-l-ia-hallucine/).
- **Limitez le débit** : un agent en boucle peut marteler un outil — un rate limiter ASP.NET standard suffit.
- **Versionnez le catalogue** : renommer un outil casse tous les prompts qui s'y réfèrent ; les descriptions font partie du contrat.

## En résumé

- STDIO = outil de poste ; **Streamable HTTP** = service d'équipe — et vos classes d'outils se recopient sans modification (`WithHttpTransport()` + `MapMcp()`).
- **Stateless** pour scaler (serveurs d'outils), **stateful** pour dialoguer (sampling, elicitation) — un ADR s'impose.
- L'authentification et le déploiement sont de l'**ASP.NET standard** : JWT/clés en en-têtes, conteneur sur Container Apps, scale-to-zero.
- Distribution par `.github/mcp.json` : toute l'équipe branchée en un commit.
- Et le sérieux d'une vraie API : moindre privilège, validation, journaux, rate limiting, versionnage.

De la console sur votre poste au service d'équipe sur Azure, sans réécrire un seul outil : la prise universelle tient sa promesse. Et ça, franchement… c'est pas sorcier.
