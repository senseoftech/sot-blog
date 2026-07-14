---
layout: post
title: "Tool calling : comment un LLM appelle vraiment vos fonctions — c'est pas sorcier !"
date: 2026-07-29 10:00:00
author: AClerbois
lang: fr
ref: tool-calling
image: /images/posts/tool-calling.png
tags: [AI, LLM, tool-calling, function-calling, MCP]
---

Tout ce blog repose sur une petite phrase répétée partout : *« l'agent appelle un outil »*. Copilot lance vos tests, [votre serveur MCP]({{ site.baseurl }}/fr/2026/07/13/premier-serveur-mcp-dotnet/) répond au modèle, [Agent Framework]({{ site.baseurl }}/fr/2026/07/11/microsoft-agent-framework-equipe-agents-ia/) exécute vos function tools… Mais concrètement, **comment** un modèle qui ne sait que produire du texte « appelle »-t-il une fonction C# ?

Réponse courte, et c'est la révélation du jour : **il ne l'appelle pas.** Il demande poliment. On démonte le mécanisme — le chaînon manquant de toute la série. Vous allez voir : c'est pas sorcier.

<!--more-->

## La révélation : le modèle n'exécute rien

Un LLM produit des tokens, [rien d'autre]({{ site.baseurl }}/fr/2026/07/05/tokens-llm-envoyes-sortie-cache/). Quand on dit qu'il « appelle GetStock », voici ce qui se passe réellement :

1. Le modèle **écrit un message spécial**, structuré : *« je souhaite appeler `GetStock` avec `{"reference": "SKU-1234"}` »*.
2. **Votre code** (le harnais, le SDK, Copilot…) lit ce message, exécute la vraie fonction, et récupère le résultat.
3. Le résultat est **renvoyé au modèle comme un nouveau message**, et la conversation continue.

L'employé de la série n'a jamais eu les clés de l'atelier : il remplit des **bons de commande**, et c'est le harnais qui livre. Toute la sécurité du système tient dans cette séparation — c'est *votre* code qui exécute, donc c'est votre code qui peut [demander une approbation]({{ site.baseurl }}/fr/2026/07/11/microsoft-agent-framework-equipe-agents-ia/), refuser, ou valider.

## Le contrat : un JSON Schema (que vous écrivez déjà)

Comment le modèle sait-il quels outils existent et comment les remplir ? À chaque requête, on lui envoie **le catalogue** : pour chaque outil, un nom, une description, et un **JSON Schema** décrivant les paramètres. Vous en écrivez déjà sans le savoir :

```csharp
[McpServerTool, Description("Retourne le niveau de stock d'un produit à partir de sa référence.")]
public static int GetStock(
    [Description("La référence produit, par exemple SKU-1234.")] string reference)
```

…devient, sur le fil :

```json
{
  "name": "GetStock",
  "description": "Retourne le niveau de stock d'un produit à partir de sa référence.",
  "parameters": {
    "type": "object",
    "properties": { "reference": { "type": "string", "description": "La référence produit…" } },
    "required": ["reference"]
  }
}
```

D'où deux vérités déjà croisées, qui prennent ici tout leur sens : les **`[Description]` sont la vitrine** (c'est *littéralement* ce que le modèle lit pour choisir), et **le catalogue se paie en tokens à chaque tour** — quarante outils verbeux, c'est des milliers de tokens avant même votre question. MCP, function tools, Copilot : tous parlent ce même langage sous le capot.

## La boucle complète

Une question du type « quel est le stock du SKU-1234, et commande-en 50 si on est sous le seuil » déroule la mécanique en boucle :

> modèle → *appelle GetStock(SKU-1234)* → harnais exécute → *résultat : 12* → modèle → *appelle GetThreshold(SKU-1234)* → harnais exécute → *résultat : 20* → modèle → *appelle CreateOrder(SKU-1234, 50)* → **approbation humaine** → exécution → modèle → réponse finale rédigée.

Chaque flèche est un aller-retour de messages. C'est le [harnais]({{ site.baseurl }}/fr/2026/07/01/le-harnais-de-l-ia-github-copilot/), vu au microscope — et c'est pour ça qu'un agent « réfléchit » par étapes : il ne peut rien faire d'autre que lire les résultats et écrire la suite.

## Pourquoi ça déraille (et les remèdes)

**Les paramètres hallucinés.** Le modèle rédige ses bons de commande [comme il rédige tout : au plausible]({{ site.baseurl }}/fr/2026/07/16/pourquoi-l-ia-hallucine/). Une référence inventée, un enum approximatif (`"Urgent"` au lieu de `"High"`), une date au mauvais format. Remèdes : des **types stricts** dans le schéma (enums, formats, bornes — le SDK les génère depuis vos signatures C# typées), et un outil qui **revalide tout** à l'exécution ([règle déjà posée]({{ site.baseurl }}/fr/2026/07/26/serveur-mcp-en-production/)).

**Le catalogue obèse.** Quarante outils, et le modèle choisit mal — [la doc d'Agent Framework le dit crûment]({{ site.baseurl }}/fr/2026/07/11/microsoft-agent-framework-equipe-agents-ia/) : la sélection d'outils se dégrade avec leur nombre. Remèdes : moins d'outils mieux décrits, et des [sous-agents spécialisés]({{ site.baseurl }}/fr/2026/07/25/copilot-sous-agents-decouper-le-travail/) qui n'emportent chacun que leur trousse.

**L'erreur muette.** L'outil échoue avec `Exception of type 'System.Exception' was thrown` — et le modèle, qui *lit* les résultats, ne peut rien en faire. Retournez des **erreurs rédigées pour un lecteur** : *« référence inconnue ; les références valides ressemblent à SKU-1234 »* — et le modèle se corrige au tour suivant. L'erreur utile est un outil de pilotage.

## « Réponds en JSON » vs structured outputs : la prière et le contrat

Dernier étage, souvent confondu avec le tool calling : obtenir du modèle **une sortie structurée** (pour vos écrans, vos imports, vos pipelines).

- **La prière** : écrire « réponds uniquement en JSON » dans le prompt. Ça marche… souvent. Et un jour, un ` ```json ` d'enrobage, une virgule en trop, un champ renommé — et votre parseur casse.
- **Le contrat** : les **structured outputs**. Vous fournissez le schéma, et le fournisseur **contraint la génération elle-même** : à chaque token, seuls les tokens compatibles avec le schéma sont autorisés. Ce n'est plus une consigne, c'est une grammaire — le JSON est valide *par construction*.

En .NET, c'est le paramètre de format de réponse des SDK (et `GetResponseAsync<T>` dans `Microsoft.Extensions.AI`, qui désérialise directement vers votre type). La règle : **la forme par le contrat, le fond par les [évals]({{ site.baseurl }}/fr/2026/07/17/tester-une-application-ia-les-evals/)** — le schéma garantit du JSON valide, pas du JSON vrai.

## En résumé

- Le modèle **n'exécute jamais rien** : il rédige des demandes d'appel, votre harnais exécute — toute la sécurité vit dans cette séparation.
- Le contrat est un **JSON Schema** généré depuis vos signatures : les `[Description]` sont lues par le modèle, et le catalogue se paie à chaque tour.
- Les ratés classiques : paramètres plausibles-mais-faux (**types stricts + revalidation**), catalogue obèse (**moins d'outils, mieux décrits**), erreurs muettes (**rédigez-les pour un lecteur**).
- Pour les sorties structurées : le **contrat** (structured outputs) plutôt que la **prière** (« réponds en JSON ») — valide par construction, vrai à vérifier.

L'employé remplit des bons de commande, le harnais livre, et le schéma fait office de formulaire pré-imprimé : voilà tout le tool calling. Le chaînon manquant est posé. Et ça, franchement… c'est pas sorcier.
