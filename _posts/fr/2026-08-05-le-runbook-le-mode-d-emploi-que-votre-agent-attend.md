---
layout: post
title: "Le runbook : le mode d'emploi que votre agent attend — c'est pas sorcier !"
date: 2026-08-05 10:00:00
author: AClerbois
lang: fr
ref: runbook
image: /images/posts/runbook.png
tags: [documentation, runbook, operations, AI, best-practices]
level: 200
---

« Ça devrait marcher. » Si cette phrase d'un agent IA vous hérisse autant que moi, posez-vous la question qui fâche : l'agent avait-il **les moyens de vérifier** ? Savait-il comment lancer l'application, avec quelles variables d'environnement, quelle commande joue les tests d'intégration, où regarder les logs ? Si la réponse vit uniquement dans votre tête, l'agent ne pouvait *que* supposer.

[Hier, on a appris à observer nos agents]({{ site.baseurl }}/fr/2026/08/04/observer-ses-agents-opentelemetry/) — les traces disent *ce qui* s'est passé. Aujourd'hui, le document qui dit *quoi faire* : le **runbook**, le mode d'emploi opérationnel du projet. Un héritage du monde SRE qui, à l'ère des agents, devient une pièce maîtresse du dépôt qui parle. Vous allez voir : c'est pas sorcier.

<!--more-->

## Le savoir opérationnel : le plus tribal de tous

Chaque équipe a son folklore : « pour lancer en local, il faut d'abord démarrer le docker-compose *puis* appliquer les migrations, sinon ça plante », « les tests d'intégration exigent la variable `TESTCONTAINERS_HOST` », « si l'API renvoie des 502 en cascade, c'est presque toujours le pool Redis — redémarre d'abord le worker ». Ce savoir n'est écrit nulle part : il se transmet par-dessus l'épaule, se perd à chaque départ, et se redécouvre à 3 h du matin pendant un incident.

Le runbook capture ce folklore dans le dépôt : `docs/runbook.md` (ou un dossier `docs/runbooks/` quand ça grandit), versionné, relu en PR — le même réflexe que pour [les ADR]({{ site.baseurl }}/fr/2026/07/14/adr-memoire-decisions-architecture/), appliqué à l'exploitation.

## Ce qu'on y met : quatre rubriques

| Rubrique | La question à laquelle elle répond |
| --- | --- |
| **Démarrer** | comment lancer en local, dans quel ordre, avec quels prérequis ? |
| **Vérifier** | comment savoir que ça marche — commandes de test, URL de health check ? |
| **Diagnostiquer** | où sont les logs, les dashboards, les traces ? Quels symptômes → quelles causes ? |
| **Réparer** | les procédures connues : redémarrage propre, rollback, purge de cache, feature flag à couper |

Un extrait vaut mille descriptions :

```markdown
## Symptôme : 502 en cascade sur /api/orders

1. Vérifier le pool Redis : `docker exec redis redis-cli INFO clients`
   → si `connected_clients` > 95, c'est la fuite connue (voir ADR-0021).
2. Redémarrer LE WORKER d'abord (jamais l'API en premier — elle
   re-remplirait le pool immédiatement) : `docker restart worker`
3. Confirmer : `curl -s localhost:8080/health` doit répondre `Healthy`
   en < 2 s. Sinon, escalader — ne PAS redémarrer Redis (perte des
   sessions actives).
```

Remarquez les trois marqueurs d'un bon runbook : des **commandes copiables** (pas « vérifier Redis », mais *la* commande), des **seuils concrets** (> 95, < 2 s), et les **interdits** avec leur raison (« ne pas redémarrer Redis, perte des sessions »). Les barrières de Chesterton de l'exploitation.

## Pourquoi ça vaut double à l'ère des agents IA

1. **C'est ce qui transforme « ça devrait marcher » en « ça marche ».** Un agent qui dispose du runbook peut boucler : coder → lancer → **vérifier avec les commandes du runbook** → corriger. Sans lui, la boucle s'arrête à « coder » — et vous héritez de la vérification. Le runbook est le chaînon manquant de l'autonomie.
2. **C'est le brief parfait pour le diagnostic.** « L'API renvoie des 502, lis `docs/runbook.md` et diagnostique » : l'agent suit la procédure comme un opérateur de garde discipliné, colle les sorties de commandes, et s'arrête aux interdits. Vos procédures d'incident deviennent exécutables en langage naturel.
3. **L'IA le rédige à partir de vos incidents.** Le post-mortem d'hier soir est dans le chat, le canal Teams ou [les traces OTel]({{ site.baseurl }}/fr/2026/08/04/observer-ses-agents-opentelemetry/) ? « Rédige l'entrée de runbook correspondant à cet incident » — l'humain valide les seuils et les interdits, le dépôt mémorise. Chaque incident paie sa dette en documentation.

Et le lien avec l'outillage : les sections « Démarrer » et « Vérifier » sont exactement ce qu'on grave dans les fichiers de configuration d'agents (`copilot-setup-steps.yml`, scripts de build). Le runbook est la **version prose** — celle qui explique l'ordre et les pièges ; l'outillage est la version exécutable. Les deux se valident mutuellement.

## Commencer petit : le test de l'après-midi

N'écrivez pas le runbook exhaustif — écrivez les trois pages qui servent :

1. **Démarrage local** : suivez un nouveau venu (ou demandez à un agent d'essayer en partant de zéro) et notez chaque accroc. Chaque accroc est une ligne de runbook.
2. **Le dernier incident** : sa procédure de diagnostic, tant qu'elle est fraîche.
3. **La procédure qui fait peur** : celle que seul « celui qui sait » ose faire — rollback, migration manuelle, purge. C'est la plus urgente à écrire.

## Le mot d'honnêteté

- **Un runbook périmé est dangereux** — plus qu'un glossaire périmé : on l'exécute pendant un incident, sous stress. Le garde-fou : datez chaque procédure (« vérifiée le 2026-08-05 ») et rejouez les critiques à froid, idéalement en demandant à un agent de les dérouler en environnement de test. Un runbook que personne ne rejoue est une légende urbaine.
- **Jamais de secrets dedans.** Le runbook dit *où* trouver les credentials (« vault, chemin `apps/orders`»), jamais leur valeur. Il sera lu par des humains, des agents, et un jour par [un attaquant via une injection]({{ site.baseurl }}/fr/2026/07/10/securiser-github-copilot/) — écrivez-le en le sachant.
- **Ça ne remplace pas l'automatisation.** Une procédure exécutée trois fois mérite un script ; le runbook documente alors *quand* lancer le script et comment vérifier qu'il a réussi. La prose recule à mesure que l'outillage avance — c'est le but.

## En résumé

- Le savoir opérationnel — démarrer, vérifier, diagnostiquer, réparer — est le plus **tribal** de tous ; le runbook le capture dans le dépôt, versionné et relu comme le reste.
- Un bon runbook a des **commandes copiables, des seuils concrets et des interdits motivés** — pas des généralités.
- Pour un agent, c'est le chaînon de l'autonomie : il transforme « ça devrait marcher » en **boucle vérifiée**, et vos procédures d'incident en diagnostics exécutables.
- Commencez par **trois pages** : le démarrage local, le dernier incident, la procédure qui fait peur. Et faites rédiger les suivantes par l'IA après chaque incident — l'humain valide, le dépôt mémorise.

La prochaine fois qu'un agent vous dit « ça devrait marcher », vous saurez quoi répondre : « le runbook est dans docs/, vérifie. » Et ça, franchement… c'est pas sorcier.
