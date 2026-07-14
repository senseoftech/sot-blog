---
layout: post
title: "Linters et analyzers : les conventions qui s'appliquent toutes seules — c'est pas sorcier !"
date: 2026-08-28 10:00:00
author: AClerbois
lang: fr
ref: automated-conventions
image: /images/posts/automated-conventions.png
tags: [dotnet, code-quality, analyzers, AI, best-practices]
level: 100
---

Revue de pull request, mardi matin. Dix-neuf commentaires, dont quatorze qui disent en substance : « ici, `var` », « using inutilisé », « l'interface sans `I`, on avait dit non ». Le nouveau développeur encaisse poliment, corrige, repousse. La semaine suivante, mêmes remarques — sur le code d'un agent IA cette fois. Personne n'a relu le *sens* de la PR : tout le budget d'attention est parti dans la forme.

Hier, [les schémas et contrats]({{ site.baseurl }}/fr/2026/08/27/schemas-et-contrats-le-contexte-machine-verifiable/) montraient une idée puissante : la règle que la machine applique elle-même. Aujourd'hui, même famille, appliquée à vos conventions de code : les **linters et analyzers**. La meilleure convention est celle qu'on n'a plus besoin d'expliquer — ni au nouveau, ni à l'agent. Vous allez voir : c'est pas sorcier.

<!--more-->

## Les glissières de sécurité

On ne briefe pas chaque conducteur sur le tracé de la route. On ne colle pas un post-it « attention, virage à gauche au km 12 » sur chaque pare-brise. On pose une **glissière de sécurité** : elle est là, tout le temps, pour tout le monde, et elle rattrape de la même façon le chauffeur expérimenté, le conducteur du dimanche — et la voiture autonome.

Vos conventions de code méritent le même traitement. Il existe une échelle, et chaque barreau vaut dix fois le précédent :

- **La convention orale** — « on avait dit en réunion que… ». Elle meurt avec le turnover, et l'agent IA ne l'a jamais entendue.
- **La convention écrite** — une page dans le wiki, une ligne dans [AGENTS.md]({{ site.baseurl }}/fr/2026/08/22/agents-md-le-guide-d-onboarding-de-votre-ia/). Mieux : elle se lit. Mais rien n'oblige à la respecter.
- **La convention appliquée** — un outil la vérifie à chaque build. Plus besoin de l'expliquer : la glissière rattrape tout le monde pareil, humain ou IA.

Dans [la carte des artefacts du vibe coding]({{ site.baseurl }}/fr/2026/08/21/les-artefacts-du-vibe-coding-la-carte-complete/), c'est la famille la plus rentable : celle qu'on configure une fois et qui travaille à chaque commit.

## L'arsenal .NET

Bonne nouvelle pour les devs .NET : tout est déjà dans la boîte. Cinq outils, cinq moments où la glissière vous rattrape :

| Outil | Ce qu'il fait | Où il vous rattrape |
| --- | --- | --- |
| **`.editorconfig`** | déclare le style *et* la sévérité de chaque règle | dans l'IDE, pendant la frappe |
| **Analyzers Roslyn** | règles `CAxxxx` + analyzers de packages (xUnit, EF Core…) | à la compilation |
| **`dotnet format`** | ne signale pas : **corrige** | avant le commit |
| **`TreatWarningsAsErrors`** | transforme l'avertissement en mur | au build |
| **Hook pre-commit + CI** | le dernier filet, non négociable | avant le merge |

Le point clé : depuis .NET 5, les analyzers Roslyn sont livrés avec le SDK, et l'`.editorconfig` pilote leur sévérité. Un seul fichier, versionné à la racine du dépôt, relu en PR comme le reste.

## Un exemple concret, en entier

Un extrait d'`.editorconfig` réaliste — chaque règle est une remarque de review qui n'existera plus jamais :

```ini
root = true

[*.cs]
# var quand le type est évident — fini le débat en review
csharp_style_var_when_type_is_apparent = true:warning

# Un using inutilisé ne passe pas le build
dotnet_diagnostic.IDE0005.severity = error

# System.* d'abord dans les usings, toujours
dotnet_sort_system_directives_first = true

# Interface sans préfixe I = erreur de build, pas un post-it
dotnet_naming_rule.interfaces_prefixed.symbols  = interface_group
dotnet_naming_rule.interfaces_prefixed.style    = prefix_i
dotnet_naming_rule.interfaces_prefixed.severity = error
dotnet_naming_symbols.interface_group.applicable_kinds = interface
dotnet_naming_style.prefix_i.required_prefix    = I
dotnet_naming_style.prefix_i.capitalization     = pascal_case

# Le nullable ne pardonne pas : déréférencement possible = erreur
dotnet_diagnostic.CS8602.severity = error
dotnet_diagnostic.CS8618.severity = error
```

Et le verrou côté projet, trois lignes dans le `.csproj` (ou mieux, un `Directory.Build.props` pour toute la solution) :

```xml
<PropertyGroup>
  <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
  <EnforceCodeStyleInBuild>true</EnforceCodeStyleInBuild>
  <AnalysisLevel>latest-recommended</AnalysisLevel>
</PropertyGroup>
```

À partir de là, le calcul est simple : **chaque règle automatisée, c'est une ligne de moins dans votre [AGENTS.md]({{ site.baseurl }}/fr/2026/08/22/agents-md-le-guide-d-onboarding-de-votre-ia/) et une remarque de moins en review**. La doc d'instructions raconte ce qui demande du jugement ; la glissière s'occupe du reste.

## Pourquoi ça vaut double à l'ère des agents IA

Trois raisons, et la première est la plus belle :

1. **La boucle de feedback corrige l'agent sans un token.** L'agent génère du code, compile, lit le warning-devenu-erreur (`CS8602: possible null dereference`), et se corrige — tout seul, dans la même session, sans que vous écriviez un mot. Un message d'erreur de build est le prompt le plus efficace du monde : précis, contextuel, gratuit.
2. **L'agent respecte l'`.editorconfig` qu'il détecte.** Les agents modernes lisent ce fichier comme ils lisent votre code : ils y voient vos préférences de style et les adoptent dès la première génération. La convention appliquée est aussi une convention *lisible* — machine-vérifiable et machine-compréhensible, comme les contrats d'hier.
3. **La review humaine se libère de la forme pour juger le fond.** Quand l'agent produit en une heure ce qu'un dev écrivait en une semaine, les quatorze remarques de style deviennent intenables. Le linter les absorbe toutes ; l'humain garde les cinq qui parlent d'architecture et de sens. La formule de la série, poussée un cran plus loin : **l'IA propose, la règle tranche, l'humain n'arbitre que ce qui en vaut la peine**.

## Le mot d'honnêteté

- **Le linter vérifie la forme, jamais le sens.** Un code parfaitement formaté peut être parfaitement faux. Zéro warning ne dit rien de la logique métier — c'est le rôle des [tests]({{ site.baseurl }}/fr/2026/08/26/les-tests-la-spec-executable/), des reviews et des specs. La glissière empêche de sortir de la route ; elle ne dit pas si vous roulez dans la bonne direction.
- **2 000 warnings ignorés = du bruit qui noie tout le monde.** Un build qui crache deux mille avertissements « habituels » apprend aux humains à ne plus lire — et noie l'agent sous un contexte inutile où le warning important devient invisible. La seule politique tenable : **zéro warning, ou rien**. D'où `TreatWarningsAsErrors`.
- **Activer 200 règles d'un coup sur un legacy = douleur garantie.** Le build passe au rouge pour trois jours et l'équipe déteste l'outil avant d'en avoir vu la valeur. Allez-y **par vagues** : une poignée de règles en `error`, le reste en `suggestion`, puis on monte la sévérité vague après vague — et `dotnet format` éponge l'existant à chaque étape.

## En résumé

- L'échelle des conventions : **orale < écrite < appliquée** — la meilleure est celle qu'on n'explique plus, parce qu'une glissière la fait respecter, pour l'humain comme pour l'agent.
- L'arsenal .NET est déjà dans le SDK : **`.editorconfig` + analyzers Roslyn + `dotnet format` + `TreatWarningsAsErrors` + CI qui bloque**.
- Chaque règle automatisée = **une ligne de moins dans AGENTS.md, une remarque de moins en review** — la doc garde le jugement, l'outil garde la forme.
- Avec les agents : **la boucle build-erreur-correction pilote l'IA sans un token**, et la review humaine se concentre enfin sur le sens — critique quand le volume de code généré explose.

Une glissière ne fait pas la conversation, ne se fatigue pas, ne laisse rien passer un vendredi à 17 h. Configurez-la une fois, et vos conventions s'appliquent toutes seules — au dev du sprint 24 comme à l'agent de ce soir. Et ça, franchement… c'est pas sorcier.
