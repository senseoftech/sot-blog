---
layout: post
title: "Runbooks et postmortems : la mémoire des nuits blanches — c'est pas sorcier !"
date: 2026-08-29 10:00:00
author: AClerbois
lang: fr
ref: runbooks-postmortems
image: /images/posts/runbooks-postmortems.png
tags: [operations, documentation, AI, best-practices]
level: 100
---

03 h 12. Le téléphone vibre : *« api-http-5xx — taux d'erreur au-dessus du seuil »*. Vous ouvrez le laptop, l'API répond 503, et votre cerveau — qui dormait il y a quatre minutes — doit reconstituer de mémoire ce que le collègue avait fait « la dernière fois ». C'était quoi, déjà, la commande ? Le code dit comment le système marche. Rien ne dit quoi faire quand il ne marche *plus*.

Hier, on a vu [les linters et analyzers]({{ site.baseurl }}/fr/2026/08/28/linters-analyzers-les-conventions-qui-s-appliquent-toutes-seules/) — les conventions qui se font respecter toutes seules. Aujourd'hui, l'avant-dernière pièce de [la carte des artefacts]({{ site.baseurl }}/fr/2026/08/21/les-artefacts-du-vibe-coding-la-carte-complete/) : le **runbook** et le **postmortem**, le savoir opérationnel. Vous allez voir : c'est pas sorcier.

<!--more-->

## La check-list du pilote

Quand un moteur lâche en vol, le pilote ne brainstorme pas. Il sort la check-list et il la **déroule** : étape 1, étape 2, étape 3. Non pas parce qu'il est incompétent — précisément parce qu'il est compétent : l'aviation a compris depuis un siècle qu'un cerveau sous stress est un mauvais improvisateur. On réfléchit *avant*, à tête reposée ; à 3 h du matin, on exécute.

Le runbook, c'est exactement ça : la check-list écrite par le vous calme d'il y a trois semaines, pour le vous paniqué de cette nuit. Et le postmortem, c'est le débriefing d'après-vol : pourquoi ça a cassé, et qu'est-ce qu'on change dans la check-list pour la prochaine fois.

## L'anatomie d'un runbook

Un runbook = un fichier Markdown par panne connue, dans le dépôt (`docs/runbooks/`), versionné et relu en PR comme le reste. Quatre rubriques, toujours les mêmes :

| Rubrique | La question à laquelle elle répond |
| --- | --- |
| **Symptôme** | quelle alerte, quel comportement observé ? |
| **Diagnostic** | quelles commandes lancer, dans quel ordre, avec quels seuils ? |
| **Remédiation** | quelle action pour rétablir le service — et combien de temps ça prend ? |
| **Escalade** | à partir de quand on réveille qui, sur quel canal ? |

La règle d'or : les **vraies commandes**, copiables-collables. « Vérifier la base de données » n'est pas une étape de runbook ; c'est un vœu pieux. Une étape de runbook, c'est une commande, un résultat attendu, un seuil.

## Un exemple concret, en entier

```markdown
# Runbook — L'API répond 503

## Symptôme
Alerte `api-http-5xx` : plus de 5 % de réponses 503 sur 5 minutes.
Cause la plus fréquente (3 incidents sur 4) : pool de connexions SQL épuisé.

## Diagnostic
1. Confirmer :
   curl -s -o /dev/null -w "%{http_code}" https://api.contoso.com/health
   → 503 = incident en cours, continuer.
2. Chercher la signature du pool dans les logs :
   kubectl logs deploy/api --since=10m | grep -c "max pool size was reached"
   → > 0 : c'est bien le pool. Sinon, voir runbook « API 503 — autres causes ».
3. Compter les connexions dormantes côté SQL Server :
   SELECT COUNT(*) FROM sys.dm_exec_sessions
   WHERE program_name LIKE 'api-%' AND status = 'sleeping';
   → seuil : au-delà de 80 (Max Pool Size = 100), le pool fuit.

## Remédiation
- kubectl rollout restart deploy/api
  → libère les connexions fantômes. Retour à la normale : ~2 min.
- Vérifier : le taux de 503 doit repasser sous 1 % en 5 min.

## Escalade
- Récidive sous 30 min → astreinte data (#incident-api), c'est une fuite
  de connexions dans le code, pas un incident d'infra.
- Ne PAS augmenter Max Pool Size à chaud : ça masque la fuite
  (voir postmortem du 2026-05-14).
```

Remarquez la dernière ligne : le runbook connaît **l'erreur tentante** et l'interdit explicitement, avec un lien vers la nuit où on l'a apprise. C'est ça, du savoir opérationnel.

## Le postmortem : blameless, sinon rien

Une fois le service rétabli et la nuit dormie, on écrit le **postmortem** : la chronologie (qui a vu quoi, quand), la **cause racine** (pas « Kevin a poussé un bug » — *pourquoi* le bug a pu passer et *pourquoi* il a fait tomber la prod), et les **actions** correctives. *Blameless* : on cherche les failles du système, pas un coupable. Un postmortem qui désigne quelqu'un garantit une chose — la prochaine fois, on vous cachera des informations.

Et surtout, le lien qui referme la boucle : **chaque postmortem engendre ou améliore un runbook**. L'incident du pool SQL a produit le runbook ci-dessus ; la fausse bonne idée du `Max Pool Size` y est entrée après le deuxième incident. La check-list du pilote s'écrit avec les pannes des vols précédents.

## 2026 : le runbook devient exécutable

Nouveauté de l'ère des agents : un runbook en Markdown, avec de vraies commandes et des seuils explicites, c'est déjà — mot pour mot — une procédure qu'un agent sait dérouler. Transformez-le en [skill ou slash command]({{ site.baseurl }}/fr/2026/07/02/github-copilot-skills-instructions-agents-mcp/) (`/diagnose-503`), et la doc que l'astreinte *lisait* devient la procédure que l'agent *exécute* : il lance le `curl`, compte les sessions SQL, compare au seuil, et vous présente le verdict. La frontière entre documentation et automatisation n'a jamais été aussi fine.

## Pourquoi ça vaut double à l'ère des agents IA

1. **En incident, l'agent déroule la check-list sans paniquer — lui.** Donnez-lui accès à `docs/runbooks/` : à 3 h du matin, il exécute les étapes de diagnostic dans l'ordre, sans sauter la 2 parce qu'il « sent » que c'est la 4, et vous restitue les faits. Le pilote, c'est toujours vous ; lui, c'est le copilote qui lit la check-list à voix haute.
2. **L'agent rédige le brouillon du postmortem.** Chronologie depuis les logs, les alertes et le fil Slack : c'est un travail de compilation où il excelle. L'humain valide la cause racine et décide des actions — la formule de la série, en version nocturne : **l'IA propose, l'humain tranche, le dépôt mémorise**.
3. **Runbook → skill : la boucle complète.** L'incident produit un postmortem, le postmortem améliore le runbook, le runbook devient une procédure exécutable — avec l'humain dans la boucle pour toute action qui détruit ou modifie. Chaque nuit blanche rend la suivante moins probable, et plus courte.

## Le mot d'honnêteté

- **Un runbook jamais déroulé est de la fiction.** Les commandes vieillissent, les URLs changent, les seuils dérivent. Testez-le à froid — comme un extincteur : on vérifie qu'il marche *avant* l'incendie. Un « game day » par trimestre où quelqu'un déroule la procédure sur un environnement de test suffit.
- **Le postmortem sans suivi d'actions est du théâtre.** Une réunion émue, un document sincère, zéro action livrée : l'incident reviendra. Chaque action a un **responsable** et une **échéance**, trackés comme n'importe quel ticket.
- **Ne laissez pas un agent exécuter seul les remédiations destructives.** Dérouler le diagnostic : oui. Proposer la remédiation : oui. `rollout restart` validé d'un clic : d'accord. Mais tout ce qui supprime, tronque ou écrase — c'est un humain qui appuie. Restart oui, `DROP TABLE` non.

## En résumé

- Le code dit comment le système marche ; le **runbook** dit quoi faire quand il ne marche plus ; le **postmortem** dit pourquoi il avait cassé.
- Un runbook = **symptôme, diagnostic, remédiation, escalade** — avec les vraies commandes et les vrais seuils, dans `docs/runbooks/`, versionné.
- Le postmortem est **blameless**, avec des actions **portées et datées** — et chaque postmortem **améliore un runbook** : la boucle du savoir opérationnel.
- Avec les agents : l'IA **déroule la check-list** en incident, **rédige le brouillon** du postmortem, et le runbook devient **exécutable** — l'humain gardant la main sur le destructif.

On ne réfléchit pas à 3 h du matin : on déroule la check-list que le vous reposé a écrite — et que chaque incident a rendue meilleure. Et ça, franchement… c'est pas sorcier.
