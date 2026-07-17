---
layout: post
title: "Microsoft.Extensions.AI (5/5) — Production RAG: six pitfalls and their fixes — it's not rocket science!"
date: 2026-09-13 10:00:00
author: AClerbois
ref: meai-production-rag
image: /images/posts/meai-production-rag.png
tags: [dotnet, csharp, AI, RAG, qdrant, meai]
level: 300
---

The setting: an internal bot answering questions about order history. The documents — request, description, closing status — are in German, cut into 1,000-word chunks, indexed in Qdrant, and the bot always retrieves the top 5 before answering. The symptoms: confident answers built on irrelevant excerpts, and orders attributed to the wrong customer. If you built [the RAG from the August article]({{ site.baseurl }}/2026/08/01/build-your-rag-in-dotnet/) and it's derailing on contact with reality, this episode is for you.

This scenario comes from a real conversation with a developer nursing their first bruises — **classic growing pains, all solvable**. To close the `Microsoft.Extensions.AI` series, we treat them one by one: six pitfalls, six fixes, code included. Not rocket science.

<!--more-->

## Pitfall 1 — the blind top-K

`limit: 5` *always* returns five results — relevant or not. If nothing resembles the question, the model receives five mediocre excerpts and embroiders on them with aplomb: that's [hallucination]({{ site.baseurl }}/2026/07/19/why-ai-hallucinates/) served on a platter.

The fix fits in one parameter: the **score threshold**.

```csharp
using Qdrant.Client;

var hits = await qdrant.SearchAsync("orders",
    queryVector,
    limit: 5,
    scoreThreshold: 0.75f);   // below this: we don't want to see it

if (hits.Count == 0)
    return "I found nothing reliable on this in the order history. "
         + "Could you give me an order number or a customer?";
```

The right to say "I don't know" is something you **program**: zero results above the threshold beats five bad excerpts every time. The 0.75 isn't magic — we calibrate it in pitfall 6.

## Pitfall 2 — chunking by weight

1,000 words is a unit for scales, not for meaning. An order already has a **structure**: request, description, resolution. Cut along those seams — one chunk per field — and let identity travel as **payload**:

```csharp
using Qdrant.Client.Grpc;

var points = order.Fields.Select(f => new PointStruct
{
    Id = Guid.NewGuid(),
    Vectors = embeddingsByField[f.Name],
    Payload =
    {
        ["order_id"]        = order.Id,
        ["customer_number"] = order.CustomerNumber,   // ← pitfall 3's filter
        ["field"]           = f.Name,                 // request | description | resolution
        ["date"]            = order.Date.ToString("yyyy-MM-dd"),
    }
});
await qdrant.UpsertAsync("orders", points.ToList());
```

An embedding should carry only **one idea**; metadata (numbers, dates, identifiers) has no business being *inside* the vectorized text — it's there to filter, not to resemble. A direct continuation of the chunking rules from [the .NET RAG]({{ site.baseurl }}/2026/08/01/build-your-rag-in-dotnet/).

## Pitfall 3 — the entity drowned in the embedding

"Orders from customer Müller in March": embed that sentence as-is and the customer name dilutes into the vector, and the search surfaces orders… from other customers. A proper noun isn't a semantic notion, it's an **exact key**.

The fix in two steps, and it's pure episode 2: the model **extracts** the entity via tool calling, your code **resolves** it exactly:

```csharp
[Description("Searches the orders of a specific customer")]
async Task<string> SearchCustomerOrders(
    [Description("The customer name as mentioned")] string customerName,
    [Description("The question to search within their orders")] string query)
{
    // 1. Exact resolution: fuzzy match against the customer table (SQL)
    var matches = await customers.FindClosestAsync(customerName);
    if (matches.Count != 1)
        return $"Several customers match: {string.Join(", ", matches)}. Which one?";

    // 2. Semantic search FILTERED to the right customer
    var vector = (await embedder.GenerateVectorAsync(query)).ToArray();
    var hits = await qdrant.SearchAsync("orders", vector,
        filter: MatchKeyword("customer_number", matches[0].Number),
        limit: 5, scoreThreshold: 0.75f);
    return FormatHits(hits);
}
```

The division of labor is crisp: the LLM understands *language* (extracting "Müller"), the code guarantees *exactness* (fuzzy match against the reference table, ambiguity escalated to the user), and Qdrant only searches **within the filtered scope**. Never the neighbor's orders again.

## Pitfall 4 — embeddings and chat as a single choice

Two models, two jobs, two **independent** decisions — which is exactly why MEAI exposes two interfaces:

- **`IEmbeddingGenerator`**: it must understand the **language of your documents**. German orders with an English-centric embedding model search poorly; a multilingual model like `bge-m3` (one `ollama pull` away, [episode 4]({{ site.baseurl }}/2026/09/12/meai-4-local-ollama-and-foundry-local/)) changes the game.
- **`IChatClient`**: it must excel at **tool calling** — it drives pitfalls 3 and 5. Locally: Qwen 2.5, Llama 3.1+; in the cloud: whatever you like ([episode 3]({{ site.baseurl }}/2026/09/11/meai-3-same-code-three-clouds/)).

And the warning that saves a sleepless night: **changing embeddings = re-indexing everything**. Two embedding models share neither dimensions nor geometry — you can't compare a `bge-m3` vector against a `text-embedding-3` index. Budget re-indexing like a schema migration.

## Pitfall 5 — vectorizing everything

The costliest pitfall, and the most counter-intuitive when you've just discovered vectors: "orders from customer X in March" is **not a semantic question**. It's a `WHERE customer = X AND date BETWEEN …` — exact results, zero noise, three milliseconds. Reserving Qdrant for the questions that deserve it ("have we ever had a gasket issue on this model?") is the **hybrid** architecture:

```csharp
var options = new ChatOptions
{
    Tools =
    [
        AIFunctionFactory.Create(QueryOrdersSql),        // exact filters: customer, date, status
        AIFunctionFactory.Create(SearchOrdersSemantic),  // open questions: Qdrant + threshold
    ]
};
// UseFunctionInvocation() does the rest: the model picks the right tool
```

The LLM becomes a **router**: SQL for the structured, vectors for the fuzzy, and both tools can combine within one conversation. It's the application-level version of the hybrid search we covered infrastructure-side in [vector search at scale]({{ site.baseurl }}/2026/08/19/vector-search-at-scale/).

## Pitfall 6 — tuning without measuring

The 0.75 threshold, the chunk size, the bge-m3 choice: all hypotheses until [the golden dataset]({{ site.baseurl }}/2026/08/01/build-your-rag-in-dotnet/) has judged them. Twenty real questions, the expected chunk for each, and a measurement loop for every tweak. Add two production counters: the "I don't know" rate (if it explodes, your threshold is too high) and the unsourced-answer rate (if it isn't zero, your prompt leaks).

And the question to ask **before** all of this — the one that closed the original conversation: *what do your users actually ask?* If 80% of the questions are structured lookups, start with the SQL tool alone; vectors are earned by open questions, not by hype.

## A word of honesty

- **0.75 is not a universal constant**: the right threshold depends on the embedding model, the language and the domain. Calibrate it on your golden dataset — it's a dial, not a dogma.
- Fuzzy matching has its own traps (homonyms, subsidiaries, typos): when in doubt, the tool must **ask**, never guess — pitfall 3's example does that on purpose.
- Hybrid adds moving parts. If your usage is overwhelmingly lookups, a SQL-only bot with solid tool calling is an **excellent** v1 — add vectors when open questions actually arrive.

## In short — the series in one lesson

- **Score threshold** over blind top-K — and a programmed "I don't know".
- **Structural chunking** (one field, one chunk) + metadata as **payload**, never inside the vectorized text.
- Entities get **extracted** (tool calling), **resolved** (fuzzy match in code) and **filtered** (payload) — they don't get embedded.
- Embeddings and chat: **two independent choices**; multilingual for one, tool calling for the other; budget the re-indexing.
- **Hybrid SQL + vector**: the LLM routes, SQL answers the exact, Qdrant the semantic.
- And everything gets **measured** — thresholds included.

The series comes full circle: one interface ([ep. 1]({{ site.baseurl }}/2026/09/09/meai-1-one-interface-to-rule-them-all/)), tools and types ([ep. 2]({{ site.baseurl }}/2026/09/10/meai-2-tools-typed-outputs-middleware/)), three clouds ([ep. 3]({{ site.baseurl }}/2026/09/11/meai-3-same-code-three-clouds/)), two local engines ([ep. 4]({{ site.baseurl }}/2026/09/12/meai-4-local-ollama-and-foundry-local/)) — and a RAG that survives production. And that, honestly… is not rocket science.
