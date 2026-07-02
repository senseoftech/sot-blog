---
layout: post
title:  "Freeing GitHub Copilot CLI from Tokens: Wiring Up a Local Model with Microsoft Foundry Local"
date:   2026-06-05 10:00:00
categories: certificate
author: AClerbois
ref: ghco-tokens
github_repo_username: aclerbois
github_repo : aclerbois
image: /images/posts/road.jpg
tags: [github, copilot, tokens, cli]
---

# Freeing GitHub Copilot CLI from Tokens: Wiring Up a Local Model with Microsoft Foundry Local

GitHub Copilot CLI is an excellent command-line development agent, but by default every request consumes your GitHub Copilot tokens ("premium requests"). Since April 2026, GitHub has decoupled the agent from the model router: Copilot CLI can now point to **any endpoint compatible with the OpenAI Chat Completions API**, including a model running entirely on your own machine.

That is exactly what **Microsoft Foundry Local** enables: a local, free runtime, with no Azure subscription, that exposes an OpenAI-compatible API. By combining the two, you get a terminal agent that no longer depends on your Copilot quotas, keeps your code on your machine, and can even work offline.

Here is how to set it all up.
<!--more-->

## Why do this

A few good reasons to wire up a local model:

- **Quota independence.** No more premium request consumption for everyday tasks (explanations, simple refactorings, reading logs, generating tests).
- **Privacy.** With a local model and offline mode, your prompts and your code context never leave the machine.
- **Cost.** No usage-based billing for local inference.
- **Isolated / air-gapped workflows.** Useful in environments with no internet access once the models are downloaded.

Keep in mind: a local model of a few billion parameters remains significantly less capable than a frontier model hosted in the cloud. The ideal approach is often hybrid — local for the everyday, cloud for the heavy tasks.

## How it works

The setup rests on two building blocks:

1. **Foundry Local** launches a local inference service that exposes an OpenAI-compatible endpoint (of the form `http://localhost:5273/v1`).
2. **Copilot CLI** is configured via a few environment variables (*BYOK* mode, "Bring Your Own Key") to send its requests to that endpoint instead of GitHub's servers.

Copilot CLI then redirects all model traffic to your machine.

## The critical point to know before you start

Copilot CLI imposes two requirements on the model:

- It **must support *tool calling*** (function calling). This is essential: the agent needs to invoke tools (read/write files, run commands). A model without tool calling returns an error, and Copilot CLI **never silently falls back** to a GitHub model: it displays an error message.
- It must support **streaming**.
- For good results, GitHub recommends a **context window of at least 128k tokens**.

On the Foundry Local side, **not all models support tool calling**. This is the #1 cause of failure for this setup. We'll see how to verify that a model is compatible before wiring it up.

## Prerequisites

- **GitHub Copilot CLI installed** (the `copilot` command available in the terminal).
- **Windows** (with `winget`) or **macOS** (with Homebrew). Foundry Local is primarily Windows-oriented; on Linux/WSL2, you sometimes have to call the service from a supported host machine.
- Internet access for the first download of models and execution runtimes (afterward, usage can be offline).
- Administrator rights for the installation.

## Step 1 — Install Foundry Local

**Windows** (PowerShell as administrator):

```powershell
winget install Microsoft.FoundryLocal
```

**macOS** (Homebrew):

```bash
brew tap microsoft/foundrylocal
brew install foundrylocal
```

You can also grab the installer from the *releases* page of the GitHub repository `microsoft/foundry-local`.

Then verify the installation:

```bash
foundry --version
```

If you get a service connection error along the lines of *"Request to local service failed"*, restart the service:

```bash
foundry service restart
```

## Step 2 — Choose a model that supports tool calling

This is the most important step. List the available models:

```bash
foundry model list
```

In the output, look at the **Task** column: the value **`tools`** indicates that the model supports tool calling. Be sure to choose a model marked `tools` — otherwise Copilot CLI will fail.

You'll also notice that each model comes in several **optimized variants** depending on the hardware (generic CPU, generic GPU, CUDA, TensorRT/RTX, NPU). Foundry Local automatically selects the best variant for your machine, but you can force a specific variant via its ID.

Run the chosen model (generic example — replace it with a `tools` model from your list, ideally a recent code model such as a Qwen Coder or a Phi with tool support):

```bash
foundry model run <MODEL-NAME>
```

This command downloads the model on first use (it may take several minutes), starts the service, then opens an interactive chat session. The download happens only once: after that the model is cached.

You can exit the chat session — the service itself stays active to serve Copilot CLI.

> Tip: to force execution on CPU regardless of your hardware, use the full ID of the CPU variant, for example `foundry model run qwen2.5-0.5b-instruct-generic-cpu`.

## Step 3 — Retrieve the local endpoint

Query the service status to find the URL and the **port** (dynamically allocated, `5273` by default):

```bash
foundry service status
```

The OpenAI-compatible endpoint follows the format:

```
http://localhost:<PORT>/v1
```

with chat completions at `http://localhost:<PORT>/v1/chat/completions`. Note the displayed port: you'll need it in the next step.

You can verify that the service responds:

```bash
curl http://localhost:<PORT>/openai/status
```

You also need the **exact model identifier** (the *model ID*, not just the alias). You'll find it in the output of `foundry model list`.

> Need to change the port (conflict with another service)? `foundry service set --port 8081`.

## Step 4 — Configure Copilot CLI toward Foundry Local

Copilot CLI is configured through environment variables, to be set **before** launching the `copilot` command. Since Foundry Local exposes an OpenAI-compatible API, you use the `openai` provider type (which is the default value).

The available variables:

| Variable | Required | Role |
| --- | --- | --- |
| `COPILOT_PROVIDER_BASE_URL` | Yes | Base URL of your endpoint |
| `COPILOT_MODEL` | Yes | Model identifier (the *model ID*) |
| `COPILOT_PROVIDER_TYPE` | No | `openai` (default), `azure`, or `anthropic` |
| `COPILOT_PROVIDER_API_KEY` | No | Not needed for a local service without authentication |

**macOS / Linux (bash)** — adapt the port and model name:

```bash
export COPILOT_PROVIDER_BASE_URL=http://localhost:5273/v1
export COPILOT_MODEL=<MODEL-ID>
copilot
```

**Windows (PowerShell)**:

```powershell
$env:COPILOT_PROVIDER_BASE_URL = "http://localhost:5273/v1"
$env:COPILOT_MODEL = "<MODEL-ID>"
copilot
```

Once Copilot CLI is launched, the agent sends its requests to your local model. No API key is required, and GitHub authentication is not mandatory in BYOK mode.

> Built-in reminder: `copilot help providers` shows a quick recap of the configuration directly in the terminal.

A small tip: to avoid retyping these variables at every session, add them to your shell profile (`~/.bashrc`, `~/.zshrc`) or to your Windows environment variables.

## Step 5 (optional) — Full offline mode

To prevent Copilot CLI from contacting GitHub's servers, enable offline mode:

```bash
export COPILOT_OFFLINE=true
```

(in PowerShell: `$env:COPILOT_OFFLINE = "true"`)

In offline mode, all telemetry is disabled and the CLI communicates only with your configured provider. Combined with a local model, this gives you a fully isolated workflow.

Two important nuances:

- Network isolation is only total if your provider is **local** as well. If `COPILOT_PROVIDER_BASE_URL` points to a remote endpoint, your prompts are still sent there.
- Offline mode deprives you of features that depend on GitHub (for example `/delegate`, GitHub code search, etc.). If you want to keep those features while using your local model, stay logged in to GitHub and **do not set** `COPILOT_OFFLINE`: you then get the best of both worlds — your model for the answers, and GitHub features on top.

## Pitfalls and limitations to know

- **Tool calling is mandatory.** If Copilot CLI returns an *Invalid JSON* error or refuses to start, the model probably doesn't support tool calling. Go back to `foundry model list` and choose a model marked `tools`.
- **Context window.** Many small local models have a context below the recommended 128k. On large files or long sessions, quality drops. Adjust your context/output limits accordingly and favor focused prompts.
- **Hardware.** Performance depends heavily on your hardware. A GPU radically changes the experience compared to CPU alone. Quantized variants (e.g. INT8) help on modest machines.
- **Model TTL.** By default, Foundry Local unloads a model from memory after ~10 minutes without a request. The first request after that idle period will be slower, while the model reloads.
- **Preview status.** Foundry Local is in preview: some commands or behaviors may change. Copilot CLI's BYOK path is also recent and evolving.
- **Think about the ecosystem around the model.** A local model on its own remains limited. What turns it into a genuine dev tool are the layers around it: custom instructions (what your project is, what not to touch), *skills* (structured workflows), and MCP servers (tests, linters, semantic search). The model doesn't need to be brilliant at everything if the tooling guides it.

## Quick recap

```bash
# 1. Install (Windows)
winget install Microsoft.FoundryLocal

# 2. List and choose a "tools" model, then run it
foundry model list
foundry model run <MODEL-ID>

# 3. Retrieve the endpoint port
foundry service status

# 4. Point Copilot CLI to the local model
export COPILOT_PROVIDER_BASE_URL=http://localhost:5273/v1
export COPILOT_MODEL=<MODEL-ID>
# (optional) export COPILOT_OFFLINE=true
copilot
```

And there you go: Copilot CLI now runs on your own model, without touching your GitHub quotas. Start small with a lightweight model to validate the workflow, then move up the range depending on your hardware and your needs.

---

*References: GitHub documentation "Using your own LLM models in GitHub Copilot CLI" and Microsoft Learn documentation "Get started with Foundry Local" / "Use tool calling with Foundry Local". Check these sources for the latest developments, as both products are evolving rapidly.*
