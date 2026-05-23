# Xevu MCP

> Xevu figures out who uses your app, then reads your code through their eyes.

An MCP server that reads your React codebase, detects what kind of app you built, and gives you UX feedback through behavioral user archetypes — using your IDE's own AI, at zero cost.

## Quick Start

Add to your IDE's MCP config:

```json
{
  "mcpServers": {
    "xevu": {
      "command": "npx",
      "args": ["-y", "xevu-mcp"]
    }
  }
}
```

Then ask your IDE AI:

- *"Xevu, scan my project"*
- *"Xevu, check my checkout flow"*
- *"Xevu, analyze the onboarding experience"*

## How It Works

1. **Scans** your React codebase (components, routes, text, state)
2. **Detects** your app domain (e-commerce, SaaS, content, devtool, healthcare)
3. **Traces** user flows across connected components
4. **Applies** 5 behavioral archetype lenses:
  - 🐣 **First-Timer** — reads nothing, needs guidance
  - 🎯 **Goal-Getter** — hates extra steps
  - ⚡ **Rusher** — needs instant feedback
  - 🛡️ **Skeptic** — wants proof before trusting the flow
  - 🔁 **Returning-User** — expects continuity and shortcuts
5. **Returns** structured findings your IDE AI presents as actionable feedback

## Tools

| Tool | Purpose |
|------|---------|
| `xevu_scan_project` | Scan project, detect domain, get overview |
| `xevu_detect_domain` | Focused domain detection with evidence |
| `xevu_analyze_flow` | Full flow analysis with archetype lenses |
| `xevu_check_component` | Quick single-component check |

## License

MIT
