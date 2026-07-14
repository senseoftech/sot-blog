---
layout: post
title: "Model parameters: the mixing console of your prompt — it's not rocket science!"
date: 2026-07-15 10:00:00
author: AClerbois
ref: model-parameters
image: /images/posts/model-parameters.png
tags: [AI, LLM, parameters, temperature, top-p, api]
level: 200
---

You make your first call to a model API, and there it is: a wall of parameters — `temperature`, `top_p`, `max_tokens`, `frequency_penalty`, `stop`, `seed`… Most people touch temperature, pray, and leave the rest to chance. A shame: each knob does *one* precise thing, and knowing which to turn changes everything.

Today's image: a **mixing console**. You're the sound engineer, each fader and dial has a role, and the skill is knowing *which* to push for the effect you want — not pushing them all to the max. Let's walk the console, group by group. You'll see: it's not rocket science.

<!--more-->

## The "randomness" group: temperature and top_p

The two best-known faders — and the most misused. They dose the randomness in the choice of each word (the real mechanism — softmax, nucleus and friends — will get its own "under the hood" post later in the series; today we stay practical):

- **`temperature`**: the width of the draw. Low (→ 0), the model almost always takes the most probable word — sober, repetitive, reliable. High (→ 1 or 2 depending on the provider), it dares improbable choices — creative, diverse, adventurous. It's the knob [the hallucinations article]({{ site.baseurl }}/2026/07/19/why-ai-hallucinates/) will come back to in a few days.
- **`top_p`** (nucleus): instead of dosing randomness, it **cuts the tail** of unlikely words — "keep only the candidates weighing p%". At 0.1, ultra-restrictive; at 1, anything goes.

**The golden rule nobody states**: don't push **both at once**. They act on the same distribution, and combining them makes behavior unpredictable. Pick **one**: temperature for most cases, top_p if you want to firmly bound the drift. Leave the other at its default.

*(On open models, two cousins appear: `top_k` — "keep the k best candidates" — and `min_p` — "nothing below X% of the favorite". Same family, finer tuning.)*

Enough theory — **turn the knobs yourself**. The widget below runs the *real* sampling formula (softmax + nucleus top-p) on **four toy distributions**. Pick a scenario, adjust the sliders — and above all, the most telling trick: **keep the same settings while switching scenarios**. You'll watch the *same* temperature flatten an open story while leaving an established fact perfectly intact.

{% raw %}
<div class="pw" id="pw">
  <div class="pw-head">
    <span class="pw-title">🎛️ Play with the knobs</span>
    <span class="pw-note">illustrative demo — real sampling formula on toy distributions, not a model call</span>
  </div>
  <div class="pw-scenarios" id="pw-scenarios"></div>
  <div class="pw-prompt"><span id="pw-ptext">For breakfast, I'll have a</span> <span class="pw-slot" id="pw-slot">…</span></div>
  <div class="pw-controls">
    <label class="pw-ctl">Temperature <output id="pw-tval">0.7</output>
      <input type="range" id="pw-temp" min="0.1" max="1.5" step="0.1" value="0.7" aria-label="Temperature">
    </label>
    <label class="pw-ctl">Top-p <output id="pw-pval">1.00</output>
      <input type="range" id="pw-topp" min="0.1" max="1" step="0.05" value="1" aria-label="Top-p">
    </label>
  </div>
  <div class="pw-bars" id="pw-bars"></div>
  <div class="pw-lesson" id="pw-lesson"></div>
  <div class="pw-actions">
    <button id="pw-draw1" type="button">🎲 Draw a word</button>
    <button id="pw-draw20" type="button">Draw 20×</button>
    <button id="pw-reset" type="button" class="pw-ghost">Reset</button>
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
    {emoji:'🥐',label:'Breakfast',prompt:'For breakfast, I’ll have a',
     lesson:'A clear favorite ("coffee") with an absurd tail. Raise the temperature: "dragon" eventually comes out — exactly the mechanism of a hallucination.',
     cands:[{w:'coffee',l:3.2},{w:'tea',l:2.4},{w:'croissant',l:2.1},{w:'juice',l:1.6},{w:'yogurt',l:1.2},{w:'fruit',l:0.9},{w:'silence',l:-0.4},{w:'dragon',l:-1.2}],odd:{'silence':1,'dragon':1}},
    {emoji:'🗼',label:'Established fact',prompt:'The capital of France is',
     lesson:'A "sure" distribution: Paris crushes everything. Even at high temperature the model rarely errs — here, turning the knobs barely changes a thing.',
     cands:[{w:'Paris',l:6.0},{w:'Lyon',l:1.2},{w:'Marseille',l:0.9},{w:'Bordeaux',l:0.4},{w:'Berlin',l:-0.3},{w:'Tokyo',l:-0.8}],odd:{'Berlin':1,'Tokyo':1}},
    {emoji:'📖',label:'Story',prompt:'Once upon a time, a',
     lesson:'An "open" distribution: a thousand valid continuations, nearly tied. Here the knobs matter enormously — low top-p narrows, high temperature scatters everywhere.',
     cands:[{w:'king',l:2.2},{w:'dragon',l:2.1},{w:'village',l:2.0},{w:'castle',l:1.9},{w:'child',l:1.8},{w:'wolf',l:1.7},{w:'kingdom',l:1.6},{w:'merchant',l:1.4}],odd:{}},
    {emoji:'💻',label:'Code',prompt:'var total = items.',
     lesson:'Several idiomatic continuations (Sum, Count, Where…). Keep a low temperature for the most probable one — otherwise "Banana()", an invented API, can surface.',
     cands:[{w:'Sum()',l:2.8},{w:'Count()',l:2.5},{w:'Where()',l:2.0},{w:'Select()',l:1.9},{w:'First()',l:1.2},{w:'ToList()',l:1.0},{w:'Banana()',l:-1.5}],odd:{'Banana()':1}}
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
      row.innerHTML='<span class="pw-word">'+c.w+'</span><span class="pw-track"><span class="pw-fill" style="width:'+(cut?0:Math.max(pct,0.6))+'%"></span></span><span class="pw-pct">'+(cut?'cut':pct.toFixed(1)+'%')+'</span>';
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
    tally.innerHTML='<span class="pw-tally-lbl">20 draws:</span>'+arr.map(function(o){return '<span class="pw-chip">'+o.w+' <b>×'+o.c+'</b></span>';}).join('');
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

## The "length" group: max_tokens

A single fader, but a classic trap. **`max_tokens`** (sometimes `max_completion_tokens`) caps the length of the **response** — [output tokens, the most expensive]({{ site.baseurl }}/2026/07/05/llm-tokens-input-output-cached/). Two things you absolutely must know:

- **It truncates, it doesn't summarize.** Hitting the limit cuts the response **mid-sentence** — it's not "be shorter", it's "stop dead". For shorter, ask in the prompt; the parameter is a seatbelt, not a style instruction.
- **Reasoning models count their thinking in it.** On those models, the invisible "thinking" tokens consume the budget before the visible answer even starts — cap too low, and you get… nothing. Budget generously.

## The "repetition" group: frequency and presence

Two dials to fight the model that rambles — useful in long generation:

| Knob | What it penalizes | The effect |
| --- | --- | --- |
| **`frequency_penalty`** | words already used **often** | breaks literal repetitions ("very very very") |
| **`presence_penalty`** | words that **already appeared** (even once) | pushes toward new topics, more variety |

Typical values from -2 to 2. A slight positive (0.3–0.6) usually suffices; too high, the model forbids itself necessary words and gets weird. Leave at zero by default, touch only if you *see* the rambling.

## The "control" group: stop, seed, n

The knobs that frame the output without touching the style:

- **`stop`** (or `stop_sequences`): strings that **cut generation** as soon as they appear. Essential when you generate homemade structure ("stop at `###`") or a single line in a dialogue.
- **`seed`**: a seed to **attempt** to reproduce an output. The important word is *attempt* — it's never guaranteed across a fleet of GPUs. Useful in development to replay a case, not a promise of determinism.
- **`n`**: request **several answers** in one call — handy for picking the best or exploring variants (beware, it multiplies the output bill).
- **`logit_bias`**: force or ban specific words. Powerful, surgical, rarely needed — the expert's knob.

## The "structure & thinking" group

The most modern settings, met elsewhere in the series:

- **`response_format`** / **structured outputs**: impose a JSON schema. It's not a style setting but a contract that constrains generation — valid JSON by construction (we'll open that hood later in the series). The right reflex for anything feeding a screen or an import.
- **Reasoning effort** (`reasoning_effort` or a thinking budget depending on the provider): on reasoning models, dosing *how much* the model "thinks" before answering. Low = fast and cheap; high = slower but better on hard problems. It's a knob you'll meet again soon in the Copilot CLI series — the same logic as [choosing the right model]({{ site.baseurl }}/2026/06/25/which-model-to-choose-github-copilot/), but for compute intensity.

## The recipes: which setting for which use

The table to keep handy — a starting point, not a law:

| Use | temperature | The rest |
| --- | --- | --- |
| **Factual, extraction, classification** | 0 – 0.3 | `response_format` if structured output |
| **Code** | 0 – 0.2 | large max_tokens (reasoning included) |
| **Writing, rewriting** | 0.6 – 0.8 | slight `frequency_penalty` if repetitive |
| **Brainstorm, ideation** | 0.9 – 1.2 | `n` > 1 to vary the angles |
| **Chat / assistant** | 0.5 – 0.7 | `stop` on the speaking turn |

## The word of honesty

- **Names and ranges vary by provider.** OpenAI, Anthropic, open models don't expose exactly the same knobs or bounds (temperature up to 2 for one, 1 for another; `stop` vs `stop_sequences`…). **Always check *your* provider's docs** — this guide gives the map, not the exact territory.
- **The defaults are good.** In the vast majority of cases, touch *only* the temperature. Cargo-culting settings ("I copied top_p 0.92 from a tutorial") does more harm than good.
- **Tune with [evals]({{ site.baseurl }}/2026/07/20/testing-an-ai-application-evals/), not by feel.** A parameter that's "better" over three tries might be luck. Measure before carving.

## In summary

- An API call is a **mixing console**: each knob does one thing, the art is touching few.
- **Randomness**: `temperature` **or** `top_p`, never both. **Length**: `max_tokens` truncates (doesn't summarize) and includes reasoning.
- **Repetition**: `frequency`/`presence_penalty` against rambling, dose lightly. **Control**: `stop`, `seed` (best-effort), `n`, `logit_bias`.
- **Structure**: `response_format` for guaranteed JSON; **reasoning effort** to dose the thinking.
- And above all: defaults are fine, names vary by provider, and **you tune with evals**.

The console has many knobs, but a good mix pushes three, not thirty. Start with temperature, add a fader when a precise need calls for it, and measure. And that, honestly… is not rocket science.
