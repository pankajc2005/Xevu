# Contributing to Xevu

Thank you for your interest in contributing to Xevu! This document provides guidelines and instructions for contributing.

## Development Setup

```bash
git clone https://github.com/pankaj/xevu-mcp.git
cd xevu-mcp
npm install
npm run lint    # Type-check
npm test        # Run tests
```

## Project Architecture

Xevu uses a **6-stage pipeline architecture**:

```
Scan → Parse → Detect Domain → Trace Flows → Apply Archetypes → Build Report
```

Each stage is in its own directory under `src/pipeline/`.

### Key Directories

| Directory | Purpose |
|---|---|
| `src/shared/types.ts` | **Single source of truth** for all types |
| `src/infra/` | Infrastructure: Result monad, errors, logger, cache |
| `src/pipeline/scanner/` | Stage 1: File discovery and framework detection |
| `src/pipeline/parser/` | Stage 2: Babel AST parsing |
| `src/pipeline/domain/` | Stage 3: App domain detection |
| `src/pipeline/flow/` | Stage 4: User flow tracing |
| `src/pipeline/archetypes/` | Stage 5: Behavioral archetype analysis |
| `src/pipeline/report/` | Stage 6: Report generation |
| `src/tools/` | MCP tool definitions (public API) |
| `src/server.ts` | MCP server setup |
| `tests/` | Vitest test suite |

### Critical Rules

1. **All types go in `src/shared/types.ts`** — never define domain types inline.
2. **All logging goes to stderr** — stdout is reserved for MCP JSON-RPC.
3. **Every pipeline stage returns `Result<T, E>`** — never throw from pipeline code.
4. **Never modify user code** — Xevu is read-only.
5. **ES modules only** — use `import/export`, never `require()`.

## Making Changes

### Adding a New Archetype

1. Create `src/pipeline/archetypes/your-archetype.ts`
2. Extend `BaseArchetype` from `base-archetype.ts`
3. Implement `getQuestions()`, `evaluateNode()`, `evaluateEdge()`, `evaluateFlow()`
4. Register it in `archetype-engine.ts`'s `ALL_ARCHETYPES` array
5. Add the name to `ArchetypeName` type in `src/shared/types.ts`
6. Write tests in `tests/unit/`

### Adding a New Domain Category

1. Add the category to `DomainCategory` type in `src/shared/types.ts`
2. Add keyword dictionary in `src/pipeline/domain/domains.ts`
3. The signal extractors will pick it up automatically
4. Write tests with a fixture project in `tests/fixtures/`

### Adding a New Signal Source

1. Create `src/pipeline/domain/signals/your-signal.ts`
2. Export a function: `extractYourSignals(input): DomainSignal[]`
3. Call it from `domain-detector.ts`
4. Add a weight entry in `SOURCE_WEIGHTS`

## Code Standards

- **TypeScript strict mode** — no `any` unless unavoidable (and document why)
- **Prettier formatting** — run `npm run format` before committing
- **Tests required** — every new feature needs unit tests
- **No side effects in utils** — `src/shared/utils.ts` functions must be pure

## Pull Request Process

1. Fork the repo and create your branch from `main`
2. Write tests for your changes
3. Run `npm run lint && npm test` — all must pass
4. Update documentation if needed
5. Submit a PR with a clear description

## Reporting Issues

Use GitHub Issues. Include:
- Xevu version (`npx xevu-mcp --version`)
- Node.js version (`node --version`)
- IDE and AI model being used
- Steps to reproduce
- Expected vs actual behavior
