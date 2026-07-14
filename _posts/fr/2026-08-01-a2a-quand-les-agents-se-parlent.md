---
layout: post
title: "A2A : quand les agents s'échangent leurs cartes de visite — c'est pas sorcier !"
date: 2026-08-01 10:00:00
author: AClerbois
lang: fr
ref: a2a-protocol
image: /images/posts/a2a-protocol.png
tags: [AI, A2A, agents, MCP, interop]
---

Toute cette série a construit **votre** entreprise d'agents : des employés ([Agent Framework]({{ site.baseurl }}/fr/2026/07/11/microsoft-agent-framework-equipe-agents-ia/)), leurs outils ([MCP]({{ site.baseurl }}/fr/2026/07/13/premier-serveur-mcp-dotnet/)), leurs procédures ([workflows]({{ site.baseurl }}/fr/2026/07/27/agent-framework-workflow-pratique/)). Mais une entreprise ne vit pas en vase clos : elle a des fournisseurs, des transporteurs, des partenaires — qui ont, eux aussi, leurs agents.

Comment votre agent logistique demande-t-il à l'agent du transporteur où en est la livraison ? Réponse : **A2A** — *Agent-to-Agent protocol* — le standard ouvert qui fait se parler des agents de systèmes, d'éditeurs et d'entreprises différents. Vous allez voir : c'est pas sorcier.

<!--more-->

## MCP branche des outils ; A2A fait dialoguer des agents

La confusion classique d'abord, car les deux protocoles sont cousins :

- **MCP**, c'est la **prise murale** : elle branche des *outils* — passifs, déterministes — sur *votre* agent. `GetStock` ne réfléchit pas : il répond.
- **A2A**, c'est le **téléphone inter-entreprises** : il met en relation deux *agents* — deux systèmes autonomes qui raisonnent, posent des questions en retour, et mettent du temps à travailler.

Le test simple : si la chose appelée exécute et retourne (une fonction), c'est un outil → MCP. Si elle **délibère, demande des précisions et revient plus tard** (un employé), c'est un agent → A2A. Et les deux se composent naturellement : l'agent du transporteur que vous appelez en A2A utilise, en interne, ses propres outils MCP. La prise dans les ateliers, le téléphone entre les sièges sociaux.

## La carte de visite : l'Agent Card

Comment votre agent découvre-t-il ce que sait faire l'agent d'en face ? Chaque agent A2A publie une **Agent Card** — un document JSON à une adresse convenue (`/.well-known/agent-card.json`), littéralement sa carte de visite :

```json
{
  "name": "Agent Livraisons TransExpress",
  "description": "Suivi et replanification des livraisons TransExpress.",
  "url": "https://agents.transexpress.example/a2a",
  "skills": [
    { "id": "track-shipment", "description": "Localise un colis et estime l'arrivée." },
    { "id": "reschedule-delivery", "description": "Replanifie une livraison." }
  ],
  "securitySchemes": { "...": "comment s'authentifier" }
}
```

Qui je suis, ce que je sais faire (mes *skills*), où me joindre, comment vous identifier. Votre agent lit la carte, choisit la compétence, et engage la conversation — **sans intégration sur mesure**. C'est exactement ce que MCP a fait pour les outils, appliqué un étage au-dessus.

## Le bon de commande : la task

Le deuxième concept clé règle le problème du **temps**. Une question d'agent à agent n'est pas un appel de fonction qui répond en 200 ms : « replanifie la livraison » peut demander des vérifications, une validation humaine côté transporteur, des heures. A2A modélise donc l'échange comme une **task** — un bon de commande avec un cycle de vie :

> soumise → en cours → *(besoin d'une précision ?)* → terminée / échouée

Votre agent soumet la task, puis suit son état (notifications, streaming des mises à jour). L'agent d'en face peut **demander un complément** (« quel créneau préférez-vous ? ») avant de reprendre. Et le résultat final — texte, données structurées, documents — arrive sous forme d'**artifacts**. Vous reconnaissez le pattern : c'est le [RequestPort des workflows]({{ site.baseurl }}/fr/2026/07/27/agent-framework-workflow-pratique/), étendu entre organisations — et la même philosophie que les [bons de mission des sous-agents]({{ site.baseurl }}/fr/2026/07/25/copilot-sous-agents-decouper-le-travail/) : brief, mission, livrable.

## Opaque par design : on ne visite pas l'usine du fournisseur

Un choix de conception capital, et très « entreprise » : A2A est **opaque**. L'agent du transporteur ne révèle ni son raisonnement, ni ses outils internes, ni ses données — seulement ses compétences affichées et ses réponses. Vous ne visitez pas l'usine de votre fournisseur : vous passez commande au comptoir.

C'est ce qui rend le protocole viable entre entreprises (secret industriel, conformité, sécurité)… et c'est aussi sa conséquence la plus sérieuse : **vous faites confiance à une boîte noire.** D'où l'importance du reste du protocole — authentification mutuelle (les schémas de sécurité de la carte), et vos propres réflexes : [tracer ces échanges]({{ site.baseurl }}/fr/2026/07/31/observer-ses-agents-opentelemetry/) comme n'importe quel appel sortant, et [vérifier ce qui est vérifiable]({{ site.baseurl }}/fr/2026/07/16/pourquoi-l-ia-hallucine/) avant d'agir sur la réponse d'un agent tiers.

## Où en est l'écosystème (et Microsoft dedans)

A2A, initié par Google puis confié à la **Linux Foundation**, a rallié les grands noms — dont Microsoft, qui l'a adopté dans **Foundry et Agent Framework** : votre agent .NET peut *appeler* un agent A2A distant, et votre propre agent peut *s'exposer* en A2A, carte de visite comprise. La boucle des poupées russes de la série est bouclée : un workflow devient un agent, l'agent devient un serveur MCP pour vos outils internes… et un **agent A2A pour vos partenaires externes**.

**Le mot d'honnêteté**, car il s'impose : A2A est **jeune**. Le protocole est stable et gouverné, mais l'annuaire d'agents publics reste embryonnaire, les modèles de confiance inter-entreprises (qui certifie la carte de visite ? qui répond des dégâts d'un agent tiers ?) sont en construction, et vos premiers usages seront probablement… internes — entre les agents de vos propres départements, là où la confiance existe déjà. C'est le pari classique du standard : s'y préparer avant d'en avoir besoin.

## En résumé

- **MCP branche des outils sur un agent ; A2A fait dialoguer des agents entre eux** — la prise et le téléphone, complémentaires par construction.
- L'**Agent Card** : la carte de visite JSON publiée (identité, compétences, adresse, authentification) — la découverte sans intégration sur mesure.
- La **task** : un bon de commande avec cycle de vie — longue durée, questions en retour, artifacts en livraison.
- **Opaque par design** : ni raisonnement ni outils exposés — viable entre entreprises, mais boîte noire à tracer et vérifier.
- Gouverné par la **Linux Foundation**, adopté par Microsoft dans Foundry/Agent Framework — jeune, mais c'est le standard à suivre.

Vos agents ont des cartes de visite, des bons de commande et un standard téléphonique : l'économie des agents commence à ressembler… à une économie. Et ça, franchement… c'est pas sorcier.
