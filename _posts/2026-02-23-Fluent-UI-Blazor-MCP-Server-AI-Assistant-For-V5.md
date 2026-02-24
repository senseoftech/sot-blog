---
layout: post
title:  "Fluent UI Blazor MCP Server: An AI Assistant to Support Your V5 Migration"
date:   2026-02-23 10:00:00
author: AClerbois
tags: [Blazor, Fluent UI, MCP, AI, .NET, Copilot]
---

## The Challenge of Migrating to Fluent UI Blazor V5

[Microsoft Fluent UI Blazor version 5](https://www.fluentui-blazor.net/) brings a wealth of new features, breaking changes, and refactoring. With over **142 components** available, browsing the documentation to find the right parameter, understand an enum, or adapt your existing code can quickly become time-consuming.

<!-- more -->

What if your AI assistant — GitHub Copilot, Claude, Cursor — could **directly** access the complete documentation for every component, including migration guides?

That's exactly what the **Fluent UI Blazor MCP Server** offers.

## What Is an MCP Server?

The [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) is an open standard that enables AI agents to access external data sources — tools, APIs, documentation — through a unified protocol. In practice, an MCP server exposes **tools** (automatically invoked by the AI) and **resources** (manually attached to a conversation) that your IDE can leverage.

Instead of copy-pasting documentation into your prompt, the MCP server makes it **natively accessible** to the AI.

## The Fluent UI Blazor MCP Server

I contributed to the creation of this MCP server, now available as an [official NuGet package](https://www.nuget.org/packages/Microsoft.FluentUI.AspNetCore.McpServer). It provides your AI assistant with full access to the Fluent UI Blazor V5 documentation:

### Available Tools (automatically invoked by the AI)

| Tool | Description |
|---|---|
| `ListComponents` | Lists all available components, with optional category filtering |
| `GetComponentDetails` | Complete documentation for a component (parameters, events, methods) |
| `SearchComponents` | Search components by name or description |
| `GetEnumValues` | Explore enum types and their values |
| `GetComponentEnums` | Lists enums used by a given component |
| `ListDocumentationTopics` | Lists all documentation topics |
| `GetDocumentationTopic` | Detailed documentation on a topic (installation, localization, styles...) |
| `SearchDocumentation` | Search documentation by keyword |
| `GetMigrationGuide` | **Complete migration guide to V5** |

### Available Resources (attached by the user)

| URI | Description |
|---|---|
| `fluentui://components` | Complete list of all components by category |
| `fluentui://categories` | List of categories with component counts |
| `fluentui://enums` | Complete list of all enum types with their values |
| `fluentui://component/{name}` | Detailed documentation for a specific component |
| `fluentui://category/{name}` | Components in a given category |
| `fluentui://enum/{name}` | Details of an enum type |
| `fluentui://documentation` | List of all documentation topics |
| `fluentui://documentation/{topic}` | Documentation for a specific topic |
| `fluentui://documentation/migration` | Migration guide to V5 |

## Installation

### Option 1: .NET Global Tool (recommended)

Install the MCP server as a global tool:

```bash
dotnet tool install -g Microsoft.FluentUI.AspNetCore.McpServer
```

Then configure your `.vscode/mcp.json` file:

```json
{
    "servers": {
        "fluent-ui-blazor": {
            "command": "fluentui-mcp"
        }
    }
}
```

### Option 2: Using `dnx` (no installation required)

If you're using .NET 10+, you can use the [`dnx`](https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-10/sdk#the-new-dnx-tool-execution-script) script to run the server on the fly:

```json
{
    "servers": {
        "fluent-ui-blazor": {
            "type": "stdio",
            "command": "dnx",
            "args": [
                "Microsoft.FluentUI.AspNetCore.McpServer",
                "--yes"
            ]
        }
    }
}
```

This method automatically downloads the latest version from NuGet.org. You can also pin a specific version:

```bash
dnx Microsoft.FluentUI.AspNetCore.McpServer@5.0.1
```

### Option 3: Build from Source

To contribute or customize the server:

```bash
cd src/Tools/McpServer
dotnet build
```

```json
{
    "servers": {
        "fluent-ui-blazor": {
            "type": "stdio",
            "command": "dotnet",
            "args": [
                "run",
                "--project",
                "src/Tools/McpServer/Microsoft.FluentUI.AspNetCore.McpServer.csproj"
            ],
            "env": {
                "DOTNET_ENVIRONMENT": "Development"
            }
        }
    }
}
```

## Real-World Usage Examples

Once the MCP server is configured, your AI assistant can answer questions like:

**"What Button-type components are available?"**
→ The AI automatically invokes `ListComponents(category: "Button")` and returns the complete list.

**"How do I use FluentDataGrid with sorting and pagination?"**
→ The AI calls `GetComponentDetails(componentName: "FluentDataGrid")` and retrieves all documented parameters, events, and methods.

**"Which enum should I use for button appearance?"**
→ `GetEnumValues(enumName: "Appearance")` returns all possible values.

**"How do I migrate my code from V4 to V5?"**
→ `GetMigrationGuide()` provides the complete migration guide directly in the AI's context.

## Architecture: Security and Performance

The MCP server was designed with strict security principles:

| Feature | Detail |
|---|---|
| **Read-only** | No file system modifications |
| **No network access** | Runs entirely offline |
| **Pre-generated documentation** | No code execution at runtime |
| **Sandboxed execution** | Runs as a child process of your IDE |
| **No sensitive data** | Serves only public API documentation |
| **Open source** | Fully auditable code on [GitHub](https://github.com/microsoft/fluentui-blazor) |

The architecture relies on a documentation JSON **pre-generated at build time** from the project's XML docs, then embedded as a resource in the package. This ensures fast startup and documentation that is always consistent with the package version.

```
┌─────────────────────────────────────────────────┐
│ FluentUI.Demo.DocApiGen (Build Time)            │
│ ├── Uses LoxSmoke.DocXml                        │
│ └── Generates FluentUIComponentsDocumentation.json
└─────────────────────────────────────────────────┘
                    │
                    ▼ (PreBuild / EmbeddedResource)
┌─────────────────────────────────────────────────┐
│ McpServer (Runtime)                             │
│ └── Reads JSON from embedded resource           │
└─────────────────────────────────────────────────┘
```

## Compatible with Visual Studio Code AND Visual Studio 2026

The MCP server works with:

- **Visual Studio Code** via `.vscode/mcp.json`
- **Visual Studio 2026** via `.mcp.json` at the solution root
- **Any compatible MCP client** (MCP Inspector, Claude Desktop, etc.)

## Why This Is a Game-Changer for V5

Migrating to a new major version of a component library is always a delicate moment. With the Fluent UI Blazor MCP Server:

1. **No more searching through docs** — The AI has native access to all documentation
2. **Built-in migration guide** — `GetMigrationGuide()` provides breaking changes and migration steps
3. **Component discovery** — Don't know all 142+ components yet? The AI can present them by category
4. **Accelerated prototyping** — Ask the AI to generate a `FluentDataGrid` with pagination — it knows all the parameters

## Useful Links

- [NuGet Package — Microsoft.FluentUI.AspNetCore.McpServer](https://www.nuget.org/packages/Microsoft.FluentUI.AspNetCore.McpServer)
- [GitHub Repository — microsoft/fluentui-blazor](https://github.com/microsoft/fluentui-blazor)
- [Fluent UI Blazor Demo Site](https://www.fluentui-blazor.net/)
- [What's New — Fluent UI Blazor](https://www.fluentui-blazor.net/whatsnew)
- [Model Context Protocol — Specification](https://modelcontextprotocol.io/)
- [dnx Documentation (.NET 10)](https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-10/sdk#the-new-dnx-tool-execution-script)

## Conclusion

The Fluent UI Blazor MCP Server turns your AI assistant into a **Fluent UI Blazor expert**. No more juggling between your IDE and the documentation — everything is directly accessible within your AI conversation.

If you're starting your migration to V5 or kicking off a new Blazor project with Fluent UI, install the MCP server — your productivity will thank you.

```bash
dotnet tool install -g Microsoft.FluentUI.AspNetCore.McpServer
```

**Happy coding!**
