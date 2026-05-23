# Xevu Sub-Agents

This document defines the specialist sub-agents to use when building Xevu. The goal is to keep the work split by responsibility so each agent stays focused on one part of the 6-stage pipeline.

## Shared Rules For All Agents

- Work read-only against the target React project.
- Use `src/shared/types.ts` as the single source of truth for domain types.
- Keep pipeline code fail-soft and return `Result<T, E>` instead of throwing.
- Use `.js` extensions for relative imports in TypeScript files.
- Log to stderr only.
- Write tests alongside new code.

## Recommended Sub-Agents

| Agent | Mission | Best Used For | Deliverables |
|---|---|---|---|
| Explore Agent | Fast read-only codebase exploration | Finding where a behavior lives, identifying nearby tests, narrowing scope before edits | File map, relevant symbols, local hypothesis, next-step recommendation |
| Architecture Agent | Own the overall Xevu design | Defining module boundaries, pipeline contracts, shared types, and stage responsibilities | Architecture notes, interface contracts, implementation sequence |
| Scanner Agent | Build file discovery and framework detection | `fast-glob` scanning, Next.js/Vite/CRA/Remix detection, project shape inference | Scan results, framework classification, file inventory |
| Parser Agent | Extract structure from source files | Babel parsing, component extraction, routes, props, hooks, JSX text, import graph | Parsed project model, parser helpers, fixture needs |
| Domain Agent | Detect app domain from signals | Route, component, text, dependency, and filename signal scoring | Domain keywords, signal extractors, confidence scoring rules |
| Flow Agent | Trace user journeys through the app | Component graph, route graph, entry and exit points, user actions, states | Flow graph, node and edge model, flow matching logic |
| Archetype Agent | Evaluate flows through behavioral lenses | First-Timer, Goal-Getter, Rusher, Skeptic, Returning User heuristics | Archetype rules, findings, severity adjustments |
| Report Agent | Turn analysis into structured output | Report assembly, summary formatting, metadata, warnings, JSON shape | Structured report schema and builder logic |
| Test Agent | Protect behavior with Vitest | Unit tests, integration tests, fixture apps, regression coverage | Test cases, fixture updates, validation notes |
| Docs Agent | Keep project documentation aligned | README, implementation plan updates, tool descriptions, usage examples | Clear documentation and setup instructions |

## Suggested Work Split

### Phase 1: Foundation
- Architecture Agent defines shared contracts.
- Scanner Agent implements file discovery and framework detection.
- Test Agent adds scanner coverage.

### Phase 2: AST Parsing
- Parser Agent implements AST extraction.
- Test Agent builds parser fixtures and regression tests.

### Phase 3: Domain Detection
- Domain Agent defines categories, keywords, and scoring.
- Test Agent validates signal coverage across fixture projects.

### Phase 4: Flow Tracing
- Flow Agent builds graphs and flow matching.
- Architecture Agent reviews the `FlowGraph` and node model.

### Phase 5: Archetypes
- Archetype Agent implements the archetype engine and heuristics.
- Report Agent ensures findings are emitted consistently.
- Test Agent covers each archetype with fixture flows.

### Phase 6: Polish
- Report Agent finalizes output shape.
- Docs Agent updates README and usage guidance.
- Test Agent runs the full integration suite.

## Minimal Agent Set For MVP

If you want the smallest practical team, start with these five:

1. Explore Agent
2. Architecture Agent
3. Parser Agent
4. Domain/Flow Agent
5. Test Agent

That set is enough to get the core pipeline working, then expand into specialized archetype and report agents once the data model stabilizes.
