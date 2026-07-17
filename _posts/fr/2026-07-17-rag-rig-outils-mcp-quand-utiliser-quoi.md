---
layout: post
title: "RAG, RIG, outils, MCP : quand utiliser quoi pour augmenter votre LLM — c'est pas sorcier !"
date: 2026-07-17 16:00:00
author: AClerbois
lang: fr
ref: llm-augmentation-guide
image: /images/posts/llm-augmentation-guide.png
tags: [AI, RAG, MCP, tool-calling, architecture]
level: 200
---

Un LLM sorti de sa boîte est un collègue brillant… amnésique, coupé du monde et figé à sa date d'entraînement. Il ne connaît ni vos documents, ni votre base de données, ni la météo de ce matin — et il ne *fait* rien : il ne sait que parler. Toute l'ingénierie des applications IA consiste à combler ces manques. Le problème, c'est l'étagère : RAG, RIG, tool calling, MCP, fine-tuning, contexte long, mémoire… on choisit trop souvent la techno au buzz plutôt qu'au besoin — et on se retrouve avec une base vectorielle pour interroger trois tables SQL.

Ce guide remet chaque outil devant le manque qu'il comble, avec un tableau de décision et — première sur ce blog — une **boîte interactive** pour vous accompagner dans le choix. C'est pas sorcier.

<!--more-->

## La bonne question : quel manque comblez-vous ?

Tout se simplifie quand on classe les technologies par **déficit comblé** plutôt que par popularité. Un LLM a quatre manques, et chaque famille d'outils en vise un :

| Le manque | La question à se poser | Les remèdes |
| --- | --- | --- |
| **Savoir** | « il ne connaît pas mes données » | contexte direct, RAG, RIG |
| **Agir** | « il ne peut rien exécuter » | tool calling, MCP |
| **Être** | « il ne parle pas comme il faut » | prompt engineering, fine-tuning |
| **Se souvenir** | « il oublie tout entre deux sessions » | mémoire conversationnelle |

L'erreur classique — et coûteuse — est de croiser les colonnes : fine-tuner pour injecter des connaissances (elles seront périmées au premier changement), ou vectoriser des données qui méritaient une requête SQL.

## Combler le « savoir » : trois outils, trois situations

**Le contexte direct — le plus simple qui marche.** Votre corpus est petit et stable (une doc produit, une FAQ, un règlement) ? Collez-le intégralement dans le prompt système. Avec les fenêtres actuelles et le [prompt caching]({{ site.baseurl }}/fr/2026/08/03/prompt-caching-sous-le-capot/) qui rend les préfixes répétés quasi gratuits (certains parlent de *cache-augmented generation*), cette approche « bête » bat un RAG mal réglé neuf fois sur dix. Ses limites : la taille du corpus et l'attention du modèle qui se dilue.

**Le RAG — la bibliothèque avec documentaliste.** Grande base documentaire, contenus qui bougent, questions ouvertes : on découpe, on vectorise, on récupère les passages pertinents au moment de la question. C'est le standard des bases de connaissances — on le démonte en détail dès demain dans [RAG et embeddings expliqués simplement]({{ site.baseurl }}/fr/2026/07/18/rag-embeddings-expliques-simplement/), puis en version code le 1er août.

**Le RIG — le fact-checker en direct.** Moins connu : *Retrieval-Interleaved Generation*. Là où le RAG récupère **une fois avant** de générer, le RIG laisse le modèle **interroger la source pendant qu'il génère** : il émet une mini-requête au moment d'écrire un chiffre, et la vraie valeur vient remplacer son estimation. C'est l'approche popularisée par DataGemma (Google) branché sur Data Commons, et elle vise un problème précis : les statistiques et valeurs numériques qu'un RAG classique cite mal. Prometteur, mais jeune — peu d'outillage prêt à l'emploi.

## Combler l'« agir » : les outils, et la prise qui les distribue

**Le tool calling** donne des bras au modèle : vous déclarez des fonctions (requête SQL, appel d'API, calcul, envoi de mail), le modèle choisit laquelle appeler et avec quels arguments, votre code exécute. C'est aussi le remède aux questions *exactes* : « les commandes du client X en mars » n'est pas une question sémantique, c'est un `WHERE` — une question structurée mérite une réponse structurée, pas cinq extraits vectoriels approximatifs.

**MCP n'est pas une capacité de plus — c'est une prise standard.** Le Model Context Protocol ne rend pas votre modèle plus malin : il **emballe** vos outils (et ressources, et prompts) derrière un protocole que tous les clients comprennent — IDE, chatbot, agents. La règle de décision est simple : un outil pour **une seule** application → une fonction native suffit ; le même outil pour **plusieurs** clients ou équipes → un serveur MCP, écrit une fois, branché partout. On a déjà [construit un serveur MCP en .NET]({{ site.baseurl }}/fr/2026/07/13/premier-serveur-mcp-dotnet/), et sa version production arrive le 30 juillet.

## Combler l'« être » et le « se souvenir »

**Le style, le ton, le format** ne se règlent pas avec une base vectorielle. L'escalier : d'abord le prompt système et quelques exemples bien choisis (few-shot) ; si — et seulement si — ça ne suffit pas à tenir un format ou un jargon métier très spécifique, le **fine-tuning** entre en scène. Retenez sa règle d'or : il apprend au modèle *comment* parler, pas *quoi* savoir — les connaissances injectées par fine-tuning périment et ne se citent pas.

**La mémoire**, enfin, comble l'amnésie entre sessions : résumés de conversation, préférences utilisateur, fichiers de notes que l'agent relit. C'est un sujet à part entière — on y consacre l'article du 27 juillet.

## Le tableau de décision

| Situation | Le bon réflexe | Complexité |
| --- | --- | --- |
| Corpus < ~100 pages, stable | tout en contexte + cache | ★ |
| Grande base docs, questions ouvertes | RAG | ★★★ |
| Données structurées (SQL, API) | tool calling | ★★ |
| Chiffres/stats à citer précisément | RIG (à surveiller) | ★★★ |
| Le modèle doit *agir* | tool calling | ★★ |
| Outils partagés entre plusieurs apps | MCP | ★★ |
| Ton, format, jargon récalcitrants | prompt d'abord, puis fine-tuning | ★★★★ |
| Oubli entre sessions | mémoire | ★★ |

## À vous de jouer : le guide interactif

Répondez à deux questions, la boîte vous propose un point de départ — et le lien pour creuser.

<div class="llm-widget" id="llm-widget">
  <style>
    .llm-widget { border: 1px solid var(--border); background: var(--bg-subtle); border-radius: 12px; padding: 1.2rem 1.4rem; margin: 1.5rem 0; }
    .llm-widget h4 { margin: 0 0 .35rem; font-size: 1rem; color: var(--text); }
    .llm-widget .llm-q { margin-bottom: 1rem; }
    .llm-widget .llm-opts { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .55rem; }
    .llm-widget .llm-opts input { position: absolute; opacity: 0; pointer-events: none; }
    .llm-widget .llm-opts label { border: 1px solid var(--border); background: var(--bg); color: var(--text); border-radius: 999px; padding: .35rem .85rem; font-size: .85rem; cursor: pointer; transition: border-color .15s, background .15s; user-select: none; }
    .llm-widget .llm-opts label:hover { border-color: var(--accent); }
    .llm-widget .llm-opts input:checked + label { border-color: var(--accent); background: var(--accent-bg); color: var(--accent-strong); font-weight: 600; }
    .llm-widget .llm-opts input:focus-visible + label { outline: 2px solid var(--accent); outline-offset: 2px; }
    .llm-widget .llm-result { border: 1px solid var(--accent); background: var(--accent-bg); border-radius: 10px; padding: .9rem 1.1rem; margin-top: 1rem; }
    .llm-widget .llm-result strong { color: var(--accent-strong); }
    .llm-widget .llm-result p { margin: .3rem 0 0; font-size: .92rem; color: var(--text); }
    .llm-widget .llm-result .llm-combo { font-size: .84rem; color: var(--text-muted); margin-top: .45rem; }
    .llm-widget .llm-hint { color: var(--text-muted); font-size: .85rem; margin: 0 0 .8rem; }
  </style>
  <p class="llm-hint">🧭 Deux réponses suffisent — la recommandation se met à jour toute seule.</p>
  <div class="llm-q">
    <h4>1. Que manque-t-il à votre LLM&#8239;?</h4>
    <div class="llm-opts" id="llm-q1">
      <input type="radio" name="llm-need" id="llm-n-know" value="know"><label for="llm-n-know">📚 Des connaissances</label>
      <input type="radio" name="llm-need" id="llm-n-act" value="act"><label for="llm-n-act">🦾 La capacité d'agir</label>
      <input type="radio" name="llm-need" id="llm-n-style" value="style"><label for="llm-n-style">🎭 Un ton / format précis</label>
      <input type="radio" name="llm-need" id="llm-n-memory" value="memory"><label for="llm-n-memory">🧠 De la mémoire</label>
    </div>
  </div>
  <div class="llm-q" id="llm-q2-know" hidden>
    <h4>2. À quoi ressemblent ces connaissances&#8239;?</h4>
    <div class="llm-opts">
      <input type="radio" name="llm-know" id="llm-k-small" value="small"><label for="llm-k-small">📄 Petit corpus stable</label>
      <input type="radio" name="llm-know" id="llm-k-big" value="big"><label for="llm-k-big">🗄️ Grande base qui bouge</label>
      <input type="radio" name="llm-know" id="llm-k-sql" value="sql"><label for="llm-k-sql">🧮 Données structurées (SQL/API)</label>
      <input type="radio" name="llm-know" id="llm-k-stats" value="stats"><label for="llm-k-stats">📊 Chiffres à citer précisément</label>
    </div>
  </div>
  <div class="llm-q" id="llm-q2-act" hidden>
    <h4>2. Qui consommera ces outils&#8239;?</h4>
    <div class="llm-opts">
      <input type="radio" name="llm-act" id="llm-a-one" value="one"><label for="llm-a-one">🎯 Une seule application</label>
      <input type="radio" name="llm-act" id="llm-a-many" value="many"><label for="llm-a-many">🔌 Plusieurs apps / clients</label>
    </div>
  </div>
  <div class="llm-q" id="llm-q2-style" hidden>
    <h4>2. Avez-vous déjà poussé le prompt à fond (system + exemples)&#8239;?</h4>
    <div class="llm-opts">
      <input type="radio" name="llm-style" id="llm-s-no" value="no"><label for="llm-s-no">🤔 Pas encore</label>
      <input type="radio" name="llm-style" id="llm-s-yes" value="yes"><label for="llm-s-yes">😤 Oui, et ça ne suffit pas</label>
    </div>
  </div>
  <div class="llm-result" id="llm-result" hidden></div>
  <script>
    (function () {
      var widget = document.getElementById('llm-widget');
      var results = {
        'know-small': { t: 'Tout en contexte + prompt caching', d: 'Collez le corpus dans le prompt système : avec le cache, les préfixes répétés ne coûtent presque rien. Le plus simple qui marche — commencez ici.', c: 'Passez au RAG le jour où le corpus grossit ou bouge trop.' },
        'know-big': { t: 'RAG (retrieval augmented generation)', d: 'Découpage, embeddings, récupération des passages pertinents à la question. Le standard des bases de connaissances vivantes — guide complet dans l’article du 18 juillet, version code .NET le 1er août.', c: 'Combinez avec un outil SQL pour les questions exactes (hybride).' },
        'know-sql': { t: 'Tool calling vers votre SQL / API', d: 'Une question structurée mérite une réponse structurée : déclarez une fonction de requête, le modèle fournit les filtres, votre code exécute. Zéro vecteur, zéro bruit.', c: 'Ajoutez le RAG seulement quand les questions ouvertes arrivent.' },
        'know-stats': { t: 'RIG (retrieval interleaved generation)', d: 'Le modèle interroge la source de données au moment où il écrit chaque chiffre — la vraie valeur remplace son estimation. Pensé pour les statistiques (cf. DataGemma + Data Commons).', c: 'Encore jeune : en attendant, un outil de requête + relecture fait le même travail.' },
        'act-one': { t: 'Tool calling natif', d: 'Déclarez vos fonctions dans votre application (l’article du 2 août les décortique) : le modèle choisit, vos garde-fous exécutent. Pas besoin de protocole pour une seule app.', c: 'Gardez les actions destructrices derrière une confirmation humaine.' },
        'act-many': { t: 'Un serveur MCP', d: 'Écrivez l’outil une fois, branchez-le partout : IDE, chatbot, agents. On en a construit un en .NET le 13 juillet — version production le 30 juillet.', c: 'Les outils MCP restent du tool calling : mêmes règles de sécurité.' },
        'style-no': { t: 'Prompt engineering d’abord', d: 'System prompt structuré + trois bons exemples (few-shot) règlent l’immense majorité des questions de ton et de format. Gratuit, réversible, immédiat.', c: 'Mesurez avant/après sur quelques cas réels — l’article évals du 20 juillet vous outillera.' },
        'style-yes': { t: 'Fine-tuning', d: 'Pour un format ou un jargon que le prompt ne tient pas, l’ajustement du modèle est légitime. Règle d’or : il apprend comment parler, pas quoi savoir.', c: 'Les connaissances restent côté RAG/outils — le fine-tuning ne se met pas à jour, il se ré-entraîne.' },
        'memory': { t: 'Mémoire conversationnelle', d: 'Résumés de session, préférences, fichiers de notes relus au démarrage : l’amnésie se soigne par l’architecture, pas par le modèle. Article dédié le 27 juillet.', c: 'La mémoire consomme du contexte : résumez, ne stockez pas les transcriptions brutes.' }
      };
      function val(name) {
        var el = widget.querySelector('input[name="' + name + '"]:checked');
        return el ? el.value : null;
      }
      function refresh() {
        var need = val('llm-need');
        widget.querySelector('#llm-q2-know').hidden = need !== 'know';
        widget.querySelector('#llm-q2-act').hidden = need !== 'act';
        widget.querySelector('#llm-q2-style').hidden = need !== 'style';
        var key = null;
        if (need === 'know' && val('llm-know')) key = 'know-' + val('llm-know');
        if (need === 'act' && val('llm-act')) key = 'act-' + val('llm-act');
        if (need === 'style' && val('llm-style')) key = 'style-' + val('llm-style');
        if (need === 'memory') key = 'memory';
        var box = widget.querySelector('#llm-result');
        if (!key) { box.hidden = true; return; }
        var r = results[key];
        box.innerHTML = '<strong>👉 ' + r.t + '</strong><p>' + r.d + '</p><p class="llm-combo">💡 ' + r.c + '</p>';
        box.hidden = false;
      }
      widget.addEventListener('change', refresh);
    })();
  </script>
</div>

## Et dans la vraie vie : on combine

Les applications sérieuses cumulent presque toujours plusieurs briques : un RAG **plus** un outil SQL pour les questions exactes, du contexte direct **plus** de la mémoire, un fine-tuning léger **plus** un RAG pour les faits. La règle d'or reste l'escalier de simplicité : prompt → contexte → RAG ou outils → fine-tuning, en ne montant une marche que quand la précédente a prouvé ses limites — preuve chiffrée à l'appui (les évals arrivent dans l'article du 20 juillet). Et pour orchestrer plusieurs briques entre elles, c'est le rôle des agents — on en a posé les bases avec le [Microsoft Agent Framework]({{ site.baseurl }}/fr/2026/07/11/microsoft-agent-framework-equipe-agents-ia/).

## Le mot d'honnêteté

- Le **RIG** est le petit jeune de la liste : concept solide, outillage encore confidentiel. Je le présente pour que le terme ne vous surprenne pas en réunion — pas comme un choix par défaut en 2026.
- Les frontières sont **poreuses** : un « RAG agentique » n'est qu'un RAG piloté par tool calling, la recherche web n'est qu'un outil parmi d'autres. Ne vous battez pas sur les étiquettes, battez-vous sur le manque à combler.
- La boîte interactive donne un **point de départ**, pas un verdict d'architecte : vos volumes, votre budget et vos évals ont toujours le dernier mot.

## En résumé

- Classez par **manque comblé** : savoir (contexte, RAG, RIG), agir (tools, MCP), être (prompt, fine-tuning), se souvenir (mémoire).
- **Petit corpus stable → contexte + cache** ; grande base vivante → **RAG** ; données structurées → **SQL par tool calling** ; stats au fil du texte → **RIG** (à surveiller).
- **MCP** ne rend pas le modèle plus capable : il **standardise la prise** — réservez-le aux outils partagés.
- Le **fine-tuning** apprend *comment* parler, jamais *quoi* savoir.
- Montez l'**escalier de simplicité** une marche à la fois, évals en main — et combinez sans complexe.

Demain matin, on plonge justement dans la marche la plus utilisée de l'escalier : le RAG et ses embeddings, expliqués simplement. Et ça, franchement… c'est pas sorcier.
