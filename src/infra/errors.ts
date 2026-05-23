// ============================================================
// FILE: src/infra/errors.ts
// PURPOSE: Typed error classes for each pipeline stage.
//
// AI IDE GUIDANCE:
// Every pipeline stage has its own error class extending XevuError.
// 'recoverable' indicates if the pipeline can continue past this error.
// Use these instead of generic Error for better error handling.
// ============================================================

export class XevuError extends Error {
  constructor(
    message: string,
    public readonly stage: string,
    public readonly recoverable: boolean = true,
  ) {
    super(message);
    this.name = 'XevuError';
  }
}

export class ScanError extends XevuError {
  constructor(message: string) {
    super(message, 'scan', false);
    this.name = 'ScanError';
  }
}

export class ParseFileError extends XevuError {
  constructor(
    message: string,
    public readonly filePath: string,
  ) {
    super(message, 'parse', true);
    this.name = 'ParseFileError';
  }
}

export class DomainDetectionError extends XevuError {
  constructor(message: string) {
    super(message, 'domain', true);
    this.name = 'DomainDetectionError';
  }
}

export class FlowTracingError extends XevuError {
  constructor(message: string) {
    super(message, 'flow', true);
    this.name = 'FlowTracingError';
  }
}

export class ArchetypeError extends XevuError {
  constructor(message: string) {
    super(message, 'archetype', true);
    this.name = 'ArchetypeError';
  }
}
