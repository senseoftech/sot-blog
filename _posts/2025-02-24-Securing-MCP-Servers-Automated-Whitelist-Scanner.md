---
layout: post
title:  "Securing Your MCP Servers: An Automated Scanner for GitHub Actions"
date:   2025-02-24 10:00:00
author: AClerbois
tags: [MCP, security, AI, GitHub Actions, DevSecOps]
---

## The Model Context Protocol: A Revolution... and an Attack Surface

The [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) is rapidly establishing itself as the open standard enabling AI agents — GitHub Copilot, Claude, Cursor, and many others — to access external tools, databases, and APIs. In practice, an `mcp.json` file declared in your project allows your IDE to interact with remote or local servers that expose additional capabilities to the AI.

<!-- more -->

It's powerful. It's also **dangerous** if these servers aren't audited.

## Security Risks Associated with MCP Servers

The security community has already identified several attack vectors specific to MCP servers:

### Prompt Injection

A malicious MCP server can inject content into its tool descriptions to manipulate AI agent behavior. The agent then performs actions not intended by the user, in complete transparency.

- [Invariant Labs — MCP Security Notification: Tool Poisoning Attacks](https://invariantlabs.ai/blog/mcp-security-notification-tool-poisoning-attacks)
- [OWASP — Prompt Injection](https://owasp.org/www-project-top-10-for-large-language-model-applications/)

### Tool Poisoning

A tool exposed by an MCP server can be compromised: instead of executing the expected action, it runs malicious code — reading sensitive files, executing system commands, exfiltrating tokens.

- [Snyk — Securing AI Agents: Understanding MCP Tool Poisoning](https://snyk.io/blog/securing-ai-agents-understanding-mcp-tool-poisoning/)

### Toxic Flows (WhatsApp-style Data Exfiltration)

When an AI agent uses multiple MCP tools in a chain, a compromised tool can transmit data collected by a legitimate tool to a malicious server. This is the principle behind *toxic tool-call flows*.

- [Trail of Bits — MCP Security Review](https://blog.trailofbits.com/2025/01/09/the-model-context-protocol-and-its-security-implications/)

### Rug Pull Attacks

An MCP server can silently modify the behavior of its tools **after** the user has approved them. The visible description remains unchanged, but the executed code is different — a particularly insidious scenario.

- [Pillar Security — The Security Risks of Model Context Protocol](https://www.pillar.security/blog/the-security-risks-of-model-context-protocol-mcp)

## The Reality: Nobody Is Auditing MCP Servers

During an engagement with a client, we noticed that development teams were adding MCP servers to their VS Code configurations without any validation process. Each developer could declare their own servers, with zero visibility for the security team.

The questions that arose:

- **Which MCP servers are being used** across the organization?
- **Are they trustworthy?** Could a third-party HTTP server be compromised between deployments?
- **How can we detect silent changes** in the tools exposed by a server?

## The Solution: An Automated MCP Scanner in GitHub Actions

We developed a GitHub Actions workflow that:

1. **Automatically discovers** all `mcp.json` files in the repository
2. **Runs [mcp-scan](https://github.com/snyk/agent-scan)** (Snyk's open-source tool) on each configuration
3. **Analyzes every tool, prompt, and resource** exposed by the declared MCP servers
4. **Generates a JUnit XML test report** displayed directly in the Pull Request *Checks* tab
5. **Publishes a Markdown summary** in the *Job Summary* of each run

### Pipeline Architecture

```
mcp.json → mcp-scan (analysis) → JSON → JUnit XML + Markdown → GitHub Actions (Test Report + Summary)
```

### Automatic Triggers

| Event | Condition |
|---|---|
| **Push** to `main` | Modification of an `mcp.json` file |
| **Pull Request** to `main` | Same |
| **Weekly schedule** | Every Monday at 08:00 UTC |
| **Manual** | Via the Actions tab |

The **weekly scan** is essential: it detects *rug pull attacks*, i.e., silent server-side modifications that occur between commits.

### GitHub Actions Workflow Example

```yaml
name: MCP Security Scan

on:
  push:
    branches: [main]
    paths:
      - '**/*mcp*.json'
  pull_request:
    branches: [main]
    paths:
      - '**/*mcp*.json'
  schedule:
    - cron: '0 8 * * 1'
  workflow_dispatch:

permissions:
  contents: read
  checks: write
  pull-requests: write

jobs:
  mcp-scan:
    name: Scan MCP Configurations
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install uv
        uses: astral-sh/setup-uv@v4

      - name: Run mcp-scan
        run: |
          MCP_FILES=$(find . -name "mcp.json" -o -name "mcp*.json" \
            | grep -v node_modules | grep -v .git/)
          uvx mcp-scan@latest --json --server-timeout 30 $MCP_FILES \
            > mcp-scan-results.json 2>mcp-scan-stderr.log || true

      - name: Convert results to JUnit XML
        run: |
          python .github/scripts/mcp-scan-to-junit.py \
            mcp-scan-results.json \
            mcp-scan-results.xml \
            mcp-scan-summary.md
          cat mcp-scan-summary.md >> "$GITHUB_STEP_SUMMARY"

      - name: Publish Test Report
        uses: dorny/test-reporter@v1
        if: always()
        with:
          name: MCP Security Scan Results
          path: mcp-scan-results.xml
          reporter: java-junit
          fail-on-error: false
```

### Reading the Results

Results appear directly in the GitHub interface:

- **Checks tab** on the PR: each MCP server is a *test suite*, each tool is a *test case*
  - ✅ **Passed** — no issues detected
  - ❌ **Failed** — vulnerability detected (prompt injection, tool poisoning, etc.)
  - ⚠️ **Error** — server unreachable or timeout
- **Job Summary**: summary table per server with the number of tools analyzed and alerts

## Result Conversion: The Python Script

The core of the system relies on a Python script that converts the JSON output from `mcp-scan` into a JUnit XML report consumable by [dorny/test-reporter](https://github.com/dorny/test-reporter). Each tool exposed by an MCP server is evaluated against a **risk score**:

- Tools with a score above the threshold (0.5) are marked as **failed**
- Unreachable servers are marked as **error**
- Healthy tools are marked as **passed**

This JUnit format leverages the existing ecosystem: native integration with GitHub, Azure DevOps, Jenkins, etc.

## Value Proposition

| Benefit | Detail |
|---|---|
| **Visibility** | Centralized, versioned inventory of all authorized MCP servers |
| **Proactive detection** | Identify vulnerabilities before they impact developers |
| **Continuous monitoring** | Detect silent server-side changes (rug pulls) |
| **Zero cost** | mcp-scan is open-source, no license required |
| **Audit & compliance** | Archived reports (JUnit XML, JSON, Markdown) for every run |

## Going Further

### MCP Security Resources

- [Model Context Protocol — Official Specification](https://modelcontextprotocol.io/)
- [Snyk agent-scan (mcp-scan) — GitHub](https://github.com/snyk/agent-scan)
- [Invariant Labs — MCP Security Notifications](https://invariantlabs.ai/blog/mcp-security-notification-tool-poisoning-attacks)
- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- [Trail of Bits — The Model Context Protocol and its Security Implications](https://blog.trailofbits.com/2025/01/09/the-model-context-protocol-and-its-security-implications/)
- [Pillar Security — The Security Risks of MCP](https://www.pillar.security/blog/the-security-risks-of-model-context-protocol-mcp)
- [Snyk — Securing AI Agents: Understanding MCP Tool Poisoning](https://snyk.io/blog/securing-ai-agents-understanding-mcp-tool-poisoning/)

### GitHub Actions Used

- [dorny/test-reporter](https://github.com/dorny/test-reporter) — Display test reports in GitHub
- [astral-sh/setup-uv](https://github.com/astral-sh/setup-uv) — Install `uv` to run `mcp-scan`
- [actions/upload-artifact](https://github.com/actions/upload-artifact) — Archive results

## Conclusion

The massive adoption of MCP in AI-assisted development tools creates a **new attack surface** that most organizations have not yet addressed. A compromised MCP server can exfiltrate source code, secrets, or silently manipulate an AI agent's behavior.

Setting up an automated scanner, integrated into your CI/CD pipeline, is an essential first step to **regain control** over this emerging supply chain. All at zero cost, with no additional infrastructure, and native GitHub Actions integration.

**Don't wait for an incident to audit your MCP servers.**
