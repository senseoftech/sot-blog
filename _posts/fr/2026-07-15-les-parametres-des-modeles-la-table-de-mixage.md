---
layout: post
title: "Les paramètres des modèles : la table de mixage du prompt — c'est pas sorcier !"
date: 2026-07-15 10:00:00
author: AClerbois
lang: fr
ref: model-parameters
image: /images/posts/model-parameters.png
tags: [AI, LLM, parameters, temperature, top-p, api]
level: 200
---

Vous faites votre premier appel à une API de modèle, et là, un mur de paramètres : `temperature`, `top_p`, `max_tokens`, `frequency_penalty`, `stop`, `seed`… La plupart des gens touchent la température, prient, et laissent le reste au hasard. Dommage : chaque bouton fait *une* chose précise, et savoir lequel tourner change tout.

L'image du jour : une **table de mixage**. Vous êtes l'ingénieur du son, chaque fader et chaque potentiomètre a un rôle, et le talent, c'est de savoir *lequel* pousser pour l'effet voulu — pas de tous les pousser à fond. On passe la console en revue, groupe par groupe. Vous allez voir : c'est pas sorcier.

<!--more-->

## Le groupe « hasard » : temperature et top_p

Les deux faders les plus connus — et les plus mal utilisés. Ils dosent l'aléatoire dans le choix de chaque mot (le vrai mécanisme — softmax, nucleus et compagnie — aura son billet « sous le capot » plus tard dans la série ; aujourd'hui on reste pratique) :

- **`temperature`** : la largeur de la pioche. Basse (→ 0), le modèle prend presque toujours le mot le plus probable — sobre, répétitif, fiable. Haute (→ 1 ou 2 selon le fournisseur), il ose des choix improbables — créatif, divers, aventureux. C'est le bouton sur lequel [l'article sur les hallucinations]({{ site.baseurl }}/fr/2026/07/19/pourquoi-l-ia-hallucine/) reviendra dans quelques jours.
- **`top_p`** (nucleus) : au lieu de doser le hasard, il **coupe la traîne** des mots peu probables — « ne garde que les candidats qui pèsent p % ». À 0,1, ultra-restrictif ; à 1, tout est permis.

**La règle d'or que personne ne dit** : ne poussez **pas les deux en même temps**. Ils agissent sur la même distribution, et les combiner rend le comportement imprévisible. Choisissez-en **un** : la température pour la plupart des cas, top_p si vous voulez borner franchement les dérapages. Laissez l'autre à sa valeur par défaut.

*(Sur les modèles ouverts, deux cousins apparaissent : `top_k` — « garde les k meilleurs candidats » — et `min_p` — « rien sous X % du favori ». Même famille, réglages plus fins.)*

Assez de théorie — **tournez les boutons vous-même**. Le widget ci-dessous exécute la *vraie* formule de sampling (softmax + nucleus top-p) sur **quatre distributions jouets**. Choisissez un scénario, réglez les curseurs — et surtout, l'astuce la plus parlante : **gardez les mêmes réglages en changeant de scénario**. Vous verrez la *même* température aplatir une histoire ouverte tout en laissant un fait établi parfaitement intact.

{% raw %}
<div class="pw" id="pw">
  <div class="pw-head">
    <span class="pw-title">🎛️ Jouez avec les boutons</span>
    <span class="pw-note">démo illustrative — vraie formule de sampling sur des distributions jouets, pas un appel à un modèle</span>
  </div>
  <div class="pw-scenarios" id="pw-scenarios"></div>
  <div class="pw-prompt"><span id="pw-ptext">Pour le petit-déjeuner, je prends un</span> <span class="pw-slot" id="pw-slot">…</span></div>
  <div class="pw-controls">
    <label class="pw-ctl">Température <output id="pw-tval">0.7</output>
      <input type="range" id="pw-temp" min="0.1" max="1.5" step="0.1" value="0.7" aria-label="Température">
    </label>
    <label class="pw-ctl">Top-p <output id="pw-pval">1.00</output>
      <input type="range" id="pw-topp" min="0.1" max="1" step="0.05" value="1" aria-label="Top-p">
    </label>
  </div>
  <div class="pw-bars" id="pw-bars"></div>
  <div class="pw-lesson" id="pw-lesson"></div>
  <div class="pw-actions">
    <button id="pw-draw1" type="button">🎲 Tirer un mot</button>
    <button id="pw-draw20" type="button">Tirer 20×</button>
    <button id="pw-reset" type="button" class="pw-ghost">Réinitialiser</button>
  </div>
  <div class="pw-tally" id="pw-tally" hidden></div>
</div>
<style>
.pw{border:1px solid var(--border,#30363d);background:var(--bg-subtle,#161b22);border-radius:12px;padding:18px 20px;margin:26px 0;font-size:.95rem}
.pw-head{display:flex;flex-wrap:wrap;align-items:baseline;gap:10px;margin-bottom:14px}
.pw-title{font-weight:700;color:var(--text,#e6edf3)}
.pw-note{font-size:.74rem;color:var(--text-muted,#9198a1)}
.pw-scenarios{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}
.pw-scn{font:inherit;font-size:.82rem;font-weight:600;padding:5px 13px;border-radius:20px;cursor:pointer;background:transparent;color:var(--text-muted,#9198a1);border:1px solid var(--border,#30363d)}
.pw-scn:hover{color:var(--text,#e6edf3)}
.pw-scn.pw-on{color:var(--accent,#38bdf8);border-color:var(--accent,#38bdf8);background:var(--accent-bg,rgba(56,189,248,.12))}
.pw-prompt{font-family:ui-monospace,"JetBrains Mono",Consolas,monospace;font-size:1.02rem;color:var(--text,#e6edf3);margin-bottom:16px}
.pw-slot{display:inline-block;min-width:96px;padding:1px 9px;border-radius:6px;background:var(--accent-bg,rgba(56,189,248,.12));color:var(--accent,#38bdf8);border:1px dashed var(--accent,#38bdf8);font-weight:700;transition:background .15s}
.pw-slot.pw-pulse{background:var(--accent,#38bdf8);color:#0d1117}
.pw-controls{display:flex;flex-wrap:wrap;gap:20px;margin-bottom:16px}
.pw-ctl{flex:1;min-width:220px;font-size:.82rem;color:var(--text-muted,#9198a1);display:flex;flex-direction:column;gap:6px}
.pw-ctl output{font-family:ui-monospace,Consolas,monospace;font-weight:700;color:var(--accent,#38bdf8)}
.pw-ctl input[type=range]{width:100%;accent-color:var(--accent,#38bdf8)}
.pw-bars{display:flex;flex-direction:column;gap:6px}
.pw-row{display:flex;align-items:center;gap:10px}
.pw-word{width:100px;text-align:right;font-family:ui-monospace,Consolas,monospace;font-size:.86rem;color:var(--text,#e6edf3);flex-shrink:0}
.pw-track{flex:1;height:18px;background:var(--code-bg,#0d1117);border-radius:5px;overflow:hidden}
.pw-fill{display:block;height:100%;background:var(--accent,#38bdf8);border-radius:5px;transition:width .18s ease}
.pw-pct{width:52px;text-align:right;font-family:ui-monospace,Consolas,monospace;font-size:.78rem;color:var(--text-muted,#9198a1);flex-shrink:0}
.pw-row.pw-cut .pw-word{color:var(--text-muted,#9198a1);text-decoration:line-through;opacity:.6}
.pw-row.pw-cut .pw-fill{background:var(--border,#30363d)}
.pw-row.pw-cut .pw-pct{color:var(--border,#484f58)}
.pw-row.pw-odd .pw-fill{background:var(--orange,#ffa657)}
.pw-lesson{margin-top:14px;font-size:.82rem;color:var(--text-muted,#9198a1);line-height:1.5;border-left:2px solid var(--accent,#38bdf8);padding-left:12px}
.pw-actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:16px}
.pw-actions button{font:inherit;font-size:.84rem;font-weight:600;padding:7px 14px;border-radius:7px;cursor:pointer;background:transparent;color:var(--accent,#38bdf8);border:1px solid var(--accent,#38bdf8)}
.pw-actions button:hover{background:var(--accent-bg,rgba(56,189,248,.12))}
.pw-actions button.pw-ghost{color:var(--text-muted,#9198a1);border-color:var(--border,#30363d)}
.pw-tally{margin-top:14px;padding-top:12px;border-top:1px solid var(--border,#30363d);display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.pw-tally-lbl{font-size:.78rem;color:var(--text-muted,#9198a1);margin-right:4px}
.pw-chip{font-family:ui-monospace,Consolas,monospace;font-size:.8rem;padding:2px 9px;border-radius:20px;background:var(--code-bg,#0d1117);border:1px solid var(--border,#30363d);color:var(--text,#e6edf3)}
.pw-chip b{color:var(--green,#3fb950)}
</style>
<script>
(function(){
  var root=document.getElementById('pw'); if(!root) return;
  var scenarios=[
    {emoji:'🥐',label:'Petit-déjeuner',prompt:'Pour le petit-déjeuner, je prends un',
     lesson:'Un favori net (« café ») avec une queue absurde. Montez la température : « dragon » finit par sortir — c’est exactement le mécanisme d’une hallucination.',
     cands:[{w:'café',l:3.2},{w:'thé',l:2.4},{w:'croissant',l:2.1},{w:'jus',l:1.6},{w:'yaourt',l:1.2},{w:'fruit',l:0.9},{w:'silence',l:-0.4},{w:'dragon',l:-1.2}],odd:{'silence':1,'dragon':1}},
    {emoji:'🗼',label:'Fait établi',prompt:'La capitale de la France, c’est',
     lesson:'Distribution « sûre » : Paris écrase tout. Même à haute température, le modèle se trompe rarement — ici, régler les boutons ne change presque rien.',
     cands:[{w:'Paris',l:6.0},{w:'Lyon',l:1.2},{w:'Marseille',l:0.9},{w:'Bordeaux',l:0.4},{w:'Berlin',l:-0.3},{w:'Tokyo',l:-0.8}],odd:{'Berlin':1,'Tokyo':1}},
    {emoji:'📖',label:'Histoire',prompt:'Il était une fois un',
     lesson:'Distribution « ouverte » : mille suites valables, presque à égalité. Ici les boutons comptent énormément — top-p bas resserre, haute température part dans tous les sens.',
     cands:[{w:'roi',l:2.2},{w:'dragon',l:2.1},{w:'village',l:2.0},{w:'château',l:1.9},{w:'enfant',l:1.8},{w:'loup',l:1.7},{w:'royaume',l:1.6},{w:'marchand',l:1.4}],odd:{}},
    {emoji:'💻',label:'Code',prompt:'var total = items.',
     lesson:'Plusieurs suites idiomatiques (Sum, Count, Where…). On garde une température basse pour la plus probable — sinon « Banane() », une API inventée, peut surgir.',
     cands:[{w:'Sum()',l:2.8},{w:'Count()',l:2.5},{w:'Where()',l:2.0},{w:'Select()',l:1.9},{w:'First()',l:1.2},{w:'ToList()',l:1.0},{w:'Banane()',l:-1.5}],odd:{'Banane()':1}}
  ];
  var current=0, temp=0.7, topp=1;
  var $=function(id){return document.getElementById(id);};
  var barsEl=$('pw-bars'), slot=$('pw-slot'), tally=$('pw-tally');
  function sc(){return scenarios[current];}
  function effective(){
    var cands=sc().cands;
    var scaled=cands.map(function(c){return c.l/temp;});
    var m=Math.max.apply(null,scaled);
    var ex=scaled.map(function(s){return Math.exp(s-m);});
    var sum=ex.reduce(function(a,b){return a+b;},0);
    var probs=ex.map(function(e){return e/sum;});
    var order=probs.map(function(p,i){return {i:i,p:p};}).sort(function(a,b){return b.p-a.p;});
    var cum=0, keep={};
    for(var k=0;k<order.length;k++){keep[order[k].i]=true;cum+=order[k].p;if(cum>=topp)break;}
    var kept=cands.map(function(c,i){return keep[i]?probs[i]:0;});
    var ks=kept.reduce(function(a,b){return a+b;},0);
    var eff=kept.map(function(p){return ks>0?p/ks:0;});
    return {eff:eff,keep:keep};
  }
  function render(){
    var e=effective(), cands=sc().cands, odd=sc().odd;
    barsEl.innerHTML='';
    cands.forEach(function(c,i){
      var cut=!e.keep[i], pct=(e.eff[i]*100);
      var row=document.createElement('div');
      row.className='pw-row'+(cut?' pw-cut':'')+(odd[c.w]&&!cut?' pw-odd':'');
      row.innerHTML='<span class="pw-word">'+c.w+'</span><span class="pw-track"><span class="pw-fill" style="width:'+(cut?0:Math.max(pct,0.6))+'%"></span></span><span class="pw-pct">'+(cut?'coupé':pct.toFixed(1)+'%')+'</span>';
      barsEl.appendChild(row);
    });
  }
  function sample(){
    var e=effective().eff, cands=sc().cands, r=Math.random(), acc=0;
    for(var i=0;i<e.length;i++){acc+=e[i];if(r<=acc)return cands[i].w;}
    return cands[0].w;
  }
  function showWord(w){slot.textContent=w;slot.classList.add('pw-pulse');setTimeout(function(){slot.classList.remove('pw-pulse');},200);}
  function selectScenario(i){
    current=i;
    [].forEach.call(document.querySelectorAll('.pw-scn'),function(b,j){b.className='pw-scn'+(j===i?' pw-on':'');});
    $('pw-ptext').textContent=sc().prompt;
    $('pw-lesson').textContent=sc().lesson;
    slot.textContent='…'; tally.hidden=true; render();
  }
  var scnWrap=$('pw-scenarios');
  scenarios.forEach(function(s,i){
    var b=document.createElement('button');
    b.type='button'; b.className='pw-scn'+(i===0?' pw-on':''); b.textContent=s.emoji+' '+s.label;
    b.addEventListener('click',function(){selectScenario(i);});
    scnWrap.appendChild(b);
  });
  $('pw-temp').addEventListener('input',function(e){temp=parseFloat(e.target.value);$('pw-tval').textContent=temp.toFixed(1);render();});
  $('pw-topp').addEventListener('input',function(e){topp=parseFloat(e.target.value);$('pw-pval').textContent=topp.toFixed(2);render();});
  $('pw-draw1').addEventListener('click',function(){showWord(sample());tally.hidden=true;});
  $('pw-draw20').addEventListener('click',function(){
    var counts={};
    for(var n=0;n<20;n++){var w=sample();counts[w]=(counts[w]||0)+1;}
    showWord(sample());
    var arr=Object.keys(counts).map(function(w){return {w:w,c:counts[w]};}).sort(function(a,b){return b.c-a.c;});
    tally.innerHTML='<span class="pw-tally-lbl">20 tirages :</span>'+arr.map(function(o){return '<span class="pw-chip">'+o.w+' <b>×'+o.c+'</b></span>';}).join('');
    tally.hidden=false;
  });
  $('pw-reset').addEventListener('click',function(){
    temp=0.7;topp=1;$('pw-temp').value=0.7;$('pw-topp').value=1;$('pw-tval').textContent='0.7';$('pw-pval').textContent='1.00';
    slot.textContent='…';tally.hidden=true;render();
  });
  $('pw-lesson').textContent=sc().lesson;
  render();
})();
</script>
{% endraw %}

## Le groupe « longueur » : max_tokens

Un seul fader, mais un piège classique. **`max_tokens`** (parfois `max_completion_tokens`) plafonne la longueur de la **réponse** — [des tokens de sortie, les plus chers]({{ site.baseurl }}/fr/2026/07/05/tokens-llm-envoyes-sortie-cache/). Deux choses à savoir absolument :

- **Il tronque, il ne résume pas.** Atteindre la limite coupe la réponse **au milieu d'une phrase** — ce n'est pas « fais plus court », c'est « arrête-toi net ». Pour du plus court, demandez-le dans le prompt ; le paramètre est une ceinture de sécurité, pas une consigne de style.
- **Les modèles de raisonnement comptent leur réflexion dedans.** Sur ces modèles, les tokens de « pensée » invisible consomment le budget avant même la réponse visible — plafonnez trop bas, et vous n'obtenez… rien. Prévoyez large.

## Le groupe « répétition » : frequency et presence

Deux potentiomètres pour lutter contre le modèle qui radote — utiles en génération longue :

| Bouton | Ce qu'il pénalise | L'effet |
| --- | --- | --- |
| **`frequency_penalty`** | les mots déjà **souvent** utilisés | casse les répétitions littérales (« très très très ») |
| **`presence_penalty`** | les mots **déjà apparus** (même une fois) | pousse vers de nouveaux sujets, plus de variété |

Valeurs typiques de -2 à 2. Un léger positif (0,3–0,6) suffit d'ordinaire ; trop haut, le modèle s'interdit des mots nécessaires et devient bizarre. À laisser à zéro par défaut, à ne toucher que si vous *voyez* le radotage.

## Le groupe « contrôle » : stop, seed, n

Les boutons qui cadrent la sortie sans toucher au style :

- **`stop`** (ou `stop_sequences`) : des chaînes qui **coupent la génération** dès qu'elles apparaissent. Indispensable quand vous générez du structuré maison (« arrête-toi à `###` ») ou une seule réplique dans un dialogue.
- **`seed`** : une graine pour **tenter** de reproduire une sortie. Le mot important est *tenter* — ce n'est jamais garanti à travers un parc de GPU. Utile en développement pour rejouer un cas, pas une promesse de déterminisme.
- **`n`** : demander **plusieurs réponses** en un appel — pratique pour choisir la meilleure ou explorer des variantes (attention, ça multiplie la facture de sortie).
- **`logit_bias`** : forcer ou bannir des mots précis. Puissant, chirurgical, rarement nécessaire — le bouton d'expert.

## Le groupe « structure & réflexion »

Les réglages les plus modernes, croisés ailleurs dans la série :

- **`response_format`** / **structured outputs** : imposer un schéma JSON. Ce n'est pas un réglage de style mais un contrat qui contraint la génération — JSON valide par construction (on ouvrira ce capot plus tard dans la série). Le bon réflexe pour tout ce qui alimente un écran ou un import.
- **L'effort de raisonnement** (`reasoning_effort` ou budget de réflexion selon le fournisseur) : sur les modèles de raisonnement, doser *combien* le modèle « réfléchit » avant de répondre. Bas = rapide et pas cher ; haut = plus lent mais meilleur sur les problèmes durs. C'est un bouton que vous retrouverez bientôt dans la série Copilot CLI — la même logique que [choisir le bon modèle]({{ site.baseurl }}/fr/2026/06/25/quel-modele-choisir-github-copilot/), mais pour l'intensité de calcul.

## Les recettes : quel réglage pour quel usage

Le tableau à garder sous le coude — un point de départ, pas une loi :

| Usage | temperature | Le reste |
| --- | --- | --- |
| **Factuel, extraction, classification** | 0 – 0,3 | `response_format` si sortie structurée |
| **Code** | 0 – 0,2 | max_tokens large (raisonnement compris) |
| **Rédaction, reformulation** | 0,6 – 0,8 | léger `frequency_penalty` si redites |
| **Brainstorm, idéation** | 0,9 – 1,2 | `n` > 1 pour varier les angles |
| **Chat / assistant** | 0,5 – 0,7 | `stop` sur le tour de parole |

## Le mot d'honnêteté

- **Les noms et plages varient selon le fournisseur.** OpenAI, Anthropic, les modèles ouverts n'exposent pas exactement les mêmes boutons ni les mêmes bornes (température jusqu'à 2 chez l'un, 1 chez l'autre ; `stop` vs `stop_sequences`…). **Vérifiez toujours la doc de *votre* fournisseur** — ce guide donne la carte, pas le territoire exact.
- **Les valeurs par défaut sont bonnes.** Dans l'immense majorité des cas, ne touchez *que* la température. Le cargo-cult de réglages (« j'ai copié top_p 0,92 d'un tuto ») fait plus de mal que de bien.
- **Réglez avec des [évals]({{ site.baseurl }}/fr/2026/07/20/tester-une-application-ia-les-evals/), pas au feeling.** Un paramètre « meilleur » sur trois essais est peut-être du hasard. Mesurez avant de graver.

## En résumé

- Un appel API, c'est une **table de mixage** : chaque bouton fait une chose, l'art est d'en toucher peu.
- **Hasard** : `temperature` **ou** `top_p`, jamais les deux. **Longueur** : `max_tokens` tronque (ne résume pas) et englobe le raisonnement.
- **Répétition** : `frequency`/`presence_penalty` contre le radotage, à doser léger. **Contrôle** : `stop`, `seed` (best-effort), `n`, `logit_bias`.
- **Structure** : `response_format` pour du JSON garanti ; **effort de raisonnement** pour doser la réflexion.
- Et surtout : par défaut c'est bon, les noms varient par fournisseur, et **on règle avec des évals**.

La console a beaucoup de boutons, mais un bon mix en pousse trois, pas trente. Commencez par la température, ajoutez un fader quand un besoin précis le réclame, et mesurez. Et ça, franchement… c'est pas sorcier.
