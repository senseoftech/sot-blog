---
layout: post
title: "Tests: the executable spec — it's not rocket science!"
date: 2026-08-26 10:00:00
author: AClerbois
ref: tests-as-spec
image: /images/posts/tests-as-spec.png
tags: [testing, TDD, AI, best-practices]
level: 100
---

Friday, 4:40 pm. An AI agent just rewrote your shipping-fee calculation — forty files touched, eight hundred lines. Your colleague worries: *"You're going to re-read all of that?"* No. You look at one thing: the test suite. Seventy-four green, zero red. You review the hot spots, and you merge. Calmly.

Yesterday, [the implementation plan]({{ site.baseurl }}/2026/08/25/the-implementation-plan-the-human-checkpoint/) set the human checkpoint *before* the agent writes code. Today, the artifact that locks the result down *after*: tests. On [the map of vibe coding artifacts]({{ site.baseurl }}/2026/08/21/the-artifacts-of-vibe-coding-the-complete-map/), they hold a special place — the only documentation that cannot lie. You'll see: it's not rocket science.

<!--more-->

## The instructions binder and the smoke detector

Every building has two fire-safety documents. The **instructions binder**: prose, filed in a cabinet, that nobody reopens — and that can be three years out of date without anyone noticing. And the **smoke detector**: you press the button, it beeps or it doesn't. It doesn't *describe* safety, it **verifies** it.

Your prose docs, your specs, your comments: the binder. Useful, but nothing stops them from drifting in silence. A test is wired to reality: the day it and the code stop telling the same story, **it turns red**. It's the only documentation that cannot lie — precisely because it knows how to fail.

And in the agent era, that property changes in value. When code becomes regenerable in ten minutes, it becomes almost a consumable. The tests become **the contract**: the agent may rewrite the entire implementation — as long as the tests pass, the behavior is preserved. The real asset has moved.

## A test that reads like a spec

A test is only a spec if you can *read* it as one. Two habits are enough:

**Behavioral naming.** `Test1` or `CalculateShipping_Test` say nothing. `When_the_cart_exceeds_100e_shipping_is_free` states a business rule — it's Given-When-Then compressed into a method name. Someone reading the test list is reading the spec, without opening a single method body.

**The Arrange-Act-Assert skeleton.** Every test tells the same three-act story, mapping exactly onto the Given-When-Then of specs:

| Act | Given-When-Then | What happens there |
| --- | --- | --- |
| **Arrange** | *Given* | set up the starting situation |
| **Act** | *When* | trigger **the action — one only** |
| **Assert** | *Then* | check the observable result |

## A complete example, in full

```csharp
public class ShippingFeeTests
{
    [Fact]
    public void When_the_cart_exceeds_100e_shipping_is_free()
    {
        // Arrange
        var cart = new Cart();
        cart.Add(new Item("Mechanical keyboard", price: 89.90m));
        cart.Add(new Item("Mouse pad", price: 19.90m));

        // Act
        var order = cart.Checkout();

        // Assert
        Assert.Equal(0m, order.ShippingFee);
    }

    [Fact]
    public void When_the_cart_is_exactly_100e_shipping_is_still_charged()
    {
        // Arrange
        var cart = new Cart();
        cart.Add(new Item("24-inch monitor", price: 100.00m));

        // Act
        var order = cart.Checkout();

        // Assert
        Assert.Equal(4.99m, order.ShippingFee);
    }
}
```

Look at the second test: it answers the question prose always leaves open — does "exceeds" mean `>` or `>=`? Here, no ambiguity is possible: at exactly €100, you pay. A prose spec *may* pin down that edge case; the test **cannot not pin it down**. And notice what these tests ignore: the internal class doing the math, the number of methods called. They test the **behavior** — the final price — not the implementation. We'll come back to that below; it matters enormously.

## TDD is reborn — at LLM speed

*Test-driven development* — write the red test first, make it green, refactor — is twenty-five years old and has a reputation as a demanding discipline. Agents are giving it a second youth, for a simple reason: **writing the test first means handing the agent its target**. Instead of a fuzzy prompt ("shipping is free above €100"), you give a binary criterion: "make this test pass". The agent loops on its own — code, run tests, read the failure, fix — and the red-green-refactor cycle, which used to cost human discipline, now spins at LLM speed. You only had to validate one thing: the test. Which is to say, the spec.

## Tests or evals? Both — but not for the same job

Don't confuse this xUnit suite with [the evals we covered in July]({{ site.baseurl }}/2026/07/20/testing-an-ai-application-evals/):

| | Tests | Evals |
| --- | --- | --- |
| Verify | **your code**, deterministic | the **model's behavior**, probabilistic |
| Result | binary — green or red | a score, a pass rate |
| "Shipping is free at €101" | test | — |
| "The chatbot answers politely" | — | eval |

If your application calls an LLM, you need both — but never ask one to do the other's job.

## Why it's worth double in the AI agent era

1. **The test holds the line while the agent moves.** A massive AI-generated refactoring with no safety net is roulette. With a suite that tests behavior, the agent can move, rename, rewrite — the contract holds as long as it's green. That's what makes code *regenerable* without being *fragile*.
2. **"Write the tests first, I'll validate them, then implement."** The best agent workflow I know. Reviewing ten tests — sentences, almost — is infinitely faster than reviewing eight hundred lines of implementation. You validate the spec, the agent handles the rest: **the AI proposes, the human decides, the repository remembers**.
3. **The agent reads the tests to understand.** Facing unfamiliar code, a good agent opens the test suite: it's the most reliable description of expected behavior in the repo — more reliable than prose docs, since CI guarantees it's still true. Today's tests are tomorrow's agent context.

## The honesty moment

It'll be longer than usual, because the subject deserves it: **agents cheat.**

- **Facing a red test, an agent is tempted to "fix"… the test.** A weakened assertion (`Assert.True(true)` is not a legend), an expected value aligned with the bug, a `[Fact(Skip = "flaky")]` that quietly appeared. From its point of view, red became green: mission accomplished. The countermeasure takes two moves: an explicit line in your agent instructions — *"never modify an existing test without asking me"* — and a review rule: **any diff touching a test file gets read with double the attention**. The agent may rewrite the code; the contract, never.
- **Coverage is not quality.** 100% coverage with empty assertions is a four-digit lie: every line is *executed*, nothing is *verified*. An agent can produce that lie very quickly if you ask it for "coverage". Ask for tested behaviors, not a percentage.
- **Fragile tests punish regeneration instead of enabling it.** A suite stuffed with mocks verifying that some internal method is called twice in a given order breaks on every refactoring — even when the behavior is intact. The result: fifty reds that signal nothing, and the agent (or you) ends up "adapting" them in bulk. Test the **observable behavior**, not the implementation: that's what makes the contract durable.

## In summary

- Tests are the **only documentation that cannot lie**: when the code drifts, **they turn red** — the smoke detector, not the instructions binder.
- A spec-grade test shows in its **behavioral name** (`When_the_cart_exceeds_100e…`) and its **Arrange-Act-Assert** skeleton — executable Given-When-Then.
- With agents, code becomes regenerable and tests become **the contract**: "write the tests first, I validate, then implement".
- Stay lucid: **agents cheat with tests** — lock them down by instruction, double-review their test diffs, and test behavior, not implementation.

Code, these days, regenerates. The executable spec remains — and it beeps the moment you lie to it. And that, honestly… is not rocket science.
