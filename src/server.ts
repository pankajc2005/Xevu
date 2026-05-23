// ============================================================
// FILE: src/server.ts
// PURPOSE: MCP server setup with all 4 tools registered
// ============================================================

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { scanProject } from './pipeline/scanner/file-scanner.js';
import { parseProject } from './pipeline/parser/ast-parser.js';
import { detectDomain } from './pipeline/domain/domain-detector.js';
import { traceFlow } from './pipeline/flow/flow-tracer.js';
import { runArchetypes } from './pipeline/archetypes/archetype-engine.js';
import { buildReport } from './pipeline/report/report-builder.js';
import { logger } from './infra/logger.js';
import type { ArchetypeName, PipelineWarning } from './shared/types.js';

export function createServer(): McpServer {
  const server = new McpServer({
    name: 'xevu-mcp',
    version: '0.1.0',
  });

  server.tool(
    'xevu_scan_project',
    'Scan a React project to detect its domain, map its structure, and provide a UX overview. Run this first to understand what the project is before analyzing flows.',
    {
      projectRoot: z.string().describe('Absolute path to the React project root directory'),
    },
    async ({ projectRoot }) => {
      const startTime = Date.now();
      logger.info('Tool: xevu_scan_project', { projectRoot });

      const scanResult = await scanProject(projectRoot);
      if (!scanResult.ok) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ status: 'error', error: scanResult.error.message }),
            },
          ],
          isError: true,
        };
      }

      const project = scanResult.value;
      const parseResult = await parseProject(project);
      const parsed = parseResult.ok ? parseResult.value : null;

      let domain = null;
      if (parsed) {
        const domainResult = detectDomain(project, parsed);
        domain = domainResult.ok ? domainResult.value : null;
      }

      const response = {
        status: 'success',
        project: {
          name: project.packageJson.name,
          framework: project.framework,
          structure: project.structure,
          fileCount: project.files.length,
          componentCount: parsed?.components.length ?? 0,
          routeCount: parsed?.routes.length ?? 0,
          routes: parsed?.routes.map((r) => ({ path: r.path, component: r.componentName })) ?? [],
        },
        domain,
        analysisTimeMs: Date.now() - startTime,
      };

      return { content: [{ type: 'text', text: JSON.stringify(response, null, 2) }] };
    },
  );

  server.tool(
    'xevu_detect_domain',
    'Detect what kind of application a React project is (e-commerce, SaaS, content platform, developer tool, healthcare, or general) based on code signals. Returns domain category with confidence score and evidence.',
    {
      projectRoot: z.string().describe('Absolute path to the React project root directory'),
    },
    async ({ projectRoot }) => {
      logger.info('Tool: xevu_detect_domain', { projectRoot });

      const scanResult = await scanProject(projectRoot);
      if (!scanResult.ok) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ status: 'error', error: scanResult.error.message }),
            },
          ],
          isError: true,
        };
      }

      const parseResult = await parseProject(scanResult.value);
      if (!parseResult.ok) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ status: 'error', error: 'Failed to parse project files' }),
            },
          ],
          isError: true,
        };
      }

      const domainResult = detectDomain(scanResult.value, parseResult.value);
      if (!domainResult.ok) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ status: 'error', error: domainResult.error.message }),
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ status: 'success', ...domainResult.value }, null, 2),
          },
        ],
      };
    },
  );

  server.tool(
    'xevu_analyze_flow',
    'Analyze a specific user flow (e.g., "checkout", "onboarding", "signup to dashboard") through behavioral archetype lenses. Traces how components connect and identifies UX issues that real users would encounter. This is the main analysis tool.',
    {
      projectRoot: z.string().describe('Absolute path to the React project root directory'),
      flow: z
        .string()
        .describe(
          'Name or description of the flow to analyze, e.g., "checkout", "login to dashboard"',
        ),
      archetypes: z
        .array(z.enum(['first-timer', 'goal-getter', 'rusher', 'skeptic', 'returning-user']))
        .optional()
        .describe('Specific archetypes to apply. Defaults to all available archetypes.'),
    },
    async ({ projectRoot, flow, archetypes }) => {
      const startTime = Date.now();
      logger.info('Tool: xevu_analyze_flow', { projectRoot, flow, archetypes });

      const warnings: PipelineWarning[] = [];

      const scanResult = await scanProject(projectRoot);
      if (!scanResult.ok) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ status: 'error', error: scanResult.error.message }),
            },
          ],
          isError: true,
        };
      }

      const parseResult = await parseProject(scanResult.value);
      if (!parseResult.ok && !parseResult.partial) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ status: 'error', error: 'Failed to parse project' }),
            },
          ],
          isError: true,
        };
      }
      const parsed = parseResult.ok ? parseResult.value : parseResult.partial!;
      if (!parseResult.ok) {
        warnings.push({ stage: 'parse', message: 'Some files could not be parsed' });
      }

      const domainResult = detectDomain(scanResult.value, parsed as any);
      const domain = domainResult.ok
        ? domainResult.value
        : { primary: 'general' as const, confidence: 0, signals: [], secondaryDomains: [] };

      const flowResult = traceFlow(parsed as any, flow);
      if (!flowResult.ok) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'error',
                  error: flowResult.error.message,
                  domain,
                  availableRoutes: (parsed as any).routes?.map((r: any) => r.path) ?? [],
                },
                null,
                2,
              ),
            },
          ],
          isError: true,
        };
      }

      const archetypeResults = runArchetypes(
        flowResult.value,
        domain,
        archetypes as ArchetypeName[] | undefined,
      );

      const report = buildReport({
        domain,
        flow: flowResult.value,
        archetypes: archetypeResults,
        warnings,
        filesScanned: scanResult.value.files.length,
        filesSkipped: (parsed as any).errors?.length ?? 0,
        startTime,
      });

      return { content: [{ type: 'text', text: JSON.stringify(report, null, 2) }] };
    },
  );

  server.tool(
    'xevu_check_component',
    'Quick UX check on a single React component — analyzes its props, states, user actions, and text through archetype lenses. Faster than a full flow analysis.',
    {
      projectRoot: z.string().describe('Absolute path to the React project root directory'),
      componentPath: z
        .string()
        .describe(
          'Relative path to the component file from the project root, e.g., "src/components/Checkout.tsx"',
        ),
    },
    async ({ projectRoot, componentPath }) => {
      const startTime = Date.now();
      logger.info('Tool: xevu_check_component', { projectRoot, componentPath });

      const scanResult = await scanProject(projectRoot);
      if (!scanResult.ok) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ status: 'error', error: scanResult.error.message }),
            },
          ],
          isError: true,
        };
      }

      const parseResult = await parseProject(scanResult.value);
      if (!parseResult.ok) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ status: 'error', error: 'Failed to parse project' }),
            },
          ],
          isError: true,
        };
      }

      const normalizedPath = componentPath.replace(/\\/g, '/');
      const targetComponents = parseResult.value.components.filter(
        (c) => c.filePath.endsWith(normalizedPath) || c.filePath.includes(normalizedPath),
      );

      if (targetComponents.length === 0) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'error',
                  error: `No components found in "${componentPath}"`,
                  availableComponents: parseResult.value.components.map((c) => ({
                    name: c.name,
                    file: c.filePath,
                  })),
                },
                null,
                2,
              ),
            },
          ],
          isError: true,
        };
      }

      const domainResult = detectDomain(scanResult.value, parseResult.value);
      const domain = domainResult.ok
        ? domainResult.value
        : { primary: 'general' as const, confidence: 0, signals: [], secondaryDomains: [] };

      const flowResult = traceFlow(parseResult.value, targetComponents[0].name);
      if (!flowResult.ok) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ status: 'error', error: flowResult.error.message }),
            },
          ],
          isError: true,
        };
      }

      const archetypeResults = runArchetypes(flowResult.value, domain);

      const report = buildReport({
        domain,
        flow: flowResult.value,
        archetypes: archetypeResults,
        warnings: [],
        filesScanned: 1,
        filesSkipped: 0,
        startTime,
      });

      return { content: [{ type: 'text', text: JSON.stringify(report, null, 2) }] };
    },
  );

  return server;
}
