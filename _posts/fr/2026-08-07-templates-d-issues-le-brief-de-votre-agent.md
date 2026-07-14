---
layout: post
title: "Templates d'issues : le brief de votre agent — c'est pas sorcier !"
date: 2026-08-07 10:00:00
author: AClerbois
lang: fr
ref: issue-templates
image: /images/posts/issue-templates.png
tags: [github, issues, templates, AI, coding-agent, best-practices]
level: 200
---

Une issue GitHub classique : *« Le filtre marche pas bien sur mobile, à corriger. »* Assignée à un humain, elle déclenche trois allers-retours de questions — pénible mais rattrapable. Assignée à un agent IA, elle déclenche… une pull request. L'agent ne viendra pas à votre bureau demander « c'est quoi, *pas bien* ? » : il va **supposer**, avec aplomb, et vous livrer la mauvaise correction proprement testée.

Dans [l'article sur les sous-agents]({{ site.baseurl }}/fr/2026/07/29/copilot-sous-agents-decouper-le-travail/), on a vu que la qualité d'une délégation se joue dans le brief. Aujourd'hui, on institutionnalise : le **template d'issue**, ce vieux outil GitHub un peu oublié, est devenu le gabarit de prompt de vos agents. Vous allez voir : c'est pas sorcier.

<!--more-->

## L'issue a changé de lecteur

Pendant quinze ans, une issue était une note pour un collègue : le contexte manquant se récupérait au café, l'implicite était toléré. Ce contrat vient de changer : une issue peut désormais être **exécutée** — assignée à un coding agent qui va cloner, coder, tester et ouvrir une PR sans poser une seule question intermédiaire.

L'issue est donc devenue un **prompt**. Et tout ce qu'on sait des prompts s'applique : le contexte compte, l'ambiguïté coûte, et ce qui n'est pas dit sera inventé. La différence avec le chat : l'issue est *asynchrone* — pas de rattrapage conversationnel. Le brief doit être complet **avant** le départ.

Bonne nouvelle : GitHub a déjà l'outil pour imposer un brief complet — les *issue forms*, des templates structurés en YAML dans `.github/ISSUE_TEMPLATE/`.

## Le template pensé pour un agent

```yaml
# .github/ISSUE_TEMPLATE/feature.yml
name: Fonctionnalité
description: Une tâche exécutable par un humain ou un agent
body:
  - type: textarea
    id: contexte
    attributes:
      label: Contexte
      description: Le problème métier, pas la solution technique
    validations:
      required: true
  - type: textarea
    id: acceptation
    attributes:
      label: Critères d'acceptation
      description: Liste vérifiable — chaque ligne doit être testable
      placeholder: |
        - [ ] Le filtre prix s'applique à la liste ET à la carte
        - [ ] Un filtre vide n'envoie pas de requête
    validations:
      required: true
  - type: textarea
    id: zone
    attributes:
      label: Zone de travail
      description: Fichiers, dossiers ou tranche concernés (au mieux de votre connaissance)
  - type: textarea
    id: hors-perimetre
    attributes:
      label: Hors périmètre
      description: Ce qu'il ne faut PAS toucher, et pourquoi
```

Quatre rubriques, quatre fonctions précises :

| Rubrique | Ce qu'elle évite |
| --- | --- |
| **Contexte** (le problème, pas la solution) | l'agent qui optimise une mauvaise interprétation |
| **Critères d'acceptation** vérifiables | le « terminé » autoproclamé — chaque case devient un test |
| **Zone de travail** | vingt minutes d'exploration, et les modifications hors sujet |
| **Hors périmètre** | le refactoring surprise de trois mille lignes « tant qu'on y est » |

La rubrique « hors périmètre » est la plus rentable et la moins répandue. Un humain sent les limites implicites ; un agent ne connaît que les explicites. « Ne touche pas au calcul de TVA (voir ADR-0021), ne migre pas les anciens appels » — deux lignes qui économisent une revue de PR douloureuse.

## Les critères d'acceptation : le cœur du réacteur

Regardez la mécanique de bout en bout : un critère d'acceptation bien écrit devient successivement le **plan** de l'agent, ses **tests**, et votre **checklist de revue**. Trois usages pour une ligne — à condition qu'elle soit *vérifiable* :

- ❌ « Le filtre doit bien marcher sur mobile » — invérifiable, donc invérifié.
- ✅ « Sur un écran < 640 px, le panneau de filtres s'ouvre en tiroir et le bouton Appliquer reste visible sans scroll » — l'agent sait quoi construire, le test sait quoi vérifier, le reviewer sait quoi regarder.

C'est exactement la logique du **livrable exigé** des [sous-agents]({{ site.baseurl }}/fr/2026/07/29/copilot-sous-agents-decouper-le-travail/), déplacée dans l'outil de tracking — là où toute l'équipe la voit.

## Pourquoi ça vaut double à l'ère des agents IA

1. **Le template est un garde-fou pour le rédacteur humain.** Les champs `required` transforment « le filtre marche pas » en brief complet — la friction est au bon endroit : deux minutes à l'écriture plutôt qu'un aller-retour de PR ratée.
2. **L'issue bien formée devient déléguable telle quelle.** `/delegate` depuis [Copilot CLI]({{ site.baseurl }}/fr/2026/07/24/copilot-cli-4-deleguer-et-automatiser/) ou une assignation au coding agent : si le brief est dans l'issue, la délégation est un clic. Si le brief est dans votre tête, chaque délégation redevient une séance d'écriture.
3. **L'IA aide aussi en amont.** « Transforme cette demande floue du client en issue suivant notre template » : l'agent structure, *vous* validez les critères d'acceptation — la division du travail habituelle. Certaines équipes ont même un agent qui relit les issues entrantes et signale les rubriques creuses avant qu'un humain (ou un autre agent) ne perde du temps dessus.

## Le mot d'honnêteté

- **Un template ne remplace pas le discernement.** Remplir « hors périmètre : rien de particulier » pour aller vite, c'est saboter l'outil. Le template structure la réflexion ; il ne l'exécute pas à votre place.
- **Trop de champs tue le template.** Douze rubriques obligatoires et les gens contournent (ou remplissent n'importe quoi, c'est pire). Quatre rubriques bien choisies suffisent — la sélectivité, encore.
- **Toutes les issues ne sont pas pour des agents.** Une exploration ouverte (« investiguer la lenteur du dashboard ») se brief autrement qu'une tâche fermée. Faites deux templates : *tâche exécutable* (le formulaire ci-dessus) et *investigation* (symptômes, pistes, définition de « élucidé »).

## En résumé

- Une issue n'est plus une note pour un collègue : c'est potentiellement un **prompt exécuté tel quel** par un agent — l'implicite ne pardonne plus.
- Les *issue forms* GitHub (`.github/ISSUE_TEMPLATE/*.yml`) imposent le brief complet : **contexte, critères d'acceptation vérifiables, zone de travail, hors périmètre**.
- Le critère d'acceptation bien écrit sert **trois fois** : plan de l'agent, test, checklist de revue. Le « hors périmètre » est la rubrique la plus rentable — les limites implicites n'existent pas pour une machine.
- Et l'IA aide des deux côtés : elle **structure** les demandes floues en issues propres, et elle **exécute** les issues propres en PR.

Demain, on regarde justement ce qui se passe après l'assignation : le coding agent GitHub, de l'issue à la pull request. Le template d'aujourd'hui est le carburant de demain. D'ici là… c'est pas sorcier.
