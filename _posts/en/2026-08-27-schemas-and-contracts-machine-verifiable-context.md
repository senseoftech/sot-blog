---
layout: post
title: "Schemas and contracts: the context AI can't hallucinate — it's not rocket science!"
date: 2026-08-27 10:00:00
author: AClerbois
ref: machine-contracts
image: /images/posts/machine-contracts.png
tags: [API, OpenAPI, contracts, AI, best-practices]
level: 100
---

The agent's job was to wire the application to the partner's API. The doc? Thirty pages of polished prose, with examples "for illustration purposes". The generated HTTP client was gorgeous — and wrong. The field was `email_address`, not `customerEmail`; the amount was in cents, not euros; and `canceled` took one L. Three round-trips with production to discover everything the prose had never enforced.

Yesterday, [tests as executable spec]({{ site.baseurl }}/2026/08/26/tests-the-executable-spec/): tests verify *behavior*. Today, their twin on [the artifacts map]({{ site.baseurl }}/2026/08/21/the-artifacts-of-vibe-coding-the-complete-map/): **schemas and contracts**, which verify *boundaries*. Context that validates itself instead of asking to be believed. You'll see: it's not rocket science.

<!--more-->

## The wall socket

Look at the power socket on your wall. Nobody ever handed you a manual saying "please insert the plug the right way around". No need: the standard gave the plug and the socket **a shape that makes the mistake impossible**. You can't plug it in wrong — not because you're careful, but because the geometry refuses.

That's the whole difference between two families of documentation. Prose *describes* the boundary ("the amount is in cents") and hopes the reader complies. A schema *is* the boundary: a malformed call doesn't get through, full stop. Prose documentation is a warning sign; a machine-verifiable contract is the shape of the socket.

## One contract per boundary

A **machine-verifiable contract** is a formal description of a boundary — formal enough for a tool to check it with no human in the loop. There's one for every kind of boundary:

| Boundary | Contract | Who checks it |
| --- | --- | --- |
| HTTP APIs | **OpenAPI** | client generators, contract tests in CI |
| Payloads, events, config files | **JSON Schema** | validators, at runtime and in CI |
| The inside of your code | **.NET types**: *nullable reference types*, records, enums | the compiler, on every build |

That third row sometimes surprises people: yes, your type system is a contract. A `string?` that distinguishes "may be null" from `string` "never null", an enum listing the only three legal statuses, a record with `required` members… that's **the spec written into the compiler**. And it gets checked more often than any document: on every single compile.

## A concrete example, in full

On the contract side, an OpenAPI excerpt for a refund:

```yaml
# openapi.yaml — excerpt
paths:
  /orders/{orderId}/refund:
    post:
      operationId: refundOrder
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/RefundRequest'
components:
  schemas:
    RefundRequest:
      type: object
      required: [amount, reason]
      additionalProperties: false
      properties:
        amount:
          type: integer
          description: Amount in cents.
        reason:
          type: string
          enum: [damaged, late, other]
```

Feed that file to a client generator — NSwag, Kiota, brand doesn't matter — and you get C# with the exact shape of the socket:

```csharp
// Generated from openapi.yaml — do not edit by hand
public partial record RefundRequest
{
    public required int Amount { get; init; }
    public required RefundReason Reason { get; init; }
}

public enum RefundReason { Damaged, Late, Other }

public partial class OrdersClient
{
    public Task<RefundResponse> RefundOrderAsync(
        Guid orderId, RefundRequest request, CancellationToken ct = default);
}
```

Now try adding a `RefundToCard = true` field: compile error, the member doesn't exist. An amount as `string`? Rejected. A `reason: "cancelled"`? The enum has never heard of it. And the schema's `additionalProperties: false` does the same job server-side, at runtime. The boundary isn't documented anymore — it's **impossible to cross sideways**.

## Choosing your source of truth

One architecture question remains: which one is authoritative, the schema or the code?

- **Schema first** (*contract-first*): the OpenAPI file is written — and reviewed in PR — before the code; clients *and* server are generated from it. Ideal when several teams consume the same API.
- **Code first**: the C# code is authoritative, and the schema is generated on every build and published. Ideal when one team owns both ends.

Both work. The only fatal choice is the in-between: a hand-written schema *and* hand-written code, synchronized "whenever someone remembers". The rule: **one of the two directions must be automatic**. Otherwise you don't have a contract, you have two versions of the truth.

## Why it's worth double in the AI agent era

1. **The agent reads the schema and hits the target on the first try.** Exact field names, types, required vs optional, enum values: everything prose leaves to guesswork, the schema states. An agent with `openapi.yaml` in its context generates the correct call where an agent with a PDF generates a plausible hypothesis.
2. **The agent *can't* drift.** If it invents something anyway, the compiler catches it at generation time and contract validation catches it in CI — before you do. The series formula gets sharper: the AI proposes, **the contract rules first**, the human arbitrates what's left, the repository remembers. The feedback loop replaces vigilance.
3. **The token-to-value ratio is unbeatable.** A fifty-line schema costs next to nothing in context and eliminates an **entire class** of hallucinations — invented fields, the most mundane AI mistake in the world. Few artifacts give back so much for so little.

## The honesty moment

- **A schema that's published but never verified in CI is worse than nothing.** It silently drifts from the implementation, and everyone — humans and agents — trusts a document that lies. A socket that lies is more dangerous than no socket at all. The guardrail: a CI job that compares schema and implementation on every build.
- **Strict typing doesn't validate semantics.** A `decimal Amount` happily accepts a negative price; a `DateTime` accepts a delivery in 1987. Business invariants still have to be coded — the contract guards the boundary, not the meaning.
- **Contract-first has an entry cost.** Generators to wire up, a pipeline to adjust, a team to convince to write YAML before C#. It's an investment — it pays off from the second consuming team onward, and is debatable for an internal API consumed only by its own author.

## In summary

- Prose **describes** the boundary; a contract **is** the boundary — like the standardized socket, it makes the mistake impossible instead of documenting it.
- One contract per boundary: **OpenAPI** for HTTP APIs, **JSON Schema** for payloads and config, **.NET types** as the spec inside the compiler.
- Schema first or code first, doesn't matter — but **one of the two directions must be automatic**, and verified in CI.
- For agents: a schema in context yields **correct calls on the first try**, and whatever drifts anyway gets **caught by the machine** — the feedback loop replaces vigilance.

One YAML file reviewed in PR, one generator in the build, and a whole category of hallucinations — invented fields — vanishes from your code reviews. And that, honestly… it's not rocket science.
