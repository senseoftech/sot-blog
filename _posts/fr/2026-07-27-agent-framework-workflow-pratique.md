---
layout: post
title: "Agent Framework en pratique : le dossier qui attend une signature — c'est pas sorcier !"
date: 2026-07-27 10:00:00
author: AClerbois
lang: fr
ref: agent-framework-workflow
image: /images/posts/agent-framework-workflow.png
tags: [dotnet, AI, agent-framework, workflows, csharp]
level: 300
---

Dans [l'article de présentation d'Agent Framework]({{ site.baseurl }}/fr/2026/07/11/microsoft-agent-framework-equipe-agents-ia/), je promettais que les workflows permettaient d'instruire « le dossier de prêt automatiquement, mais l'accord final reste une signature humaine ». Promesse conceptuelle — aujourd'hui, on la tient **en code**.

Au menu : un vrai workflow C# de bout en bout — le graphe, le routage conditionnel, la **pause pour validation humaine** (human-in-the-loop) et le **checkpointing** qui permet au dossier d'attendre sa signature trois jours sans rien perdre. Vous allez voir : c'est pas sorcier.

<!--more-->

## Le scénario : une demande de remboursement de frais

Restons dans notre PME : les employés soumettent des notes de frais. Le processus métier :

1. **Analyser** la demande (un agent IA lit les justificatifs et structure le dossier).
2. **Router** : moins de 50 € → remboursement automatique ; au-delà → validation du manager.
3. **Attendre la signature** du manager — des heures, parfois des jours.
4. **Exécuter** : rembourser, ou notifier le refus.

Un agent seul improviserait ce processus ; ici, l'ordre des étapes est **la** règle métier. C'est le territoire des workflows : *agent pour l'ouvert, workflow pour le procédural*.

## Les briques : executors et edges

Un workflow Agent Framework est un **graphe typé** : des **executors** (les nœuds — un agent IA *ou* une simple fonction C#) reliés par des **edges** (les arêtes, qui transportent des messages typés). On modélise d'abord les messages :

```csharp
public record ExpenseClaim(string Employee, decimal Amount, string Reason);
public record ApprovalRequest(ExpenseClaim Claim, string Summary);
public record ApprovalResponse(bool Approved, string? Comments);
```

Puis les executors — remarquez le mélange : de l'IA là où il faut juger, du C# là où il faut exécuter :

```csharp
// Un agent IA analyse la demande et produit un résumé structuré
var analyzer = chatClient.CreateAIAgent(
    instructions: "Analyse la note de frais et résume-la en une phrase factuelle.");

// De simples executors C# pour la mécanique
var autoApprove   = new AutoApproveExecutor();   // rembourse directement
var reimburse     = new ReimburseExecutor();     // exécute le paiement
var notifyRefusal = new NotifyRefusalExecutor(); // prévient l'employé
```

## Le graphe : lisible comme le processus lui-même

```csharp
using Microsoft.Agents.AI.Workflows;

// Le point de pause humain : requête ApprovalRequest, réponse ApprovalResponse
var managerApproval = RequestPort.Create<ApprovalRequest, ApprovalResponse>("ManagerApproval");

var builder = new WorkflowBuilder(analyzer);

builder.AddSwitch(analyzer, sw => sw
    .AddCase((ApprovalRequest r) => r.Claim.Amount < 50m, autoApprove)
    .WithDefault(managerApproval));                 // > 50 € : direction le manager

builder.AddEdge(managerApproval, reimburse,
    condition: (ApprovalResponse r) => r.Approved);  // signé → paiement
builder.AddEdge(managerApproval, notifyRefusal,
    condition: (ApprovalResponse r) => !r.Approved); // refusé → notification

var workflow = builder.WithOutputFrom(reimburse, notifyRefusal).Build();
```

Relisez le processus métier du début, puis ce code : **c'est le même texte.** Le graphe se lit comme la procédure — et le framework **valide les types à la construction** : une arête qui transporterait le mauvais message ne compile pas votre workflow. Le moule, encore lui.

## Le human-in-the-loop : le RequestPort

La pièce maîtresse, c'est ce `RequestPort`. Quand le dossier y arrive, le workflow ne « bloque » pas un thread en attendant un humain — il **émet un événement** (`RequestInfoEvent`) et s'arrête proprement :

```csharp
await foreach (var evt in workflow.RunStreamingAsync(claim))
{
    if (evt is RequestInfoEvent request)
    {
        // Ici, VOTRE application prend le relais :
        // afficher la demande dans l'app du manager, envoyer un e-mail Actionable…
        await approvalUi.ShowAsync(request);
    }
}
```

Et quand le manager clique — dans une heure ou dans trois jours — votre application **renvoie la réponse au workflow**, qui reprend exactement où il s'était arrêté et route vers `reimburse` ou `notifyRefusal`. Le stagiaire a monté le dossier ; le workflow a porté le parapheur jusqu'au bureau du manager ; la signature reste humaine. C'est le [tool approval]({{ site.baseurl }}/fr/2026/07/13/premier-serveur-mcp-dotnet/) à l'échelle d'un processus.

## Le checkpointing : le dossier survit au redémarrage

Trois jours d'attente posent une question très concrète : et si l'application redémarre entre-temps ? Réponse : les **checkpoints**. Le workflow s'exécute en **supersteps** (des tours de graphe), et à chaque frontière de superstep, l'état complet — position dans le graphe, états des executors, messages en attente, **y compris les demandes de validation pendantes** — est sauvegardé dans un stockage de checkpoints.

À la reprise (après un déploiement, un crash, ou juste trois jours plus tard), on **recharge le dernier checkpoint** : les demandes en attente sont ré-émises, le dossier repart d'où il était. Rien en mémoire, tout en stockage — c'est ce qui transforme un « script qui tourne » en **processus métier de longue durée**. Et pour l'hébergement sérieux, l'extension **Durable Task** sur Azure checkpointe chaque étape automatiquement, sans changer la définition du workflow.

## Cerise : le workflow devient un agent

Dernier geste, déjà annoncé dans l'article de présentation : un workflow peut être **exposé comme un agent** — de l'extérieur, on lui « parle » comme à n'importe quel agent (et donc, [souvenez-vous]({{ site.baseurl }}/fr/2026/07/13/premier-serveur-mcp-dotnet/), il peut même finir en serveur MCP). Votre processus de remboursement complet, avec sa validation humaine et ses checkpoints, devient un outil branchable dans Copilot. Les poupées russes de l'ingénierie agentique.

## Le mot d'honnêteté

Agent Framework évolue vite — les noms d'API de cet article correspondent à la documentation du moment, mais **vérifiez toujours les [samples officiels](https://github.com/microsoft/agent-framework/tree/main/dotnet/samples/03-workflows)** avant de copier : c'est eux qui font foi. Et un conseil d'architecte : ne mettez en workflow que ce qui est vraiment procédural — un graphe de quarante nœuds pour ce qu'un agent gère en trois outils, c'est de la bureaucratie, pas de l'ingénierie.

## En résumé

- Un workflow = un **graphe typé** : executors (agents IA *ou* fonctions C#) + edges (conditionnels, switch-case, fan-out/fan-in) — validé à la construction.
- Le **RequestPort** matérialise le human-in-the-loop : le workflow émet une demande, s'arrête proprement, et reprend à la réponse — l'IA instruit, **l'humain signe**.
- Le **checkpointing** par supersteps rend le processus durable : redémarrages, déploiements, attentes de trois jours — le dossier ne se perd jamais.
- Et le tout peut s'exposer **comme un agent** (voire comme serveur MCP) : le processus devient une brique.

Le dossier monté par l'IA, le parapheur qui attend la signature, et l'archivage qui survit à tout : votre processus métier tient en une page de C# lisible. Et ça, franchement… c'est pas sorcier.
