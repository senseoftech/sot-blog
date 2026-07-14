---
layout: post
title: "Fiabilité des agents longue durée : idempotence, compensation et le crash au mauvais moment — c'est pas sorcier !"
date: 2026-08-14 10:00:00
author: AClerbois
lang: fr
ref: agent-reliability-400
image: /images/posts/agent-reliability-400.png
tags: [AI, agents, reliability, distributed-systems, workflows]
level: 400
---

Niveau 400, épisode 5. Dans [l'article sur les workflows]({{ site.baseurl }}/fr/2026/07/27/agent-framework-workflow-pratique/), le checkpointing permettait au « dossier de prêt » de survivre à un redémarrage. J'ai glissé sur une question qui hante tout système distribué et que l'IA rend brûlante : **que se passe-t-il quand l'agent reprend après un crash, et rejoue une action qu'il avait déjà commencée ?**

Rembourser deux fois. Envoyer l'e-mail en double. Commander 100 unités au lieu de 50. Aujourd'hui, on outille la fiabilité des agents qui vivent des heures ou des jours — avec les patterns éprouvés du distribué, adaptés au non-déterminisme. Vous allez voir : c'est pas sorcier.

<!--more-->

## Le problème : un agent long est un système distribué qui s'ignore

Additionnez ce que la série a établi : un agent [appelle des outils en boucle]({{ site.baseurl }}/fr/2026/07/29/tool-calling-sous-le-capot/), [reprend sur checkpoint]({{ site.baseurl }}/fr/2026/07/27/agent-framework-workflow-pratique/), [délègue à des sous-agents]({{ site.baseurl }}/fr/2026/07/25/copilot-sous-agents-decouper-le-travail/), et n'est [jamais déterministe]({{ site.baseurl }}/fr/2026/08/10/sampling-decodage-contraint/). Vous n'avez pas un « script IA » : vous avez un **système distribué, asynchrone, partiellement défaillant** — avec, en prime, un composant qui improvise.

Les trois modes de défaillance qui vous attendent en production :

1. **Le crash entre l'action et son enregistrement.** L'agent appelle `RembourserClient(500€)`, le paiement part… et le processus meurt avant de noter « c'est fait ». À la reprise, il rejoue — **double remboursement**.
2. **Le retry sur timeout.** L'outil ne répond pas dans les temps ; l'agent (ou le harnais) réessaie. Mais la première tentative avait *peut-être* réussi — le réseau a juste avalé la réponse.
3. **Le doute du modèle lui-même.** Non déterministe, il peut décider d'appeler deux fois le même outil « pour être sûr ». Ce qui, sur une action irréversible, est une catastrophe polie.

Le fil conducteur des trois : **les systèmes distribués garantissent au mieux le "au moins une fois". Vos actions doivent donc survivre à être exécutées plusieurs fois.**

## Pilier 1 : l'idempotence — la ceinture de sécurité

Une opération est **idempotente** si l'exécuter dix fois donne le même résultat que l'exécuter une fois. C'est LA propriété qui neutralise les modes 1, 2 et 3 d'un coup. Le pattern canonique : la **clé d'idempotence**. L'agent génère un identifiant unique *par intention*, l'outil le mémorise, et rejoue = no-op :

```csharp
[McpServerTool, Description("Rembourse un client. Idempotent via idempotencyKey.")]
public async Task<RefundResult> RefundCustomer(
    string customerId, decimal amount,
    [Description("Clé unique de CETTE intention de remboursement.")] string idempotencyKey)
{
    // Déjà vu cette clé ? On retourne le résultat mémorisé, on ne rembourse pas deux fois.
    if (await _store.TryGet(idempotencyKey) is { } prior) return prior;

    var result = await _paymentGateway.Refund(customerId, amount);
    await _store.Save(idempotencyKey, result);   // atomique avec le paiement, idéalement
    return result;
}
```

Le point d'architecture crucial, contre-intuitif : **la responsabilité de l'idempotence appartient à l'outil, pas à l'agent.** On ne *fait pas confiance* au modèle pour ne pas rejouer — [c'est un stagiaire crédule]({{ site.baseurl }}/fr/2026/08/06/prompt-injection-defense-en-profondeur/) — on rend le rejeu **inoffensif** au niveau du serveur MCP. Concevez vos outils sensibles comme des endpoints idempotents, exactement comme une bonne API de paiement.

## Pilier 2 : la compensation — quand on ne peut pas annuler

Toutes les actions ne sont pas idempotentes, et beaucoup ne sont pas *annulables*. L'e-mail envoyé ne se dé-envoie pas ; le virement parti ne revient pas d'un `rollback`. Pour ces cas, le pattern **saga** : plutôt qu'une transaction unique (impossible sur des systèmes hétérogènes), une suite d'étapes, **chacune avec son action de compensation**.

Réserver le stock → débiter la carte → expédier. Si l'expédition échoue, on ne « rollback » pas — on **compense** : rembourser la carte, relâcher le stock. La compensation n'efface pas l'histoire (le débit a existé), elle la **corrige par une action inverse**. C'est le [RequestPort/checkpoint des workflows]({{ site.baseurl }}/fr/2026/07/27/agent-framework-workflow-pratique/) qui prend tout son sens : chaque étape franchie est un point de reprise *et* un point de compensation possible.

## Pilier 3 : l'humain comme disjoncteur

Certaines décisions ne doivent jamais être laissées à un composant non déterministe seul. Le [tool approval]({{ site.baseurl }}/fr/2026/07/11/microsoft-agent-framework-equipe-agents-ia/) n'est pas qu'une garde anti-injection — c'est un **pattern de fiabilité** : au-delà d'un seuil (montant, irréversibilité, confiance basse), l'agent *prépare* et **escalade à un humain**. Définissez ces seuils explicitement : en-dessous, autonomie ; au-dessus, signature. Le disjoncteur qui protège des emballements — qu'ils viennent d'une hallucination, d'une injection ou d'une simple boucle.

## Pilier 4 : mesurer la fiabilité (les SLO d'agents)

On ne pilote que ce qu'on mesure. Un agent de production a des **SLO** propres, au-delà de l'uptime classique :

- **Taux de complétion de tâche** — quelle fraction aboutit sans intervention ?
- **Taux d'intervention humaine** — combien escaladent, et est-ce le bon niveau ?
- **Taux de rejeu / d'action dupliquée** — le thermomètre de vos piliers 1-2.
- **Coût et latence par tâche** — dérivent-ils ?

C'est là que [l'observabilité OTel]({{ site.baseurl }}/fr/2026/07/31/observer-ses-agents-opentelemetry/) devient vitale : les traces sont la matière première de ces SLO, et [l'incident de cette nuit qui devient l'éval de demain]({{ site.baseurl }}/fr/2026/07/17/tester-une-application-ia-les-evals/) boucle la boucle qualité. Un système qu'on n'observe pas est un système dont on découvre les défaillances par les clients.

## En résumé

- Un agent longue durée **est un système distribué non déterministe** : crash entre action et log, retry sur timeout, rejeu par le modèle — le « au moins une fois » est la règle.
- **Idempotence** (clé d'idempotence, responsabilité de *l'outil*) : rendre le rejeu inoffensif plutôt que d'espérer qu'il n'arrive pas.
- **Compensation** (sagas) pour l'irréversible : corriger par action inverse, puisqu'on ne peut pas annuler.
- **Humain-disjoncteur** au-dessus d'un seuil, et **SLO d'agents** (complétion, escalade, rejeu, coût) alimentés par les traces.

La question n'est pas « et si l'agent se trompe ? » mais « quand il rejouera, est-ce que ça fait mal ? ». Concevez pour le rejeu, compensez l'irréversible, gardez l'humain sur le gros rouge — et vos agents survivent au monde réel. Et ça, franchement… c'est pas sorcier.
