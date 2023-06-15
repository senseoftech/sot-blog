---
layout: post
title:  "Le principe FIRST dans le Testing"
date:   2016-07-15 10:37:00
author: AClerbois
github_repo_username: aclerbois
github_repo : aclerbois
comments: true
image: https://miro.medium.com/v2/resize:fit:1200/1*v-usjN8zMK1JLJKV9Dzwuw.png
tags: [testing]
---

## Le Principe FIRST dans le Test

### Introduction

Le principe FIRST est un ensemble de conventions largement adoptées pour la rédaction de tests, en particulier de tests unitaires. L'acronyme FIRST se décompose comme suit :
<!-- more --> 
- **F**ast (Rapide)
- **I**solated/Independent (Isolé/Indépendant)
- **R**epeatable (Répétable)
- **S**elf-validating (Auto-validant)
- **T**imely (Opportun)

### Détails du Principe FIRST

1. **Fast (Rapide)** : Les tests doivent être rapides à exécuter. Les tests unitaires sont généralement exécutés fréquemment, donc plus ils sont rapides, mieux c'est. Si un test est lent, il est probable qu'il teste plus que ce qu'il ne devrait, ou qu'il a des dépendances qu'il ne devrait pas avoir.

2. **Isolated/Independent (Isolé/Indépendant)** : Chaque test doit être indépendant des autres. Cela signifie que l'ordre d'exécution des tests ne devrait pas affecter leurs résultats. Les tests ne devraient pas partager d'état ou de dépendances.

3. **Repeatable (Répétable)** : Un test doit produire le même résultat chaque fois qu'il est exécuté, indépendamment de l'environnement dans lequel il est exécuté. Cela signifie que le test ne devrait pas dépendre d'éléments spécifiques à un environnement, comme des fichiers spécifiques ou une configuration de base de données.

4. **Self-validating (Auto-validant)** : Un test doit être capable de se valider automatiquement. Cela signifie qu'il ne devrait pas nécessiter de vérification manuelle pour déterminer si le test a réussi ou non. Le test doit se terminer par une assertion qui réussit si le test passe et échoue si le test échoue.

5. **Timely (Opportun)** : Les tests doivent être écrits à temps. Dans le contexte du développement piloté par les tests (Test-Driven Development - TDD), cela signifie que les tests devraient être écrits avant le code qu'ils testent.

### Conclusion

Le principe FIRST est une feuille de route pour écrire des tests de qualité. Il nous aide à écrire des tests qui sont robustes, fiables, et utiles pour vérifier le bon fonctionnement de notre code. Il est essentiel que nous appliquions ces principes lors de la rédaction de nos tests pour garantir que nous construisons du logiciel de la meilleure qualité possible.
