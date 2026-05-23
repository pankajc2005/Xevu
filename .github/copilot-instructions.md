# Copilot Instructions for Xevu

## Project: Xevu MCP Server
An MCP server analyzing React codebases through behavioral user archetypes.

## Key Conventions
- TypeScript strict mode with ES modules
- Use `.js` extension in all relative imports (Node16 module resolution)
- All types defined in `src/shared/types.ts` — single source of truth
- Pipeline stages return `Result<T, E>` — never throw exceptions
- Logging to `stderr` only — `stdout` reserved for MCP JSON-RPC
- Read-only analysis — never modify user files
- Vitest for testing with fixtures in `tests/fixtures/`

## Architecture (6-stage pipeline)
1. Scanner → 2. Parser → 3. Domain Detector → 4. Flow Tracer → 5. Archetype Engine → 6. Report Builder

Each stage is in `src/pipeline/<stage>/` and returns `Result<StageOutput, StageError>`.

## When Adding Code
- New types → `src/shared/types.ts`
- New archetype → extend `BaseArchetype`, register in `archetype-engine.ts`
- New domain → add to `DomainCategory` type and `domains.ts` keywords
- Always write tests alongside new features
