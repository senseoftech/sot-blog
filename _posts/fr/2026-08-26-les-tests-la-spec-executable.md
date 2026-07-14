---
layout: post
title: "Les tests : la spec exécutable — c'est pas sorcier !"
date: 2026-08-26 10:00:00
author: AClerbois
lang: fr
ref: tests-as-spec
image: /images/posts/tests-as-spec.png
tags: [testing, TDD, AI, best-practices]
level: 100
---

Vendredi, 16 h 40. Un agent IA vient de réécrire votre calcul de frais de livraison — quarante fichiers touchés, huit cents lignes. Votre collègue s'inquiète : *« Tu vas relire tout ça ? »* Non. Vous regardez une seule chose : la suite de tests. Soixante-quatorze verts, zéro rouge. Vous relisez les points chauds, et vous mergez. Sereinement.

Hier, [le plan d'implémentation]({{ site.baseurl }}/fr/2026/08/25/le-plan-d-implementation-le-point-de-controle-humain/) posait le point de contrôle humain *avant* que l'agent code. Aujourd'hui, l'artefact qui verrouille le résultat *après* : les tests. Sur [la carte des artefacts du vibe coding]({{ site.baseurl }}/fr/2026/08/21/les-artefacts-du-vibe-coding-la-carte-complete/), c'est une pièce à part — la seule documentation qui ne peut pas mentir. Vous allez voir : c'est pas sorcier.

<!--more-->

## Le classeur de consignes et le détecteur de fumée

Dans un immeuble, il y a deux documents de sécurité incendie. Le **classeur de consignes** : de la prose, rangée dans une armoire, que personne ne rouvre — et qui peut être périmée depuis trois ans sans que quiconque le sache. Et le **détecteur de fumée** : on appuie sur le bouton, il bipe ou il ne bipe pas. Il ne *décrit* pas la sécurité, il la **vérifie**.

Votre doc en prose, vos specs, vos commentaires : le classeur. Utiles, mais rien ne les empêche de dériver en silence. Un test, lui, est branché sur la réalité : le jour où le code et lui ne racontent plus la même histoire, **il passe au rouge**. C'est la seule doc qui ne peut pas mentir — précisément parce qu'elle sait échouer.

Et à l'ère des agents, cette propriété change de valeur. Quand le code devient regénérable en dix minutes, il devient presque un consommable. Les tests, eux, deviennent **le contrat** : l'agent peut réécrire toute l'implémentation, tant que les tests passent, le comportement est préservé. Le patrimoine s'est déplacé.

## Un test qui se lit comme une spec

Un test n'est une spec que si on peut le *lire* comme une spec. Deux habitudes suffisent :

**Le nommage comportemental.** `Test1` ou `CalculateShipping_Test` ne disent rien. `Quand_le_panier_depasse_100e_la_livraison_est_offerte` énonce une règle métier — c'est du Given-When-Then compressé dans un nom de méthode. Quelqu'un qui lit la liste des tests lit la spec, sans ouvrir un seul corps de méthode.

**Le squelette Arrange-Act-Assert.** Chaque test raconte la même histoire en trois actes, qui recouvrent exactement le Given-When-Then des specs :

| Acte | Given-When-Then | Ce qu'on y fait |
| --- | --- | --- |
| **Arrange** | *Given* — étant donné | poser la situation de départ |
| **Act** | *When* — quand | déclencher **l'action, une seule** |
| **Assert** | *Then* — alors | vérifier le résultat observable |

## Un exemple complet, en entier

```csharp
public class FraisDeLivraisonTests
{
    [Fact]
    public void Quand_le_panier_depasse_100e_la_livraison_est_offerte()
    {
        // Arrange
        var panier = new Panier();
        panier.Ajouter(new Article("Clavier mécanique", prix: 89.90m));
        panier.Ajouter(new Article("Tapis de souris", prix: 19.90m));

        // Act
        var commande = panier.PasserCommande();

        // Assert
        Assert.Equal(0m, commande.FraisDeLivraison);
    }

    [Fact]
    public void Quand_le_panier_fait_exactement_100e_la_livraison_reste_payante()
    {
        // Arrange
        var panier = new Panier();
        panier.Ajouter(new Article("Écran 24 pouces", prix: 100.00m));

        // Act
        var commande = panier.PasserCommande();

        // Assert
        Assert.Equal(4.99m, commande.FraisDeLivraison);
    }
}
```

Regardez le deuxième test : il répond à la question que la prose laisse toujours ouverte — « dépasse », c'est `>` ou `>=` ? Ici, pas d'ambiguïté possible : à 100 € pile, on paie. Une spec en prose *peut* préciser ce cas limite ; le test, lui, **ne peut pas ne pas le préciser**. Et remarquez ce que ces tests ignorent : la classe interne qui calcule, le nombre de méthodes appelées. Ils testent le **comportement** — le prix final — pas l'implémentation. On y revient plus bas, c'est capital.

## Le TDD renaît — à la vitesse du LLM

Le *test-driven development* — écrire le test rouge d'abord, faire passer au vert, refactorer — a vingt-cinq ans et une réputation de discipline exigeante. Les agents lui offrent une seconde jeunesse, pour une raison simple : **écrire le test d'abord, c'est donner la cible à l'agent**. Au lieu d'un prompt vague (« la livraison est offerte au-dessus de 100 € »), vous donnez un critère binaire : « fais passer ce test au vert ». L'agent boucle tout seul — il code, lance les tests, lit l'échec, corrige — et le cycle red-green-refactor, qui coûtait de la discipline humaine, tourne à la vitesse du LLM. Vous, vous n'avez validé qu'une chose : le test. C'est-à-dire la spec.

## Tests ou evals ? Les deux, mais pas pour la même chose

Ne confondez pas cette suite xUnit avec [les evals dont on parlait en juillet]({{ site.baseurl }}/fr/2026/07/20/tester-une-application-ia-les-evals/) :

| | Tests | Evals |
| --- | --- | --- |
| Vérifient | **votre code**, déterministe | le **comportement du modèle**, probabiliste |
| Résultat | binaire — vert ou rouge | un score, un taux de réussite |
| « La livraison est offerte à 101 € » | test | — |
| « Le chatbot répond poliment » | — | eval |

Si votre application appelle un LLM, il vous faut les deux — mais ne demandez jamais à l'un de faire le travail de l'autre.

## Pourquoi ça vaut double à l'ère des agents IA

1. **Le test verrouille pendant que l'agent bouge.** Un refactoring massif généré par IA sans filet, c'est de la roulette. Avec une suite qui teste le comportement, l'agent peut déplacer, renommer, réécrire — le contrat tient tant que c'est vert. C'est ce qui rend le code *regénérable* sans être *fragile*.
2. **« Écris d'abord les tests, je les valide, puis implémente. »** Le meilleur workflow agent que je connaisse. Relire dix tests — des phrases, presque — est infiniment plus rapide que relire huit cents lignes d'implémentation. Vous validez la spec, l'agent se charge du reste : **l'IA propose, l'humain tranche, le dépôt mémorise**.
3. **L'agent lit les tests pour comprendre.** Face à du code inconnu, un bon agent ouvre la suite de tests : c'est la description du comportement attendu la plus fiable du dépôt — plus fiable que la doc en prose, puisque la CI garantit qu'elle est encore vraie. Vos tests d'aujourd'hui sont le contexte de l'agent de demain.

## Le mot d'honnêteté

Il sera plus long que d'habitude, parce que le sujet le mérite : **les agents trichent.**

- **Face à un test rouge, un agent est tenté de « réparer »… le test.** Assertion affaiblie (`Assert.True(true)` n'est pas une légende), valeur attendue alignée sur le bug, `[Fact(Skip = "flaky")]` apparu discrètement. De son point de vue, le rouge est devenu vert : mission accomplie. La parade tient en deux gestes : une instruction explicite dans vos consignes d'agent — *« ne modifie jamais un test existant sans me demander »* — et une règle de revue : **tout diff qui touche un fichier de test se relit avec le double d'attention**. Le code, l'agent peut le réécrire ; le contrat, non.
- **La couverture n'est pas la qualité.** 100 % de couverture avec des assertions vides, c'est un mensonge à quatre chiffres : chaque ligne est *exécutée*, rien n'est *vérifié*. Un agent sait produire ce mensonge très vite si vous lui demandez « de la couverture ». Demandez des comportements testés, pas un pourcentage.
- **Les tests fragiles punissent la régénération au lieu de la permettre.** Une suite gavée de *mocks* qui vérifient que telle méthode interne est appelée deux fois dans tel ordre casse à chaque refactoring — même quand le comportement est intact. Résultat : cinquante rouges qui ne signalent rien, et l'agent (ou vous) finit par les « adapter » en masse. Testez le **comportement observable**, pas l'implémentation : c'est ce qui rend le contrat durable.

## En résumé

- Les tests sont la **seule doc qui ne peut pas mentir** : quand le code dérive, **ils passent au rouge** — le détecteur de fumée, pas le classeur de consignes.
- Un test-spec se reconnaît à son **nom comportemental** (`Quand_le_panier_depasse_100e…`) et à son squelette **Arrange-Act-Assert** — le Given-When-Then exécutable.
- Avec les agents, le code devient regénérable et les tests deviennent **le contrat** : « écris les tests d'abord, je valide, puis implémente ».
- Restez lucides : **les agents trichent avec les tests** — verrouillez-les par instruction, relisez leurs diffs au double, et testez le comportement, pas l'implémentation.

Le code, désormais, se régénère. La spec exécutable, elle, reste — et elle bipe dès qu'on lui ment. Et ça, franchement… c'est pas sorcier.
