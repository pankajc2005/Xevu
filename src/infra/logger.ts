// ============================================================
// FILE: src/infra/logger.ts
// PURPOSE: Structured logging to stderr.
//
// CRITICAL:
// ALL output MUST go to stderr. Writing to stdout WILL BREAK
// the MCP JSON-RPC protocol. This is not optional.
// ============================================================

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

let currentLevel = LogLevel.INFO;

export function setLogLevel(level: LogLevel): void {
  currentLevel = level;
}

function log(
  level: LogLevel,
  message: string,
  data?: Record<string, unknown>,
): void {
  if (level < currentLevel) return;
  const entry = {
    timestamp: new Date().toISOString(),
    level: LogLevel[level],
    message,
    ...data,
  };
  // CRITICAL: stderr only. stdout is reserved for MCP JSON-RPC.
  process.stderr.write(JSON.stringify(entry) + '\n');
}

export const logger = {
  debug: (msg: string, data?: Record<string, unknown>) =>
    log(LogLevel.DEBUG, msg, data),
  info: (msg: string, data?: Record<string, unknown>) =>
    log(LogLevel.INFO, msg, data),
  warn: (msg: string, data?: Record<string, unknown>) =>
    log(LogLevel.WARN, msg, data),
  error: (msg: string, data?: Record<string, unknown>) =>
    log(LogLevel.ERROR, msg, data),
};
