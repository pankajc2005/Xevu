#!/usr/bin/env node
// ============================================================
// FILE: src/index.ts
// PURPOSE: Entry point — bootstrap the MCP server
// ============================================================

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';
import { logger } from './infra/logger.js';

async function main(): Promise<void> {
  logger.info('Xevu MCP server starting...');

  const server = createServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  logger.info('Xevu MCP server connected and ready');
}

main().catch((error) => {
  logger.error('Fatal error starting Xevu', {
    error: error instanceof Error ? error.message : String(error),
  });
  process.exit(1);
});
